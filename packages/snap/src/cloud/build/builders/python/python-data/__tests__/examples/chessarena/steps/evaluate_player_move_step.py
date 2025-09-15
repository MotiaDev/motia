import chess
import chess.engine
import os
from pydantic import BaseModel, Field

config = {
    "type": "event",
    "name": "EvaluatePlayerMove",
    "description": "Evaluates the move picked by a player",
    "subscribes": ["evaluate-player-move"], 
    "emits": [],
    "flows": ["chess"],
    "input": None,
    "includeFiles": ["../../lib/stockfish"]
}

class Evaluation(BaseModel):
    centipawn_score: int = Field(description="The evaluation in centipawns")
    best_move: str = Field(description="The best move")

async def handler(input, ctx):
    pass