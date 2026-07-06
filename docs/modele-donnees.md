# Modèle de données

User (auth)
  id, nom, email, mot_de_passe_hash, role, date_creation

Projet
  id, nom, client, lieu, budget, date_debut, date_fin, statut, chef_de_projet

SousTraitant
  id, raison_sociale, contact, email, telephone, specialite, ice

Contrat  (Projet 1---N, SousTraitant 1---N)
  id, projet_id (FK), sous_traitant_id (FK), reference, montant,
  date_debut, date_fin, statut, document_id (FK)

Facture  (Contrat 1---N)
  id, contrat_id (FK), phase, reference, montant, date, statut

Paiement (Facture 1---N)
  id, facture_id (FK), montant, date, mode, document_id (FK)

Document (générique, polymorphe)
  id, nom_fichier, type_mime, taille, chemin_stockage, entite_liee, entite_id
