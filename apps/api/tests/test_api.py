"""Integration tests: upload → process → download → delete."""
from fastapi.testclient import TestClient

from app.main import app
from app.workers.worker import _process_job_id


def _submit_and_process(client, tool, file_bytes, filename="doc.pdf", data=None):
    response = client.post(
        f"/api/v1/{tool}",
        files={"file": (filename, file_bytes, "application/pdf")},
        data=data or {},
    )
    assert response.status_code == 200, response.text
    job_id = response.json()["job_id"]
    _process_job_id(job_id)
    return client.get(f"/api/v1/jobs/{job_id}").json()


def test_health():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


def test_rejects_invalid_upload():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/compress",
            files={"file": ("notes.txt", b"not a pdf", "text/plain")},
        )
        assert response.status_code == 400


def test_compress_lifecycle(image_pdf):
    with TestClient(app) as client:
        status = _submit_and_process(
            client, "compress", image_pdf, data={"preset": "lossless"}
        )
        assert status["status"] == "completed"
        assert status["output_size"] and status["output_size"] > 0
        assert status["original_size"] == len(image_pdf)

        # Download works and returns a PDF.
        download = client.get(f"/api/v1/jobs/{status['id']}/download")
        assert download.status_code == 200
        assert download.content.startswith(b"%PDF-")

        # Delete works.
        deleted = client.delete(f"/api/v1/jobs/{status['id']}")
        assert deleted.status_code == 204


def test_split_lifecycle(multi_page_pdf):
    with TestClient(app) as client:
        status = _submit_and_process(
            client, "split", multi_page_pdf, data={"page_spec": "1-2"}
        )
        assert status["status"] == "completed"
        download = client.get(f"/api/v1/jobs/{status['id']}/download")
        assert download.status_code == 200


def test_merge_lifecycle(sample_pdf):
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/merge",
            files=[
                ("files", ("a.pdf", sample_pdf, "application/pdf")),
                ("files", ("b.pdf", sample_pdf, "application/pdf")),
            ],
        )
        assert response.status_code == 200
        job_id = response.json()["job_id"]
        _process_job_id(job_id)
        status = client.get(f"/api/v1/jobs/{job_id}").json()
        assert status["status"] == "completed"
        download = client.get(f"/api/v1/jobs/{job_id}/download")
        assert download.status_code == 200
        assert download.content.startswith(b"%PDF-")


def test_pdf_to_image_lifecycle(sample_pdf):
    with TestClient(app) as client:
        status = _submit_and_process(
            client,
            "pdf-to-image",
            sample_pdf,
            data={"image_format": "png", "dpi": "72"},
        )
        assert status["status"] == "completed"
        download = client.get(f"/api/v1/jobs/{status['id']}/download")
        assert download.status_code == 200
        assert download.headers["content-type"] == "application/zip"


def test_remove_metadata_lifecycle(sample_pdf):
    with TestClient(app) as client:
        status = _submit_and_process(client, "remove-metadata", sample_pdf)
        assert status["status"] == "completed"
        download = client.get(f"/api/v1/jobs/{status['id']}/download")
        assert download.status_code == 200
        assert download.content.startswith(b"%PDF-")


def test_job_not_found():
    with TestClient(app) as client:
        assert client.get("/api/v1/jobs/does-not-exist").status_code == 404
