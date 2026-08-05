# test_ocr_predict.py
import fitz
import traceback
from paddleocr import PaddleOCR

# Chemin vers un vrai fichier chez toi, avec r"" pour éviter les soucis d'antislash
pdf_path = r"C:\Users\nasri\OneDrive\Desktop\Projects\SIS_Marches\Avis FR.pdf"  # <- adapte le chemin exact

doc = fitz.open(pdf_path)
doc[0].get_pixmap(dpi=200).save("page_test.png")
doc.close()

ocr = PaddleOCR(
    lang="fr",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
)

try:
    result = ocr.predict("page_test.png")
    for item in result:
        print(item)
except Exception:
    print("ÉCHEC predict() :")
    traceback.print_exc()