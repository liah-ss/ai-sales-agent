import tempfile
import unittest
from pathlib import Path

from app.services.product_detail_parser import parse_product_detail_upload


class ProductDetailParserTest(unittest.TestCase):
    def test_image_upload_becomes_image_block(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            blocks = parse_product_detail_upload(
                filename="cabinet.png",
                content_type="image/png",
                content=b"png-content",
                upload_root=Path(directory),
                public_root="/uploads/product-details",
            )

            self.assertEqual(blocks[0]["type"], "image")
            self.assertEqual(blocks[0]["name"], "cabinet.png")
            self.assertTrue(blocks[0]["url"].startswith("/uploads/product-details/"))
            self.assertEqual(len(list(Path(directory).rglob("*.png"))), 1)

    def test_pdf_upload_becomes_pdf_block(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            blocks = parse_product_detail_upload(
                filename="manual.pdf",
                content_type="application/pdf",
                content=b"%PDF-1.4 test",
                upload_root=Path(directory),
                public_root="/uploads/product-details",
            )

            self.assertEqual(blocks, [{
                "type": "pdf",
                "url": blocks[0]["url"],
                "name": "manual.pdf",
            }])

    def test_docx_upload_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, "Only PDF"):
                parse_product_detail_upload(
                    filename="details.docx",
                    content_type="application/octet-stream",
                    content=b"word-document",
                    upload_root=Path(directory),
                    public_root="/uploads/product-details",
                )


if __name__ == "__main__":
    unittest.main()
