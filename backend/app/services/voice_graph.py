"""LangGraph workflow for one voice-interview step.

START routes on ``action``:
  start  -> interviewer -> save                 (opening question)
  answer -> assess + interviewer -> save        (parallel; assess = transcribe, then score)
  finish -> wrap_up -> save                     (spoken goodbye + written feedback)
"""
import asyncio
from datetime import datetime, timezone
from typing import Any, Literal, TypedDict

from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, START, StateGraph

from app.schemas.voice import AnswerEvaluation, VoiceSession, VoiceTurn
from app.services import voice_ai, voice_eval
from app.services.audio_store import save_audio


class VoiceState(TypedDict, total=False):
    action: Literal["start", "answer", "finish"]
    session: VoiceSession
    answer_wav: bytes
    answer_duration: int
    answer_text: str
    evaluation: AnswerEvaluation
    reply_text: str
    reply_audio: bytes
    feedback: Any
    closing_audio: bytes


def _route(state: VoiceState) -> list[str]:
    return {
        "start": ["interviewer"],
        "answer": ["assess", "interviewer"],
        "finish": ["wrap_up"],
    }[state["action"]]


async def assess(state: VoiceState, config: RunnableConfig) -> dict:
    """Transcribe the spoken answer, then score it against the question it answers."""
    client = config["configurable"]["client"]
    session = state["session"]
    text = await voice_ai.transcribe(client, state["answer_wav"])
    evaluation = await voice_eval.evaluate_answer(
        client, session, session.turns[-1].question_text, text
    )
    return {"answer_text": text, "evaluation": evaluation}


async def interviewer(state: VoiceState, config: RunnableConfig) -> dict:
    client = config["configurable"]["client"]
    text, audio = await voice_ai.ask_next_question(
        client, state["session"], state.get("answer_wav")
    )
    return {"reply_text": text, "reply_audio": audio}


async def wrap_up(state: VoiceState, config: RunnableConfig) -> dict:
    client = config["configurable"]["client"]
    session = state["session"]
    (_, closing_audio), feedback = await asyncio.gather(
        voice_ai.closing_remarks(client, session), voice_ai.write_feedback(client, session)
    )
    return {"closing_audio": closing_audio, "feedback": feedback}


async def _record_attempt(attempts: Any, session: VoiceSession, turn: VoiceTurn) -> None:
    """Catalog sessions also write a per-question record used by the subject/topic pages."""
    if attempts is None or not session.subject_slug or not session.topic_slug or turn.evaluation is None:
        return
    await attempts.insert(
        {
            "user_id": session.user_id,
            "session_id": session.id,
            "turn_index": turn.index,
            "subject_slug": session.subject_slug,
            "topic_slug": session.topic_slug,
            "difficulty": session.difficulty,
            "question_text": turn.question_text,
            "answer_text": turn.answer_text,
            "question_audio": turn.question_audio,
            "answer_audio": turn.answer_audio,
            "score": turn.evaluation.score,
            "summary": turn.evaluation.summary,
            "strengths": turn.evaluation.strengths,
            "improvements": turn.evaluation.improvements,
            "created_at": datetime.now(timezone.utc),
        }
    )


async def save(state: VoiceState, config: RunnableConfig) -> dict:
    repo = config["configurable"]["repo"]
    session = state["session"].model_copy(deep=True)
    action = state["action"]

    if action == "answer":
        turn = session.turns[-1]
        turn.answer_text = state["answer_text"]
        turn.answer_duration_seconds = state.get("answer_duration", 0)
        turn.answer_audio = save_audio(session.id, f"a{turn.index}.wav", state["answer_wav"])
        turn.evaluation = state["evaluation"]
        await _record_attempt(config["configurable"].get("attempts"), session, turn)
    if action in ("start", "answer"):
        index = len(session.turns)
        session.turns.append(
            VoiceTurn(
                index=index,
                question_text=state["reply_text"],
                question_audio=save_audio(session.id, f"q{index}.mp3", state["reply_audio"]),
            )
        )
    else:
        session.feedback = state["feedback"]
        session.status = "completed"
        session.closing_audio = save_audio(session.id, "closing.mp3", state["closing_audio"])

    await repo.save(session)
    return {"session": session}


def build_graph():
    graph = StateGraph(VoiceState)
    graph.add_node("assess", assess)
    graph.add_node("interviewer", interviewer)
    graph.add_node("wrap_up", wrap_up)
    graph.add_node("save", save)
    graph.add_conditional_edges(START, _route, ["assess", "interviewer", "wrap_up"])
    graph.add_edge("assess", "save")
    graph.add_edge("interviewer", "save")
    graph.add_edge("wrap_up", "save")
    graph.add_edge("save", END)
    return graph.compile()


voice_graph = build_graph()


async def run_step(
    state: VoiceState, *, client: Any, repo: Any, attempts: Any = None
) -> VoiceSession:
    result = await voice_graph.ainvoke(
        state, config={"configurable": {"client": client, "repo": repo, "attempts": attempts}}
    )
    return result["session"]
