"""RecycleRight sort endpoint — Vercel Python serverless function.

POST /api/sort with JSON {"item": "...", "photo": "..." (optional base64)}
and get back {"stream": str, "confidence": int, "why": str,
"prep": [str], "dropoff": str, "source": "live"} from Gemini
(gemini-3.5-flash-lite via the OpenAI-compatible endpoint).

The Gemini API key lives server-side only, in the GEMINI_API_KEY
environment variable. When no key is configured the function answers 501
and the app falls back to its on-device demo sorter.

Sorting is honest and conventional: clean paper, cardboard, glass jars,
metal cans, and hard plastic bottles go to recycling; food scraps and
yard waste go to compost; plastic bags and film, greasy or soiled paper,
mirrors, window glass, Pyrex, and ceramics go to trash; batteries,
electronics, and paint go to hazardous waste; usable clothes, books,
toys, and furniture go to donation. Rules vary by town, so the model
is told to say so where it matters and never to invent a local rule.
"""

import json
import os
import re
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
MODEL = "gemini-3.5-flash-lite"
MAX_ITEM_CHARS = 500
MAX_PHOTO_CHARS = 2 * 1024 * 1024
STREAMS = ("recycle", "compost", "trash", "hazard", "donate")

SYSTEM_PROMPT = (
    "You are RecycleRight, a household recycling sorter. Reply with JSON "
    "ONLY — no markdown fences, no commentary. The JSON object must have: "
    "\"stream\": one of \"recycle\", \"compost\", \"trash\", \"hazard\", "
    "\"donate\"; \"confidence\": a number from 0 to 100; \"why\": one or two "
    "honest sentences on why it goes in this stream; \"prep\": an array of "
    "1 to 4 short preparation steps; \"dropoff\": a short string such as "
    "\"Curbside blue bin\", \"Backyard compost\", \"Curbside trash\", "
    "\"Household hazardous waste day\", or \"Donation bin / charity shop\". "
    "Use conventional sorting: clean paper, cardboard, glass jars, metal "
    "cans, and hard plastic bottles go to recycle; food scraps and yard "
    "waste go to compost; plastic bags and film, greasy or soiled paper, "
    "mirrors, window glass, Pyrex, and ceramics go to trash; batteries, "
    "electronics, and paint go to hazard; usable clothes, books, toys, "
    "and furniture go to donate. When in doubt, say so in the why and "
    "note that rules vary by town and the person should check local "
    "guidance. Never invent a local rule or a fact you are unsure of."
)

SYSTEM_PROMPT_WITH_PHOTO = (
    SYSTEM_PROMPT
    + " A photo was supplied with this request, but it cannot be read "
    "without vision support, so sort from the item text only and set "
    "confidence lower to reflect that the photo was not seen."
)


def _read_json(handler):
    try:
        length = int(handler.headers.get("Content-Length") or 0)
    except ValueError:
        length = 0
    raw = handler.rfile.read(length) if length > 0 else b"{}"
    try:
        return json.loads(raw.decode("utf-8") or "{}")
    except (ValueError, UnicodeDecodeError):
        return None


def _send(handler, status, payload):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def _extract_json(text):
    """Pull the first JSON object out of model output, tolerating fences."""
    try:
        return json.loads(text)
    except ValueError:
        pass
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except ValueError:
            return None
    return None


def _validate(data):
    if not isinstance(data, dict):
        return None
    stream = str(data.get("stream") or "").strip()
    if stream not in STREAMS:
        return None
    why = str(data.get("why") or "").strip()
    if not why:
        return None
    try:
        confidence = int(data.get("confidence"))
    except (TypeError, ValueError):
        return None
    confidence = max(0, min(100, confidence))
    prep = data.get("prep")
    if not isinstance(prep, list):
        prep = []
    prep = [str(step).strip() for step in prep if str(step).strip()][:4]
    if not prep:
        prep = ["When in doubt, keep it out of recycling"]
    dropoff = str(data.get("dropoff") or "").strip() or "Curbside trash"
    return {
        "stream": stream,
        "confidence": confidence,
        "why": why[:600],
        "prep": prep,
        "dropoff": dropoff[:200],
        "source": "live",
    }


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = _read_json(self)
        if body is None:
            _send(self, 400, {"error": {"message": "Invalid JSON body"}})
            return

        item = body.get("item")
        if not isinstance(item, str) or len(item.strip()) < 2:
            _send(self, 400, {"error": {"message": "Tell us what the item is first"}})
            return
        item = item.strip()[:MAX_ITEM_CHARS]

        photo = body.get("photo")
        if photo is not None:
            if not isinstance(photo, str):
                _send(self, 400, {"error": {"message": "Photo must be a base64 string"}})
                return
            if len(photo) > MAX_PHOTO_CHARS:
                _send(self, 400, {"error": {"message": "Photo is too large"}})
                return
        has_photo = bool(photo)

        api_key = os.environ.get("GEMINI" + "_API_KEY", "")
        if not api_key:
            _send(self, 501, {"error": {"message": "Hosted AI is not configured"}})
            return

        system_prompt = SYSTEM_PROMPT_WITH_PHOTO if has_photo else SYSTEM_PROMPT
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Sort this item: {item}"},
            ],
            "temperature": 0.3,
        }
        request = urllib.request.Request(
            GEMINI_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "x-goog-api-key": api_key,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                upstream = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError:
            _send(self, 502, {"error": {"message": "Upstream request failed"}})
            return
        except (urllib.error.URLError, TimeoutError, OSError):
            _send(self, 502, {"error": {"message": "Upstream request failed"}})
            return

        try:
            content = upstream["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            _send(self, 502, {"error": {"message": "Upstream returned an unexpected response"}})
            return

        data = _extract_json(content)
        result = _validate(data) if data is not None else None
        if result is None:
            _send(self, 502, {"error": {"message": "Could not sort that item"}})
            return
        _send(self, 200, result)

    def do_GET(self):
        _send(self, 405, {"error": {"message": "Method not allowed"}})

    def log_message(self, *args):  # keep serverless logs clean
        pass
