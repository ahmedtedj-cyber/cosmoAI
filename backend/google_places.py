"""
google_places.py — Récupération d'avis via RapidAPI "Local Business Data"
Sans carte bancaire, plan gratuit 50 req/mois.

Usage :
    from google_places import fetch_google_reviews, search_place
    place  = search_place("Sephora Paris", api_key="votre_rapidapi_key")
    reviews, meta = fetch_google_reviews("Sephora Paris", api_key="votre_rapidapi_key")
"""

import os
import logging
from typing import Optional

import requests

logger = logging.getLogger(__name__)

RAPIDAPI_HOST = "local-business-data.p.rapidapi.com"
RAPIDAPI_KEY  = os.getenv("RAPIDAPI_KEY", "")


def _key(api_key: Optional[str] = None) -> str:
    k = api_key or RAPIDAPI_KEY
    if not k:
        raise ValueError(
            "Clé RapidAPI manquante. "
            "Passez api_key en paramètre ou configurez RAPIDAPI_KEY dans .env"
        )
    return k


def _headers(api_key: str) -> dict:
    return {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key":  api_key,
    }


# ════════════════════════════════════════════════════════════════
#  RECHERCHE D'UN LIEU
# ════════════════════════════════════════════════════════════════

def search_place(query: str, api_key: Optional[str] = None) -> dict:
    """
    Cherche un lieu par nom et retourne ses infos de base.

    Returns:
        {
            "place_id": "...",
            "name": "...",
            "address": "...",
            "rating": 4.2,
            "total_ratings": 1250,
        }
    """
    key = _key(api_key)

    r = requests.get(
        f"https://{RAPIDAPI_HOST}/search",
        headers=_headers(key),
        params={
            "query":    query,
            "limit":    "1",
            "language": "fr",
            "region":   "fr",
        },
        timeout=15,
    )
    r.raise_for_status()
    data = r.json()

    results = data.get("data", [])
    if not results:
        raise RuntimeError(
            f"Lieu introuvable pour '{query}'. "
            "Essayez un nom plus précis, ex: 'Sephora Champs-Élysées Paris'."
        )

    place = results[0]
    return {
        "place_id":      place.get("place_id", ""),
        "name":          place.get("name", query),
        "address":       place.get("full_address", ""),
        "rating":        place.get("rating"),
        "total_ratings": place.get("review_count", 0),
    }


# ════════════════════════════════════════════════════════════════
#  RÉCUPÉRATION DES AVIS
# ════════════════════════════════════════════════════════════════

def get_place_reviews(place_id: str, api_key: Optional[str] = None) -> tuple[list[str], dict]:
    """
    Récupère les avis d'un lieu via son business_id RapidAPI.

    Returns:
        reviews : liste de textes d'avis
        meta    : infos du lieu
    """
    key = _key(api_key)

    r = requests.get(
        f"https://{RAPIDAPI_HOST}/business-reviews",
        headers=_headers(key),
        params={
            "business_id": place_id,
            "limit":       "20",
            "language":    "fr",
            "region":      "fr",
            "sort_by":     "newest",
        },
        timeout=15,
    )
    r.raise_for_status()
    data = r.json()

    raw_reviews = data.get("data", [])

    # Extraire uniquement les avis avec du texte
    reviews = [
        rev["review_text"].strip()
        for rev in raw_reviews
        if rev.get("review_text", "").strip() and len(rev["review_text"].strip()) > 10
    ]

    if not reviews:
        raise RuntimeError(
            "Aucun avis textuel trouvé pour ce lieu. "
            "Les clients ont peut-être laissé des notes sans commentaires."
        )

    # Infos du lieu depuis la réponse
    business = data.get("business", {})
    meta = {
        "source":        "google",
        "place_id":      place_id,
        "name":          business.get("name", ""),
        "address":       business.get("full_address", ""),
        "rating":        business.get("rating"),
        "total_ratings": business.get("review_count", 0),
        "reviews_found": len(reviews),
    }

    logger.info(f"RapidAPI: {len(reviews)} avis pour '{meta['name']}'")
    return reviews, meta


# ════════════════════════════════════════════════════════════════
#  POINT D'ENTRÉE COMBINÉ
# ════════════════════════════════════════════════════════════════

def fetch_google_reviews(query: str, api_key: Optional[str] = None) -> tuple[list[str], dict]:
    """
    Recherche un lieu et récupère ses avis en un seul appel.

    Args:
        query   : nom du lieu, ex "Sephora Paris Champs-Élysées"
        api_key : clé RapidAPI

    Returns:
        reviews, meta
    """
    place   = search_place(query, api_key)
    reviews, meta = get_place_reviews(place["place_id"], api_key)
    # Compléter meta avec les infos du search si manquantes
    if not meta.get("name"):
        meta["name"]    = place["name"]
    if not meta.get("address"):
        meta["address"] = place["address"]
    if meta.get("rating") is None:
        meta["rating"]  = place["rating"]
    return reviews, meta
