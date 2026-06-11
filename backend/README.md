# 💄 CosmoAI — Analyse d'avis cosmétiques par IA locale

> IA 100% locale · Zéro API payante · Anti-hallucination intégré

---

## 🗂️ Architecture

```
cosmo_ai/
├── main.py            ← Point d'entrée (CLI)
├── analyzer.py        ← Pipeline principal
├── prompt_builder.py  ← Prompt strict anti-hallucination
├── ollama_client.py   ← Appel à Ollama + parsing JSON
├── validator.py       ← Validation et nettoyage du résultat
├── csv_loader.py      ← Chargement CSV / Excel
├── exporter.py        ← Export JSON / Excel
├── config.py          ← Paramètres centralisés
├── requirements.txt
└── README.md
```

---

## ⚙️ Installation

```bash
# 1. Installe les dépendances Python
pip install -r requirements.txt

# 2. Lance Ollama (dans un autre terminal)
ollama serve

# 3. Vérifie que ton modèle est disponible
ollama list
```

---

## ▶️ Utilisation

```bash
# Mode démo (avis intégrés)
python main.py

# Depuis un fichier CSV
python main.py --csv mes_avis.csv

# Depuis un fichier Excel
python main.py --xlsx mes_avis.xlsx

# Avec export JSON + Excel
python main.py --csv mes_avis.csv --export

# Mode verbeux (logs de validation)
python main.py --csv mes_avis.csv --verbose

# Colonne personnalisée dans le fichier
python main.py --csv mes_avis.csv --column "commentaire"
```

---

## 📋 Format du CSV attendu

```
avis
"J'adore cette crème, elle hydrate vraiment bien."
"L'odeur est trop forte."
"Texture agréable mais prix trop élevé."
```

---

## 🧠 Stratégie anti-hallucination

| Mécanisme | Rôle |
|---|---|
| `temperature: 0.1` | Réponses factuelles, quasi déterministes |
| `top_p: 0.9` | Coupe les tokens improbables |
| `repeat_penalty: 1.2` | Pénalise les répétitions et inventions |
| Prompt strict | Interdit explicitement toute invention |
| `validator.py` | Détecte les incohérences (mentions > nb avis, etc.) |

---

## 📦 Résultat type

```json
{
  "aspects": [
    {
      "nom": "hydratation",
      "sentiment": "positif",
      "mentions": 3,
      "exemples": ["hydrate vraiment bien ma peau sèche"]
    }
  ],
  "summary": "Le produit est globalement apprécié pour son effet hydratant.",
  "recommendations": ["Revoir la formulation du parfum"],
  "confidence": "élevée",
  "avis_analysés": 7,
  "_warnings": []
}
```

---

## 🔧 Configuration (`config.py`)

```python
MODEL      = "gemma3:27b"    # ← change selon ton modèle Ollama
MODEL_OPTIONS = {
    "temperature":    0.1,
    "top_p":          0.9,
    "repeat_penalty": 1.2,
}
REQUEST_TIMEOUT = 180        # secondes
```
