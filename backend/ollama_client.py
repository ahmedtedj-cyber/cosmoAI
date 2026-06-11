# ─────────────────────────────────────────
#  ollama_client.py  —  Appel à Ollama
# ─────────────────────────────────────────
import requests
import json
from config import OLLAMA_URL, MODEL, MODEL_OPTIONS, REQUEST_TIMEOUT


def call_ollama(prompt: str) -> str:
    """
    Envoie un prompt à Ollama et retourne le texte brut de la réponse.
    Lève des exceptions claires en cas de problème.
    """
    payload = {
        "model":   MODEL,
        "prompt":  prompt,
        "stream":  False,
        "options": MODEL_OPTIONS,
    }

    try:
        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=REQUEST_TIMEOUT
        )
        response.raise_for_status()

    except requests.exceptions.ConnectionError:
        raise ConnectionError(
            "❌ Ollama n'est pas lancé.\n"
            "   → Lance : ollama serve"
        )
    except requests.exceptions.Timeout:
        raise TimeoutError(
            f"❌ Ollama n'a pas répondu en {REQUEST_TIMEOUT}s.\n"
            "   → Le modèle est peut-être trop lourd, ou la machine est occupée."
        )
    except requests.exceptions.HTTPError as e:
        raise RuntimeError(f"❌ Erreur HTTP Ollama : {e}")

    raw = response.json().get("response", "").strip()

    if not raw:
        raise ValueError("❌ Ollama a retourné une réponse vide.")

    return raw


def parse_json_response(text: str) -> dict:
    """
    Extrait le JSON de la réponse du modèle.
    Robuste : cherche { ... } même si le modèle ajoute du texte parasite.
    """
    # Cas idéal : texte pur JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Cas fréquent : JSON entouré de texte ou ```json ... ```
    start = text.find("{")
    end   = text.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass

    # Échec total
    return {
        "aspects":         [],
        "summary":         "⚠️ Le modèle n'a pas retourné un JSON valide.",
        "recommendations": [],
        "confidence":      "faible",
        "avis_analysés":   0,
        "_raw":            text,   # garde la réponse brute pour débugger
    }
