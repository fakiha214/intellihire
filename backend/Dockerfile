FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

COPY requirements.txt .

# Runtime libs: libgomp1 (scikit-learn/scipy), libcairo2 (pycairo for xhtml2pdf).
# Build deps (compile pycairo) are installed, used, then purged to keep the image lean.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 libcairo2 \
    && apt-get install -y --no-install-recommends build-essential pkg-config libcairo2-dev \
    && pip install --no-cache-dir -r requirements.txt \
    && apt-get purge -y --auto-remove build-essential pkg-config libcairo2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY . .

EXPOSE 5000

# app:app = the Flask `app` object in app.py (runs create_all + schema migration on import)
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "app:app", "--timeout", "120"]
