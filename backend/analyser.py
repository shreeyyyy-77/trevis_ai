import json
import re
from google import genai
from google.genai import types
from models import AnalyseRequest, AnalyseResponse, Source

client = genai.Client()

SYSTEM_PROMPT = """
You are a rigorous fact-checking AI. Given a news headline, use the google_search
tool to find related news articles from credible sources. Then:

1. Determine whether the headline is accurate, misleading, or false.
2. Collect up to 5 sources (URL, title, stance: supporting/contradicting/neutral).

3. Output ONLY valid JSON in this exact shape — no preamble, no markdown fences:

{
  "score": <integer 0-100>,
  "verdict": "<Likely True | Needs Context | Misleading | Likely False | Unverified>",
  "summary": "<2-3 sentence plain-language explanation>",
  "reasoning": "<detailed reasoning about sources and consensus>",
  "sources": [
    {"url": "...", "title": "...", "stance": "supporting|contradicting|neutral"}
  ]
}

Scoring guide:
- 75-100: Strongly corroborated by multiple credible sources
- 50-74:  Partially true but missing context or nuance
- 25-49:  Misleading framing or cherry-picked facts
- 0-24:   Demonstrably false or debunked
- Use "Unverified" verdict when no relevant sources are found.
"""

async def analyse(req: AnalyseRequest) -> AnalyseResponse:
    # Use gemini-2.5-flash for better quota limits
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=f'Fact-check this headline: "{req.headline}"',
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            tools=[{"google_search": {}}],
            temperature=0.2, # Keep hallucination risk low
        )
    )

    try:
        if not response.candidates:
            raise ValueError("Gemini returned an empty response. It may have been blocked by safety filters.")
            
        match = re.search(r'\{.*\}', getattr(response, "text", ""), re.DOTALL)
        if not match:
            raise ValueError("Gemini did not return a valid JSON format in the text block.")
            
        data = json.loads(match.group())
        sources = [Source(**s) for s in data.get("sources", [])]
        return AnalyseResponse(
            score=data.get("score", 0),
            verdict=data.get("verdict", "Unverified"),
            summary=data.get("summary", "Could not verify."),
            reasoning=data.get("reasoning", "Failed to retrieve proper format."),
            sources=sources
        )
    except Exception as e:
        # Fallback error mapping
        safe_resp = getattr(response, "text", str(response)) if response else "None"
        raise ValueError(f"{str(e)} | Details: {safe_resp}")
