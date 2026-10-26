# ==============================================================================
# Stage 1: Build Frontend SPA (React + Vite)
# ==============================================================================
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Python Backend Runtime & Unified Static Serving
# ==============================================================================
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code & processed data snapshot
COPY backend/ /app/backend/
COPY data/processed/ /app/data/processed/

# Copy built frontend production assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
