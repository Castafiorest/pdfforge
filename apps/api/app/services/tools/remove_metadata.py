from pathlib import Path

import pikepdf

# Metadata keys to strip (XMP handled separately).
_KEYS_TO_REMOVE = {
    "/Author",
    "/Creator",
    "/Producer",
    "/Subject",
    "/Keywords",
    "/Title",
    "/CreationDate",
    "/ModDate",
    "/Trapped",
}


def remove_metadata(input_path: Path, output_path: Path) -> int:
    """Strip document metadata while keeping page content intact."""
    with pikepdf.open(input_path) as pdf:
        for key in _KEYS_TO_REMOVE:
            if key in pdf.docinfo:
                del pdf.docinfo[key]
        if "/Metadata" in pdf.trailer.get("/Root"):
            del pdf.trailer.get("/Root")["/Metadata"]
        pdf.save(output_path, fix_metadata_version=False)
    return output_path.stat().st_size
