vSois mon coach et expert pour la suite de ce projet "SIS Suivi Marchés" (stage IA/Data 
Science, SIS Consultants, Maroc). Je continue le FRONTEND dans cette session ; le 
BACKEND avance en parallèle dans une autre session.

MÉTHODE : étape par étape, je valide chaque fichier avant le suivant, on discute avant 
de coder.

STYLE : basé sur sis.ma (cabinet institutionnel sobre, fondé 1985), PAS TenderWatch. 
Blocs/tuiles sobres, bordure fine 1px, AUCUNE ombre, AUCUN dégradé, radius léger 6-8px. 
Palette provisoire : fond #FAFAFA, encre #0F2A44, bordures #E2E5EA, accent doré/ochre 
#B08A3E. Police Inter. Styles inline + theme.js, pas de Tailwind.

STACK : React + Vite, react-router-dom, lucide-react. Backend : FastAPI + SQLite.

CLIENT API CONFIRMÉ (src/api/client.js) : exporte un objet `api` avec `get(path)`, 
`post(path, body)`, `put(path, body)`, `del(path)` — PAS `delete`. BASE_URL = 
http://localhost:8000.

CONVENTION DE NOMMAGE CONFIRMÉE : le backend utilise systématiquement le snake_case 
(budget_engage, projet_id, sous_traitant_id, date_debut, date_fin, document_nom...). 
TOUJOURS utiliser exactement les mêmes noms côté frontend (formulaires, state, payloads) 
— jamais de camelCase qui ne matche pas, sinon FastAPI/Pydantic ignore silencieusement le 
champ sans erreur visible (bug déjà rencontré et corrigé sur budget_engage).

ARCHITECTURE DATA : src/context/DataContext.jsx (DataProvider + useData()), seule source 
de vérité. CRUD projects/subs/contrats tous ASYNC (API réelle), chargés ensemble au 
montage via un seul Promise.all([fetchProjects(), fetchSousTraitants(), fetchContrats()]). 
subsByProject reste LOCAL/mock (pas encore migré vers les vrais contrats — migration 
prévue comme étape séparée plus tard, PAS urgente).

═══════════════════════════════
ÉTAT FRONTEND — À JOUR
═══════════════════════════════
- components/layout/, components/ui/ (Table, Badge, Highlight, Modal, Field, 
  ConfirmModal) — FAIT
- api/ : client.js, projects.js, sousTraitants.js, contrats.js — FAIT et branché
- context/DataContext.jsx : projects, subs, contrats tous chargés au montage et gérés en 
  CRUD async (addProject/updateProject/deleteProject, addSub/updateSub/deleteSub, 
  addContrat/editContrat/removeContrat). Sélecteurs : getSubsForProject, subProjectCount, 
  projectsForSub, getHistoryForProject, getContratsForProject, assignSubToProject, 
  unassignSub — TOUT FAIT ET FONCTIONNEL
- pages/Projects/ : ProjectsView, ProjectDetail (édition en place + ConfirmModal), 
  ProjectForm, tabs/* — TOUT FAIT ET FONCTIONNEL (bug budget_engage résolu : mismatch 
  camelCase/snake_case corrigé dans ProjectForm.jsx, ProjectInfoEdit.jsx, 
  ProjectInfoTab.jsx)
- pages/SousTraitants/ : SubsView, SubDetail, SubForm — FAIT et branché API
- pages/Contrats/ : ContratsView.jsx (liste, tri, recherche+surbrillance, filtre par 
  projet, bouton Nouveau), ContratDetail.jsx (fil d'Ariane, infos + liens vers 
  projet/sous-traitant, Modifier/Supprimer avec ConfirmModal), ContratForm.jsx (modal 
  create/edit, select projet + select sous-traitant, null→"" appliqué sur TOUS les champs 
  au chargement) — TOUT FAIT, CRUD COMPLET, TESTÉ ET FONCTIONNEL ✅
- pages/DCE — PROCHAINE ÉTAPE. Backend annoncé prêt (table + route créées côté autre 
  session), mais détail exact (models/dce.py, schemas/dce.py, routes) PAS ENCORE ENVOYÉ 
  dans cette session — nécessaire avant de coder api/dce.js
- Auth : structure réservée, NON codée, priorité basse

CORRECTIFS DÉJÀ FAITS (historique complet) :
1. debut/fin obligatoires (Projet) — FAIT
2. budget_engage : colonne backend confirmée présente, mismatch camelCase/snake_case 
   frontend CORRIGÉ (ProjectForm, ProjectInfoEdit, ProjectInfoTab)
3. subsByProject collision ID — CORRIGÉ ({})
4. Édition en place (Projects) + confirmation suppression — FAIT
5. Données de test synthétiques — seed.py existe côté backend
6. SubForm.jsx : null → "" avant de peupler le form — CORRIGÉ
7. assignSubToProject/unassignSub manquantes — CORRIGÉ
8. PUT /projets/{id} 422 — CORRIGÉ (state ProjectInfoEdit depuis objet entier)
9. api/contrats.js utilisait client/.delete au lieu de api/.del — CORRIGÉ
10. ContratForm.jsx : même bug null→"" que SubForm — CORRIGÉ avec un utilitaire générique 
    (Object.entries + map value===null?"":value) appliqué à TOUS les champs d'un coup, 
    plutôt que champ par champ

PIÈGES À NE PAS REFAIRE :
1. Ne jamais appeler un Hook en dehors du corps d'un composant.
2. Toujours combler les champs manquants avec un objet EMPTY par défaut dans les 
   useEffect des formulaires.
3. Ne jamais dupliquer une route dans App.jsx.
4. Vérifier qu'un fichier collé est complet, jamais un morceau partiel.
5. Vérifier les extensions de fichiers cachées sous Windows (utiliser `dir` en CMD).
6. Erreurs 422 : toujours regarder le detail JSON exact (Network tab).
7. Ne jamais initialiser un state relationnel avec des IDs codés en dur.
8. Fonctions DataContext liées à l'API = ASYNC, toujours await + état saving/deleting.
9. Champ optionnel backend (Optional[...]=None) revient en `null`, jamais `""` — 
   neutraliser TOUS les champs d'un objet initial avec un map générique, pas un par un.
10. Lors d'une réécriture complète d'un fichier, vérifier qu'aucune fonction existante 
    n'a été perdue.
11. Formulaire d'édition avec PUT complet : toujours initialiser le state depuis l'objet 
    source ENTIER.
12. TOUJOURS vérifier le nom exact des méthodes exportées par client.js (api.get/post/
    put/del) avant d'écrire un nouveau fichier api/*.js.
13. TOUJOURS utiliser le snake_case exact du backend (jamais camelCase) dans tout payload 
    envoyé à l'API — vérifier le schema Pydantic réel plutôt que de deviner un nom de 
    champ.

CONTEXTE PERSONNEL : stagiaire IA/Data Science, décalage ressenti avec le travail 
CRUD/API actuel. Niveau C (pilote d'extraction DCE hors app) reste le terrain identifié 
pour sa spécialité, une fois quelques fiches DCE Niveau B disponibles.

PROCHAINE ÉTAPE IMMÉDIATE : l'utilisateur doit envoyer le contenu de 
backend/app/models/dce.py, backend/app/schemas/dce.py, et les routes exactes de 
backend/app/routers/dce.py, pour que je construise api/dce.js + l'intégration DataContext 
sans deviner les noms de champs (leçon du bug budget_engage).

À CHAQUE réponse, redonner le prompt de reprise complet et à jour.

voici les fichiers demandé:

dce models
from sqlalchemy import Column, Integer, String, Float, Date, Text, ForeignKey, DateTime, func
from app.core.database import Base

class DCE(Base):
    __tablename__ = "dce"

    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projets.id"), nullable=False, unique=True)  # 1:1 avec Projet

    objet = Column(Text, nullable=True)
    organisme = Column(String, nullable=True)
    montant_estimatif = Column(Float, nullable=True)
    date_limite_remise = Column(Date, nullable=True)
    type_procedure = Column(String, nullable=True)
    pieces_exigees = Column(Text, nullable=True)  # une pièce par ligne, texte libre

    document_nom = Column(String, nullable=True)
    date_creation = Column(DateTime(timezone=True), server_default=func.now())


dce schema
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class DCEBase(BaseModel):
    projet_id: int
    objet: Optional[str] = None
    organisme: Optional[str] = None
    montant_estimatif: Optional[float] = None
    date_limite_remise: Optional[date] = None
    type_procedure: Optional[str] = None
    pieces_exigees: Optional[str] = None
    document_nom: Optional[str] = None

class DCECreate(DCEBase):
    pass

class DCEUpdate(DCEBase):
    pass

class DCERead(DCEBase):
    id: int
    date_creation: datetime
    model_config = ConfigDict(from_attributes=True)

dce routers
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.dce import DCE
from app.schemas.dce import DCECreate, DCEUpdate, DCERead

router = APIRouter(prefix="/dce", tags=["dce"])

@router.get("/", response_model=list[DCERead])
def list_dce(projet_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(DCE)
    if projet_id is not None:
        query = query.filter(DCE.projet_id == projet_id)
    return query.all()

@router.get("/{dce_id}", response_model=DCERead)
def get_dce(dce_id: int, db: Session = Depends(get_db)):
    dce = db.query(DCE).filter(DCE.id == dce_id).first()
    if not dce:
        raise HTTPException(status_code=404, detail="DCE introuvable")
    return dce

@router.post("/", response_model=DCERead, status_code=201)
def create_dce(data: DCECreate, db: Session = Depends(get_db)):
    existing = db.query(DCE).filter(DCE.projet_id == data.projet_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ce projet a déjà un DCE (relation 1:1)")
    dce = DCE(**data.model_dump())
    db.add(dce)
    db.commit()
    db.refresh(dce)
    return dce

@router.put("/{dce_id}", response_model=DCERead)
def update_dce(dce_id: int, data: DCEUpdate, db: Session = Depends(get_db)):
    dce = db.query(DCE).filter(DCE.id == dce_id).first()
    if not dce:
        raise HTTPException(status_code=404, detail="DCE introuvable")
    for key, value in data.model_dump().items():
        setattr(dce, key, value)
    db.commit()
    db.refresh(dce)
    return dce

@router.delete("/{dce_id}", status_code=204)
def delete_dce(dce_id: int, db: Session = Depends(get_db)):
    dce = db.query(DCE).filter(DCE.id == dce_id).first()
    if not dce:
        raise HTTPException(status_code=404, detail="DCE introuvable")
    db.delete(dce)
    db.commit()