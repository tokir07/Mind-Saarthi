print("✅ CHAT FUNCTION HIT")
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import pymongo
from bson.objectid import ObjectId
import os
import traceback
import datetime
from dotenv import load_dotenv
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

# Force load .env from the current script directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)
print(f"DEBUG: Loaded .env from {env_path}")
print(f"DEBUG: OPENROUTER_API_KEY value: {os.getenv('OPENROUTER_API_KEY')[:5] if os.getenv('OPENROUTER_API_KEY') else 'NONE'}")

app = Flask(__name__)
CORS(app) # Enable CORS for frontend

# Configure Settings
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "mindsaarthi-super-secret-key-2026")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(hours=24)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# OpenRouter AI Chatbot Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
ai_client = None
if OPENROUTER_API_KEY and OPENROUTER_API_KEY not in ["", "your_api_key_here"]:
    try:
        # OpenRouter uses the OpenAI-compatible API
        ai_client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=OPENROUTER_API_KEY,
        )
        print(f"✅ Successfully configured OpenRouter API for Chatbot. Key starts with: {OPENROUTER_API_KEY[:8]}...")
    except Exception as e:
        print(f"❌ Failed to configure OpenRouter API: {e}")
else:
    print("⚠️  OPENROUTER_API_KEY not set or is placeholder — chatbot will use rule-based fallback.")

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://tokirkhan00291_db_user:Rehan07@ac-hibhg1p-shard-00-00.3aae3if.mongodb.net:27017,ac-hibhg1p-shard-00-01.3aae3if.mongodb.net:27017,ac-hibhg1p-shard-00-02.3aae3if.mongodb.net:27017/?ssl=true&replicaSet=atlas-129ewi-shard-0&authSource=admin&retryWrites=true&w=majority")
print(f"Connecting to MongoDB at {MONGO_URI}...")
try:
    
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, TLS = True)
    print(client.list_database_names()) # trigger exception if down
    db = client["mindsaarthi"]
    users_collection = db["users"]
    chats_collection = db["chats"]
    print("Successfully connected to MongoDB.")
    db_con = True
except pymongo.errors.ServerSelectionTimeoutError:
    print("FAILED to connect to MongoDB. Make sure mongod is running!")
    print("App will run in MOCK mode to prevent crashing.")
    db_con = False

# Fallback memory arrays if MongoDB is not running
mock_users = []
mock_chats = []

# Initialize Demo User
try:
    demo_email = "demo@mindsaarthi.com"
    hashed_demo = bcrypt.generate_password_hash("password123").decode('utf-8')
    demo_doc = {
        "name": "Demo User",
        "email": demo_email,
        "password": hashed_demo,
        "created_at": datetime.datetime.now()
    }
    
    if db_con:
        if not users_collection.find_one({"email": demo_email}):
            users_collection.insert_one(demo_doc)
            print("Demo user created in MongoDB.")
    else:
        demo_doc['_id'] = "demo_1"
        mock_users.append(demo_doc)
        print("Demo user created in Mock DB.")
except Exception as e:
    print("Demo user init failed:", e)

# Load sentiment-analysis pipeline (uses distilbert internally, outputs POSITIVE/NEGATIVE)
print("Loading NLP pipeline... This may take a moment.")
try:
    sentiment_pipeline = pipeline("sentiment-analysis")
    print("Pipeline loaded!")
except Exception as e:
    print(f"Error loading pipeline: {e}")
    sentiment_pipeline = None

# ---- Helper Functions ----
def get_risk_level(text, sentiment_result):
    text_lower = text.lower()
    
    # 1. Hardcoded High Risk keywords
    high_risk_keywords = ["hopeless", "depressed", "die", "suicide", "end it", "worthless", "kill", "give up"]
    if any(word in text_lower for word in high_risk_keywords):
        return "High"
    
    # 2. Hardcoded Moderate Risk keywords
    moderate_risk_keywords = ["stress", "tired", "anxious", "overwhelmed", "worry", "panic", "sad", "alone", "exhausted", "burnout"]
    if any(word in text_lower for word in moderate_risk_keywords):
        return "Moderate"
        
    # 3. Fallback to sentiment model
    if sentiment_result:
        label = sentiment_result[0]['label']
        score = sentiment_result[0]['score']
        
        if label == "NEGATIVE" and score > 0.9:
            return "Moderate"
            
    return "Low"

# ---- Response Generation (Handled In-Line in /chat for now) ----
# Note: Manual Gemini block is currently active inside the /chat route.

# ---- Auth Endpoints ----

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not all([name, email, password]):
        return jsonify({"error": "Missing required fields"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    user_doc = {
        "name": name,
        "email": email.lower(),
        "password": hashed_password,
        "created_at": datetime.datetime.now()
    }

    if db_con:
        if users_collection.find_one({"email": email.lower()}):
            return jsonify({"error": "Email already exists"}), 409
        users_collection.insert_one(user_doc)
    else:
        if any(u['email'] == email.lower() for u in mock_users):
            return jsonify({"error": "Email already exists"}), 409
        user_doc['_id'] = str(len(mock_users) + 1)
        mock_users.append(user_doc)

    return jsonify({"message": "User created successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"error": "Missing required fields"}), 400

    user = None
    if db_con:
        user = users_collection.find_one({"email": email.lower()})
    else:
        user = next((u for u in mock_users if u['email'] == email.lower()), None)

    if user and bcrypt.check_password_hash(user['password'], password):
        user_id = str(user['_id'])
        access_token = create_access_token(identity=user_id)
        return jsonify({
            "token": access_token,
            "user": {
                "id": user_id,
                "name": user["name"],
                "email": user["email"]
            }
        }), 200

    return jsonify({"error": "Invalid email or password"}), 401

# ---- Test Endpoint ----
@app.route('/test-ai', methods=['GET'])
def test_ai():
    if not ai_client:
        return jsonify({"status": "error", "message": "AI client not initialized"}), 500
    try:
        response = ai_client.chat.completions.create(
            model="openrouter/free", # OpenRouter model name
            messages=[{"role": "user", "content": "Say 'System is Alive!'"}]
        )
        return jsonify({"status": "success", "response": response.choices[0].message.content.strip()})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ---- Protected Endpoints ----

@app.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    user_id = get_jwt_identity()
    user_name = "User"
    
    if db_con:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if user: user_name = user.get("name", "User")
        
        # Aggregate logic for mood history chart
        user_chats = list(chats_collection.find({"user_id": user_id}).sort("timestamp", 1))
    else:
        u = next((u for u in mock_users if str(u['_id']) == user_id), None)
        if u: user_name = u.get("name", "User")
        user_chats = [c for c in mock_chats if c["user_id"] == user_id]

    # Calculate overall risk
    if not user_chats:
        overall_risk = "Low"
    else:
        last_chat = user_chats[-1]
        overall_risk = last_chat.get("risk", "Low")
        
    # Generate history payload
    history = []
    for c in user_chats:
        history.append({
            "timestamp": c["timestamp"].strftime("%b %d, %H:%M") if isinstance(c["timestamp"], datetime.datetime) else c["timestamp"],
            "risk": c["risk"],
            "sentiment": c["sentiment"]
        })

    return jsonify({
        "name": user_name,
        "latest_risk": overall_risk,
        "mood_history": history
    })

# ---- 🧠 Sentimental Fallback Engine (In case of 429 Quota Errors) ----
def get_hardcoded_empathy(risk_level, sentiment):
    if risk_level == "High":
        return "I can hear how painful this is for you. Please know that you're not alone, and reaching out is a brave first step. I strongly encourage you to connect with a crisis support professional who can provide the immediate care you deserve."
    if risk_level == "Moderate":
        return "It sounds like you're carrying a lot on your shoulders right now. I'm here to listen. Taking a small moment to breathe and focus on your well-being can sometimes help when things feel overwhelming."
    if sentiment == "NEGATIVE":
        return "I'm sorry you're going through a tough time. It's completely valid to feel this way. Tell me more about what's on your mind—I'm here for you."
    return "I appreciate you sharing your thoughts with me. How else can I support you today? I'm always here to listen."

@app.route('/chat', methods=['POST'])
@jwt_required(optional=True)
def chat():
    print("\n" + "="*50)
    print("🧠 NEW CHAT REQUEST RECEIVED")
    print("="*50)

    try:
        data = request.json
        user_message = data.get('message', '')
        user_id = get_jwt_identity()
        
        print(f"📥 Input: {user_message[:60]}")

        # 1. Pipeline Analysis
        sentiment_result = None
        sentiment_label = "NEUTRAL"
        if sentiment_pipeline:
            try:
                sentiment_result = sentiment_pipeline(user_message)
                sentiment_label = sentiment_result[0]['label']
            except: pass
        
        risk_level = get_risk_level(user_message, sentiment_result)
        print(f"📊 Analysis -> Risk: {risk_level}, Sentiment: {sentiment_label}")

        # 2. Context Loading
        context = ""
        if user_id:
            user_history = list(chats_collection.find({"user_id": user_id}).sort("timestamp", -1).limit(5))[::-1]
            for c in user_history:
                context += f"User: {c.get('user_message', '')}\nMindSaarthi: {c.get('bot_reply', '')}\n"

        # 3. AI Brain Call
        bot_reply = ""
        if not ai_client:
            print("⚠️ [SYSTEM] AI client NOT initialized. Using fallback.")
            bot_reply = get_hardcoded_empathy(risk_level, sentiment_label)
        else:
            try:
                print("🔥 [API] Calling OpenRouter (Gemini 2.0 Flash via OR)...")
                prompt = f"Role: MindSaarthi AI\nContext: {context}\nUser: {user_message}\nTask: 2-3 line human-like empathetic response based on Risk: {risk_level}."
                
                response = ai_client.chat.completions.create(
                    model="openrouter/free",
                    messages=[{"role": "user", "content": prompt}],
                    extra_headers={
                        "HTTP-Referer": "https://mindsaarthi.com", # Optional, for OpenRouter rankings
                        "X-Title": "MindSaarthi AI", # Optional
                    }
                )
                bot_reply = response.choices[0].message.content.strip().replace("*", "")
                print(f"✅ [API] Success: {bot_reply[:60]}...")
            except Exception as ai_err:
                print(f"❌ [API] AI Call Failed: {ai_err}")
                # Use our smart fallback if API is down or 429
                bot_reply = get_hardcoded_empathy(risk_level, sentiment_label)
                if "429" in str(ai_err):
                    print("⚠️ [QUOTA] 429 Resource Exhausted. Switching to Smart Fallback.")

        # 4. Persistence
        if user_id:
            chat_doc = {
                "user_id": user_id,
                "user_message": user_message,
                "bot_reply": bot_reply,
                "sentiment": sentiment_label,
                "risk": risk_level,
                "timestamp": datetime.datetime.now()
            }
            if db_con: chats_collection.insert_one(chat_doc)
            else: mock_chats.append(chat_doc)

        return jsonify({
            "reply": bot_reply,
            "sentiment": sentiment_label,
            "risk": risk_level
        })

    except Exception as fatal_err:
        print(f"❌ [FATAL] Global Error: {fatal_err}")
        traceback.print_exc()
        return jsonify({"reply": "I'm experiencing a small temporary issue, but I'm still here for you. Tell me more?"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
