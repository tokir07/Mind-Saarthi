from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import pymongo
from bson.objectid import ObjectId
import datetime

import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for frontend

# Configure Settings
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "mindsaarthi-super-secret-key-2026")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(hours=24)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Google Gemini API Chatbot Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = None
if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        print("Successfully configured Gemini API for Chatbot.")
    except Exception as e:
        print(f"Failed to configure Gemini API: {e}")

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

def generate_response(risk_level, text, context=""):
    # Smart Recommendation Engine (Rule-based mix)
    text_lower = text.lower()
    suggestion = ""
    if risk_level == "High":
        suggestion = "Please consider speaking to a professional therapist or a crisis helpline."
    elif "sleep" in text_lower:
        suggestion = "Try maintaining a consistent sleep schedule."
    elif "stress" in text_lower or "tired" in text_lower:
        suggestion = "Try breathing exercises or taking a short break to relax."

    if gemini_client:
        try:
            prompt = f"""You are a mental health assistant named MindSaarthi.

User history:
{context}

Current message:
{text}

Instructions:
- Be empathetic
- Detect emotional state
- Give personalized advice
- Suggest coping strategies
- Keep response human-like and natural (2-3 sentences max)
- Do not use markdown format like **

Analyzed current risk level: {risk_level}.
"""
            response = gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            ai_reply = response.text.replace('*', '')  # Remove any stray markdown
            
            # Combine AI output with rule-based recommendation
            if suggestion and suggestion not in ai_reply:
                ai_reply = f"{ai_reply} {suggestion}"
                
            return ai_reply
        except Exception as e:
            print(f"LLM generation failed, falling back to rule-based: {e}")

    # Fallback Rule-based logic
    fallback_reply = ""
    if risk_level == "High":
        fallback_reply = "I'm really sorry you're feeling this way. You're not alone, and there is help available. Your life is valuable and things can get better."
    elif risk_level == "Moderate":
        fallback_reply = "It sounds like you're carrying a heavy load right now. I'm here for you. It's completely normal to feel this way sometimes."
    else: # Low
        fallback_reply = "I appreciate you sharing that with me! How has the rest of your day been? Feel free to talk about whatever is on your mind, I'm always here to listen."

    if suggestion:
        fallback_reply += f" {suggestion}"

    return fallback_reply

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

@app.route('/chat', methods=['POST'])
@jwt_required(optional=True)  # Optional so guest demo still works
def chat():
    data = request.json
    user_id = get_jwt_identity() # None if guest

    if not data or 'message' not in data:
        return jsonify({"error": "No message provided"}), 400
        
    user_message = data['message']
    
    # Run sentiment analysis
    sentiment_result = None
    sentiment_label = "NEUTRAL"
    if sentiment_pipeline:
        try:
            sentiment_result = sentiment_pipeline(user_message)
            sentiment_label = sentiment_result[0]['label']
        except Exception as e:
            print(f"Sentiment analysis failed: {e}")
    
    # Determine risk
    risk_level = get_risk_level(user_message, sentiment_result)
    
    # 1. Context Memory (MOST IMPORTANT)
    context = ""
    if user_id:
        user_history = []
        if db_con:
            # Get last 5 messages, sort descending, then reverse for chronological order
            history_cursor = chats_collection.find({"user_id": user_id}).sort("timestamp", -1).limit(5)
            user_history = list(history_cursor)[::-1]
        else:
            user_chats = [c for c in mock_chats if c["user_id"] == user_id]
            user_history = user_chats[-5:]
            
        for c in user_history:
            context += f"User: {c.get('user_message', '')}\nMindSaarthi: {c.get('bot_reply', '')}\n"
    
    # Generate Reply
    bot_reply = generate_response(risk_level, user_message, context)
    
    # Store history if logged in
    if user_id:
        chat_doc = {
            "user_id": user_id,
            "user_message": user_message,
            "bot_reply": bot_reply,
            "sentiment": sentiment_label,
            "risk": risk_level,
            "timestamp": datetime.datetime.now()
        }
        if db_con:
            chats_collection.insert_one(chat_doc)
        else:
            mock_chats.append(chat_doc)
    
    return jsonify({
        "reply": bot_reply,
        "sentiment": sentiment_label,
        "risk": risk_level
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
