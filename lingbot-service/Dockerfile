# QURABIA LingBot-Map Service — Conda-based Dockerfile
# Python 3.10 with NLP and Arabic language processing capabilities

FROM continuumio/miniconda3:latest

LABEL maintainer="AZIIZALOYIBI <contact@qurabia.com>"
LABEL description="LingBot-Map: خدمة معالجة اللغة الطبيعية العربية"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Copy environment file
COPY environment.yml .

# Create conda environment
RUN conda env create -f environment.yml && \
    conda clean -afy

# Copy application code
COPY . .

# Make RUN commands use the new environment
SHELL ["conda", "run", "-n", "lingbot-map", "/bin/bash", "-c"]

# Create necessary directories
RUN mkdir -p /tmp/lingbot-cache /tmp/lingbot-models

# Set environment variables
ENV CONDA_DEFAULT_ENV=lingbot-map \
    PATH=/opt/conda/envs/lingbot-map/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    LOG_LEVEL=info \
    PORT=10001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD conda run -n lingbot-map python -c "import urllib.request; urllib.request.urlopen('http://localhost:10001/health')" || exit 1

# Expose port
EXPOSE 10001

# Run the application
CMD ["conda", "run", "--no-capture-output", "-n", "lingbot-map", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10001"]
