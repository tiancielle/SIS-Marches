# Spécification Backend - Workflow et Architecture Simplifiée

## 1. MODÈLES DE DONNÉES

### 1.1 Modèle `Projet` (MODIFIÉ)

```python
class Projet(Base):
    __tablename__ = "projets"

    id = Column(Integer, primary_key=True, index=True)

    # Lien vers l'AppelOffres d'origine
    appel_offres_id = Column(Integer, ForeignKey("appel_offres.id"), nullable=True, unique=True, index=True)
    origine = Column(String, nullable=False, default="manuel")  # "appel_offres" | "manuel"
    url_avis = Column(String, nullable=True)

    # Informations générales
    nom = Column(String, nullable=False)
    client = Column(String, nullable=True)
    lieu = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    # Budget et dates
    budget = Column(Float, nullable=True)
    budget_engage = Column(Float, nullable=True, default=0)
    debut = Column(Date, nullable=True)
    fin = Column(Date, nullable=True)

    # Équipe
    chef = Column(String, nullable=True)
    chef_id = Column(Integer, ForeignKey("equipe.id"), nullable=True)

    # WORKFLOW STATE (NOUVEAU - remplace "phase")
    workflow_state = Column(String, nullable=False, default="opportunite")  # "opportunite" | "projet"

    # Statut métier
    statut = Column(String, nullable=False, default="interesse")
    # Opportunité: interesse, en_preparation, soumis, gagne, perdu, abandonne
    # Projet: en_execution, actif, suspendu, termine

    # Dates workflow
    date_soumission = Column(Date, nullable=True)
    date_conversion = Column(DateTime(timezone=True), nullable=True)  # Quand opportunité → projet

    # Relations
    contrat_principal_id = Column(Integer, ForeignKey("contrats.id"), nullable=True)

    date_creation = Column(DateTime(timezone=True), server_default=func.now())
```

### 1.2 Modèle `Evenement` (NOUVEAU - Audit Trail)

```python
class Evenement(Base):
    __tablename__ = "evenements"

    id = Column(Integer, primary_key=True, index=True)

    # Entité concernée
    entite_type = Column(String, nullable=False)  # "appel_offres", "opportunite", "projet", "contrat", "equipe", "sous_traitant", "livrable"
    entite_id = Column(Integer, nullable=False)

    # Type d'événement
    type_evenement = Column(String, nullable=False)

    # Description
    titre = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Contexte utilisateur
    utilisateur_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    utilisateur_nom = Column(String, nullable=True)  # Denormalisé pour performance

    # Tracking des changements
    donnees_changees = Column(JSON, nullable=True)  # {avant: {...}, apres: {...}}

    # Métadonnées
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

    date_creation = Column(DateTime(timezone=True), server_default=func.now())

    # Index pour performance
    __table_args__ = (
        Index('ix_evenements_entite', 'entite_type', 'entite_id'),
        Index('ix_evenements_date', 'date_creation'),
    )
```

### 1.3 Modèle `Livrable` (NOUVEAU)

```python
class Livrable(Base):
    __tablename__ = "livrables"

    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projets.id"), nullable=False)
    contrat_id = Column(Integer, ForeignKey("contrats.id"), nullable=True)

    titre = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    type_livrable = Column(String, nullable=True)  # "rapport", "plan", "document", etc.

    date_prevue = Column(Date, nullable=True)
    date_livraison = Column(Date, nullable=True)

    statut = Column(String, nullable=False, default="en_attente")  # "en_attente", "envoye", "valide", "refuse"

    document_nom = Column(String, nullable=True)
    document_path = Column(String, nullable=True)

    date_creation = Column(DateTime(timezone=True), server_default=func.now())
```

### 1.4 Modèle `Avenant` (NOUVEAU)

```python
class Avenant(Base):
    __tablename__ = "avenants"

    id = Column(Integer, primary_key=True, index=True)
    contrat_id = Column(Integer, ForeignKey("contrats.id"), nullable=False)

    numero = Column(String, nullable=False)  # "A1", "A2", etc.
    objet = Column(String, nullable=False)

    montant_variation = Column(Float, nullable=True)  # Positif ou négatif
    nouveau_montant = Column(Float, nullable=True)

    date_signature = Column(Date, nullable=True)
    description = Column(Text, nullable=True)

    document_nom = Column(String, nullable=True)
    document_path = Column(String, nullable=True)

    date_creation = Column(DateTime(timezone=True), server_default=func.now())
```

### 1.5 Modèle `Contrat` (MODIFIÉ)

```python
class Contrat(Base):
    __tablename__ = "contrats"

    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projets.id"), nullable=False)
    sous_traitant_id = Column(Integer, ForeignKey("sous_traitants.id"), nullable=False)

    reference = Column(String, nullable=True)
    montant = Column(Float, nullable=True)

    date_debut = Column(Date, nullable=True)
    date_fin = Column(Date, nullable=True)

    # NOUVEAUX CHAMPS
    date_signature = Column(Date, nullable=True)
    date_renouvellement = Column(Date, nullable=True)

    statut = Column(String, nullable=False, default="brouillon")
    # brouillon, envoye, signe, actif, expire, resilie, renouvele

    document_nom = Column(String, nullable=True)
    document_path = Column(String, nullable=True)
```

### 1.6 Modèle `AppelOffres` (MODIFIÉ)

```python
class AppelOffres(Base):
    __tablename__ = "appel_offres"

    # ... champs existants ...

    # NOUVEAUX CHAMPS
    date_interet = Column(DateTime(timezone=True), nullable=True)  # Quand marqué "intéressé"
    date_conversion_projet = Column(DateTime(timezone=True), nullable=True)  # Quand converti en projet
```

## 2. MIGRATIONS SQLALCHEMY

### Migration 001 : Ajouter workflow_state aux projets

```python
def upgrade():
    op.add_column('projets', sa.Column('workflow_state', sa.String(), nullable=False, server_default='opportunite'))
    op.add_column('projets', sa.Column('date_conversion', sa.DateTime(timezone=True), nullable=True))
    op.add_column('projets', sa.Column('contrat_principal_id', sa.Integer(), sa.ForeignKey('contrats.id'), nullable=True))

    # Migration des données existantes
    op.execute("UPDATE projets SET workflow_state = 'projet' WHERE statut IN ('actif', 'termine', 'en_execution')")
    op.execute("UPDATE projets SET workflow_state = 'opportunite' WHERE statut IN ('interesse', 'en_preparation', 'soumis', 'gagne', 'perdu', 'abandonne')")
```

### Migration 002 : Créer table evenements

```python
def upgrade():
    op.create_table(
        'evenements',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('entite_type', sa.String(), nullable=False),
        sa.Column('entite_id', sa.Integer(), nullable=False),
        sa.Column('type_evenement', sa.String(), nullable=False),
        sa.Column('titre', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('utilisateur_id', sa.Integer(), nullable=True),
        sa.Column('utilisateur_nom', sa.String(), nullable=True),
        sa.Column('donnees_changees', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('date_creation', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Index('ix_evenements_entite', 'entite_type', 'entite_id'),
        sa.Index('ix_evenements_date', 'date_creation'),
    )
```

### Migration 003 : Créer table livrables

```python
def upgrade():
    op.create_table(
        'livrables',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('projet_id', sa.Integer(), sa.ForeignKey('projets.id'), nullable=False),
        sa.Column('contrat_id', sa.Integer(), sa.ForeignKey('contrats.id'), nullable=True),
        sa.Column('titre', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type_livrable', sa.String(), nullable=True),
        sa.Column('date_prevue', sa.Date(), nullable=True),
        sa.Column('date_livraison', sa.Date(), nullable=True),
        sa.Column('statut', sa.String(), nullable=False, server_default='en_attente'),
        sa.Column('document_nom', sa.String(), nullable=True),
        sa.Column('document_path', sa.String(), nullable=True),
        sa.Column('date_creation', sa.DateTime(timezone=True), server_default=func.now()),
    )
```

### Migration 004 : Créer table avenants

```python
def upgrade():
    op.create_table(
        'avenants',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('contrat_id', sa.Integer(), sa.ForeignKey('contrats.id'), nullable=False),
        sa.Column('numero', sa.String(), nullable=False),
        sa.Column('objet', sa.String(), nullable=False),
        sa.Column('montant_variation', sa.Float(), nullable=True),
        sa.Column('nouveau_montant', sa.Float(), nullable=True),
        sa.Column('date_signature', sa.Date(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('document_nom', sa.String(), nullable=True),
        sa.Column('document_path', sa.String(), nullable=True),
        sa.Column('date_creation', sa.DateTime(timezone=True), server_default=func.now()),
    )
```

### Migration 005 : Enrichir contrat

```python
def upgrade():
    op.add_column('contrats', sa.Column('date_signature', sa.Date(), nullable=True))
    op.add_column('contrats', sa.Column('date_renouvellement', sa.Date(), nullable=True))
    op.execute("UPDATE contrats SET statut = 'actif' WHERE statut = 'actif'")
```

### Migration 006 : Enrichir appel_offres

```python
def upgrade():
    op.add_column('appel_offres', sa.Column('date_interet', sa.DateTime(timezone=True), nullable=True))
    op.add_column('appel_offres', sa.Column('date_conversion_projet', sa.DateTime(timezone=True), nullable=True))
```

## 3. SERVICES ÉVÉNEMENTS (Audit Trail Automatique)

### Fichier `app/services/evenement_service.py` (NOUVEAU)

```python
from datetime import datetime
from app.models.evenement import Evenement
from sqlalchemy.orm import Session

def creer_evenement(
    db: Session,
    entite_type: str,
    entite_id: int,
    type_evenement: str,
    titre: str,
    description: str = None,
    utilisateur_id: int = None,
    utilisateur_nom: str = None,
    donnees_changees: dict = None,
    ip_address: str = None,
    user_agent: str = None,
) -> Evenement:
    """Crée un événement automatique"""
    evenement = Evenement(
        entite_type=entite_type,
        entite_id=entite_id,
        type_evenement=type_evenement,
        titre=titre,
        description=description,
        utilisateur_id=utilisateur_id,
        utilisateur_nom=utilisateur_nom,
        donnees_changees=donnees_changees,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(evenement)
    db.commit()
    db.refresh(evenement)
    return evenement

def creer_evenement_changement(
    db: Session,
    entite_type: str,
    entite_id: int,
    type_evenement: str,
    titre: str,
    avant: dict,
    apres: dict,
    utilisateur_id: int = None,
    utilisateur_nom: str = None,
) -> Evenement:
    """Crée un événement avec tracking des changements"""
    return creer_evenement(
        db=db,
        entite_type=entite_type,
        entite_id=entite_id,
        type_evenement=type_evenement,
        titre=titre,
        description=f"Changement: {list(apres.keys())}",
        utilisateur_id=utilisateur_id,
        utilisateur_nom=utilisateur_nom,
        donnees_changees={"avant": avant, "apres": apres},
    )
```

## 4. ENDPOINTS API

### 4.1 Router `evenements.py` (NOUVEAU)

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.evenement import Evenement
from app.schemas.evenement import EvenementRead

router = APIRouter(prefix="/evenements", tags=["evenements"])

@router.get("/{entite_type}/{entite_id}", response_model=list[EvenementRead])
def get_evenements_entite(entite_type: str, entite_id: int, db: Session = Depends(get_db)):
    """Récupère la timeline d'une entité"""
    return db.query(Evenement).filter(
        Evenement.entite_type == entite_type,
        Evenement.entite_id == entite_id
    ).order_by(Evenement.date_creation.desc()).all()

@router.get("/recent", response_model=list[EvenementRead])
def get_evenements_recent(limit: int = 50, db: Session = Depends(get_db)):
    """Récupère les événements récents (pour dashboard)"""
    return db.query(Evenement).order_by(Evenement.date_creation.desc()).limit(limit).all()
```

### 4.2 Router `projets.py` (MODIFIÉ)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.projet import Projet
from app.services.evenement_service import creer_evenement, creer_evenement_changement
from app.schemas.projet import ProjetCreate, ProjetUpdate, ProjetRead

router = APIRouter(prefix="/projets", tags=["projets"])

@router.post("/", response_model=ProjetRead, status_code=201)
def create_projet(data: ProjetCreate, db: Session = Depends(get_db)):
    projet = Projet(**data.model_dump())
    db.add(projet)
    db.commit()
    db.refresh(projet)
    
    # Événement automatique
    creer_evenement(
        db=db,
        entite_type="projet" if data.workflow_state == "projet" else "opportunite",
        entite_id=projet.id,
        type_evenement="creation",
        titre="Projet créé" if data.workflow_state == "projet" else "Opportunité créée",
        description=f"{projet.nom}",
    )
    
    return projet

@router.put("/{projet_id}", response_model=ProjetRead)
def update_projet(projet_id: int, data: ProjetUpdate, db: Session = Depends(get_db)):
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    
    # Sauvegarder l'état avant
    old_statut = projet.statut
    old_workflow_state = projet.workflow_state
    old_values = {k: getattr(projet, k) for k in data.model_dump().keys()}
    
    # Appliquer les changements
    for key, value in data.model_dump().items():
        setattr(projet, key, value)
    db.commit()
    db.refresh(projet)
    
    # Événement changement de statut
    if data.statut and data.statut != old_statut:
        creer_evenement(
            db=db,
            entite_type="projet" if old_workflow_state == "projet" else "opportunite",
            entite_id=projet.id,
            type_evenement="statut_change",
            titre="Statut changé",
            description=f"{old_statut} → {data.statut}",
        )
    
    # Événement conversion opportunité → projet
    if data.workflow_state and data.workflow_state != old_workflow_state and data.workflow_state == "projet":
        projet.date_conversion = datetime.now()
        db.commit()
        creer_evenement(
            db=db,
            entite_type="opportunite",
            entite_id=projet.id,
            type_evenement="conversion",
            titre="Conversion en projet",
            description="Opportunité gagnée → Projet démarré",
        )
    
    # Événement modification générale
    if data.model_dump().keys() - {"statut", "workflow_state"}:
        creer_evenement_changement(
            db=db,
            entite_type="projet" if projet.workflow_state == "projet" else "opportunite",
            entite_id=projet.id,
            type_evenement="modification",
            titre="Projet modifié",
            avant=old_values,
            apres=data.model_dump(),
        )
    
    return projet

@router.post("/{projet_id}/convertir-en-projet", response_model=ProjetRead)
def convertir_en_projet(projet_id: int, db: Session = Depends(get_db)):
    """Convertit une opportunité en projet"""
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    
    old_workflow_state = projet.workflow_state
    
    projet.statut = "en_execution"
    projet.workflow_state = "projet"
    projet.date_conversion = datetime.now()
    db.commit()
    
    creer_evenement(
        db=db,
        entite_type="opportunite",
        entite_id=projet.id,
        type_evenement="conversion",
        titre="Conversion en projet",
        description="Opportunité gagnée → Projet démarré",
    )
    
    return projet
```

### 4.3 Router `contrats.py` (MODIFIÉ)

```python
@router.post("/", response_model=ContratRead, status_code=201)
def create_contrat(data: ContratCreate, db: Session = Depends(get_db)):
    contrat = Contrat(**data.model_dump())
    db.add(contrat)
    db.commit()
    db.refresh(contrat)
    
    # Événement contrat créé
    creer_evenement(
        db=db,
        entite_type="contrat",
        entite_id=contrat.id,
        type_evenement="creation",
        titre="Contrat créé",
        description=f"Réf: {contrat.reference}",
    )
    
    # Événement sur le projet
    if contrat.projet_id:
        creer_evenement(
            db=db,
            entite_type="projet",
            entite_id=contrat.projet_id,
            type_evenement="contrat_cree",
            titre="Contrat créé",
            description=f"Réf: {contrat.reference}",
        )
    
    return contrat

@router.put("/{contrat_id}", response_model=ContratRead)
def update_contrat(contrat_id: int, data: ContratUpdate, db: Session = Depends(get_db)):
    contrat = db.query(Contrat).filter(Contrat.id == contrat_id).first()
    if not contrat:
        raise HTTPException(status_code=404, detail="Contrat introuvable")
    
    old_statut = contrat.statut
    
    for key, value in data.model_dump().items():
        setattr(contrat, key, value)
    db.commit()
    db.refresh(contrat)
    
    # Événement changement de statut
    if data.statut and data.statut != old_statut:
        creer_evenement(
            db=db,
            entite_type="contrat",
            entite_id=contrat.id,
            type_evenement="statut_change",
            titre="Statut changé",
            description=f"{old_statut} → {data.statut}",
        )
        
        # Si signé, événement sur le projet
        if data.statut == "signe" and contrat.projet_id:
            creer_evenement(
                db=db,
                entite_type="projet",
                entite_id=contrat.projet_id,
                type_evenement="contrat_signe",
                titre="Contrat signé",
                description=f"Réf: {contrat.reference}",
            )
    
    return contrat
```

### 4.4 Router `appel_offres.py` (MODIFIÉ)

```python
@router.post("/{id}/interesser")
def interesser_appel_offre(id: int, payload: dict, db: Session = Depends(get_db)):
    appel = db.query(AppelOffres).filter(AppelOffres.id == id).first()
    if not appel:
        raise HTTPException(status_code=404, detail="Appel d'offres introuvable")
    
    appel.statut = "interesse"
    appel.date_interet = datetime.now()
    db.commit()
    
    # Événement sur l'AO
    creer_evenement(
        db=db,
        entite_type="appel_offres",
        entite_id=appel.id,
        type_evenement="interet_marque",
        titre="Intérêt marqué",
        description="Appel d'offres marqué comme intéressé",
    )
    
    # Créer ou mettre à jour le projet associé
    projet = db.query(Projet).filter(Projet.appel_offres_id == id).first()
    if not projet:
        projet = Projet(
            appel_offres_id=id,
            nom=payload.get("nom") or appel.objet[:100],
            origine="appel_offres",
            url_avis=appel.url_avis,
            statut="interesse",
            workflow_state="opportunite",
        )
        db.add(projet)
        db.commit()
        db.refresh(projet)
        
        creer_evenement(
            db=db,
            entite_type="opportunite",
            entite_id=projet.id,
            type_evenement="creation",
            titre="Opportunité créée",
            description=f"Depuis AO: {appel.reference}",
        )
    else:
        projet.statut = "interesse"
        projet.workflow_state = "opportunite"
        db.commit()
        
        creer_evenement(
            db=db,
            entite_type="opportunite",
            entite_id=projet.id,
            type_evenement="statut_change",
            titre="Statut changé",
            description="Réactivé comme opportunité",
        )
    
    return projet
```

## 5. SCHÉMAS PYDANTIC

### `app/schemas/evenement.py` (NOUVEAU)

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class EvenementBase(BaseModel):
    entite_type: str
    entite_id: int
    type_evenement: str
    titre: str
    description: Optional[str] = None
    utilisateur_id: Optional[int] = None
    utilisateur_nom: Optional[str] = None
    donnees_changees: Optional[Dict[str, Any]] = None

class EvenementRead(EvenementBase):
    id: int
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    date_creation: datetime
    
    class Config:
        from_attributes = True
```

### `app/schemas/projet.py` (MODIFIÉ)

```python
class ProjetCreate(BaseModel):
    appel_offres_id: Optional[int] = None
    origine: str = "manuel"
    url_avis: Optional[str] = None
    nom: str
    client: Optional[str] = None
    lieu: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[float] = None
    budget_engage: Optional[float] = 0
    debut: Optional[date] = None
    fin: Optional[date] = None
    chef: Optional[str] = None
    chef_id: Optional[int] = None
    workflow_state: str = "opportunite"  # NOUVEAU
    statut: str = "interesse"
    date_soumission: Optional[date] = None
    contrat_principal_id: Optional[int] = None

class ProjetUpdate(BaseModel):
    nom: Optional[str] = None
    client: Optional[str] = None
    lieu: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[float] = None
    budget_engage: Optional[float] = None
    debut: Optional[date] = None
    fin: Optional[date] = None
    chef: Optional[str] = None
    chef_id: Optional[int] = None
    workflow_state: Optional[str] = None  # NOUVEAU
    statut: Optional[str] = None
    date_soumission: Optional[date] = None
    contrat_principal_id: Optional[int] = None

class ProjetRead(BaseModel):
    id: int
    appel_offres_id: Optional[int] = None
    origine: str
    url_avis: Optional[str] = None
    nom: str
    client: Optional[str] = None
    lieu: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[float] = None
    budget_engage: Optional[float] = None
    debut: Optional[date] = None
    fin: Optional[date] = None
    chef: Optional[str] = None
    chef_id: Optional[int] = None
    workflow_state: str  # NOUVEAU
    statut: str
    date_soumission: Optional[date] = None
    date_conversion: Optional[datetime] = None  # NOUVEAU
    contrat_principal_id: Optional[int] = None
    date_creation: datetime
    
    class Config:
        from_attributes = True
```

## 6. MIGRATION INTELLIGENTE DES DONNÉES

### Script de migration AO → Opportunité

```python
def migrer_donnees_ao_vers_opportunite(appel_offres: AppelOffres, projet: Projet, db: Session):
    """Migration intelligente des données lors de la création d'une opportunité depuis un AO"""
    
    # 1. Copier les données de base (déjà fait)
    # 2. Migrer l'analyse DCE si elle existe
    analyse_dce = db.query(AnalyseDce).filter(AnalyseDce.appel_offres_id == appel_offres.id).first()
    if analyse_dce:
        # Créer une nouvelle analyse liée au projet
        nouvelle_analyse = AnalyseDce(
            projet_id=projet.id,
            resume=analyse_dce.resume,
            mots_cles=analyse_dce.mots_cles,
            technologies_detectees=analyse_dce.technologies_detectees,
            score_recommandation=analyse_dce.score_recommandation,
            recommandations=analyse_dce.recommandations,
            # ... autres champs
        )
        db.add(nouvelle_analyse)
        
        # Événement
        creer_evenement(
            db=db,
            entite_type="opportunite",
            entite_id=projet.id,
            type_evenement="analyse_importee",
            titre="Analyse IA importée",
            description="Analyse DCE récupérée depuis l'AO d'origine",
        )
    
    # 3. Migrer le DCE si téléchargé
    if appel_offres.dce_statut == "TELECHARGE" and appel_offres.url_cps:
        dce = db.query(DCE).filter(DCE.projet_id == projet.id).first()
        if not dce:
            dce = DCE(
                projet_id=projet.id,
                objet=appel_offres.objet,
                organisme=appel_offres.organisme,
                montant_estimatif=appel_offres.montant_estimatif,
                date_limite_remise=appel_offres.date_limite_remise,
                type_procedure=appel_offres.type_procedure,
                document_nom=appel_offres.url_cps,
            )
            db.add(dce)
            
            # Événement
            creer_evenement(
                db=db,
                entite_type="opportunite",
                entite_id=projet.id,
                type_evenement="dce_importe",
                titre="DCE importé",
                description="DCE récupéré depuis l'AO d'origine",
            )
    
    # 4. Migrer les documents DCE si existants
    documents_dce = db.query(DCEDocument).filter(DCEDocument.appel_offres_id == appel_offres.id).all()
    for doc in documents_dce:
        nouveau_doc = PieceDossier(
            projet_id=projet.id,
            nom=doc.nom,
            type_piece=doc.type_piece,
            chemin=doc.chemin,
        )
        db.add(nouveau_doc)
    
    db.commit()
```

## 7. CHECKLIST D'IMPLÉMENTATION BACKEND

### Modèles
- [ ] Ajouter `workflow_state` au modèle `Projet`
- [ ] Ajouter `date_conversion` au modèle `Projet`
- [ ] Ajouter `contrat_principal_id` au modèle `Projet`
- [ ] Créer le modèle `Evenement`
- [ ] Créer le modèle `Livrable`
- [ ] Créer le modèle `Avenant`
- [ ] Ajouter `date_signature` et `date_renouvellement` au modèle `Contrat`
- [ ] Ajouter `date_interet` et `date_conversion_projet` au modèle `AppelOffres`

### Migrations
- [ ] Écrire et exécuter la migration 001 (workflow_state)
- [ ] Écrire et exécuter la migration 002 (evenements)
- [ ] Écrire et exécuter la migration 003 (livrables)
- [ ] Écrire et exécuter la migration 004 (avenants)
- [ ] Écrire et exécuter la migration 005 (contrat enrichi)
- [ ] Écrire et exécuter la migration 006 (appel_offres enrichi)

### Services
- [ ] Créer `app/services/evenement_service.py`
- [ ] Implémenter `creer_evenement()`
- [ ] Implémenter `creer_evenement_changement()`
- [ ] Implémenter `migrer_donnees_ao_vers_opportunite()`

### Routers
- [ ] Créer `app/routers/evenements.py`
- [ ] Ajouter endpoint `GET /evenements/{entite_type}/{entite_id}`
- [ ] Ajouter endpoint `GET /evenements/recent`
- [ ] Modifier `app/routers/projets.py` pour les événements automatiques
- [ ] Modifier `app/routers/contrats.py` pour les événements automatiques
- [ ] Modifier `app/routers/appel_offres.py` pour les événements automatiques
- [ ] Ajouter endpoint `POST /projets/{id}/convertir-en-projet`

### Schémas
- [ ] Créer `app/schemas/evenement.py`
- [ ] Modifier `app/schemas/projet.py` (ajouter workflow_state)
- [ ] Modifier `app/schemas/contrat.py` (ajouter dates)
- [ ] Créer `app/schemas/livrable.py`
- [ ] Créer `app/schemas/avenant.py`

### Tests
- [ ] Tester la création d'événements automatiques
- [ ] Tester la conversion opportunité → projet
- [ ] Tester la migration intelligente AO → opportunité
- [ ] Tester la timeline par entité
- [ ] Tester les événements récents pour le dashboard
