import logging
import shutil
import subprocess
from pathlib import Path

import pikepdf

logger = logging.getLogger(__name__)

# ── Compression presets ─────────────────────────────────────────────────
# Lossless:  object-level optimization only (no visual change).
# Balanced:  Ghostscript image downsampling — text stays selectable.
# Maximum:   aggressive downsampling + lower JPEG quality.
#
# Values are starting points; tune them after running the benchmark corpus.

LOSSY_PRESETS: dict[str, dict] = {
    "balanced": {"dpi": 150, "jpeg_quality": 80},
    "maximum": {"dpi": 96, "jpeg_quality": 55},
}

_GS_CACHE: bool | None = None


def ghostscript_available() -> bool:
    """Detect a Ghostscript binary on PATH (cached)."""
    global _GS_CACHE
    if _GS_CACHE is None:
        _GS_CACHE = shutil.which("gs") is not None or shutil.which("gswin64c") is not None
    return _GS_CACHE


def _gs_binary() -> str:
    return "gs" if shutil.which("gs") else "gswin64c"


def compress_lossless(input_path: Path, output_path: Path) -> int:
    """Optimize the PDF object structure without visual changes."""
    with pikepdf.open(input_path) as pdf:
        pdf.remove_unreferenced_resources()
        pdf.save(
            output_path,
            compress_streams=True,
            object_stream_mode=pikepdf.ObjectStreamMode.generate,
            preserve_pdfa=False,
        )
    return output_path.stat().st_size


def compress_with_ghostscript(
    input_path: Path, output_path: Path, dpi: int, jpeg_quality: int
) -> int:
    """Downsample embedded images via Ghostscript. Text remains selectable."""
    cmd = [
        _gs_binary(),
        "-dSAFER",  # sandbox: no file read/write outside the specified files
        "-dBATCH",
        "-dNOPAUSE",
        "-dQUIET",
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.5",
        "-dEmbedAllFonts=true",
        "-dSubsetFonts=true",
        "-dCompressFonts=true",
        "-dDetectDuplicateImages=true",
        "-dDownsampleColorImages=true",
        "-dDownsampleGrayImages=true",
        "-dDownsampleMonoImages=true",
        f"-dColorImageResolution={dpi}",
        f"-dGrayImageResolution={dpi}",
        f"-dMonoImageResolution={dpi}",
        f"-dJPEGQ={jpeg_quality}",
        f"-sOutputFile={output_path}",
        str(input_path),
    ]
    result = subprocess.run(
        cmd, capture_output=True, text=True, timeout=600, check=False
    )
    if result.returncode != 0:
        raise RuntimeError(f"Ghostscript failed: {(result.stderr or result.stdout)[:500]}")
    return output_path.stat().st_size


def compress(input_path: Path, output_path: Path, preset: str) -> int:
    """Compress a PDF according to a preset. Returns output size in bytes."""
    preset = (preset or "balanced").lower()
    if preset == "lossless":
        return compress_lossless(input_path, output_path)
    if preset in LOSSY_PRESETS:
        if not ghostscript_available():
            # Degrade gracefully when Ghostscript is missing (e.g. dev box).
            logger.warning(
                "Ghostscript not found; using lossless path for preset '%s'.", preset
            )
            return compress_lossless(input_path, output_path)
        p = LOSSY_PRESETS[preset]
        return compress_with_ghostscript(input_path, output_path, p["dpi"], p["jpeg_quality"])
    raise ValueError(f"Unknown compression preset: {preset}")
