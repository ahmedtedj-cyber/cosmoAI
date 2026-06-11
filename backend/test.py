from scraper import scrape_reviews

reviews, meta = scrape_reviews("https://www.sephora.fr/p/creme-hydratante-peau-normale-a-mixte/P10017023.html")
print(meta)
print(f"{len(reviews)} avis trouvés")
print(reviews[0])