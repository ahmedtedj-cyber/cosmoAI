# ─────────────────────────────────────────
#  mock_analyzer.py  —  Mode démo sans Ollama
#
#  Génère une analyse réaliste à partir des
#  avis réels fournis (analyse lexicale simple).
#  0 dépendance externe, résultat instantané.
# ─────────────────────────────────────────
import random
import re
from validator import validate_result


# ── Dictionnaires de détection ───────────────────────────────────────────

ASPECT_KEYWORDS = {
    "Hydratation": {
        "pos": ["hydrat", "nourri", "nourrissant", "moisture", "humect", "sec "],
        "neg": ["sèche", "assèche", "dessèche", "tiraillement"],
    },
    "Odeur / Parfum": {
        "pos": ["odeur agréable", "bonne odeur", "parfum délicat", "sent bon", "fragrance"],
        "neg": ["odeur forte", "odeur désagréable", "odeur trop", "mal à la tête", "trop parfumé"],
    },
    "Texture": {
        "pos": ["texture agréable", "légère", "soyeuse", "douce", "facile à étaler", "fond bien"],
        "neg": ["grasse", "lourde", "collante", "épaisse", "mal absorbée"],
    },
    "Prix / Rapport qualité-prix": {
        "pos": ["bon rapport", "abordable", "raisonnable", "prix correct", "vaut le prix"],
        "neg": ["cher", "trop cher", "prix élevé", "trop élevé", "hors de prix"],
    },
    "Efficacité": {
        "pos": ["efficace", "résultats", "effets visibles", "amélioration", "bluffée", "lumineuse", "différence"],
        "neg": ["inefficace", "pas d'effet", "décevant", "aucune différence", "sans résultat"],
    },
    "Packaging": {
        "pos": ["joli", "beau packaging", "pratique", "élégant", "bien conçu"],
        "neg": ["coule", "fuite", "mal conçu", "cassé", "packaging décevant"],
    },
    "Tolérance cutanée": {
        "pos": ["peau sensible", "pas d'allergie", "bien toléré", "doux pour"],
        "neg": ["allergie", "rougeur", "irritation", "réaction", "pique"],
    },
    "Naturalité / Composition": {
        "pos": ["naturel", "bio", "sans paraben", "ingrédients sains", "clean beauty"],
        "neg": ["chimique", "parabens", "parfum artificiel", "ingrédients douteux"],
    },
}

SUMMARIES_POSITIVE = [
    "Les avis sont globalement positifs. L'hydratation et l'efficacité sont les points forts les plus cités. "
    "Quelques mentions d'un prix élevé, mais la majorité des utilisateurs recommande le produit.",
    "Le produit reçoit des retours enthousiastes, notamment sur sa texture et ses résultats visibles en peu de semaines. "
    "L'odeur est appréciée par la plupart, bien qu'une minorité la trouve trop prononcée.",
    "Très bien noté pour son efficacité et son rapport qualité-prix. "
    "Les utilisateurs apprécient particulièrement la légèreté de la formule.",
]

SUMMARIES_MIXED = [
    "Les avis sont partagés. Si l'hydratation est reconnue, la texture grasse et le prix élevé reviennent fréquemment. "
    "L'expérience varie selon le type de peau.",
    "Produit à double tranchant : apprécié pour ses effets visibles mais critiqué pour son odeur forte et son packaging peu pratique. "
    "À essayer selon la tolérance aux parfums.",
    "Des résultats encourageants pour les peaux sèches, mais le format et le prix divisent les opinions. "
    "La composition mériterait d'être améliorée.",
]

SUMMARIES_NEGATIVE = [
    "Les retours sont majoritairement négatifs. Le prix jugé excessif, la texture lourde et les effets décevants dominent les avis. "
    "Des alternatives moins onéreuses sont fréquemment recommandées.",
    "Beaucoup d'utilisateurs sont déçus par l'absence de résultats annoncés. "
    "L'odeur forte et les problèmes de packaging renforcent la déception globale.",
]

RECOMMENDATIONS_POOL = [
    "Revoir la formule pour réduire le caractère gras de la texture.",
    "Proposer une version sans parfum ou à parfum réduit pour les peaux sensibles.",
    "Réviser le packaging pour éviter les fuites et faciliter le dosage.",
    "Retravailler le positionnement prix au regard des attentes clients.",
    "Mettre davantage en avant les résultats observés dès la 2e semaine pour rassurer les nouveaux acheteurs.",
    "Améliorer l'absorption cutanée, mentionnée comme trop lente.",
    "Développer un format voyage pour élargir la cible.",
    "Communiquer plus clairement sur la composition et les certifications naturelles.",
    "Tester une version enrichie pour les peaux très sèches.",
    "Renforcer l'hydratation longue durée, point différenciant vis-à-vis de la concurrence.",
]


# ── Analyse lexicale ─────────────────────────────────────────────────────

def _detect_aspects(reviews: list[str]) -> list[dict]:
    """Détecte les aspects mentionnés dans les avis via mots-clés."""
    found = {}

    for review in reviews:
        review_lower = review.lower()
        for aspect_name, kw in ASPECT_KEYWORDS.items():
            pos_hit = any(k in review_lower for k in kw["pos"])
            neg_hit = any(k in review_lower for k in kw["neg"])

            if not pos_hit and not neg_hit:
                continue

            if aspect_name not in found:
                found[aspect_name] = {"pos": 0, "neg": 0, "reviews": []}

            if pos_hit and not neg_hit:
                found[aspect_name]["pos"] += 1
            elif neg_hit and not pos_hit:
                found[aspect_name]["neg"] += 1
            else:
                # Les deux : mitigé → compte 0.5 dans chaque
                found[aspect_name]["pos"] += 0  # neutre
                found[aspect_name]["neg"] += 0

            found[aspect_name]["reviews"].append(review)

    aspects = []
    for name, data in found.items():
        total = data["pos"] + data["neg"]
        if total == 0:
            continue

        if data["pos"] > data["neg"]:
            sentiment = "positif"
        elif data["neg"] > data["pos"]:
            sentiment = "négatif"
        else:
            sentiment = "mitigé"

        # Extraits : prend les 2 premiers avis mentionnant l'aspect
        exemples = []
        for r in data["reviews"][:2]:
            # Extrait une phrase de 80 chars max
            excerpt = r.strip()[:90].rstrip()
            if len(r) > 90:
                excerpt += "…"
            exemples.append(excerpt)

        aspects.append({
            "nom":       name,
            "sentiment": sentiment,
            "mentions":  total,
            "exemples":  exemples,
        })

    # Trie par nb de mentions décroissant
    aspects.sort(key=lambda x: x["mentions"], reverse=True)
    return aspects


def _pick_summary(aspects: list[dict]) -> str:
    """Choisit un résumé cohérent avec la polarité dominante."""
    if not aspects:
        return "Analyse insuffisante : aucun aspect détecté dans les avis fournis."

    pos = sum(1 for a in aspects if a["sentiment"] == "positif")
    neg = sum(1 for a in aspects if a["sentiment"] == "négatif")

    if pos >= neg * 2:
        return random.choice(SUMMARIES_POSITIVE)
    elif neg >= pos * 2:
        return random.choice(SUMMARIES_NEGATIVE)
    else:
        return random.choice(SUMMARIES_MIXED)


def _compute_confidence(n: int, aspects: list[dict]) -> str:
    """Confiance selon le nombre d'avis et d'aspects détectés."""
    if n >= 10 and len(aspects) >= 3:
        return "élevée"
    elif n >= 4 and len(aspects) >= 1:
        return "moyenne"
    else:
        return "faible"


def _pick_recommendations(aspects: list[dict], n: int = 3) -> list[str]:
    """Sélectionne des recommandations pertinentes selon les aspects négatifs."""
    neg_names = {a["nom"] for a in aspects if a["sentiment"] in ("négatif", "mitigé")}

    priority = []
    if "Texture" in neg_names:
        priority.append("Revoir la formule pour réduire le caractère gras de la texture.")
    if "Odeur / Parfum" in neg_names:
        priority.append("Proposer une version sans parfum ou à parfum réduit pour les peaux sensibles.")
    if "Packaging" in neg_names:
        priority.append("Réviser le packaging pour éviter les fuites et faciliter le dosage.")
    if "Prix / Rapport qualité-prix" in neg_names:
        priority.append("Retravailler le positionnement prix au regard des attentes clients.")
    if "Efficacité" in neg_names:
        priority.append("Mettre davantage en avant les résultats observés dès la 2e semaine pour rassurer les nouveaux acheteurs.")

    # Complète avec des recs génériques si besoin
    remaining = [r for r in RECOMMENDATIONS_POOL if r not in priority]
    random.shuffle(remaining)
    recs = (priority + remaining)[:n]

    return recs if recs else RECOMMENDATIONS_POOL[:n]


# ── Point d'entrée public ────────────────────────────────────────────────

def mock_analyze_reviews(reviews: list[str], verbose: bool = False) -> dict:
    """
    Analyse mock instantanée — remplace call_ollama() en mode démo.
    Retourne le même format que analyze_reviews() du pipeline réel.
    """
    if not reviews:
        raise ValueError("La liste d'avis est vide.")

    aspects    = _detect_aspects(reviews)
    summary    = _pick_summary(aspects)
    confidence = _compute_confidence(len(reviews), aspects)
    recs       = _pick_recommendations(aspects)

    raw_result = {
        "aspects":         aspects,
        "summary":         summary,
        "recommendations": recs,
        "confidence":      confidence,
        "avis_analysés":   len(reviews),
    }

    # Même pipeline de validation que le mode réel
    result = validate_result(raw_result, reviews, verbose=verbose)

    if verbose:
        print(f"[DEMO] Mock analyse : {len(aspects)} aspects, {len(reviews)} avis, confiance={confidence}")

    return result
