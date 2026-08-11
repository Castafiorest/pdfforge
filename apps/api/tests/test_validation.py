from app.services.file_validation import validate_pdf


def test_rejects_plain_text():
    result = validate_pdf(b"this is definitely not a pdf")
    assert not result.ok
    assert result.error is not None


def test_rejects_tiny_file():
    result = validate_pdf(b"%PDF-1.4")
    assert not result.ok


def test_accepts_valid_pdf(sample_pdf):
    result = validate_pdf(sample_pdf)
    assert result.ok
    assert result.page_count == 1
    assert result.size == len(sample_pdf)


def test_accepts_multi_page(multi_page_pdf):
    result = validate_pdf(multi_page_pdf)
    assert result.ok
    assert result.page_count == 4
