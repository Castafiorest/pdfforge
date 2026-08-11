from pathlib import Path

import pikepdf


def merge_pdfs(input_files: list[Path], output_path: Path) -> int:
    """Merge multiple PDFs into one, in the given order."""
    with pikepdf.new() as dst:
        for path in input_files:
            with pikepdf.open(path) as src:
                dst.pages.extend(src.pages)
        dst.save(output_path)
    return output_path.stat().st_size
