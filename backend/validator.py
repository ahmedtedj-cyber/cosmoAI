# ─────────────────────────────────────────
#  validator.py  —  Validation anti-hallucination
#  Vérifie que le JSON retourné est cohérent
#  avec les avis d'origine
# ─────────────────────────────────────────


VALID_SENTIMENTS  = {"positif", "négatif", "mitigé"}
VALID_CONFIDENCES = {"élevée", "moyenne", "faible"}


def validate_result(result: dict, reviews: list[str], verbose: bool = False) -> dict:
    """
    Valide et nettoie le JSON retourné par le modèle.
    - Vérifie les champs obligatoires
    - Contrôle les valeurs (sentiment, mentions, confidence)
    - Détecte les hallucinations évidentes (mentions > nb avis)
    - Retourne le résultat nettoyé + un champ "_warnings"
    """
    warnings = []
    n        = len(reviews)

    # ── 1. Champs obligatoires ──────────────────────────────────────────
    for field in ("aspects", "summary", "recommendations"):
        if field not in result:
            result[field] = [] if field != "summary" else "Non disponible"
            warnings.append(f"Champ manquant ajouté : {field}")

    # ── 2. Validation des aspects ───────────────────────────────────────
    clean_aspects = []
    for aspect in result.get("aspects", []):

        # Champs manquants
        if "nom" not in aspect or not aspect["nom"].strip():
            warnings.append("Aspect sans nom ignoré.")
            continue

        # Sentiment invalide
        if aspect.get("sentiment") not in VALID_SENTIMENTS:
            warnings.append(
                f"Sentiment invalide '{aspect.get('sentiment')}' "
                f"→ remplacé par 'mitigé' pour : {aspect['nom']}"
            )
            aspect["sentiment"] = "mitigé"

        # Mentions incohérentes (hallucination numérique)
        mentions = aspect.get("mentions", 1)
        if not isinstance(mentions, int) or mentions < 1:
            aspect["mentions"] = 1
            warnings.append(f"Mentions invalides pour '{aspect['nom']}' → forcé à 1")
        elif mentions > n:
            warnings.append(
                f"⚠️ HALLUCINATION POSSIBLE : '{aspect['nom']}' mentionne {mentions} avis "
                f"alors qu'il n'y en a que {n} → plafonné à {n}"
            )
            aspect["mentions"] = n

        # Exemples : garde max 2, assure que ce sont des strings
        exemples = aspect.get("exemples", [])
        aspect["exemples"] = [str(e)[:120] for e in exemples[:2]]

        clean_aspects.append(aspect)

    result["aspects"] = clean_aspects

    # ── 3. Summary trop court ───────────────────────────────────────────
    summary = result.get("summary", "")
    if len(summary) < 20:
        warnings.append("Summary trop court ou absent.")
        result["summary"] = "Résumé non disponible."

    # ── 4. Recommendations vides ────────────────────────────────────────
    recs = result.get("recommendations", [])
    if not recs:
        warnings.append("Aucune recommandation générée.")

    # ── 5. Confidence ───────────────────────────────────────────────────
    if result.get("confidence") not in VALID_CONFIDENCES:
        result["confidence"] = "moyenne"

    # ── 6. Avis analysés ────────────────────────────────────────────────
    result["avis_analysés"] = n   # on force le vrai nombre

    # ── 7. Rapport ──────────────────────────────────────────────────────
    result["_warnings"] = warnings
    if verbose and warnings:
        print(f"\n⚠️  Validation — {len(warnings)} avertissement(s) :")
        for w in warnings:
            print(f"   • {w}")

    return result
