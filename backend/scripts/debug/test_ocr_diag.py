# test_ocr_diag.py
import traceback

for lang in ["fr", "ar"]:
    print(f"--- Test chargement PaddleOCR lang={lang} ---")
    try:
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(
            lang=lang,
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
        )
        print(f"OK : PaddleOCR({lang}) chargé avec succès.")
    except Exception:
        print(f"ÉCHEC chargement PaddleOCR({lang}) :")
        traceback.print_exc()