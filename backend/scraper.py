"""
scraper.py — Extraction d'avis depuis des URLs
Supporte : Amazon (.fr/.com/.co.uk), Sephora, Marionnaud, et pages génériques.

Usage :
    from scraper import scrape_reviews
    reviews, meta = scrape_reviews("https://www.amazon.fr/dp/B0...")
"""

import re
import time
import random
import logging
from urllib.parse import urlparse, urlencode, urljoin
from typing import Optional

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# ── Headers réalistes pour éviter les blocages ──────────────────────────
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": "https://www.google.com/",
}

MAX_PAGES   = 5    # pages d'avis à parcourir max
MIN_DELAY   = 1.0  # délai min entre requêtes (secondes)
MAX_DELAY   = 2.5  # délai max


def _get(url: str, session: requests.Session, timeout: int = 15) -> Optional[BeautifulSoup]:
    """Requête GET avec délai aléatoire et gestion d'erreur."""
    time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))
    try:
        r = session.get(url, headers=HEADERS, timeout=timeout)
        r.raise_for_status()
        try:
            return BeautifulSoup(r.text, "lxml")
        except Exception:
            return BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        logger.warning(f"GET {url} → {e}")
        return None


# ════════════════════════════════════════════════════════════════
#  AMAZON
# ════════════════════════════════════════════════════════════════

def _amazon_asin(url: str) -> Optional[str]:
    """Extrait l'ASIN depuis une URL Amazon."""
    m = re.search(r"/(?:dp|gp/product)/([A-Z0-9]{10})", url)
    return m.group(1) if m else None

def _amazon_domain(url: str) -> str:
    host = urlparse(url).netloc  # www.amazon.fr
    return host.replace("www.", "")  # amazon.fr

def scrape_amazon(url: str) -> tuple[list[str], dict]:
    """Scrape les avis Amazon (plusieurs pages)."""
    asin   = _amazon_asin(url)
    domain = _amazon_domain(url)
    if not asin:
        raise ValueError(f"Impossible d'extraire l'ASIN depuis : {url}")

    reviews_url = f"https://www.{domain}/product-reviews/{asin}?sortBy=recent&pageNumber="
    session = requests.Session()
    reviews = []
    product_name = ""

    for page in range(1, MAX_PAGES + 1):
        soup = _get(reviews_url + str(page), session)
        if not soup:
            break

        # Nom du produit (page 1 seulement)
        if page == 1:
            title_el = soup.select_one("a[data-hook='product-link']")
            if title_el:
                product_name = title_el.get_text(strip=True)

        # Avis
        items = soup.select("[data-hook='review-body'] span")
        if not items:
            break  # plus d'avis

        for item in items:
            text = item.get_text(separator=" ", strip=True)
            if len(text) > 20:
                reviews.append(text)

        # Vérifier s'il y a une page suivante
        next_btn = soup.select_one("li.a-last a")
        if not next_btn:
            break

    return reviews, {"source": "amazon", "url": url, "product_hint": product_name, "pages_scraped": page}


# ════════════════════════════════════════════════════════════════
#  SEPHORA (France)
# ════════════════════════════════════════════════════════════════

def scrape_sephora(url: str) -> tuple[list[str], dict]:
    """Scrape les avis Sephora.fr."""
    session = requests.Session()

    # Extraire l'ID produit depuis l'URL
    m = re.search(r"/P(\d+)", url)
    product_id = m.group(1) if m else None

    reviews = []
    product_name = ""

    if product_id:
        # API interne Sephora (non officielle mais stable)
        api_url = (
            f"https://api.bazaarvoice.com/data/reviews.json"
            f"?apiversion=5.4"
            f"&passkey=caB1IPIEvsZW5SCSA1UwNxGjXCdLFXWpMSvdZ8nrMBmco"
            f"&Filter=ProductId%3A{product_id}"
            f"&Sort=SubmissionTime%3Adesc"
            f"&Limit=100"
            f"&Include=Products"
        )
        try:
            r = session.get(api_url, headers=HEADERS, timeout=15)
            data = r.json()
            for rev in data.get("Results", []):
                text = rev.get("ReviewText", "").strip()
                title = rev.get("Title", "").strip()
                if text and len(text) > 15:
                    reviews.append(f"{title + ' — ' if title else ''}{text}")
            # Nom produit
            products_map = data.get("Includes", {}).get("Products", {})
            if products_map:
                first = next(iter(products_map.values()))
                product_name = first.get("Name", "")
        except Exception as e:
            logger.warning(f"API Sephora → {e}")

    # Fallback : scraping HTML direct
    if not reviews:
        soup = _get(url, session)
        if soup:
            title_el = soup.select_one("h1.product-name, h1[class*='product']")
            if title_el:
                product_name = title_el.get_text(strip=True)
            for el in soup.select("[class*='review-text'], [class*='reviewText'], [itemprop='reviewBody']"):
                text = el.get_text(separator=" ", strip=True)
                if len(text) > 20:
                    reviews.append(text)

    return reviews, {"source": "sephora", "url": url, "product_hint": product_name}


# ════════════════════════════════════════════════════════════════
#  MARIONNAUD
# ════════════════════════════════════════════════════════════════

def scrape_marionnaud(url: str) -> tuple[list[str], dict]:
    """Scrape les avis Marionnaud.fr."""
    session = requests.Session()
    soup = _get(url, session)
    reviews = []
    product_name = ""

    if soup:
        title_el = soup.select_one("h1.product-name, h1")
        if title_el:
            product_name = title_el.get_text(strip=True)

        for el in soup.select(".bv-content-summary-body-text, .bv-review-body-content, [itemprop='reviewBody']"):
            text = el.get_text(separator=" ", strip=True)
            if len(text) > 20:
                reviews.append(text)

    return reviews, {"source": "marionnaud", "url": url, "product_hint": product_name}


# ════════════════════════════════════════════════════════════════
#  SCRAPER GÉNÉRIQUE (fallback)
# ════════════════════════════════════════════════════════════════

# Sélecteurs CSS courants pour les blocs d'avis
_GENERIC_SELECTORS = [
    "[itemprop='reviewBody']",
    "[class*='review-text']",
    "[class*='reviewText']",
    "[class*='review-body']",
    "[class*='reviewBody']",
    "[class*='comment-body']",
    "[class*='user-review']",
    ".avis-text",
    ".review p",
    "blockquote",
]

def scrape_generic(url: str) -> tuple[list[str], dict]:
    """Tentative de scraping générique sur n'importe quelle page."""
    session = requests.Session()
    soup = _get(url, session)
    reviews = []
    product_name = ""

    if not soup:
        raise ConnectionError(f"Impossible d'accéder à {url}")

    # Titre de la page comme nom produit
    title_el = soup.select_one("h1")
    if title_el:
        product_name = title_el.get_text(strip=True)[:100]

    # Chercher des blocs d'avis avec les sélecteurs courants
    for selector in _GENERIC_SELECTORS:
        items = soup.select(selector)
        for el in items:
            text = el.get_text(separator=" ", strip=True)
            if 20 < len(text) < 3000 and text not in reviews:
                reviews.append(text)
        if len(reviews) >= 10:
            break

    return reviews, {"source": "generic", "url": url, "product_hint": product_name}


# ════════════════════════════════════════════════════════════════
#  POINT D'ENTRÉE PRINCIPAL
# ════════════════════════════════════════════════════════════════

def scrape_reviews(url: str) -> tuple[list[str], dict]:
    """
    Détecte automatiquement le site et scrape les avis.

    Returns:
        reviews : liste de chaînes (un avis par élément)
        meta    : dict avec source, url, product_hint, pages_scraped
    
    Raises:
        ValueError  : URL invalide ou ASIN introuvable
        ConnectionError : site inaccessible
        RuntimeError : aucun avis trouvé
    """
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        raise ValueError("URL invalide. Exemple : https://www.amazon.fr/dp/B0...")

    host = parsed.netloc.lower()

    if "amazon." in host:
        reviews, meta = scrape_amazon(url)
    elif "sephora." in host:
        reviews, meta = scrape_sephora(url)
    elif "marionnaud." in host:
        reviews, meta = scrape_marionnaud(url)
    else:
        reviews, meta = scrape_generic(url)

    if not reviews:
        raise RuntimeError(
            f"Aucun avis trouvé sur cette page. "
            f"Le site est peut-être protégé (anti-bot) ou la page ne contient pas d'avis."
        )

    logger.info(f"Scraped {len(reviews)} reviews from {meta['source']} ({url})")
    return reviews, meta
