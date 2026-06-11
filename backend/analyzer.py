# ─────────────────────────────────────────
#  analyzer.py  —  Logique principale
#
#  Si DEMO_MODE=true  → mock_analyzer (instantané, 0 dépendance)
#  Si DEMO_MODE=false → pipeline Ollama complet
# ─────────────────────────────────────────
from config import DEMO_MODE


def analyze_reviews(reviews: list[str], verbose: bool = False) -> dict:
    """
    Pipeline complet d'analyse :
      - Mode démo  : analyse lexicale instantanée (mock_analyzer)
      - Mode réel  : Ollama → JSON → validation

    Args:
        reviews : liste d'avis clients (strings)
        verbose : affiche les warnings de validation si True

    Returns:
        dict structuré et validé :
        {
          "aspects":         [...],
          "summary":         "...",
          "recommendations": [...],
          "confidence":      "élevée | moyenne | faible",
          "avis_analysés":   int,
          "_warnings":       [...]
        }
    """
    if not reviews:
        raise ValueError("La liste d'avis est vide.")

    if DEMO_MODE:
        from mock_analyzer import mock_analyze_reviews
        return mock_analyze_reviews(reviews, verbose=verbose)

    # ── Pipeline Ollama réel ──────────────────────────────────────
    from prompt_builder import build_analysis_prompt
    from ollama_client  import call_ollama, parse_json_response
    from validator      import validate_result
    import config

    # Sécurité : tronque les avis trop longs pour ne pas dépasser
    # le context window du modèle (~8K tokens pour gemma3:1b)
    MAX_REVIEW_LEN = 400
    truncated = [r[:MAX_REVIEW_LEN] for r in reviews]

    prompt = build_analysis_prompt(truncated)

    if verbose:
        print(f"⏳ Envoi de {len(truncated)} avis à {config.MODEL}…")

    raw_text = call_ollama(prompt)
    result   = parse_json_response(raw_text)
    result   = validate_result(result, truncated, verbose=verbose)

    return result
