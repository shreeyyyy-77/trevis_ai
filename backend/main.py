from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from models import AnalyseRequest, AnalyseResponse

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from analyser import analyse

app = FastAPI(title="Trevis AI - Fake News Detector")

# Allow all origins in development — restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyse", response_model=AnalyseResponse)
async def analyse_headline(req: AnalyseRequest):
    try:
        return await analyse(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}
