import json
import mimetypes
import os
import secrets
import urllib.error
import urllib.request
import asyncio
from contextlib import suppress
from pathlib import Path

import certifi
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool

from app.core.config import get_settings

os.environ.setdefault("SSL_CERT_FILE", certifi.where())
os.environ.setdefault("REQUESTS_CA_BUNDLE", certifi.where())

import dashscope
from dashscope.audio.asr import Recognition, RecognitionCallback, RecognitionResult

router = APIRouter(prefix="/speech", tags=["speech"])
SPEECH_UPLOAD_DIR = Path("backend/uploads/speech")
PCM_SAMPLE_RATE = 16000


def multipart_form_data(fields: dict[str, str], files: dict[str, tuple[str, bytes, str]]) -> tuple[bytes, str]:
    boundary = f"----examplecorp-speech-{secrets.token_hex(16)}"
    chunks: list[bytes] = []

    for name, value in fields.items():
        chunks.extend([
            f"--{boundary}\r\n".encode(),
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode(),
            value.encode(),
            b"\r\n",
        ])

    for name, (filename, content, content_type) in files.items():
        chunks.extend([
            f"--{boundary}\r\n".encode(),
            f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode(),
            f"Content-Type: {content_type}\r\n\r\n".encode(),
            content,
            b"\r\n",
        ])

    chunks.append(f"--{boundary}--\r\n".encode())
    return b"".join(chunks), boundary


def call_transcription_api(audio: bytes, filename: str, content_type: str, language: str | None) -> str:
    settings = get_settings()
    if not settings.speech_transcription_api_key:
        raise HTTPException(status_code=503, detail="Speech transcription service is not configured")

    url = f"{settings.speech_transcription_base_url.rstrip('/')}/audio/transcriptions"
    fields = {
        "model": settings.speech_transcription_model,
        "response_format": "json",
    }
    if language:
        fields["language"] = language

    body, boundary = multipart_form_data(fields, {
        "file": (filename, audio, content_type),
    })
    request = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {settings.speech_transcription_api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore") or str(exc)
        raise HTTPException(status_code=502, detail=f"Speech transcription failed: {detail}") from exc
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=502, detail="Speech transcription service is unavailable") from exc

    text = payload.get("text")
    if not isinstance(text, str):
        raise HTTPException(status_code=502, detail="Speech transcription response is invalid")
    return text.strip()


@router.post("/transcriptions")
async def transcribe_speech(
    audio: UploadFile = File(...),
    language: str | None = Form(default=None),
) -> dict[str, str]:
    settings = get_settings()
    content = await audio.read()
    if not content:
        raise HTTPException(status_code=422, detail="Audio file is empty")
    if len(content) > settings.speech_transcription_max_bytes:
        raise HTTPException(status_code=413, detail="Audio file is too large")

    content_type = audio.content_type or mimetypes.guess_type(audio.filename or "")[0] or "audio/webm"
    filename = audio.filename or "speech.webm"

    SPEECH_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored_name = f"{secrets.token_urlsafe(10)}-{Path(filename).name or 'speech.webm'}"
    (SPEECH_UPLOAD_DIR / stored_name).write_bytes(content)

    text = await run_in_threadpool(call_transcription_api, content, filename, content_type, language)
    return {"text": text}


class WebSocketRecognitionCallback(RecognitionCallback):
    def __init__(self, websocket: WebSocket, loop: asyncio.AbstractEventLoop) -> None:
        self.websocket = websocket
        self.loop = loop

    def send_event(self, payload: dict[str, object]) -> None:
        asyncio.run_coroutine_threadsafe(self.websocket.send_json(payload), self.loop)

    def on_open(self) -> None:
        self.send_event({"type": "open"})

    def on_close(self) -> None:
        self.send_event({"type": "close"})

    def on_complete(self) -> None:
        self.send_event({"type": "complete"})

    def on_error(self, message) -> None:  # type: ignore[no-untyped-def]
        self.send_event({
            "type": "error",
            "message": getattr(message, "message", "Realtime speech recognition failed"),
            "request_id": getattr(message, "request_id", ""),
        })

    def on_event(self, result: RecognitionResult) -> None:
        sentence = result.get_sentence()
        text = sentence.get("text") if isinstance(sentence, dict) else None
        if not text:
            return

        self.send_event({
            "type": "result",
            "text": text,
            "is_sentence_end": RecognitionResult.is_sentence_end(sentence),
            "request_id": result.get_request_id(),
        })


@router.websocket("/realtime")
async def realtime_speech(websocket: WebSocket) -> None:
    await websocket.accept()
    settings = get_settings()
    if not settings.dashscope_api_key:
        await websocket.send_json({"type": "error", "message": "DashScope API key is not configured"})
        await websocket.close(code=1011)
        return

    dashscope.api_key = settings.dashscope_api_key
    dashscope.base_websocket_api_url = settings.dashscope_websocket_url
    callback = WebSocketRecognitionCallback(websocket, asyncio.get_running_loop())
    recognition = Recognition(
        model=settings.realtime_asr_model,
        format="pcm",
        sample_rate=PCM_SAMPLE_RATE,
        semantic_punctuation_enabled=False,
        callback=callback,
    )

    try:
        await run_in_threadpool(recognition.start)
        await websocket.send_json({"type": "ready"})

        while True:
            message = await websocket.receive()
            if "bytes" in message and message["bytes"]:
                await run_in_threadpool(recognition.send_audio_frame, message["bytes"])
            elif message.get("text") == "stop":
                break
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        with suppress(Exception):
            await websocket.send_json({"type": "error", "message": str(exc)})
    finally:
        with suppress(Exception):
            await run_in_threadpool(recognition.stop)
        with suppress(Exception):
            await websocket.close()
