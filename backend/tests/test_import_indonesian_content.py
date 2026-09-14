from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

from import_indonesian_content import assurance_items, pairs, parse_challenges


def test_parse_challenges_supports_inline_and_split_word_layouts() -> None:
    values = [
        "Tantangan: Kapasitas terbatas.\nSolusi: Gunakan managed charging.",
        "b. Tantangan",
        "Kelembapan tinggi.",
        "Solusi:",
        "Gunakan panel IP65.",
        "c. Tantangan",
        "Pemantauan masih manual.",
        "Solusi: Tambahkan pemantauan jarak jauh.",
    ]

    assert parse_challenges(values) == [
        {"challenge": "Kapasitas terbatas.", "solution": "Gunakan managed charging."},
        {"challenge": "Kelembapan tinggi.", "solution": "Gunakan panel IP65."},
        {"challenge": "Pemantauan masih manual.", "solution": "Tambahkan pemantauan jarak jauh."},
    ]


def test_product_line_fields_keep_colons_inside_values() -> None:
    value = "Model: GEN-4\nCatatan: Tegangan: 400 V"

    assert pairs(value) == [
        {"label": "Model", "value": "GEN-4"},
        {"label": "Catatan", "value": "Tegangan: 400 V"},
    ]
    assert assurance_items("Garansi: 12 bulan\nDukungan kustomisasi") == [
        {"duration": "", "title": "Garansi", "copy": "12 bulan"},
        {"duration": "", "title": "Dukungan kustomisasi", "copy": ""},
    ]
