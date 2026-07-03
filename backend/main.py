"""SA AI Web Kit — Backend entrypoint.

Run locally:
    pip install -r requirements.txt
    cp .env.example .env   # then fill in GOOGLE_API_KEY etc.
    uvicorn main:app --reload --port 8000
"""

from app.server import create_app

app = create_app()
