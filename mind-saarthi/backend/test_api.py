import os
from dotenv import load_dotenv
from google import genai

# Find base
base = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(base, '.env'))

key = os.getenv('GEMINI_API_KEY')
if not key:
    print("NO KEY FOUND")
    exit(1)

client = genai.Client(api_key=key.strip())
try:
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents="Hello"
    )
    print("SUCCESS:", response.text)
except Exception as e:
    print("FAILURE:", e)
