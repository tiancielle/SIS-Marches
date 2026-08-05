"""
Statistiques OCR pour l'instrumentation du pipeline.

Collecte et rapporte les métriques suivantes :
- Nombre total de documents traités
- Répartition par type (PDF natif, PDF scanné, DOCX)
- Nombre de pages OCRisées
- Temps d'OCR par document
- Statistiques de cache (HIT/MISS)
- Document le plus lent, le plus volumineux
"""
import logging
from dataclasses import dataclass, field
from typing import Optional
from collections import defaultdict

logger = logging.getLogger(__name__)


@dataclass
class DocumentStats:
    """Statistiques pour un document individuel."""
    file_name: str
    file_type: str  # "pdf_native", "pdf_scanned", "docx", "other"
    file_size: int  # octets
    nb_pages: int
    ocr_time: float  # secondes
    cache_hit: bool
    nb_chars: int


@dataclass
class OCRReport:
    """Rapport complet des statistiques OCR pour une analyse."""
    total_documents: int = 0
    pdf_native: int = 0
    pdf_scanned: int = 0
    docx: int = 0
    other: int = 0
    
    total_pages: int = 0
    total_ocr_time: float = 0.0
    avg_time_per_page: float = 0.0
    
    cache_hits: int = 0
    cache_misses: int = 0
    
    slowest_document: Optional[str] = None
    slowest_time: float = 0.0
    
    largest_document: Optional[str] = None
    largest_size: int = 0
    
    total_chars: int = 0
    
    # Statistiques détaillées par document
    documents: list[DocumentStats] = field(default_factory=list)


class OCRStatsCollector:
    """Collecteur de statistiques OCR pour une session d'analyse."""
    
    def __init__(self):
        self.report = OCRReport()
        self.documents: list[DocumentStats] = []
    
    def add_document(self, stats: DocumentStats) -> None:
        """Ajoute les statistiques d'un document."""
        self.documents.append(stats)
        self._update_report(stats)
    
    def _update_report(self, stats: DocumentStats) -> None:
        """Met à jour le rapport global avec les nouvelles statistiques."""
        self.report.total_documents += 1
        self.report.total_pages += stats.nb_pages
        self.report.total_ocr_time += stats.ocr_time
        self.report.total_chars += stats.nb_chars
        
        # Répartition par type
        if stats.file_type == "pdf_native":
            self.report.pdf_native += 1
        elif stats.file_type == "pdf_scanned":
            self.report.pdf_scanned += 1
        elif stats.file_type == "docx":
            self.report.docx += 1
        else:
            self.report.other += 1
        
        # Statistiques de cache
        if stats.cache_hit:
            self.report.cache_hits += 1
        else:
            self.report.cache_misses += 1
        
        # Document le plus lent
        if stats.ocr_time > self.report.slowest_time:
            self.report.slowest_time = stats.ocr_time
            self.report.slowest_document = stats.file_name
        
        # Document le plus volumineux
        if stats.file_size > self.report.largest_size:
            self.report.largest_size = stats.file_size
            self.report.largest_document = stats.file_name
        
        # Temps moyen par page
        if self.report.total_pages > 0:
            self.report.avg_time_per_page = self.report.total_ocr_time / self.report.total_pages
    
    def get_report(self) -> OCRReport:
        """Retourne le rapport complet."""
        self.report.documents = self.documents
        return self.report
    
    def print_report(self) -> None:
        """Affiche le rapport OCR dans les logs."""
        report = self.get_report()
        
        logger.info("=" * 50)
        logger.info("========== OCR REPORT ==========")
        logger.info(f"Documents : {report.total_documents}")
        logger.info(f"PDF natifs : {report.pdf_native}")
        logger.info(f"PDF scannés : {report.pdf_scanned}")
        logger.info(f"DOCX : {report.docx}")
        logger.info(f"Autres : {report.other}")
        logger.info("")
        logger.info(f"Pages OCR : {report.total_pages}")
        logger.info(f"Temps OCR : {report.total_ocr_time:.1f} s")
        logger.info(f"Temps moyen/page : {report.avg_time_per_page:.1f} s")
        logger.info(f"Caractères extraits : {report.total_chars}")
        logger.info("")
        logger.info(f"Cache HIT : {report.cache_hits}")
        logger.info(f"Cache MISS : {report.cache_misses}")
        logger.info("")
        
        if report.slowest_document:
            logger.info(f"Document le plus lent :")
            logger.info(f"  {report.slowest_document} ({report.slowest_time:.1f} s)")
        
        if report.largest_document:
            logger.info(f"Document le plus volumineux :")
            logger.info(f"  {report.largest_document} ({report.largest_size / 1024:.1f} KB)")
        
        logger.info("=" * 50)


# Instance globale pour le pipeline actuel
_current_stats: Optional[OCRStatsCollector] = None


def start_stats_collection() -> OCRStatsCollector:
    """Démarre une nouvelle session de collecte de statistiques."""
    global _current_stats
    _current_stats = OCRStatsCollector()
    return _current_stats


def get_current_stats() -> Optional[OCRStatsCollector]:
    """Retourne le collecteur de statistiques actuel."""
    return _current_stats


def end_stats_collection() -> Optional[OCRReport]:
    """Termine la collecte et retourne le rapport final."""
    global _current_stats
    if _current_stats is None:
        return None
    
    report = _current_stats.get_report()
    _current_stats.print_report()
    _current_stats = None
    return report