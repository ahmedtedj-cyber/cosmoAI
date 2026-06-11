# ─────────────────────────────────────────
#  prompt_builder.py  —  Construction des prompts
#  Stratégie anti-hallucination intégrée
# ─────────────────────────────────────────


def build_analysis_prompt(reviews: list[str]) -> str:
    """
    Construit un prompt strict qui force le modèle
    à rester factuel et à ne rien inventer.
    """
    reviews_text = "\n".join(f"  [{i+1}] {r}" for i, r in enumerate(reviews))
    n = len(reviews)

    return f"""
Tu es un analyste expert en produits cosmétiques.
Tu reçois {n} avis clients réels.

═══════════════════════════════════════
AVIS CLIENTS (source unique autorisée)
═══════════════════════════════════════
{reviews_text}
═══════════════════════════════════════

RÈGLES ABSOLUES — tu dois les respecter sans exception :
1. Analyse UNIQUEMENT ce qui est explicitement écrit dans les avis ci-dessus.
2. N'invente AUCUN aspect, AUCUN chiffre, AUCUNE tendance absente des avis.
3. Si un aspect n'est pas mentionné → ne l'inclus PAS dans "aspects".
4. Si tu n'es pas certain d'un sentiment → utilise "mitigé".
5. Les "recommendations" doivent découler DIRECTEMENT des problèmes cités.
6. Le "summary" doit refléter UNIQUEMENT ce que disent les avis.
7. "mentions" = nombre réel d'avis qui parlent de cet aspect (compte bien).
8. JAMAIS de texte hors du JSON — pas de "Voici l'analyse", pas de commentaires.

FORMAT DE RÉPONSE — JSON pur, rien d'autre :
{{
  "aspects": [
    {{
      "nom": "nom exact de l'aspect mentionné",
      "sentiment": "positif | négatif | mitigé",
      "mentions": <entier entre 1 et {n}>,
      "exemples": ["extrait court de l'avis 1", "extrait court de l'avis 2"]
    }}
  ],
  "summary": "résumé factuel en 2-3 phrases basé uniquement sur les avis",
  "recommendations": [
    "recommandation concrète issue d'un problème réel cité"
  ],
  "confidence": "élevée | moyenne | faible",
  "avis_analysés": {n}
}}
""".strip()
