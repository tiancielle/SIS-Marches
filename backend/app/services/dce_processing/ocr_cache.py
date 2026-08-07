"""
Cache OCR persistant pour éviter de retraiter les mêmes documents.

Principe :
- Calculer un hash SHA256 du fichier source
- Sauvegarder le texte extrait avec ce hash comme clé
- Réutiliser le texte si le même fichier est traité à nouveau

L'objectif est qu'un même CPS ne soit OCRisé qu'une seule fois.

Métadonnées du cache :
- hash du fichier source
- version du pipeline OCR
- date de création
- taille du fichier source
- nombre de pages
- temps d'OCR original
"""
import hashlib
import json
import logging
import os
import time
from typing import Optional, Tuple

from app.core.config import settings

logger = logging.getLogger(__name__)

# Version du pipeline OCR pour invalider automatiquement les caches obsolètes
OCR_PIPELINE_VERSION = "1.0"


def _get_file_hash(file_path: str) -> str:
    """Calcule le hash SHA256 d'un fichier."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def _get_file_size(file_path: str) -> int:
    """Retourne la taille du fichier en octets."""
    return os.path.getsize(file_path)


def _get_cache_dir() -> str:
    """Retourne le répertoire du cache OCR."""
    cache_dir = os.path.join(settings.dce_extracted_storage_path, "ocr_cache")
    os.makedirs(cache_dir, exist_ok=True)
    return cache_dir


def _get_cache_path(file_hash: str) -> str:
    """Retourne le chemin du fichier cache pour un hash donné."""
    cache_dir = _get_cache_dir()
    return os.path.join(cache_dir, f"{file_hash}.json")


def _read_cache_metadata(file_hash: str) -> Optional[dict]:
    """Lit les métadonnées du cache depuis un fichier JSON."""
    cache_path = _get_cache_path(file_hash)
    if not os.path.exists(cache_path):
        return None
    
    try:
        with open(cache_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except (json.JSONDecodeError, KeyError) as exc:
        logger.warning(f"[CACHE] Cache corrompu pour hash {file_hash[:8]}... : {exc}")
        return None


def _write_cache_metadata(file_hash: str, metadata: dict) -> None:
    """Écrit les métadonnées du cache dans un fichier JSON."""
    cache_path = _get_cache_path(file_hash)
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    logger.info(f"[CACHE] Métadonnées écrites pour hash {file_hash[:8]}... : {cache_path}")


def get_cached_ocr_result(file_path: str) -> Tuple[Optional[str], Optional[float], Optional[dict]]:
    """
    Vérifie si le résultat OCR existe déjà dans le cache.
    
    Returns:
        (content, time_saved, metadata) - content est le texte extrait si cache HIT, None sinon
        time_saved est le temps économisé en secondes, None si cache MISS
        metadata contient les informations du cache
    """
    logger.info(f"[CACHE] Début get_cached_ocr_result pour {os.path.basename(file_path)}")
    
    try:
        file_hash = _get_file_hash(file_path)
        logger.info(f"[CACHE] Hash calculé : {file_hash[:8]}...")
        
        cache_path = _get_cache_path(file_hash)
        logger.info(f"[CACHE] Chemin cache : {cache_path}")
        
        cached_data = _read_cache_metadata(file_hash)
        
        if cached_data is not None:
            logger.info(f"[CACHE] Données cache trouvées")
            
            # Vérifier que la version du pipeline est compatible
            if cached_data.get("pipeline_version") != OCR_PIPELINE_VERSION:
                logger.info(f"[CACHE] Cache obsolète (version {cached_data.get('pipeline_version')} vs {OCR_PIPELINE_VERSION}) pour {os.path.basename(file_path)}")
                return None, None, None
            
            # Vérifier que le fichier source n'a pas changé
            current_size = _get_file_size(file_path)
            if cached_data.get("file_size") != current_size:
                logger.info(f"[CACHE] Fichier modifié (taille {cached_data.get('file_size')} vs {current_size}) pour {os.path.basename(file_path)}")
                return None, None, None
            
            # Vérifier que le contenu n'est pas vide
            content = cached_data.get("content", "")
            if not content or len(content.strip()) == 0:
                logger.warning(f"[CACHE] Cache vide pour {os.path.basename(file_path)}")
                return None, None, None
            
            # Calculer le temps économisé
            original_ocr_time = cached_data.get("ocr_time", 0)
            time_saved = original_ocr_time if original_ocr_time > 0 else None
            
            logger.info(f"[CACHE] HIT pour {os.path.basename(file_path)} (hash: {file_hash[:8]}...)")
            if time_saved is not None:
                logger.info(f"[CACHE] Temps économisé : {time_saved:.1f}s si temps_original={original_ocr_time:.1f}s")
            else:
                logger.info(f"[CACHE] Temps économisé : inconnu (temps_original={original_ocr_time:.1f}s)")
            return content, time_saved, cached_data
        
        logger.info(f"[CACHE] Aucune donnée cache trouvée")
        logger.info(f"[CACHE] MISS pour {os.path.basename(file_path)} (hash: {file_hash[:8]}...)")
        return None, None, None
        
    except Exception as exc:
        logger.error(f"[CACHE] ERREUR lors de get_cached_ocr_result : {exc}")
        import traceback
        logger.error(f"[CACHE] Traceback : {traceback.format_exc()}")
        return None, None, None


def save_ocr_result(file_path: str, content: str, ocr_time: float, nb_pages: int) -> None:
    """
    Sauvegarde le résultat OCR dans le cache avec métadonnées.
    
    Args:
        file_path: Chemin du fichier source
        content: Texte extrait par OCR
        ocr_time: Temps d'OCR en secondes
        nb_pages: Nombre de pages OCRisées
    """
    logger.info(f"[CACHE] Début save_ocr_result pour {os.path.basename(file_path)}")
    
    if not content or len(content.strip()) == 0:
        logger.warning(f"[CACHE] Refus d'enregistrer un cache vide pour {os.path.basename(file_path)}")
        return
    
    try:
        file_hash = _get_file_hash(file_path)
        logger.info(f"[CACHE] Hash calculé : {file_hash[:8]}...")
        
        file_size = _get_file_size(file_path)
        logger.info(f"[CACHE] Taille fichier : {file_size} octets")
        
        cache_dir = _get_cache_dir()
        logger.info(f"[CACHE] Répertoire cache : {cache_dir}")
        
        metadata = {
            "file_hash": file_hash,
            "file_name": os.path.basename(file_path),
            "file_size": file_size,
            "pipeline_version": OCR_PIPELINE_VERSION,
            "created_at": time.time(),
            "created_at_iso": time.strftime("%Y-%m-%d %H:%M:%S"),
            "content": content,
            "ocr_time": ocr_time,
            "nb_pages": nb_pages,
        }
        
        logger.info(f"[CACHE] Appel de _write_cache_metadata")
        _write_cache_metadata(file_hash, metadata)
        logger.info(f"[CACHE] Résultat OCR sauvegardé pour {os.path.basename(file_path)} (hash: {file_hash[:8]}...)")
        
        # Vérifier que le fichier a bien été créé
        cache_path = _get_cache_path(file_hash)
        if os.path.exists(cache_path):
            cache_size = os.path.getsize(cache_path)
            logger.info(f"[CACHE] Fichier cache créé : {cache_path} ({cache_size} octets)")
        else:
            logger.error(f"[CACHE] ERREUR : Fichier cache non créé après sauvegarde : {cache_path}")
            
    except Exception as exc:
        logger.error(f"[CACHE] ERREUR lors de save_ocr_result : {exc}")
        import traceback
        logger.error(f"[CACHE] Traceback : {traceback.format_exc()}")


def clear_cache_for_file(file_path: str) -> bool:
    """
    Supprime uniquement le cache d'un document spécifique.
    
    Returns:
        True si le cache a été supprimé, False sinon
    """
    file_hash = _get_file_hash(file_path)
    cache_path = _get_cache_path(file_hash)
    
    if os.path.exists(cache_path):
        os.remove(cache_path)
        logger.info(f"[CACHE] Cache supprimé pour {os.path.basename(file_path)} (hash: {file_hash[:8]}...)")
        return True
    
    logger.info(f"[CACHE] Aucun cache à supprimer pour {os.path.basename(file_path)}")
    return False


def clear_cache() -> int:
    """
    Supprime tous les fichiers du cache OCR.
    
    Returns:
        Nombre de fichiers supprimés
    """
    cache_dir = _get_cache_dir()
    if not os.path.exists(cache_dir):
        return 0
    
    count = 0
    for filename in os.listdir(cache_dir):
        if filename.endswith(".json"):
            file_path = os.path.join(cache_dir, filename)
            os.remove(file_path)
            count += 1
    
    logger.info(f"[CACHE] Cache nettoyé : {count} fichiers supprimés")
    return count


def get_cache_stats() -> dict:
    """
    Retourne des statistiques sur le cache OCR.
    
    Returns:
        Dictionnaire avec : nb_files, total_size, oldest_file, newest_file, pipeline_version
    """
    cache_dir = _get_cache_dir()
    if not os.path.exists(cache_dir):
        return {"nb_files": 0, "total_size": 0, "oldest_file": None, "newest_file": None, "pipeline_version": OCR_PIPELINE_VERSION}
    
    files = [f for f in os.listdir(cache_dir) if f.endswith(".json")]
    if not files:
        return {"nb_files": 0, "total_size": 0, "oldest_file": None, "newest_file": None, "pipeline_version": OCR_PIPELINE_VERSION}
    
    total_size = sum(os.path.getsize(os.path.join(cache_dir, f)) for f in files)
    
    import datetime
    timestamps = [
        os.path.getmtime(os.path.join(cache_dir, f))
        for f in files
    ]
    oldest = min(timestamps)
    newest = max(timestamps)
    
    return {
        "nb_files": len(files),
        "total_size": total_size,
        "oldest_file": datetime.datetime.fromtimestamp(oldest).isoformat(),
        "newest_file": datetime.datetime.fromtimestamp(newest).isoformat(),
        "pipeline_version": OCR_PIPELINE_VERSION,
    }
