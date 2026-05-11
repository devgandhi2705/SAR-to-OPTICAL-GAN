# ── Stage 1: Build React frontend ─────────────────────────────
FROM node:18-alpine AS frontend-build

WORKDIR /build

COPY Frontend/package*.json ./
RUN npm ci

COPY Frontend/ ./
RUN npm run build
# Output: /build/dist


# ── Stage 2: Python API + serve static ────────────────────────
FROM python:3.10-slim

WORKDIR /app

# Install Python dependencies
COPY Backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Flask backend
COPY Backend/ ./Backend/

# Copy trained model weights
COPY pix2pix_gen_265.pth ./

# Copy built React app from stage 1
COPY --from=frontend-build /build/dist ./Frontend/dist

# HuggingFace Spaces runs on port 7860
EXPOSE 7860

# Point Flask to the correct paths inside the container
ENV MODEL_PATH=/app/pix2pix_gen_265.pth
ENV STATIC_DIR=/app/Frontend/dist
ENV PORT=7860

CMD ["python", "Backend/app.py"]
