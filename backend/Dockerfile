# QURABIA Backend - FastAPI Service
# Python 3.11 slim base image for production
FROM python:3.11-slim

# Python optimization flags
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Copy requirements files explicitly (not using wildcards to ensure Docker build context includes them)
COPY requirements.txt ./
COPY requirements-quantum-extra.txt ./

# Install core dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install optional quantum packages (non-critical, can fail)
RUN pip install --no-cache-dir -r requirements-quantum-extra.txt || true

# Copy application code
COPY . .

# Expose application port
EXPOSE 10000

# Start FastAPI with uvicorn
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]
