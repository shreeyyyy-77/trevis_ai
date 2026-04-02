# Fake News Detector

A complete, step-by-step built application that accepts a news headline, searches the web for corroborating or contradicting sources, and returns a credibility accuracy score.

## Features
- **Frontend**: HTML / CSS / JavaScript (vanilla, no build step)
- **Backend**: Python 3.11+ with FastAPI
- **AI Layer**: Google Gemini API (`gemini-2.5-flash`) + built-in Google Search grounding capability

## Setup Instructions

1. **Install Python Dependencies**
Navigate to the `backend` folder and ensure your virtual environment is active, then install the required dependencies:
```bash
pip install fastapi uvicorn google-genai python-dotenv httpx pydantic
```

2. **Set up Environment Variables**
In the `backend` folder, create (or open) the `.env` file and add your Google Gemini API Key:
```env
GEMINI_API_KEY=your-gemini-key-here
```

3. **Run the Backend Server**
Start the FastAPI server using Uvicorn:
```bash
cd backend
uvicorn main:app --reload --port 8000
```
*The API will be available at http://localhost:8000*

4. **Run the Frontend UI**
Since this is a vanilla HTML/CSS/JS frontend, you can either:
- Open `frontend/index.html` directly in your browser.
- Serve it using Python's built-in HTTP server:
```bash
cd frontend
python -m http.server 3000
```
*The UI will be accessible at http://localhost:3000*

## Architecture Overview
- **Backend**: Accepts POST requests via HTTP and utilizes Gemini's `google_search` capability to gather external context. Prompts Gemini with a strict system instruction and `response_schema` enforcing a rigorous scoring guide mapping to a Pydantic object.
- **Frontend**: A highly responsive dark-mode styled HTML site that retrieves endpoints and visually translates the JSON response payload into a readable dashboard, including dynamic SVG ring stroke generation.
