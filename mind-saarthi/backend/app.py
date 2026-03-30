print("--- BACKEND STARTING ---")
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
try:
    from transformers import pipeline
except ImportError:
    print("WARNING: 'transformers' not found. Local sentiment analysis will be disabled (fallback to AI sentiment).")
    pipeline = None

from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import pymongo
from bson.objectid import ObjectId
import os
import traceback
import datetime
import requests
import json
import io
from dotenv import load_dotenv
from openai import OpenAI
from twilio.rest import Client  
from tenacity import retry, stop_after_attempt, wait_exponential

# reportlab for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch

import base64
from gtts import gTTS
from flask_socketio import SocketIO, emit, join_room, leave_room
import random

# Force load .env from the current script directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)
print(f"DEBUG: Loaded .env from {env_path}")
print(f"DEBUG: OPENROUTER_API_KEY value: {os.getenv('OPENROUTER_API_KEY')[:5] if os.getenv('OPENROUTER_API_KEY') else 'NONE'}")

app = Flask(__name__)
CORS(app) # Enable CORS for frontend

# Use environment variable for Frontend URL, fallback to * for dev
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

# Initialize SocketIO with fallback configuration for high Python versions
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

SOOTHING_NAMES = [
    "Quiet Lotus", "Brave Willow", "Zen Panda", "Mindful Breeze",
    "Hopeful Star", "Calm River", "Peaceful Dove", "Bold Sparrow",
    "Gentle Oak", "Radiant Sun", "Inner Peak", "Soft Moon",
    "Golden Leaf", "Blue Whale", "Wise Owl", "Forest Guardian"
]

def get_anonymous_name(user_id=None):
    if user_id:
        idx = int(str(user_id)[-1], 16) % len(SOOTHING_NAMES)
        return SOOTHING_NAMES[idx]
    return random.choice(SOOTHING_NAMES)

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
        ai_client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=OPENROUTER_API_KEY,
        )
        print("Successfully configured OpenRouter AI Client.")
    except Exception as e:
        print(f"Failed to configure OpenRouter API: {e}")
        ai_client = None
else:
    print("OPENROUTER_API_KEY not set or is placeholder - using rule-based fallback.")
    ai_client = None

# 4. Twilio/Google API Configuration for Crisis Management
TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")
EMERGENCY_PHONE = os.getenv("EMERGENCY_CONTACT_PHONE", "whatsapp:+919079968792")
GOOGLE_MAPS_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

twilio_client = None
if TWILIO_SID and TWILIO_TOKEN and TWILIO_SID != "your_twilio_sid_here":
    try:
        twilio_client = Client(TWILIO_SID, TWILIO_TOKEN)
        print("Twilio Crisis Alert Client ready.")
    except: pass

# 5. MongoDB Collections (Initialized below)
users_collection = None
chats_collection = None
assessment_collection = None
recovery_plans_collection = None
session_reports_collection = None
risk_history_collection = None
daily_progress_collection = None
analytics_collection = None

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://tokirkhan00291_db_user:Rehan07@ac-hibhg1p-shard-00-00.3aae3if.mongodb.net:27017,ac-hibhg1p-shard-00-01.3aae3if.mongodb.net:27017,ac-hibhg1p-shard-00-02.3aae3if.mongodb.net:27017/?ssl=true&replicaSet=atlas-129ewi-shard-0&authSource=admin&retryWrites=true&w=majority")
print(f"Connecting to MongoDB...")
try:
    
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, TLS = True)
    print(client.list_database_names()) # trigger exception if down
    db = client["mindsaarthi"]
    users_collection = db["users"]
    chats_collection = db["chats"]
    assessment_collection = db["assessments"]
    recovery_plans_collection = db["recovery_plans"]
    session_reports_collection = db["session_reports"]
    risk_history_collection = db["risk_history"]
    daily_progress_collection = db["daily_progress"]
    analytics_collection = db["analytics"]
    personality_collection = db["personality_profiles"]
    emotional_trend_collection = db["emotional_trend"]
    crisis_events_collection = db["crisis_events"]
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
print("Checking for sentiment-analysis capability...")
try:
    if pipeline:
        sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
        print("NLP Pipeline loaded!")
    else:
        sentiment_pipeline = None
        print("Pipeline initialization skipped (transformers not installed).")
except Exception as e:
    print(f"Error loading pipeline: {e}")
    sentiment_pipeline = None

# ---- Helper Functions ----
def get_risk_level(text, sentiment_result):
    text_lower = text.lower()
    
    # 1. Hardcoded High Risk Keywords (Safety Priority)
    high_risk_keywords = [
        "suicide", "kill myself", "end my life", "i don't want to live", 
        "die", "give up", "worthless", "hopeless", "better off dead", 
        "no reason to stay", "self harm", "hurting myself", "hanging", "overdose"
    ]
    if any(k in text_lower for k in high_risk_keywords):
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

def detect_issue(user_message):
    """Classify user's main struggle for targeted recovery planning."""
    msg = user_message.lower()
    if any(k in msg for k in ["kill", "die", "end it", "suicide", "harm"]):
        return "crisis"
    if any(k in msg for k in ["sleep", "insomnia", "nightmare", "waking up"]):
        return "sleep_issue"
    elif any(k in msg for k in ["stress", "pressure", "workload", "exams"]):
        return "stress"
    elif any(k in msg for k in ["overthinking", "logic", "thoughts", "can't stop", "what if"]):
        return "overthinking"
    elif any(k in msg for k in ["tired", "burnout", "exhausted", "no energy", "drained"]):
        return "burnout"
    elif any(k in msg for k in ["alone", "lonely", "no one", "isolated"]):
        return "loneliness"
    elif any(k in msg for k in ["anxious", "panic", "fear", "scared"]):
        return "anxiety"
    return "general"

def get_coping_suggestion(issue_type):
    """Smart Rule-Based Coping Engine."""
    suggestions = {
        "crisis": "Please reach out to a crisis helpline immediately. You are not alone. Focus on your breathing and stay with me.",
        "sleep_issue": "Try the 4-7-8 breathing technique: inhale for 4, hold for 7, exhale for 8. Avoid all screens now.",
        "stress": "Try a quick 'Brain Dump': write down everything on your mind for 2 minutes, then let it go.",
        "overthinking": "Try naming 5 things you can see, 4 you can touch, and 3 you can hear right now.",
        "burnout": "Permit yourself to do 'nothing' for 15 minutes. Pure rest, no guilt.",
        "loneliness": "Think of one person you've had a positive interaction with, even if it was small. Or, let's keep talking.",
        "anxiety": "Gently place your hand on your chest and feel the rhythm of your heart. You are safe in this moment.",
        "general": "Take a deep breath and remember that it's okay to feel however you're feeling right now."
    }
    return suggestions.get(issue_type, suggestions["general"])

def update_personality_profile(user_id, analytics_data):
    """Aggregate conversational data into a persistent persona profile."""
    if not db_con or personality_collection is None: return
    
    try:
        # Fetch last 10 analytics entries
        history = list(analytics_collection.find({"user_id": user_id}).sort("timestamp", -1).limit(10))
        if not history: return
        
        avg_stress = sum(h["stress_score"] for h in history) / len(history)
        avg_mood = sum(h["mood_score"] for h in history) / len(history)
        
        # Determine dominant emotion/issue
        issues = [h["issue_type"] for h in history if h["issue_type"] != "general"]
        dominant_issue = max(set(issues), key=issues.count) if issues else "developing"
        
        # Track active hours
        now = datetime.datetime.now()
        hour = now.hour
        time_period = "morning" if 5 <= hour < 12 else "afternoon" if 12 <= hour < 18 else "evening" if 18 <= hour < 22 else "night"
        
        profile = {
            "user_id": user_id,
            "avg_stress": round(avg_stress),
            "avg_mood": round(avg_mood),
            "dominant_issue": dominant_issue,
            "peak_stress_period": time_period,
            "last_updated": now
        }
        
        personality_collection.update_one(
            {"user_id": user_id},
            {"$set": profile},
            upsert=True
        )
    except Exception as e:
        print(f"Profile Update Error: {e}")

def generate_recovery_plan_ai(user_id, user_message, risk_level, sentiment, context=""):
    """Use AI to generate a structured JSON recovery plan."""
    issue_type = detect_issue(user_message)
    
    prompt = f"""
    You are a professional empathetic AI Mental Health Companion.
    Generate a personalized recovery plan in STRICT JSON format.
    
    User Context:
    - Recent Emotion: {sentiment}
    - Risk Level: {risk_level}
    - Primary Issue: {issue_type}
    - Recent Message: "{user_message}"
    - Chat History: {context[:500]}
    
    JSON Template (Return ONLY this object):
    {{
      "issue": "{issue_type}",
      "daily_routine": "string summary",
      "sleep_advice": "specific sleep tips",
      "break_schedule": "recommended break pattern",
      "tips": ["actionable tip 1", "actionable tip 2", "actionable tip 3"],
      "empathy_note": "short supportive closing"
    }}
    
    Keep advice practical, simple, and supportive.
    """
    
    try:
        # Re-use OpenRouter logic
        response = ai_client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=[{"role": "system", "content": "You are a helpful mental health assistant that outputs only JSON."},
                      {"role": "user", "content": prompt}]
        )
        content = response.choices[0].message.content
        # Basic cleanup in case AI includes markdown
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        return json.loads(content)
    except Exception as e:
        print(f"AI Plan Generation Error: {e}")
        # Fallback Plan
        return {
            "issue": issue_type,
            "daily_routine": "Wake up with 5 mins of deep breathing. Maintain a regular schedule.",
            "sleep_advice": "Avoid screens 1 hour before bed. Keep your room cool.",
            "break_schedule": "Try the 50/10 rule: 50 mins work, 10 mins disconnected break.",
            "tips": ["Stay hydrated", "Write down 3 things you're grateful for", "Short 10-min walk"],
            "empathy_note": "I'm here for you. We'll take this one step at a time."
        }

def get_nearby_doctors(lat, lng):
    """Fetch nearest hospitals using OpenStreetMap's Overpass API (Free/No Key)."""
    try:
        # Overpass QL query: find hospitals within 5km of lat/lng
        radius = 5000
        overpass_url = "https://overpass-api.de/api/interpreter"
        overpass_query = f"""
        [out:json];
        node["amenity"~"hospital|clinic|doctors"](around:{radius},{lat},{lng});
        out body;
        """
        
        response = requests.post(overpass_url, data={'data': overpass_query}, timeout=10)
        if response.status_code != 200:
            raise Exception(f"Overpass Server Error {response.status_code}")
            
        data = response.json()
        
        results = []
        for element in data.get("elements", [])[:3]:
            tags = element.get("tags", {})
            name = tags.get("name") or tags.get("name:en") or "Medical Center"
            addr = tags.get("addr:full") or tags.get("addr:street") or "Nearby Location"
            
            results.append({
                "name": name,
                "address": addr,
                "lat": element.get("lat"),
                "lng": element.get("lon")
            })
            
        if not results:
            return [{"name": "Local Support Center", "address": "Call Emergency Services (112)", "lat": lat, "lng": lng}]
            
        return results
    except Exception as e:
        print(f"OSM/Overpass API Error: {e}")
        # Robust fallback
        return [{"name": "Emergency Health Center", "address": "Please contact 112 immediately.", "lat": lat, "lng": lng}]

def send_whatsapp_alert(lat, lng, user_name="A User"):
    """Trigger Twilio WhatsApp emergency alert."""
    if not twilio_client:
        print(" Twilio not configured. Alert suppressed.")
        return False
        
    try:
        maps_link = f"https://www.google.com/maps?q={lat},{lng}"
        body = f" *MindSaarthi EMERGENCY ALERT*\n\nUser *{user_name}* may be in high-risk distress.\nLocation: {maps_link}"
        
        twilio_client.messages.create(
            from_=TWILIO_FROM,
            body=body,
            to=EMERGENCY_PHONE
        )
        print(f" Emergency Alert sent to {EMERGENCY_PHONE}")
        return True
    except Exception as e:
        print(f"Twilio API Error: {e}")
        return False

# ---- Advanced Reporting & Analytics ----

def generate_session_report(user_id, session_summary, sentiment_trend, risk_level, detected_issues, session_type="Chat"):
    """Summarize and save a chat session to MongoDB."""
    try:
        if not ai_client:
            recommendations = "Seek support from trusted circles. Maintain a regular meditation habit."
        else:
            prompt = f"Summarize the following mental health session insights and provide 3-4 professional recommendations based on: {session_summary}. Risk Level: {risk_level}."
            response = ai_client.chat.completions.create(
                model="google/gemini-2.0-flash-001",
                messages=[{"role": "user", "content": prompt}]
            )
            recommendations = response.choices[0].message.content.strip()

        report_doc = {
            "user_id": user_id,
            "session_type": session_type,
            "summary": session_summary,
            "sentiment_trend": sentiment_trend,
            "risk_level": risk_level,
            "detected_issues": detected_issues,
            "recommendations": recommendations,
            "created_at": datetime.datetime.now()
        }

        if db_con and session_reports_collection is not None:
            session_reports_collection.insert_one(report_doc)
            print("Session report saved successfully.")
        return report_doc
    except Exception as e:
        print(f"Reporting Error: {e}")
        return None

def log_high_risk_event(user_id, message, alert_sent=False, location_shared=False, hospital=None, doctor=None):
    """Specifically track high-risk triggers for dashboard analysis."""
    try:
        risk_doc = {
            "user_id": user_id,
            "user_message": message,
            "timestamp": datetime.datetime.now(),
            "alert_sent": alert_sent,
            "location_shared": location_shared,
            "hospital_suggested": hospital,
            "doctor_contact": doctor
        }
        if db_con and risk_history_collection is not None:
            risk_history_collection.insert_one(risk_doc)
            print("Critically High Risk event logged.")
    except Exception as e:
        print(f"Risk Logging Error: {e}")

# ---- Behavioral Analytics Engine ----

def calculate_analytics_scores(message, sentiment_label, risk_level):
    """Derive numerical behavioral metrics from conversational data."""
    msg = message.lower()
    
    # Stress Score (0-100)
    stress_keywords = ['stress', 'pressure', 'overwhelmed', 'anxious', 'panic', 'tension', 'worry']
    stress_base = 30 if sentiment_label == "NEGATIVE" else 10
    stress_count = sum(1 for k in stress_keywords if k in msg) * 15
    stress_score = min(100, stress_base + stress_count + (40 if risk_level == "High" else 0))
    
    # Sleep Score (0-100)
    sleep_keywords = ['sleep', 'tired', 'insomnia', 'awake', 'night', 'exhausted', 'restless']
    sleep_count = sum(1 for k in sleep_keywords if k in msg)
    sleep_score = max(20, 100 - (sleep_count * 20)) if sleep_count > 0 else 85
    
    # Productivity Score (0-100)
    prod_keywords = ['work', 'focus', 'concentrate', 'study', 'energy', 'productive', 'goal']
    prod_count = sum(1 for k in prod_keywords if k in msg)
    prod_base = 60 if sentiment_label == "POSITIVE" else 40
    productivity_score = min(100, prod_base + (prod_count * 10))
    
    # Mood Score (0-100)
    mood_score = 80 if sentiment_label == "POSITIVE" else 30 if sentiment_label == "NEGATIVE" else 55
    
    return {
        "stress_score": stress_score,
        "sleep_score": sleep_score,
        "productivity_score": productivity_score,
        "mood_score": mood_score,
        "issue_type": detect_issue(message)
    }

def get_ai_behavioral_insight(data_type, values):
    """Use Gemini to generate a meaningful healthcare-style insight from data trends."""
    if not ai_client: return "Consistency in tracking is key to long-term wellness."
    
    try:
        prompt = f"Analyze these {data_type} metrics from a mental health app: {values}. Provide a 1-sentence professional insight starting with 'Observation:' and focusing on behavioral impact."
        response = ai_client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content.strip()
    except:
        return "Your patterns show a clear correlation between stress and daily energy levels."

# ---- Server Health Check ----
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "message": "MindSaarthi API is running successfully!",
        "timestamp": datetime.datetime.now().isoformat()
    }), 200

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

# ----  Sentimental Fallback Engine (In case of 429 Quota Errors) ----
def get_hardcoded_empathy(risk_level, sentiment):
    if risk_level == "High":
        return "I can hear how painful this is for you. Please know that you're not alone, and reaching out is a brave first step. I strongly encourage you to connect with a crisis support professional who can provide the immediate care you deserve."
    if risk_level == "Moderate":
        return "It sounds like you're carrying a lot on your shoulders right now. I'm here to listen. Taking a small moment to breathe and focus on your well-being can sometimes help when things feel overwhelming."
    if sentiment == "NEGATIVE":
        return "I'm sorry you're going through a tough time. It's completely valid to feel this way. Tell me more about what's on your mind. I'm here for you."
    return "I appreciate you sharing your thoughts with me. How else can I support you today? I'm always here to listen."

@app.route('/chat', methods=['POST'])
@jwt_required(optional=True)
def chat():
    print("\n" + "="*50)
    print(" NEW CHAT REQUEST RECEIVED")
    print("="*50)

    try:
        data = request.json
        user_message = data.get('message', '')
        user_id = get_jwt_identity()
        mode = data.get('mode', 'normal') # 'normal' or 'therapy'
        
        print(f" Input: {user_message[:60]} | Mode: {mode}")

        # 1. Pipeline Analysis
        sentiment_result = None
        sentiment_label = "NEUTRAL"
        if sentiment_pipeline:
            try:
                sentiment_result = sentiment_pipeline(user_message)
                sentiment_label = sentiment_result[0]['label']
            except: pass
        
        risk_level = get_risk_level(user_message, sentiment_result)
        issue_type = detect_issue(user_message)
        coping_tip = get_coping_suggestion(issue_type)
        
        print(f" Analysis -> Risk: {risk_level}, Sentiment: {sentiment_label}, Issue: {issue_type}")

        # 2. Context & Personality Loading
        context = ""
        personality_context = ""
        if user_id:
            user_history = list(chats_collection.find({"user_id": user_id}).sort("timestamp", -1).limit(7))[::-1]
            for c in user_history:
                context += f"User: {c.get('user_message', '')}\nMindSaarthi: {c.get('bot_reply', '')}\n"
            
            profile = personality_collection.find_one({"user_id": user_id})
            if profile:
                personality_context = f"User Pattern: Tends to feel {profile.get('dominant_issue')} during the {profile.get('peak_stress_period')}. Current Avg Mood: {profile.get('avg_mood')}/100."

        # 3. AI Brain Call
        bot_reply = ""
        if not ai_client:
            bot_reply = get_hardcoded_empathy(risk_level, sentiment_label)
        else:
            try:
                system_prompt = "You are MindSaarthi, a personalized AI Mental Health Assistant."
                if mode == "therapy":
                    system_prompt += " Act as a professional therapist. Ask deep, reflective questions. Speak slowly and thoughtfully. Focus on root causes."
                else:
                    system_prompt += " Be empathetic, conversational, and direct. Use short, helpful responses."
                
                prompt = f"System Info: {personality_context}\nContext: {context}\nUser: {user_message}\nTask: Respond as MindSaarthi. Risk: {risk_level}. Issue Detected: {issue_type}."
                
                response = ai_client.chat.completions.create(
                    model="google/gemini-2.0-flash-001",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ]
                )
                bot_reply = response.choices[0].message.content.strip().replace("*", "")
            except Exception as ai_err:
                bot_reply = get_hardcoded_empathy(risk_level, sentiment_label)

        # 4. Resilience & Analytics Update
        if user_id:
            chat_doc = {
                "user_id": user_id,
                "user_message": user_message,
                "bot_reply": bot_reply,
                "sentiment": sentiment_label,
                "risk": risk_level,
                "issue_type": issue_type,
                "mode": mode,
                "timestamp": datetime.datetime.now()
            }
            if db_con: chats_collection.insert_one(chat_doc)
            
            # Record Analytics
            analytics_data = calculate_analytics_scores(user_message, sentiment_label, risk_level)
            analytics_doc = {
                "user_id": user_id,
                **analytics_data,
                "risk_level": risk_level,
                "timestamp": datetime.datetime.now()
            }
            if db_con: 
                analytics_collection.insert_one(analytics_doc)
                update_personality_profile(user_id, analytics_data)
                
                # Update Daily Trend
                date_str = datetime.datetime.now().strftime("%Y-%m-%d")
                emotional_trend_collection.update_one(
                    {"user_id": user_id, "date": date_str},
                    {"$push": {"moods": analytics_data["mood_score"], "stresses": analytics_data["stress_score"]}},
                    upsert=True
                )

            if risk_level == "High":
                log_high_risk_event(user_id, user_message)
            
            # For hackathon demo, automatically generate a session report entry
            generate_session_report(user_id, user_message, sentiment_label, risk_level, detect_issue(user_message))

            # NEW: Record Behavioral Analytics
            analytics_data = calculate_analytics_scores(user_message, sentiment_label, risk_level)
            analytics_doc = {
                "user_id": user_id,
                **analytics_data,
                "risk_level": risk_level,
                "timestamp": datetime.datetime.now()
            }
            if db_con and analytics_collection is not None:
                analytics_collection.insert_one(analytics_doc)

        return jsonify({
            "reply": bot_reply,
            "suggestion": coping_tip,
            "sentiment": sentiment_label,
            "risk": risk_level,
            "issue": issue_type,
            "ask_consent": risk_level == "High"
        })
    except Exception as fatal_err:
        print(f" [FATAL] Global Error: {fatal_err}")
        traceback.print_exc()
        return jsonify({"reply": "I'm experiencing a small temporary issue, but I'm still here for you. Tell me more?"}), 500

# ---- VOICE LLM INTERFACE ----
@app.route('/voice-chat', methods=['POST'])
@jwt_required(optional=True)
def voice_chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        lang = data.get('lang', 'en') # 'en', 'hi', or 'hinglish'
        mode = data.get('mode', 'normal')
        user_id = get_jwt_identity()

        # 1. Pipeline Analysis
        sentiment_result = None
        sentiment_label = "NEUTRAL"
        if sentiment_pipeline:
            try:
                sentiment_result = sentiment_pipeline(user_message)
                sentiment_label = sentiment_result[0]['label']
            except: pass
        
        risk_level = get_risk_level(user_message, sentiment_result)
        issue_type = detect_issue(user_message)
        coping_tip = get_coping_suggestion(issue_type)

        # 2. Context & Personality Loading
        context = ""
        personality_context = ""
        if user_id:
            user_history = list(chats_collection.find({"user_id": user_id}).sort("timestamp", -1).limit(5))[::-1]
            for c in user_history:
                context += f"User: {c.get('user_message', '')}\nMindSaarthi: {c.get('bot_reply', '')}\n"
            
            profile = personality_collection.find_one({"user_id": user_id})
            if profile:
                personality_context = f"User Memory: Frequent {profile.get('dominant_issue')} during {profile.get('peak_stress_period')}."

        # 3. Empathic Conversational Prompt
        system_prompt = f"You are MindSaarthi, a compassionate human therapist. Language: {lang}."
        if mode == "therapy":
            system_prompt += " Therapy Mode: Ask deep, reflective questions. Speak slowly. Focus on emotional roots."
        
        prompt = f"""
        {personality_context}
        Context: {context}
        User Message: "{user_message}"
        Risk Level: {risk_level}
        Issue: {issue_type}
        
        STRICT VOICE INSTRUCTIONS:
        1. Keep response under 2 sentences. Sound natural (use "hmm", "I see").
        2. Match the requested language ({lang}). If Hinglish, use casual natural phrases.
        3. Split your answer into distinct short logical chunks, separated by " | ".
        """
        
        bot_reply = "Hmm... I understand... | Tell me a bit more about what you're feeling."
        if ai_client:
            try:
                response = ai_client.chat.completions.create(
                    model="google/gemini-2.0-flash-001",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=80
                )
                bot_reply = response.choices[0].message.content.strip().replace("*", "")
            except Exception as e:
                print(f"[VOICE AI ERROR]: {e}")

        reply_chunks = [c.strip() for c in bot_reply.split("|") if c.strip()]
        if not reply_chunks: reply_chunks = [bot_reply]

        # 4. Text to Speech Generation (gTTS)
        tts_lang = 'en'
        tld = 'com'
        if lang == 'hi': 
            tts_lang = 'hi'
            tld = 'co.in'
        elif lang == 'hinglish':
            tts_lang = 'en'
            tld = 'co.in'

        audio_chunks_b64 = []
        is_slow = (risk_level == "High" or mode == "therapy")
        
        for index, chunk in enumerate(reply_chunks):
            chunk_for_tts = chunk.replace("...", ". ")
            tts = gTTS(text=chunk_for_tts, lang=tts_lang, tld=tld, slow=is_slow)
            buffer = io.BytesIO()
            tts.write_to_fp(buffer)
            buffer.seek(0)
            audio_chunks_b64.append(base64.b64encode(buffer.read()).decode('utf-8'))
        
        # 5. Logging & Analytics
        if user_id:
            chat_doc = {
                "user_id": user_id,
                "user_message": user_message,
                "bot_reply": bot_reply,
                "sentiment": sentiment_label,
                "risk": risk_level,
                "session_type": "Call",
                "timestamp": datetime.datetime.now()
            }
            if db_con: chats_collection.insert_one(chat_doc)
            
            analytics_data = calculate_analytics_scores(user_message, sentiment_label, risk_level)
            if db_con:
                analytics_collection.insert_one({
                    "user_id": user_id,
                    **analytics_data,
                    "risk_level": risk_level,
                    "timestamp": datetime.datetime.now()
                })
                update_personality_profile(user_id, analytics_data)
                
            generate_session_report(user_id, user_message, sentiment_label, risk_level, issue_type, session_type="Call")

        return jsonify({
            "reply": bot_reply.replace(" | ", " "),
            "reply_chunks": reply_chunks,
            "audio_chunks": audio_chunks_b64,
            "suggestion": coping_tip,
            "risk": risk_level,
            "issue": issue_type
        })
    except Exception as e:
        print(f"[VOICE GLOBAL ERROR]: {e}")
        return jsonify({"error": str(e)}), 500

# ---- EMERGENCY TRIGGER (AFTER CONSENT) ----
@app.route('/emergency-confirm', methods=['POST'])
@jwt_required(optional=True)
def emergency_confirm():
    try:
        data = request.json
        user_id = get_jwt_identity()
        lat = data.get('lat')
        lng = data.get('lng')
        
        user_name = "MindSaarthi User"
        if user_id:
            u = users_collection.find_one({"_id": ObjectId(user_id)}) if db_con else next((u for u in mock_users if str(u['_id']) == user_id), None)
            if u: user_name = u.get("name", "MindSaarthi User")
            
        # 1. Find nearby help
        doctors = get_nearby_doctors(lat, lng)
        
        # 2. Trigger WhatsApp Alert if configured
        alert_sent = send_whatsapp_alert(lat, lng, user_name)
        
        return jsonify({
            "status": "triggered",
            "alert_sent": alert_sent,
            "doctors": doctors,
            "message": "Nearby help identified and trusted contact notified."
        })
    except Exception as e:
        print(f"Emergency Trigger Error: {e}")
        return jsonify({"error": str(e)}), 500

# ---- RECOVERY PLAN API ----
@app.route('/generate-plan', methods=['POST'])
@jwt_required()
def generate_plan():
    try:
        user_id = get_jwt_identity()
        data = request.json
        message = data.get('message', 'General check-in')
        risk = data.get('risk', 'Low')
        sentiment = data.get('sentiment', 'Neutral')
        context = data.get('context', '')
        
        # 1. Generate Plan using AI
        plan = generate_recovery_plan_ai(user_id, message, risk, sentiment, context)
        
        # 2. Store in DB
        plan_doc = {
            "user_id": user_id,
            "plan": plan,
            "issue_type": plan.get("issue", "general"),
            "risk_level": risk,
            "sentiment_label": sentiment,
            "created_at": datetime.datetime.now()
        }
        
        if recovery_plans_collection is not None:
            recovery_plans_collection.insert_one(plan_doc)
            
        return jsonify({
            "status": "success",
            "plan": plan
        })
    except Exception as e:
        print(f"Plan Generation Route Error: {e}")
        return jsonify({"error": "Failed to generate plan"}), 500

@app.route('/plans', methods=['GET'])
@jwt_required()
def get_plans():
    try:
        user_id = get_jwt_identity()
        if recovery_plans_collection is None:
            return jsonify([])
            
        plans = list(recovery_plans_collection.find({"user_id": user_id}).sort("created_at", -1))
        # Convert ObjectId and datetime for JSON
        for p in plans:
            p["_id"] = str(p["_id"])
            p["created_at"] = p["created_at"].strftime("%Y-%m-%d")
            if "status" not in p:
                p["status"] = "active" # Default for old records
        return jsonify(plans)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---- ADVANCED DASHBOARD ENDPOINTS ----

@app.route('/reports', methods=['GET'])
@jwt_required()
def get_reports():
    user_id = get_jwt_identity()
    if session_reports_collection is None: return jsonify([])
    reports = list(session_reports_collection.find({"user_id": user_id}).sort("created_at", -1))
    for r in reports:
        r["_id"] = str(r["_id"])
        r["created_at"] = r["created_at"].strftime("%Y-%m-%d %H:%M")
    return jsonify(reports)

@app.route('/risk-history', methods=['GET'])
@jwt_required()
def get_risk_history():
    user_id = get_jwt_identity()
    if risk_history_collection is None: return jsonify([])
    risks = list(risk_history_collection.find({"user_id": user_id}).sort("timestamp", -1))
    for r in risks:
        r["_id"] = str(r["_id"])
        r["timestamp"] = r["timestamp"].strftime("%Y-%m-%d %H:%M")
    return jsonify(risks)

@app.route('/daily-progress', methods=['GET'])
@jwt_required()
def get_daily_progress():
    user_id = get_jwt_identity()
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    if daily_progress_collection is None: return jsonify({"tasks": [], "date": today, "progress": 0})
    
    prog = daily_progress_collection.find_one({"user_id": user_id, "date": today})
    if not prog:
        # Create default daily tasks for the new user day
        default_tasks = [
            {"task_name": "Deep Breathing (5 mins)", "completed": False},
            {"task_name": "Hydration (2L)", "completed": False},
            {"task_name": "Daily Journal Entry", "completed": False},
            {"task_name": "30 Min Movement", "completed": False}
        ]
        prog = {"user_id": user_id, "date": today, "tasks": default_tasks}
        daily_progress_collection.insert_one(prog)
    
    prog["_id"] = str(prog["_id"])
    completed = [t for t in prog["tasks"] if t["completed"]]
    prog["progress"] = (len(completed) / len(prog["tasks"])) * 100 if prog["tasks"] else 0
    return jsonify(prog)

@app.route('/mark-task', methods=['POST'])
@jwt_required()
def mark_task():
    user_id = get_jwt_identity()
    data = request.json
    task_name = data.get('task_name')
    completed = data.get('completed', True)
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    
    if daily_progress_collection is None: return jsonify({"error": "DB down"}), 500
    
    daily_progress_collection.update_one(
        {"user_id": user_id, "date": today, "tasks.task_name": task_name},
        {"$set": {"tasks.$.completed": completed}}
    )
    return jsonify({"success": True})

@app.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    user_id = get_jwt_identity()
    if analytics_collection is None: return jsonify([])
    
    # Get last 14 entries for trend analysis
    data = list(analytics_collection.find({"user_id": user_id}).sort("timestamp", 1).limit(20))
    chart_data = []
    for d in data:
        chart_data.append({
            "date": d["timestamp"].strftime("%b %d"),
            "full_date": d["timestamp"].strftime("%Y-%m-%d %H:%M"),
            "stress": d["stress_score"],
            "productivity": d["productivity_score"],
            "sleep": d["sleep_score"],
            "mood": d["mood_score"],
            "risk": d["risk_level"]
        })
    
    # Generate dynamic AI insights for each major graph
    insights = {
        "stress_prod": get_ai_behavioral_insight("Stress vs Productivity", chart_data[-5:] if chart_data else []),
        "sleep_mood": get_ai_behavioral_insight("Sleep vs Mood", chart_data[-5:] if chart_data else []),
        "risk_trend": "Your risk stability has improved by 15% this week."
    }
    
    return jsonify({
        "chart_data": chart_data,
        "insights": insights
    })

@app.route('/issue-distribution', methods=['GET'])
@jwt_required()
def get_issue_distribution():
    user_id = get_jwt_identity()
    if analytics_collection is None: return jsonify([])
    
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$issue_type", "value": {"$sum": 1}}}
    ]
    results = list(analytics_collection.aggregate(pipeline))
    formatted = [{"name": r["_id"].replace('_', ' ').title(), "value": r["value"]} for r in results]
    return jsonify(formatted)

@app.route('/weekly-score', methods=['GET'])
@jwt_required()
def get_weekly_score():
    user_id = get_jwt_identity()
    if analytics_collection is None: return jsonify({"score": 70})
    
    # Calculate average mood/mental health score for last 7 days
    data = list(analytics_collection.find({"user_id": user_id}).sort("timestamp", -1).limit(10))
    if not data: return jsonify({"score": 0, "status": "No data"})
    
    avg_mood = sum(d["mood_score"] for d in data) / len(data)
    avg_stress = sum(d["stress_score"] for d in data) / len(data)
    
    final_score = (avg_mood + (100 - avg_stress)) / 2
    return jsonify({
        "score": round(final_score),
        "status": "Improving" if final_score > 60 else "Requires Attention"
    })

# ---- PERSONALIZATION & TRENDS ENDPOINTS ----

@app.route('/emotional-trend', methods=['GET'])
@jwt_required()
def get_emotional_trend():
    user_id = get_jwt_identity()
    if emotional_trend_collection is None: return jsonify([])
    
    # Fetch last 7 days inclusive of today
    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=6)
    
    trends = list(emotional_trend_collection.find({
        "user_id": user_id,
        "date": {"$gte": start_date.strftime("%Y-%m-%d"), "$lte": end_date.strftime("%Y-%m-%d")}
    }).sort("date", 1))
    
    formatted = []
    for t in trends:
        avg_mood = sum(t["moods"]) / len(t["moods"]) if t["moods"] else 0
        avg_stress = sum(t["stresses"]) / len(t["stresses"]) if t["stresses"] else 0
        formatted.append({
            "date": t["date"],
            "mood": round(avg_mood),
            "stress": round(avg_stress)
        })
    return jsonify(formatted)

@app.route('/user-insights', methods=['GET'])
@jwt_required()
def get_user_insights():
    user_id = get_jwt_identity()
    if personality_collection is None: return jsonify({})
    profile = personality_collection.find_one({"user_id": user_id})
    if not profile: return jsonify({"message": "Keep talking to MindSaarthi to unlock personal insights!"})
    
    insight_text = f"You tend to feel more {profile.get('dominant_issue')} during the {profile.get('peak_stress_period')}."
    return jsonify({
        "dominant_issue": profile.get("dominant_issue"),
        "peak_stress_period": profile.get("peak_stress_period"),
        "insight": insight_text,
        "avg_mood": profile.get("avg_mood"),
        "avg_stress": profile.get("avg_stress")
    })

@app.route('/download-report/<report_id>', methods=['GET'])
@jwt_required()
def download_pdf_report(report_id):
    user_id = get_jwt_identity()
    if session_reports_collection is None: return "DB down", 500
    
    report = session_reports_collection.find_one({"_id": ObjectId(report_id), "user_id": user_id})
    if not report: return "Not found", 404
    
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    user_name = user.get("name", "User") if user else "MindSaarthi User"

    # PDF generation in-memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Professional Styles
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], textColor=colors.white, fontSize=22, alignment=1, spaceAfter=10)
    header_box_style = ParagraphStyle('HeaderBox', parent=styles['Normal'], backColor=colors.HexColor("#175dc5"), textColor=colors.white, fontSize=12, borderPadding=10, alignment=1)
    section_title = ParagraphStyle('SectionTitle', parent=styles['Heading2'], textColor=colors.HexColor("#175dc5"), fontSize=14, spaceBefore=20, spaceAfter=10, borderPadding=5)
    body_text = ParagraphStyle('BodyText', parent=styles['Normal'], fontSize=11, leading=16, spaceAfter=8)
    risk_indicator = ParagraphStyle('RiskIndicator', parent=styles['Normal'], textColor=colors.HexColor("#ff1d24") if report.get('risk_level') == "High" else colors.HexColor("#175dc5"), fontSize=12, fontName='Helvetica-Bold')

    elements = []
    
    # 1. Professional Blue Header
    header_table_data = [
        [Paragraph("<b>MindSaarthi AI: Clinical Wellness Report</b>", title_style)],
        [Paragraph(f"Patient: {user_name} | Date: {report.get('created_at').strftime('%B %d, %Y') if isinstance(report.get('created_at'), datetime.datetime) else report.get('created_at')}", header_box_style)]
    ]
    header_table = Table(header_table_data, colWidths=[7*inch])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#175dc5")),
        ('TOPPADDING', (0, 0), (-1, -1), 15),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # 2. Executive Summary
    elements.append(Paragraph("Executive Summary", section_title))
    elements.append(Paragraph(report.get('summary', 'No summary provided for this interaction.'), body_text))
    
    # 3. Clinical Assessment
    elements.append(Paragraph("Clinical Assessment", section_title))
    assessment_data = [
        ["Risk Assessment:", Paragraph(report.get('risk_level', 'Low'), risk_indicator)],
        ["Primary Issue:", report.get('detected_issues', 'General Wellness').replace('_', ' ').title()],
        ["Sentiment Trend:", report.get('sentiment_trend', 'Neutral')]
    ]
    assessment_table = Table(assessment_data, colWidths=[2*inch, 4*inch])
    assessment_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor("#175dc5")),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    elements.append(assessment_table)
    
    # 4. Professional Recommendations
    elements.append(Paragraph("AI-Driven Recommendations", section_title))
    recs = report.get('recommendations', 'Continue maintaining your wellness routine.')
    # Handle multi-line recommendations if they come as bullet points
    for line in recs.split('\n'):
        if line.strip():
            prefix = "• " if line.strip().startswith(('-', '*', '1.', '2.', '3.')) else ""
            clean_line = line.strip().lstrip('-*123456789. ')
            elements.append(Paragraph(f"{prefix}{clean_line}", body_text))
    
    # 5. Recovery Focus
    elements.append(Paragraph("Next Steps & Focus", section_title))
    elements.append(Paragraph(f"The analysis suggests focusing on <b>{report.get('detected_issues', 'general stability').replace('_', ' ')}</b> and maintaining consistent check-ins.", body_text))
    
    # Footer
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("<hr/>", body_text))
    elements.append(Paragraph("<font size='8' color='grey'>This report is generated by MindSaarthi AI and is intended for informational purposes. It does not replace professional medical advice.</font>", body_text))
    
    doc.build(elements)
    buffer.seek(0)
    
    return send_file(buffer, as_attachment=True, download_name=f"MindSaarthi_Report_{report_id}.pdf", mimetype='application/pdf')

# ---- GROUP CHAT & SOCKET.IO FEATURES ----

# Room definitions
CHAT_ROOMS = {
    "anxiety": "Inner Calm Circle",
    "stress": "Balance & Flow",
    "depression": "Hope Horizon",
    "loneliness": "Connection Corner",
    "general": "Mindful Meadows",
    "crisis": "Safe Haven"
}

ANONYMOUS_ADJECTIVES = ["Quiet", "Brave", "Calm", "Gentle", "Resilient", "Kind", "Strong", "Peaceful"]
@app.route('/user/profile', methods=['GET', 'POST'])
@jwt_required()
def user_profile():
    user_id = get_jwt_identity()
    if request.method == 'GET':
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        return jsonify({
            "name": user.get("name"),
            "email": user.get("email"),
            "anonymous_mode": user.get("anonymous_mode", False),
            "interests": user.get("interests", [])
        })
    else:
        data = request.json
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "anonymous_mode": data.get("anonymous_mode", False),
                "interests": data.get("interests", [])
            }}
        )
        return jsonify({"success": True})

@socketio.on('join_group')
def on_join(data):
    user_id = data.get('user_id')
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user: return
    
    # Smart Matching: Detect issue from profile or recent chats
    profile = personality_collection.find_one({"user_id": user_id})
    issue = profile.get("dominant_issue", "general") if profile else "general"
    room = issue if issue in CHAT_ROOMS else "general"
    
    join_room(room)
    
    display_name = get_anonymous_name(user_id) if user.get("anonymous_mode") else user.get("name")
    
    emit('status', {
        'msg': f"{display_name} has entered the room.",
        'room_name': CHAT_ROOMS[room],
        'room_id': room
    }, room=room)
    
    # Send recent messages (last 20)
    # (Implementation for fetching from separate group_chats_collection could go here)

@socketio.on('send_group_message')
def handle_group_message(data):
    room = data.get('room')
    user_id = data.get('user_id')
    message = data.get('message')
    is_sticker = data.get('is_sticker', False)
    
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user: return

    # 1. AI Moderation & Toxicity Check
    sentiment_result = None
    risk_level = "Low"
    
    if not is_sticker:
        if sentiment_pipeline:
            try:
                sentiment_result = sentiment_pipeline(message)
            except: pass
        
        risk_level = get_risk_level(message, sentiment_result)
        
        # Toxicity detection (simplified: if sentiment is highly negative + risk is high)
        if risk_level == "High" and sentiment_result and sentiment_result[0]['score'] > 0.98:
            emit('moderation_alert', {'msg': 'Your message was flagged as potentially harmful and blocked.'}, room=request.sid)
            return

    display_name = get_anonymous_name(user_id) if user.get("anonymous_mode") else user.get("name")
    
    msg_id = str(ObjectId())
    emit('new_message', {
        'id': msg_id,
        'user': display_name,
        'user_id': user_id,
        'message': message,
        'is_sticker': is_sticker,
        'risk': risk_level,
        'timestamp': datetime.datetime.now().strftime("%I:%M %p")
    }, room=room)
    
    # 2. Crisis Detection trigger
    if not is_sticker and risk_level == "High":
        emit('crisis_alert', {
            'msg': 'High-risk content detected. Please check our resources page or call 988.',
            'helpline': '988'
        }, room=request.sid)

    # 3. AI Bot Reaction (Reactive)
    if random.random() < 0.3: # 30% chance for bot to respond
        trigger_bot_response(room, message)

def trigger_bot_response(room, user_message):
    """AI Bot in Group Reacts to the conversation."""
    if not ai_client: return
    
    prompt = f"""
    You are 'Saarthi-Bot', a supportive AI presence in a mental health group chat.
    The room name is '{CHAT_ROOMS.get(room, 'Safe Space')}'.
    A user just said: "{user_message}"
    
    Give a short (1-2 sentences), warm, and supportive response that encourages the group.
    Don't sound like a robot. Be a companion.
    """
    
    try:
        response = ai_client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=[{"role": "user", "content": prompt}]
        )
        bot_reply = response.choices[0].message.content.strip()
        
        emit('new_message', {
            'id': str(ObjectId()),
            'user': "Saarthi Bot ✨",
            'is_bot': True,
            'message': bot_reply,
            'timestamp': datetime.datetime.now().strftime("%I:%M %p")
        }, room=room)
    except: pass

@socketio.on('send_reaction')
def handle_reaction(data):
    room = data.get('room')
    msg_id = data.get('msg_id')
    reaction = data.get('type') # support, hug, relate
    
    emit('new_reaction', {
        'msg_id': msg_id,
        'type': reaction
    }, room=room)

@socketio.on('voice_chunk')
def handle_voice(data):
    # For push-to-talk: broadcast chunk to room
    room = data.get('room')
    user_id = data.get('user_id')
    audio_data = data.get('audio') # base64 chunk
    
    emit('incoming_voice', {
        'user_id': user_id,
        'audio': audio_data
    }, room=room, include_self=False)

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
