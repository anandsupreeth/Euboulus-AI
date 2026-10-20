import re
import shutil
from pathlib import Path

from bson import ObjectId

from app.core.config import settings

_SAFE_NAME = re.compile(r"^[A-Za-z0-9_-]+\.(mp3|wav)$")


def _session_dir(session_id: str) -> Path:
    if not ObjectId.is_valid(session_id):
        raise ValueError("Invalid session id")
    return settings.audio_storage_dir / session_id


def save_audio(session_id: str, name: str, data: bytes) -> str:
    """Write one audio file for a session and return its file name."""
    if not _SAFE_NAME.match(name):
        raise ValueError("Invalid audio file name")
    folder = _session_dir(session_id)
    folder.mkdir(parents=True, exist_ok=True)
    (folder / name).write_bytes(data)
    return name


def delete_session_audio(session_id: str) -> None:
    """Remove every stored file for a session; a missing folder is fine."""
    if ObjectId.is_valid(session_id):
        shutil.rmtree(_session_dir(session_id), ignore_errors=True)


def audio_path(session_id: str, name: str) -> Path | None:
    """Resolve a stored file, or None if the id/name is invalid or missing."""
    if not ObjectId.is_valid(session_id) or not _SAFE_NAME.match(name):
        return None
    path = _session_dir(session_id) / name
    return path if path.is_file() else None
