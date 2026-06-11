#!/usr/bin/env python3
# ─────────────────────────────────────────
#  main.py  —  Point d'entrée
#
#  Usage :
#    python main.py                        ← demo avec avis intégrés
#    python main.py --csv avis.csv         ← depuis un fichier CSV
#    python main.py --xlsx avis.xlsx       ← depuis un fichier Excel
#    python main.py --export               ← exporte en JSON + Excel
# ─────────────────────────────────────────
import argparse
import sys

from analyzer    import analyze_reviews
from csv_loader  import load_reviews_from_csv, load_reviews_from_excel
from exporter    import export_json, export_excel


# ── Affichage terminal ───────────────────────────────────────────────────
def print_result(result: dict) -> None:
    print("\n" + "═" * 55)
    print("  💄  ANALYSE DES AVIS COSMÉTIQUES")
    print("═" * 55)

    print(f"\n🔬  {len(result.get('aspects', []))} ASPECT(S) DÉTECTÉ(S)")
    emoji_map = {"positif": "✅", "négatif": "❌", "mitigé": "⚠️"}
    for a in result.get("aspects", []):
        e = emoji_map.get(a["sentiment"], "•")
        print(f"  {e}  {a['nom']:<22} {a['sentiment']:<8}  ({a['mentions']} mention(s))")
        for ex in a.get("exemples", []):
            print(f"       › \"{ex}\"")

    print(f"\n📝  RÉSUMÉ")
    print(f"  {result.get('summary', '—')}")

    print(f"\n💡  RECOMMANDATIONS")
    for i, r in enumerate(result.get("recommendations", []), 1):
        print(f"  {i}. {r}")

    conf  = result.get("confidence", "—")
    navis = result.get("avis_analysés", "—")
    warns = result.get("_warnings", [])
    print(f"\n📊  Confiance IA : {conf}  |  Avis analysés : {navis}")
    if warns:
        print(f"⚠️   {len(warns)} correction(s) appliquée(s) par le validateur")

    print("═" * 55 + "\n")


# ── Avis de démo ────────────────────────────────────────────────────────
DEMO_REVIEWS = [
    "J'adore cette crème, elle hydrate vraiment bien ma peau sèche !",
    "L'odeur est trop forte, ça me donne mal à la tête.",
    "Texture agréable mais le prix est vraiment trop élevé pour ce que c'est.",
    "Ma peau est plus lumineuse après 2 semaines, je suis bluffée.",
    "Le packaging est joli mais le produit coule partout.",
    "Efficace contre les rougeurs, je recommande vivement.",
    "Légèrement grasse sur ma peau, mais l'effet hydratant est là.",
]


# ── CLI ─────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Analyse d'avis cosmétiques par IA locale")
    parser.add_argument("--csv",    type=str, help="Fichier CSV des avis")
    parser.add_argument("--xlsx",   type=str, help="Fichier Excel des avis")
    parser.add_argument("--column", type=str, default="avis", help="Nom de la colonne (défaut: avis)")
    parser.add_argument("--export", action="store_true",      help="Exporte les résultats (JSON + Excel)")
    parser.add_argument("--verbose", action="store_true",     help="Affiche les logs de validation")
    args = parser.parse_args()

    # Chargement des avis
    try:
        if args.csv:
            reviews = load_reviews_from_csv(args.csv, column=args.column)
            print(f"📂  {len(reviews)} avis chargés depuis {args.csv}")
        elif args.xlsx:
            reviews = load_reviews_from_excel(args.xlsx, column=args.column)
            print(f"📂  {len(reviews)} avis chargés depuis {args.xlsx}")
        else:
            reviews = DEMO_REVIEWS
            print("ℹ️   Mode démo — utilise les avis intégrés.")
            print("    → Pour charger tes propres avis : python main.py --csv mon_fichier.csv\n")

    except (FileNotFoundError, ValueError) as e:
        print(f"\n❌  Erreur de chargement : {e}")
        sys.exit(1)

    # Analyse
    try:
        result = analyze_reviews(reviews, verbose=args.verbose)
    except (ConnectionError, TimeoutError, RuntimeError) as e:
        print(f"\n{e}")
        sys.exit(1)

    # Affichage
    print_result(result)

    # Export optionnel
    if args.export:
        try:
            json_path  = export_json(result)
            excel_path = export_excel(result)
            print(f"💾  Exporté → {json_path}")
            print(f"💾  Exporté → {excel_path}\n")
        except Exception as e:
            print(f"⚠️  Export échoué : {e}")


if __name__ == "__main__":
    main()
