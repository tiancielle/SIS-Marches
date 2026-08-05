import sys
import traceback

print("Début du test d'import...")
sys.path.insert(0, '.')

try:
    from app.services.dce_processing.text_extractor import ExtractionResult
    print("✅ SUCCÈS: ExtractionResult importé avec succès")
    print(f"   Type: {type(ExtractionResult)}")
    print(f"   Module: {ExtractionResult.__module__}")
except Exception as e:
    print(f"❌ ERREUR: {e}")
    traceback.print_exc()

try:
    from app.services.dce_processing.text_extractor import extract_text
    print("✅ SUCCÈS: extract_text importé avec succès")
except Exception as e:
    print(f"❌ ERREUR extract_text: {e}")
    traceback.print_exc()
