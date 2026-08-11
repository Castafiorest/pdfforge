# PDFForge Worker — same image as the API, different entrypoint.
# Built from the API image so Ghostscript + libs are present.
FROM pdfforge-api:latest

WORKDIR /app

# Override the entrypoint: run the worker loop instead of uvicorn.
CMD ["python", "-m", "app.workers.worker"]
