# ─────────────────────────────────────────
#  scoring.py  —  Calcul du Product Health Score
# ─────────────────────────────────────────

def compute_health_score(aspects: list[dict], confidence: str) -> float:
    """
    Calcule un score de santé produit entre 0 et 100
    basé sur la répartition des sentiments dans les aspects.

    Poids :
      positif → +1.0
      mitigé  → +0.4
      négatif → 0.0

    Ajustement confiance :
      élevée  → ×1.0
      moyenne → ×0.9
      faible  → ×0.75
    """
    if not aspects:
        return 0.0

    weights = {"positif": 1.0, "mitigé": 0.4, "négatif": 0.0}
    confidence_multiplier = {"élevée": 1.0, "moyenne": 0.9, "faible": 0.75}

    total_mentions  = 0
    weighted_sum    = 0.0

    for aspect in aspects:
        sentiment = aspect.get("sentiment", "mitigé")
        mentions  = aspect.get("mentions", 1)
        score     = weights.get(sentiment, 0.4)
        weighted_sum   += score * mentions
        total_mentions += mentions

    if total_mentions == 0:
        return 0.0

    raw_score = (weighted_sum / total_mentions) * 100
    multiplier = confidence_multiplier.get(confidence, 0.9)

    return round(raw_score * multiplier, 1)


def compute_sentiment_ratio(aspects: list[dict]) -> dict:
    """Retourne la répartition positif / négatif / mitigé en pourcentages."""
    counts = {"positif": 0, "négatif": 0, "mitigé": 0}
    total  = 0

    for aspect in aspects:
        s = aspect.get("sentiment", "mitigé")
        m = aspect.get("mentions", 1)
        counts[s] = counts.get(s, 0) + m
        total += m

    if total == 0:
        return {"positif": 0, "négatif": 0, "mitigé": 0}

    return {k: round(v / total * 100, 1) for k, v in counts.items()}


def get_top_issue(aspects: list[dict]) -> str | None:
    """Retourne l'aspect négatif avec le plus de mentions."""
    negatives = [a for a in aspects if a.get("sentiment") == "négatif"]
    if not negatives:
        return None
    top = max(negatives, key=lambda a: a.get("mentions", 0))
    return top.get("nom")
