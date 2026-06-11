# ─────────────────────────────────────────
#  config.py  —  Paramètres centralisés
# ─────────────────────────────────────────
import os

# ── Mode démo ────────────────────────────
# DEMO_MODE=true  → mock statique, 0 dépendance Ollama
# DEMO_MODE=false → appel Ollama réel
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() in ("1", "true", "yes")

# ── Ollama (ignoré si DEMO_MODE) ─────────
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL      = os.getenv("OLLAMA_MODEL", "gemma3:1b")

MODEL_OPTIONS = {
    "temperature":    0.1,
    "top_p":          0.9,
    "repeat_penalty": 1.2,
}

# Timeout (secondes)
REQUEST_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "180"))

# ── Sécurité ─────────────────────────────
# En production, définir SECRET_KEY dans l'environnement.
# La valeur par défaut est volontairement distincte pour alerter.
_default_key = "CHANGE_ME_cosmoai_dev_only_key_not_for_production"
SECRET_KEY = os.getenv("SECRET_KEY", _default_key)
if SECRET_KEY == _default_key:
    import warnings
    warnings.warn(
        "⚠️  SECRET_KEY non définie — clé de développement utilisée. "
        "Définissez la variable d'environnement SECRET_KEY en production.",
        stacklevel=2,
    )

# ── Dossiers ─────────────────────────────
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
EXPORT_FOLDER = os.getenv("EXPORT_FOLDER", "exports")
