#!/usr/bin/env python3
"""
seed_data.py
============
Génère un jeu de données synthétique MAIS réaliste pour le projet
"SIS Suivi Marchés" (Projets / Sous-traitants / Contrats), en passant
UNIQUEMENT par les endpoints REST de l'API FastAPI.

Aucun ID n'est écrit en dur : les IDs sont récupérés depuis les réponses
de l'API après chaque POST, puis réutilisés pour construire les relations
(ex: Contrat -> Projet / Contrat -> SousTraitant).

Prérequis : le backend FastAPI doit tourner (par défaut sur
http://localhost:8000). Lance-le dans un terminal séparé, puis exécute :

    pip install requests
    python seed_data.py

--------------------------------------------------------------------------
⚠️ ADAPTER SI BESOIN : NOMS DE CHAMPS / ENDPOINTS
--------------------------------------------------------------------------
Je n'ai pas accès à tes schémas Pydantic exacts. J'ai utilisé les noms de
champs mentionnés dans ta demande (camelCase : budgetEngage, dateDebut...).
Si tes modèles utilisent d'autres noms (ex: snake_case), modifie UNIQUEMENT
les dictionnaires retournés par build_projet_payload / build_sous_traitant_payload
/ build_contrat_payload ci-dessous, et les constantes *_ENDPOINT.
--------------------------------------------------------------------------
"""

import random
import sys
from datetime import date, timedelta

import requests

# ============================================================
# CONFIGURATION — à adapter si ton API diffère
# ============================================================

BASE_URL = "http://localhost:8000"

PROJETS_ENDPOINT = f"{BASE_URL}/projets/"
SOUS_TRAITANTS_ENDPOINT = f"{BASE_URL}/sous-traitants/"
CONTRATS_ENDPOINT = f"{BASE_URL}/contrats/"

# Noms des clés utilisées pour lier les objets entre eux dans le payload
# Contrat (à adapter si ton schéma utilise ex: "projet_id" au lieu de "projetId")
CONTRAT_PROJET_FK = "projet_id"
CONTRAT_SOUS_TRAITANT_FK = "sous_traitant_id"

TIMEOUT = 10
RANDOM_SEED = 42  # reproductibilité ; mets None pour un jeu de données différent à chaque run

random.seed(RANDOM_SEED)

# ============================================================
# DONNÉES DE RÉFÉRENCE (pools réalistes marocains)
# ============================================================

VILLES_QUARTIERS = [
    "Rabat - Hay Riad", "Rabat - Agdal", "Casablanca - Sidi Maarouf",
    "Casablanca - Ain Sebaa", "Casablanca - Bouskoura", "Marrakech - Guéliz",
    "Marrakech - Route de l'Ourika", "Tanger - Boukhalef", "Tanger - Malabata",
    "Fès - Route d'Immouzer", "Agadir - Founty", "Agadir - Cité Founty",
    "Kénitra - Centre", "El Jadida - Centre", "Oujda - Route de Sidi Yahya",
]

TYPES_PROJETS = [
    ("Résidence", ["Al Andalous", "Les Jardins", "Riad Al Manar", "Al Manazil",
                   "Les Palmiers", "Dar Al Firdaous", "Al Wahda", "Bahia Verde"]),
    ("Centre d'affaires", ["Atlas Business Center", "Marina Office Park",
                            "Casa Nearshore Tower", "Rabat Business District"]),
    ("École", ["Groupe Scolaire Ibn Sina", "École Al Khawarizmi",
               "Complexe Scolaire Al Massira"]),
    ("Hôpital", ["Centre Hospitalier Régional", "Clinique Al Kindi",
                 "Pôle Médical Ibn Rochd"]),
    ("Route / Voirie", ["Rocade Périphérique", "Voie de contournement",
                         "Aménagement Boulevard Al Massira"]),
    ("Centre commercial", ["Atlas Mall Extension", "Marina Shopping"]),
]

CLIENTS = [
    "Groupe Al Omrane", "Addoha Promotion Immobilière", "CGI - Compagnie Générale Immobilière",
    "Alliances Développement Immobilier", "Commune Urbaine de Rabat",
    "Ministère de l'Éducation Nationale", "Ministère de la Santé",
    "Conseil Régional de Casablanca-Settat", "Société Nationale des Autoroutes du Maroc (ADM)",
    "Yasmine Immobilier", "Palmeraie Développement", "OCP Group",
]

CHEFS_PROJET = [
    "Yassine El Amrani", "Salma Bennani", "Karim Idrissi", "Fatima Ezzahra Tazi",
]

SPECIALITES_SOUS_TRAITANTS = [
    ("Gros œuvre", ["Bâtir Maroc SARL", "Groupe El Fassi Construction", "Atlas BTP"]),
    ("Électricité", ["Elec Pro Maroc", "Société Marocaine d'Électricité Générale"]),
    ("Plomberie", ["Hydro Plomberie SARL", "AquaTech Maroc"]),
    ("Étanchéité", ["Étanch'Pro Maroc", "Isolamat SARL"]),
    ("Menuiserie", ["Menuiserie Al Bahja", "Bois & Design Maroc"]),
    ("VRD", ["VRD Services Maroc", "TerraWorks SARL"]),
    ("Climatisation", ["Clim Expert Maroc", "ThermoTech SARL"]),
    ("Peinture", ["Couleurs du Maroc SARL", "Peinture Pro Rabat"]),
]

PRENOMS_CONTACTS = [
    "Mohammed", "Ahmed", "Youssef", "Hamza", "Nabil", "Rachid",
    "Amina", "Khadija", "Meryem", "Nawal", "Ilham",
]
NOMS_CONTACTS = [
    "El Alaoui", "Bensaid", "Berrada", "Chraibi", "Fassi", "Kabbaj",
    "Lahlou", "Naciri", "Ouahbi", "Sqalli", "Tahiri",
]

STATUTS_PROJET = ["actif", "actif", "actif", "termine", "termine"]  # ~60/40
STATUTS_CONTRAT = ["actif", "termine", "en_attente"]

# ============================================================
# UTILITAIRES DE GÉNÉRATION
# ============================================================

def random_date(start: date, end: date) -> date:
    delta_days = (end - start).days
    return start + timedelta(days=random.randint(0, max(delta_days, 0)))


def generate_ice() -> str:
    """
    Génère un identifiant à 15 chiffres au bon FORMAT ICE marocain :
    9 chiffres identifiant + 3 chiffres établissement + 2 chiffres type + 1 clé.
    ⚠️ La clé de contrôle N'EST PAS calculée selon un algorithme officiel validé
    (l'algorithme exact de la clé ICE marocaine n'est pas public/standardisé de
    façon fiable) : ceci est un identifiant à 15 chiffres visuellement conforme,
    PAS un ICE mathématiquement vérifiable. À ne pas utiliser tel quel en prod.
    """
    identifiant = "".join(str(random.randint(0, 9)) for _ in range(9))
    etablissement = "001"
    type_entreprise = "15"
    cle = str(random.randint(0, 9))
    return identifiant + etablissement + type_entreprise + cle


def generate_phone() -> str:
    return f"+212 6{random.randint(10,99)} {random.randint(10,99)} {random.randint(10,99)} {random.randint(10,99)}"


def generate_email(prenom: str, nom: str, domain_hint: str) -> str:
    local = f"{prenom.lower()}.{nom.lower().replace(' ', '')}"
    domain = domain_hint.lower().replace(" ", "").replace("'", "")[:15] or "entreprise"
    return f"{local}@{domain}.ma"


def budget_par_type(type_projet: str) -> int:
    ranges = {
        "Résidence": (2_000_000, 15_000_000),
        "Centre d'affaires": (5_000_000, 15_000_000),
        "École": (800_000, 4_000_000),
        "Hôpital": (5_000_000, 15_000_000),
        "Route / Voirie": (1_500_000, 12_000_000),
        "Centre commercial": (4_000_000, 15_000_000),
    }
    lo, hi = ranges.get(type_projet, (200_000, 5_000_000))
    return random.randint(lo, hi) // 1000 * 1000  # arrondi au millier


def duree_jours_par_type(type_projet: str) -> int:
    durees = {
        "Résidence": (240, 540),
        "Centre d'affaires": (300, 720),
        "École": (150, 360),
        "Hôpital": (360, 900),
        "Route / Voirie": (120, 400),
        "Centre commercial": (300, 600),
    }
    lo, hi = durees.get(type_projet, (120, 300))
    return random.randint(lo, hi)


# ============================================================
# CONSTRUCTION DES PAYLOADS (adapter les clés ici si besoin)
# ============================================================

def build_projet_payload(index: int) -> dict:
    type_projet, noms = random.choice(TYPES_PROJETS)
    nom_projet = f"{type_projet} {random.choice(noms)}"
    budget = budget_par_type(type_projet)

    today = date(2026, 7, 7)
    debut = today - timedelta(days=random.randint(30, 720))
    duree = duree_jours_par_type(type_projet)
    fin = debut + timedelta(days=duree)

    statut = random.choice(STATUTS_PROJET)
    # Si le projet est "termine", force une date de fin dans le passé
    if statut == "termine" and fin > today:
        fin = today - timedelta(days=random.randint(1, 60))
        if fin <= debut:
            fin = debut + timedelta(days=30)

    # Taux d'engagement variable : certains sous-consommés, certains en dépassement
    taux = random.choice([0.35, 0.55, 0.7, 0.85, 0.95, 1.0, 1.08, 1.15])
    budget_engage = round(budget * taux, 2)

    return {
        "nom": nom_projet,
        "client": random.choice(CLIENTS),
        "lieu": random.choice(VILLES_QUARTIERS),
        "budget": budget,
        "budgetEngage": budget_engage,
        "debut": debut.isoformat(),
        "fin": fin.isoformat(),
        "statut": statut,
        "chef": random.choice(CHEFS_PROJET),
    }


def build_sous_traitant_payload(specialite: str, nom_entreprise: str) -> dict:
    prenom = random.choice(PRENOMS_CONTACTS)
    nom = random.choice(NOMS_CONTACTS)
    return {
        "name": nom_entreprise,
        "specialite": specialite,
        "contact": f"{prenom} {nom}",
        "email": generate_email(prenom, nom, nom_entreprise),
        "telephone": generate_phone(),
        "ice": generate_ice(),
    }


def build_contrat_payload(index: int, projet: dict, sous_traitant: dict) -> dict:
    projet_debut = date.fromisoformat(projet["debut"])
    projet_fin = date.fromisoformat(projet["fin"])

    contrat_debut = random_date(projet_debut, projet_fin)
    duree_contrat = random.randint(30, max((projet_fin - contrat_debut).days, 31))
    contrat_fin = min(contrat_debut + timedelta(days=duree_contrat), projet_fin)

    # Montant du contrat : fraction raisonnable du budget du projet parent
    part = random.uniform(0.05, 0.25)
    montant = round(projet["budget"] * part, 2)

    annee = contrat_debut.year
    reference = f"CT-{annee}-{index:03d}"

    return {
        "reference": reference,
        CONTRAT_PROJET_FK: projet["id"],
        CONTRAT_SOUS_TRAITANT_FK: sous_traitant["id"],
        "montant": montant,
        # ⚠️ NON CONFIRMÉ : je n'ai pas encore vu l'erreur 422 du endpoint /contrats/.
        # Par cohérence avec le schéma Projet (debut/fin), je pars sur les mêmes noms.
        # Si ça échoue avec un 422, regarde le détail affiché et ajuste ici.
        "debut": contrat_debut.isoformat(),
        "fin": contrat_fin.isoformat(),
        "statut": random.choice(STATUTS_CONTRAT),
    }


# ============================================================
# APPELS API
# ============================================================

def post_entity(endpoint: str, payload: dict) -> dict | None:
    try:
        resp = requests.post(endpoint, json=payload, timeout=TIMEOUT)
    except requests.exceptions.ConnectionError:
        print(f"  ✗ Connexion impossible à {endpoint}. Le backend est-il démarré ?")
        return None

    if resp.status_code in (200, 201):
        return resp.json()

    print(f"  ✗ Erreur {resp.status_code} sur {endpoint}")
    try:
        print(f"    Détail : {resp.json()}")
    except ValueError:
        print(f"    Détail (brut) : {resp.text}")
    return None


def seed_projets(nb: int) -> list[dict]:
    print(f"\n=== Création de {nb} projets ===")
    created = []
    for i in range(nb):
        payload = build_projet_payload(i)
        result = post_entity(PROJETS_ENDPOINT, payload)
        if result is not None:
            print(f"  ✓ Projet créé : {payload['nom']} (id={result.get('id')})")
            created.append(result)
    return created


def seed_sous_traitants(nb: int) -> list[dict]:
    print(f"\n=== Création de {nb} sous-traitants ===")
    created = []
    pool = []
    for specialite, noms in SPECIALITES_SOUS_TRAITANTS:
        for nom in noms:
            pool.append((specialite, nom))
    random.shuffle(pool)
    pool = pool[:nb] if nb <= len(pool) else pool + [
        random.choice(pool) for _ in range(nb - len(pool))
    ]

    for specialite, nom_entreprise in pool:
        payload = build_sous_traitant_payload(specialite, nom_entreprise)
        result = post_entity(SOUS_TRAITANTS_ENDPOINT, payload)
        if result is not None:
            print(f"  ✓ Sous-traitant créé : {payload['name']} ({specialite}) (id={result.get('id')})")
            created.append(result)
    return created


def seed_contrats(nb: int, projets: list[dict], sous_traitants: list[dict]) -> list[dict]:
    print(f"\n=== Création de {nb} contrats ===")
    created = []
    if not projets or not sous_traitants:
        print("  ✗ Impossible de créer des contrats : aucun projet ou sous-traitant disponible.")
        return created

    # Garantit 2 à 4 sous-traitants par projet, dans la limite de nb contrats
    index = 1
    contrats_par_projet = {p["id"]: random.randint(2, 4) for p in projets}

    for projet in projets:
        nb_st_pour_ce_projet = contrats_par_projet[projet["id"]]
        sts_choisis = random.sample(
            sous_traitants, k=min(nb_st_pour_ce_projet, len(sous_traitants))
        )
        for st in sts_choisis:
            if index > nb:
                break
            payload = build_contrat_payload(index, projet, st)
            result = post_entity(CONTRATS_ENDPOINT, payload)
            if result is not None:
                print(f"  ✓ Contrat créé : {payload['reference']} "
                      f"(projet={projet['nom']}, sous-traitant={st['name']})")
                created.append(result)
            index += 1
        if index > nb:
            break

    return created


# ============================================================
# MAIN
# ============================================================

def main():
    nb_projets = 12
    nb_sous_traitants = 9
    nb_contrats = 18

    print("Démarrage du seed pour SIS Suivi Marchés")
    print(f"API cible : {BASE_URL}")

    projets = seed_projets(nb_projets)
    sous_traitants = seed_sous_traitants(nb_sous_traitants)
    contrats = seed_contrats(nb_contrats, projets, sous_traitants)

    print("\n" + "=" * 50)
    print("RÉSUMÉ")
    print("=" * 50)
    print(f"Projets créés        : {len(projets)} / {nb_projets}")
    print(f"Sous-traitants créés  : {len(sous_traitants)} / {nb_sous_traitants}")
    print(f"Contrats créés        : {len(contrats)} / {nb_contrats}")

    if len(projets) < nb_projets or len(sous_traitants) < nb_sous_traitants or len(contrats) < nb_contrats:
        print("\n⚠️  Certaines entités n'ont pas pu être créées. Vérifie les erreurs 422 ci-dessus")
        print("   (probablement un nom de champ qui diffère de ton schéma Pydantic).")
        sys.exit(1)

    print("\n✅ Seed terminé avec succès.")


if __name__ == "__main__":
    main()
