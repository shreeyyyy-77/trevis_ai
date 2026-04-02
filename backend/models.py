from pydantic import BaseModel, Field
from typing import Literal

class AnalyseRequest(BaseModel):
    headline: str = Field(..., min_length=10, description="The news headline to fact-check")

class Source(BaseModel):
    url: str
    title: str
    stance: Literal["supporting", "contradicting", "neutral"]

class AnalyseResponse(BaseModel):
    score: int = Field(..., ge=0, le=100)
    verdict: str
    summary: str
    reasoning: str
    sources: list[Source]
