from typing import List, Optional
from pydantic import BaseModel

class TopicMasterySchema(BaseModel):
    topic: str
    score: float
    language: str
    problems_solved: int
    total_attempts: int

class RecentActivityItem(BaseModel):
    day: str
    hours: float
    problems: int

class WeakTopicRecommendation(BaseModel):
    topic: str
    reason: str
    suggested_action: str

class ProgressSummaryResponse(BaseModel):
    streak_days: int
    problems_solved: int
    total_attempts: int
    accuracy_percentage: float
    learning_hours: float
    recent_activity: List[RecentActivityItem] = []
    topic_mastery: List[TopicMasterySchema] = []
    weak_topics: List[WeakTopicRecommendation] = []
    mastery_formula_explanation: str
