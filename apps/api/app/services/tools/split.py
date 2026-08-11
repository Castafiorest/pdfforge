from pathlib import Path

import pikepdf


def split_pdf(
    input_path: Path, output_dir: Path, page_spec: str, every: int | None = None
) -> list[Path]:
    """Split a PDF into multiple files.

    page_spec supports ranges like: "1-5", "1,3,7", "1-3,8-10".
    If `every` is set, splits every N pages into its own document.
    """
    with pikepdf.open(input_path) as pdf:
        total = len(pdf.pages)
        if every:
            groups = [
                list(range(i, min(i + every, total)))
                for i in range(0, total, every)
            ]
        else:
            groups = parse_page_spec(page_spec, total)

        outputs: list[Path] = []
        for idx, pages in enumerate(groups, start=1):
            out = output_dir / f"part-{idx:03d}.pdf"
            dst = pikepdf.new()
            dst.pages.extend([pdf.pages[p] for p in pages])
            dst.save(out)
            outputs.append(out)
    return outputs


def parse_page_spec(spec: str, total: int) -> list[list[int]]:
    """Parse '1-5', '1,3,7', '1-3,8-10' into groups of 0-based page indices."""
    groups: list[list[int]] = []
    for raw in (part.strip() for part in spec.split(",") if part.strip()):
        if "-" in raw:
            start_s, _, end_s = raw.partition("-")
            start, end = int(start_s), int(end_s)
            if start < 1 or end > total or start > end:
                raise ValueError(f"Invalid page range: {raw}")
            groups.append(list(range(start - 1, end)))
        else:
            page = int(raw)
            if page < 1 or page > total:
                raise ValueError(f"Page out of range: {raw}")
            groups.append([page - 1])
    if not groups:
        raise ValueError("No pages specified")
    return groups
