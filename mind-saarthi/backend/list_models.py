import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
key = os.getenv('GEMINI_API_KEY').strip()
client = genai.Client(api_key=key)

try:
    models = client.models.list()
    for m in models:
        print(f"Model ID: {m.name}")
except Exception as e:
    print("FAILED TO LIST MODELS:", e)
