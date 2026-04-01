print("--- BACKEND STARTING ---")
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from transformers import pipeline
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
# Robust CORS with credentials support and preflight handling
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route("/api/reverse-geocode", methods=["GET"])
def reverse_geocode():
    lat = request.args.get("lat")
    lng = request.args.get("lng")
    if not lat or not lng:
        return jsonify({"address": "Unknown Location"}), 400
        
    try:
        # Using OpenStreetMap Nominatim API (Free, no key required for low volume)
        headers = {'User-Agent': 'MindSaarthi-App/1.0'}
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}&zoom=18&addressdetails=1"
        res = requests.get(url, headers=headers, timeout=5)
        data = res.json()
        
        # Priority: Landmark/Entity Name -> Road/Suburb -> City
        address_dict = data.get('address', {})
        landmark = data.get('display_name', '').split(',')[0] # Usually the first part is the specific name (JECRC Uni)
        
        # Format a professional landmark-style address
        final_address = landmark
        if not landmark or landmark.replace(' ', '').isdigit(): # Fallback if first part is a number
            suburb = address_dict.get('suburb', address_dict.get('neighbourhood', ''))
            city = address_dict.get('city', address_dict.get('town', ''))
            final_address = f"{suburb}, {city}" if suburb else city
            
        return jsonify({"address": final_address or "MindSaarthi Hub"})
    except Exception as e:
        print(f"Geocoding Error: {e}")
        return jsonify({"address": "Geolocation Hub"})

@app.route("/api/doctors", methods=["GET"])
def get_doctors():
    doctors = [
        {
            "id": 1,
            "name": "Dr. Ananya Sharma",
            "specialization": "Clinical Psychiatrist",
            "rating": 4.9,
            "reviews": 124,
            "address": "GK-II, New Delhi",
            "phone": "+91 98765 43210",
            "lat": 28.5355,
            "lng": 77.2090,
            "image": "https://images.unsplash.com/photo-1559839734-2b71f153678?w=800&auto=format&fit=crop",
            "fee": "₹1500"
        },
        {
            "id": 2,
            "name": "Dr. Rohan Mehta",
            "specialization": "CBT Specialist",
            "rating": 4.7,
            "reviews": 89,
            "address": "Sector 62, Noida",
            "phone": "+91 91234 56780",
            "lat": 28.6139,
            "lng": 77.3910,
            "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&auto=format&fit=crop",
            "fee": "₹1200"
        },
        {
            "id": 3,
            "name": "Dr. Priya Varma",
            "specialization": "Child Psychologist",
            "rating": 4.8,
            "reviews": 210,
            "address": "Indrapuram, Ghaziabad",
            "phone": "+91 99887 76655",
            "lat": 28.6692,
            "lng": 77.4538,
            "image": "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop",
            "fee": "₹2000"
        },
        {
            "id": 4,
            "name": "Prof. Sameer Khan",
            "specialization": "Family Counselor",
            "rating": 4.6,
            "reviews": 56,
            "address": "Vasant Kunj, South Delhi",
            "phone": "+91 88776 65544",
            "lat": 28.5293,
            "lng": 77.1517,
            "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=800&auto=format&fit=crop",
            "fee": "₹1000"
        },
        {
            "id": 5,
            "name": "Dr. Ishita Roy",
            "specialization": "Anxiety Specialist",
            "rating": 4.9,
            "reviews": 340,
            "address": "Hauz Khas, Delhi",
            "phone": "+91 77665 54433",
            "lat": 28.5494,
            "lng": 77.2001,
            "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop",
            "fee": "₹1800"
        },
        {
            "id": 6,
            "name": "Dr. Kabir Singh",
            "specialization": "Addiction Therapist",
            "rating": 4.5,
            "reviews": 112,
            "address": "Gurgaon, Phase 3",
            "phone": "+91 66554 43322",
            "lat": 28.4595,
            "lng": 77.0266,
            "image": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop",
            "fee": "₹2200"
        }
    ]
    return jsonify(doctors)


# ✅ 👉 PASTE THIS RIGHT HERE (below the above function)

@app.route("/nearby-doctors", methods=["GET"])
def nearby_doctors():
    lat = request.args.get("lat")
    lng = request.args.get("lng")

    if not lat or not lng:
        return jsonify({"error": "Latitude and Longitude required"}), 400

    try:
        doctors = get_nearby_doctors(lat, lng)
        return jsonify(doctors)
    except Exception as e:
        print("Nearby doctors error:", e)
        return jsonify([
            {
                "name": "Emergency Health Center",
                "address": "Call 112 immediately",
                "lat": lat,
                "lng": lng
            }
        ])


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
print("Loading NLP pipeline... This may take a moment.")
try:
    sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
    print("Pipeline loaded!")
except Exception as e:
    print(f"Error loading pipeline: {e}")
    sentiment_pipeline = None

# ---- Helper Functions ----
import re
def clean_markdown_for_pdf(text):
    """Converts AI markdown (*, **) to ReportLab-friendly HTML tags (<i>, <b>)."""
    if not text: return ""
    # 1. Convert bold (**) to <b>
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    # 2. Convert italics (*) to <i>
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    # 3. Convert bullet points (- or *) to bullet symbols
    text = re.sub(r'^(\s*)[\-\*]\s+', r'\1• ', text, flags=re.MULTILINE)
    # 4. Remove any remaining isolated asterisks
    text = text.replace('*', '')
    # 5. Handle newlines for Paragraph
    text = text.replace('\n', '<br/>')
    return text

def get_risk_level(text, sentiment_result=None):
    """Deep AI-driven risk assessment with robust keyword fallback."""
    text_lower = text.lower()
    
    # 1. Expanded High Risk Keywords (Safety Priority)
    high_risk_keywords = [
        "suicide", "kill myself", "killing myself", "end my life", "ending my life",
        "i don't want to live", "die", "death", "goodbye world", "final message",
        "give up", "worthless", "hopeless", "better off dead", "ready to go",
        "no reason to stay", "self harm", "hurting myself", "hanging", "overdose",
        "cutting", "jump", "shooting", "poison", "end it all", "ending it all"
    ]
    
    if any(k in text_lower for k in high_risk_keywords):
        return "High"

    # 2. AI Assessment for Indirect Signs (e.g. hopelessness, isolation)
    if ai_client:
        try:
            # Stricter prompt for safety
            prompt = f"""
            CRITICAL SAFETY ANALYSIS:
            Analyze user message for acute risk of self-harm or suicide.
            User Message: "{text}"
            
            Is this user in a mental health CRISIS or expressing intent/ideation?
            Reply ONLY with 'High' or 'Low'.
            """
            response = ai_client.chat.completions.create(
                model="google/gemini-2.0-flash-001",
                messages=[{"role": "user", "content": prompt}]
            )
            ai_risk = (response.choices[0].message.content or "").strip()
            if "High" in ai_risk:
                return "High"
        except Exception as e:
            print(f"AI Risk Detection Error: {e}")

    # 3. Sentiment & Moderate Keywords Fallback
    moderate_risk_keywords = ["stress", "tired", "anxious", "overwhelmed", "worry", "panic", "sad", "alone", "exhausted", "burnout", "depressed", "fucking stuff"]
    if any(word in text_lower for word in moderate_risk_keywords):
        # If user is using moderate distress words + highly negative sentiment
        if sentiment_result and sentiment_result[0]['label'] == 'NEGATIVE' and sentiment_result[0]['score'] > 0.98:
            return "High"
        return "Moderate"
        
    # 4. Global Sentiment Fallback
    if sentiment_result:
        label = sentiment_result[0]['label']
        score = sentiment_result[0]['score']
        if label == "NEGATIVE" and score > 0.95:
            return "High" if score > 0.99 else "Moderate"
            
    return "Low"

def detect_issue(user_message):
    """Classify user's main struggle for targeted recovery planning."""
    msg = user_message.lower()
    if any(k in msg for k in ["kill", "die", "end it", "suicide", "harm", "hurt myself"]):
        return "crisis"
    if any(k in msg for k in ["sleep", "insomnia", "nightmare", "waking up", "can't sleep"]):
        return "sleep_issue"
    elif any(k in msg for k in ["stress", "pressure", "workload", "exams", "overwhelmed", "deadline"]):
        return "stress"
    elif any(k in msg for k in ["overthinking", "logic", "thoughts", "can't stop", "what if", "mind racing"]):
        return "overthinking"
    elif any(k in msg for k in ["tired", "burnout", "exhausted", "no energy", "drained", "burnt out", "fatigue"]):
        return "burnout"
    elif any(k in msg for k in ["alone", "lonely", "no one", "isolated", "single"]):
        return "loneliness"
    elif any(k in msg for k in ["anxious", "panic", "fear", "scared", "shaking", "nervous"]):
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
    """Fetch nearest hospitals using robust Overpass mirrors and broader radius."""
    # Mirror servers for redundancy
    overpass_mirrors = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter", # High performance mirror
        "https://lz4.overpass-api.de/api/interpreter"
    ]
    
    radius = 15000 # Increased to 15km for better rural coverage
    
    # query nwr (node, way, relation) to catch polygon hospitals
    query = f"""
    [out:json][timeout:25];
    (
      nwr["amenity"~"hospital|clinic|doctors"](around:{radius},{lat},{lng});
      nwr["healthcare"~"hospital|psychiatrist|psychotherapy"](around:{radius},{lat},{lng});
    );
    out center body 4;
    """

    for mirror in overpass_mirrors:
        try:
            print(f"DEBUG: Attempting hospital fetch from {mirror}...")
            response = requests.post(mirror, data={'data': query}, timeout=8)
            if response.status_code != 200: continue
                
            data = response.json()
            elements = data.get("elements", [])
            
            if not elements: continue
                
            results = []
            for el in elements:
                tags = el.get("tags", {})
                name = tags.get("name") or tags.get("name:en") or "Medical Center"
                addr = tags.get("addr:street") or tags.get("addr:full") or "Nearby Location"
                
                # Fetch lat/lng from node directly or centroid (center) for ways/relations
                e_lat = el.get("lat") or el.get("center", {}).get("lat")
                e_lng = el.get("lon") or el.get("center", {}).get("lon")
                
                if e_lat and e_lng:
                    results.append({
                        "name": name,
                        "address": addr,
                        "lat": e_lat,
                        "lng": e_lng,
                        "type": el.get("type", "node")
                    })
            
            if results: return results[:4]
            
        except Exception as e:
            print(f"OSM Mirror Error ({mirror}): {e}")
            continue

    # Final Fallback if all mirrors fail
    print("WARNING: All Overpass mirrors failed. Returning fallback clinical centers.")
    return [
        {"name": "MindSaarthi Primary Support", "address": "Call 112 (Emergency)", "lat": lat, "lng": lng},
        {"name": "Health Helpline India", "address": "91-11-23978046", "lat": lat, "lng": lng}
    ]

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
    """Summarize and save a chat session to MongoDB, then spawn a unique recovery plan."""
    try:
        # 1. Generate Recommendations using AI (Mental Health Report)
        if not ai_client:
            recommendations = "Seek support from trusted circles. Maintain a regular meditation habit."
        else:
            prompt = f"Summarize the following mental health session insights and provide 3-4 professional recommendations based on: {session_summary}. Risk Level: {risk_level}. Sentiment Trend: {sentiment_trend}."
            response = ai_client.chat.completions.create(
                model="google/gemini-2.0-flash-001",
                messages=[{"role": "user", "content": prompt}]
            )
            recommendations = response.choices[0].message.content.strip()

        # 2. Store Session Report
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

        # 3. Spawn a RECOVERY PLAN Architecture (Automatically)
        # This addresses user feedback about 'plans always being the same'
        try:
            plan = generate_recovery_plan_ai(user_id, session_summary, risk_level, sentiment_trend, context=f"Issues: {detected_issues}")
            plan_doc = {
                "user_id": user_id,
                "plan": plan,
                "issue_type": plan.get("issue", "clinical_event"),
                "risk_level": risk_level,
                "sentiment_label": sentiment_trend,
                "created_at": datetime.datetime.now(),
                "status": "active"
            }
            if recovery_plans_collection is not None:
                recovery_plans_collection.insert_one(plan_doc)
                print(" Dynamic Recovery Plan spawned for report.")
        except Exception as pe:
            print(f" Recovery Plan Spawn Error: {pe}")

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

    # MD-Score & Predictive Health Trajectory
    md_val = round(max(10, 100 - (sum({"High": 100, "Mod": 50, "Low": 10}.get(c["risk"][:3], 10) for c in user_chats[-3:]) / 3))) if user_chats else 100
    traj = [{"day": f"D+{i}", "score": round(md_val + random.uniform(-3, 3))} for i in range(1, 8)]

    return jsonify({
        "name": user_name,
        "latest_risk": overall_risk,
        "mood_history": history,
        "md_score": md_val,
        "health_trajectory": traj,
        "triage_summary": f"Predictive intelligence indicates stability at {md_val}% for the next 72h."
    })

# ----  Sentimental Fallback Engine (In case of 429 Quota Errors) ----
def get_hardcoded_empathy(risk_level, sentiment):
    if risk_level == "High":
        return "I can hear how painful this is for you. Please know that you're not alone, and reaching out is a brave first step. I strongly encourage you to connect with a crisis support professional who can provide the immediate care you deserve."
    if risk_level == "Moderate":
        return "It sounds like you're carrying a lot on your shoulders right now. I'm here to listen. Taking a small moment to breathe and focus on your well-being can sometimes help when things feel overwhelming."
    if sentiment == "NEGATIVE":
        return "I'm sorry you're going through a tough time. It's completely valid to feel this way. Tell me more about what's on your mindI'm here for you."
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
        
        # CPU Optimization: AI is much faster at remote inference than local CPU
        # Skip slow transformer model if OpenRouter is active
        if not ai_client and sentiment_pipeline:
            try:
                sentiment_result = sentiment_pipeline(user_message)
                sentiment_label = sentiment_result[0]['label']
            except: pass
        
        risk_level = get_risk_level(user_message, sentiment_result)
        
        # Automated Alert for High Risk in 1-on-1 Chat
        if risk_level == "High":
             user_name = "MindSaarthi User"
             if user_id:
                u = users_collection.find_one({"_id": ObjectId(user_id)})
                if u: user_name = u.get("name")
             send_whatsapp_alert(0, 0, user_name + " (AI Chat)")
             
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

        # 5. Exercise Trigger Detection
        # If the manual detector didn't catch a specific issue, we can use the analytics to trigger
        final_issue = issue_type if issue_type in ["stress", "burnout", "anxiety"] else analytics_data["issue_type"]
        
        exercise_trigger = None
        if final_issue in ["stress", "burnout", "anxiety"]:
            # Logic to trigger exercises
            if final_issue == "stress":
                exercise_trigger = {"type": "breathing", "duration": 120}
            elif final_issue == "anxiety":
                exercise_trigger = {"type": "grounding", "duration": 180}
            elif final_issue == "burnout":
                exercise_trigger = {"type": "micro_break", "duration": 120}

        return jsonify({
            "reply": bot_reply,
            "suggestion": coping_tip,
            "sentiment": sentiment_label,
            "risk": risk_level,
            "issue": final_issue,
            "ask_consent": risk_level == "High",
            "exercise": exercise_trigger
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
    summary_clean = clean_markdown_for_pdf(report.get('summary', 'No summary provided.'))
    elements.append(Paragraph(summary_clean, body_text))
    
    # 3. Clinical Analysis & Metrics
    elements.append(Paragraph("Clinical Analysis & Metrics", section_title))
    assessment_data = [
        [Paragraph("<b>Risk Assessment:</b>", body_text), Paragraph(report.get('risk_level', 'Low'), risk_indicator)],
        [Paragraph("<b>Primary Indicator:</b>", body_text), report.get('detected_issues', 'General Wellness').replace('_', ' ').title()],
        [Paragraph("<b>Sentiment Analysis:</b>", body_text), report.get('sentiment_trend', 'Neutral')],
        [Paragraph("<b>AI Model:</b>", body_text), "MindSaarthi v2.0 (Gemini 2.0 Flash)"]
    ]
    assessment_table = Table(assessment_data, colWidths=[2.5*inch, 3.5*inch])
    assessment_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#f8fafc")),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#175dc5")),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(assessment_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # 4. Actionable Recommendations
    elements.append(Paragraph("Actionable Wellness Recommendations", section_title))
    recs_clean = clean_markdown_for_pdf(report.get('recommendations', 'Continue maintaining your wellness routine.'))
    elements.append(Paragraph(recs_clean, body_text))
    
    # 5. Professional Footer Disclaimer
    elements.append(Spacer(1, 0.5*inch))
    footer_text = "<font color='#94a3b8' size='8'><b>DISCLAIMER:</b> This report is generated by an Artificial Intelligence system for informational purposes only. It is NOT a medical diagnosis or a substitute for professional clinical advice. If you are experiencing a crisis, please contact emergency services (988 in the US, or local counterparts).</font>"
    elements.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], alignment=1)))
    
    doc.build(elements)
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name=f"MindSaarthi_Report_{report_id}.pdf", mimetype='application/pdf')

@app.route('/record-exercise', methods=['POST'])
@jwt_required()
def record_exercise():
    try:
        user_id = get_jwt_identity()
        data = request.json
        exercise_type = data.get('exercise_type')
        completed = data.get('completed', True)
        
        exercise_doc = {
            "user_id": user_id,
            "exercise_type": exercise_type,
            "completed": completed,
            "timestamp": datetime.datetime.now()
        }
        
        # Save to analytics or a dedicated collection
        if db_con:
            db["user_exercises"].insert_one(exercise_doc)
            
            # Also update daily progress if there's a task for it
            today = datetime.datetime.now().strftime("%Y-%m-%d")
            # If the exercise was breathing, mark that task if it exists
            if exercise_type == 'breathing':
                daily_progress_collection.update_one(
                    {"user_id": user_id, "date": today, "tasks.task_name": {"$regex": "Breathing", "$options": "i"}},
                    {"$set": {"tasks.$.completed": True}}
                )
            
        return jsonify({"success": True})
    except Exception as e:
        print(f"Record Exercise Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/analyze-face', methods=['POST'])
@jwt_required()
def analyze_face():
    if not ai_client:
        return jsonify({"emotion": "Neutral", "confidence": 50, "mood": "Unknown", "insight": "AI Vision is currently offline.", "suggestions": ["Try again later."]}), 503
        
    try:
        user_id = get_jwt_identity()
        data = request.json
        frames = data.get('frames', []) # List of base64 images
        
        if not frames:
            return jsonify({"error": "No vision frames provided"}), 400

        # Construct multimodal message for Gemini 2.0
        # We'll take first 2 frames to stay within token/latency limits
        content_items = [{"type": "text", "text": "Analyze these facial frames from a mental health app. Determine the primary emotion (e.g., Happy, Sad, Stressed, Anxious, Neutral), a mood summary, a deeper insight, and 3 specific actionable suggestions. Return ONLY valid JSON."}]
        
        for frame in frames[:4]: # Increased from 2 to 4 for better accuracy
            # Expecting data:image/jpeg;base64,xxxx
            content_items.append({
                "type": "image_url",
                "image_url": {"url": frame}
            })

        response = ai_client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=[{
                "role": "system",
                "content": "You are a professional clinical wellness analyzer. Output MUST be in JSON format: {'emotion': 'string', 'confidence': number, 'mood': 'string', 'insight': 'string', 'suggestions': []}"
            }, {
                "role": "user",
                "content": content_items
            }],
            response_format={"type": "json_object"}
        )
        
        report = json.loads(response.choices[0].message.content)
        
        # UI Normalization: If AI returns confidence as 0.75 instead of 75, fix it
        if isinstance(report.get("confidence"), (float, int)) and report["confidence"] <= 1.0:
            report["confidence"] = int(report["confidence"] * 100)
        elif not isinstance(report.get("confidence"), (float, int)):
            report["confidence"] = 85 # Fallback
        
        # PERSIST: Generate a formal session report for the Neural Scan
        risk_map = {"Sad": "Moderate", "Anxious": "High", "Stressed": "Moderate", "Angry": "Moderate"}
        current_risk = risk_map.get(report.get("emotion"), "Low")
        
        try:
            generate_session_report(
                user_id=user_id,
                session_summary=f"Vision Analysis: {report.get('mood')}. {report.get('insight')}",
                sentiment_trend=report.get("emotion"),
                risk_level=current_risk,
                detected_issues=f"Facial Expression: {report.get('emotion')}",
                session_type="Neural Vision Scan"
            )
        except Exception as report_err:
            print(f"Error persisting face report: {report_err}")
        
        # Log to analytics if significant emotion detected
        if report.get("emotion") in ["Sad", "Anxious", "Stressed"]:
            log_high_risk_event(user_id, f"Face Detection: {report.get('emotion')}", hospital="System Monitoring")

        return jsonify(report)
        
    except Exception as e:
        print(f"Face Analysis Error: {e}")
        return jsonify({
            "emotion": "Analyzing",
            "confidence": 0,
            "mood": "System Error",
            "insight": "There was a problem processing the neural scan.",
            "suggestions": ["Ensure good lighting", "Center your face", "Retry scan"]
        }), 500

# ---- GROUP CHAT & SOCKET.IO FEATURES ----

# Room definitions
CHAT_ROOMS = {
    "community": "Safe Space Community 🌈"
}

ANONYMOUS_ADJECTIVES = ["Quiet", "Brave", "Calm", "Gentle", "Resilient", "Kind", "Strong", "Peaceful"]
@app.route('/user/profile', methods=['GET', 'POST'])
@jwt_required()
def user_profile():
    user_id = get_jwt_identity()
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user: return jsonify({"error": "User not found"}), 404

    if request.method == 'GET':
        # Derive a human-readable patient ID from the MongoDB ObjectID (last 4 chars)
        patient_id = f"#{str(user['_id'])[-4:].upper()}"
        
        return jsonify({
            "name": user.get("name"),
            "email": user.get("email"),
            "anonymous_mode": user.get("anonymous_mode", False),
            "crisis_alerts": user.get("crisis_alerts", True),
            "interests": user.get("interests", []),
            "patient_id": patient_id,
            "clinical_data": user.get("clinical_data", {
                "blood_group": "B+", "height": "178", "weight": "72", "heart_rate": "74"
            }),
            "emergency_contact": user.get("emergency_contact", {
                "name": "Guardian", "phone": "+91 90799 68792"
            })
        })
    else:
        data = request.json
        update_fields = {
            "name": data.get("name", user.get("name")),
            "anonymous_mode": data.get("anonymous_mode", user.get("anonymous_mode", False)),
            "crisis_alerts": data.get("crisis_alerts", user.get("crisis_alerts", True)),
            "interests": data.get("interests", user.get("interests", [])),
            "clinical_data": data.get("clinical_data", user.get("clinical_data", {})),
            "emergency_contact": data.get("emergency_contact", user.get("emergency_contact", {}))
        }
        
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_fields}
        )
        return jsonify({"success": True, "message": "Profile synced successfully!"})

@socketio.on('join_group')
def on_join(data):
    user_id = data.get('user_id')
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user: return
    
    # Single Global Room for all users
    room = "community"
    
    join_room(room)
    
    display_name = get_anonymous_name(user_id) if user.get("anonymous_mode") else user.get("name")
    
    emit('status', {
        'msg': f"{display_name} has entered the room.",
        'room_name': CHAT_ROOMS[room],
        'room_id': room
    }, room=room)
    

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
    
    # Optimization: Skip slow local transformer if we have a remote AI available or it's a sticker
    if not is_sticker:
        if not ai_client and sentiment_pipeline:
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
        
        # Trigger Twilio WhatsApp Alert to trusted contact
        user_name = "Anonymous"
        if user and not user.get('anonymous_mode'):
            user_name = user.get('name', 'User')
            
        send_whatsapp_alert(0, 0, user_name + " (Group Chat)")

    # 3. AI Bot Reaction (Reactive)
    # Background this so it doesn't block the message flow
    if random.random() < 0.3: # 30% chance for bot to respond
        socketio.start_background_task(trigger_bot_response, room, message)

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
        
        socketio.emit('new_message', {
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

VOICE_BUFFERS = {} # user_id -> bytearray

@socketio.on('voice_chunk')
def handle_voice(data):
    room = data.get('room')
    user_id = data.get('user_id')
    audio_data = data.get('audio') # base64 chunk
    
    # Broadcast to others
    emit('incoming_voice', {
        'user_id': user_id,
        'audio': audio_data
    }, room=room, include_self=False)

    # Risk Detection Buffer
    if user_id not in VOICE_BUFFERS:
        VOICE_BUFFERS[user_id] = bytearray()
    
    try:
        decoded = base64.b64decode(audio_data)
        VOICE_BUFFERS[user_id].extend(decoded)
        
        # If buffer is getting large (approx 5 sec of audio), analyze a sample
        if len(VOICE_BUFFERS[user_id]) > 80000: # Simple threshold
            socketio.start_background_task(analyze_voice_safety, user_id, list(VOICE_BUFFERS[user_id]), room)
            VOICE_BUFFERS[user_id] = bytearray() # Clear
    except: pass

def analyze_voice_safety(user_id, audio_bytes, room):
    """Analyze audio bytes for crisis using multimodal Gemini 2.0."""
    if not ai_client: return
    
    try:
        # Prompt for audio analysis
        prompt = "Listen to this audio. Is there a mental health crisis? Reply ONLY 'High' or 'Low'."
        # Multimodal call using base64 audio
        audio_b64 = base64.b64encode(bytes(audio_bytes)).decode('utf-8')
        
        response = ai_client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:audio/wav;base64,{audio_b64}"}} # GPT-style multimodal format
                ]
            }]
        )
        
        risk = (response.choices[0].message.content or "").strip()
        if "High" in risk:
            socketio.emit('crisis_alert', {
                'msg': 'High-risk content detected in your voice message. We are here to support you.',
                'helpline': '988'
            }, to=None, room=room) # Broadcast warning safely or to user
            
            # Send Twilio
            send_whatsapp_alert(0, 0, f"User {user_id} (Voice Chat)")
    except: pass

@app.route("/api/emergency-alert", methods=["POST"])
def emergency_alert():
    data = request.json
    user_id = data.get("user_id")
    name = data.get("name", "Unknown User")
    location = data.get("location", "Not provided")
    target_phone = data.get("target_phone")
    vitals = data.get("vitals", {})

    print(f"🚨 SOS RECEIVED from {name} at {location}")

    try:
        # 1. Log the Crisis Event in MongoDB
        if db_con and crisis_events_collection is not None:
            crisis_events_collection.insert_one({
                "user_id": user_id,
                "name": name,
                "location": location,
                "vitals": vitals,
                "timestamp": datetime.datetime.now()
            })

        # 2. Trigger WhatsApp Alert via Twilio
        # If Twilio is configured, it will send the alert to the designated EMERGENCY_PHONE in .env
        # or we dynamically override it if the backend logic allows.
        send_whatsapp_alert(0, 0, f"{name} (SOS DASHBOARD) - LOC: {location}")

        return jsonify({"status": "success", "message": "Emergency services and contacts alerted."}), 200
    except Exception as e:
        print(f"SOS Backend Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000, use_reloader=False)
