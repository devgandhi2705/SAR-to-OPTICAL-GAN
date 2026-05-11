---
title: SAR To Optical GAN
emoji: 🛰️
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
license: mit
app_port: 7860
---

# SAR to Optical Image Translation — Pix2Pix GAN

[![HuggingFace Space](https://img.shields.io/badge/🤗-Live%20Demo-blue)](https://huggingface.co/spaces/devgandhi2705/SAR-to-OPTICAL-GAN)
[![GitHub](https://img.shields.io/badge/GitHub-devgandhi2705-black?logo=github)](https://github.com/devgandhi2705/SAR-to-OPTICAL-GAN)

A full-stack deep learning application that translates grayscale **Synthetic Aperture Radar (SAR)** images into colorized **optical-style** imagery using a **Pix2Pix Generative Adversarial Network**. Includes a React landing page, interactive demo, and a Flask REST API backend — all containerized for HuggingFace Spaces.

---

## Live Demo

🚀 **[Try it on HuggingFace Spaces →](https://huggingface.co/spaces/devgandhi2705/SAR-to-OPTICAL-GAN)**

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Dataset](#dataset)
- [Training](#training)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [HuggingFace Spaces Deployment](#huggingface-spaces-deployment)
- [API Reference](#api-reference)
- [Results](#results)

---

## Overview

SAR sensors (Sentinel-1) capture Earth surface data through clouds and at night, but produce grayscale intensity images that are difficult to interpret visually. This project trains a **Pix2Pix GAN** to learn the mapping from SAR → optical (Sentinel-2), producing colorized outputs that are far more intuitive for analysis.

**Use cases:** Remote sensing, environmental monitoring, disaster assessment, agricultural mapping.

---

## Architecture

### Generator — U-Net

```
Input (3×256×256)
        │
  ┌─────▼────────────────────────────────────────────┐
  │  Encoder (8 Downsampling Blocks)                  │
  │  64 → 128 → 256 → 512 → 512 → 512 → 512 → 512   │
  └─────┬────────────────────────────────────────────┘
        │  Bottleneck (512 channels)
  ┌─────▼────────────────────────────────────────────┐
  │  Decoder (8 Upsampling Blocks) + Skip Connections │
  │  512 → 512 → 512 → 512 → 256 → 128 → 64 → 64    │
  └─────┬────────────────────────────────────────────┘
        │
  Conv2d + Tanh Head
        │
Output (3×256×256)
```

**Downsampling Block:** `Conv2d → BatchNorm → LeakyReLU(0.2)`  
**Upsampling Block:** `ConvTranspose2d → BatchNorm → [Dropout(0.5)] → ReLU`  
Skip connections concatenate encoder feature maps to decoder inputs at each level.

### Loss Function

```
L_total = L_GAN + λ × L_L1
```

- `L_GAN` — adversarial loss (fools the discriminator)
- `L_L1` — pixel-wise L1 loss against ground truth optical image
- `λ = 100` — weight emphasising structural fidelity

---

## Dataset

The dataset (`v_2/`) contains **32,000 paired image patches** from Sentinel-1 (SAR) and Sentinel-2 (optical) satellites across four land-cover categories:

```
v_2/
├── agri/          # Agricultural land
│   ├── s1/        # SAR patches (grayscale input)
│   └── s2/        # Optical patches (RGB target)
├── barrenland/
├── grassland/
└── urban/
```

- **Patch size:** 256 × 256 pixels · **Format:** PNG · **Normalization:** `[-1, 1]`

---

## Training

The model was trained for **265 epochs**. Training curves are in `Frontend/public/images/`:

| Curve | Description |
|-------|-------------|
| Gen overall loss vs Epoch | Total generator loss (GAN + L1) |
| Gen GAN loss vs Epoch | Adversarial component |
| L1 loss vs Epoch | Pixel-wise reconstruction loss |
| DISC loss vs Epoch | Discriminator loss |

Trained weights: `pix2pix_gen_265.pth` (~200 MB, tracked via Git LFS).

---

## Project Structure

```
GAN/
├── Dockerfile                      # HuggingFace Spaces Docker build
├── README.md                       # This file (also HF Spaces config)
├── pix2pix_gen_265.pth             # Trained generator weights (Git LFS)
│
├── Backend/
│   ├── app.py                      # Flask API + React SPA server
│   └── requirements.txt
│
└── Frontend/
    ├── package.json
    ├── vite.config.js
    ├── public/
    │   └── images/                 # Training loss curve graphs + result examples
    └── src/
        ├── App.jsx                 # React Router (Landing / Demo routes)
        ├── LandingPage.jsx         # Project landing page
        ├── Landing.css
        ├── DemoPage.jsx            # Interactive demo interface
        ├── Demo.css
        ├── Navbar.jsx              # Shared navigation bar
        ├── Navbar.css
        ├── main.jsx
        └── index.css
```

---

## Local Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- (Optional) CUDA GPU for faster inference

### 1. Backend

```bash
# From the project root
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r Backend/requirements.txt
```

### 2. Frontend

```bash
cd Frontend
npm install
```

### 3. Run locally

```bash
# Terminal 1 — start backend (from project root, venv activated)
cd Backend
python app.py          # Starts on http://localhost:7860

# Terminal 2 — start frontend dev server
cd Frontend
npm run dev            # Starts on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> In development, Vite proxies `/api/*` to the Flask backend on port 7860.  
> In production (Docker), Flask serves both the React build and the API.

---

## HuggingFace Spaces Deployment

The project is fully containerized. To deploy your own copy:

### Option A — Push to HF Spaces git repo

```bash
# 1. Create a new HF Space (Docker SDK) at huggingface.co/new-space

# 2. Clone the Space repo
git clone https://huggingface.co/spaces/<your-username>/<your-space-name>
cd <your-space-name>

# 3. Copy this project's files into the Space repo
#    (or add the Space as a second remote and push)

# 4. Push — HF will build the Dockerfile automatically
git add .
git commit -m "Deploy SAR to Optical GAN"
git push
```

### Option B — Add HF as a second remote

```bash
# From this repo
git remote add hf https://huggingface.co/spaces/<your-username>/<your-space-name>
git push hf main
```

> **Model weights:** `pix2pix_gen_265.pth` is tracked with Git LFS.  
> Ensure Git LFS is installed (`git lfs install`) before pushing.

---

## API Reference

### `GET /health`

```json
{ "status": "healthy", "device": "cpu", "model_loaded": true }
```

### `POST /api/colorize`

Translates a SAR image to optical.

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | image | SAR image (PNG / JPG / TIFF) |

**Response:** PNG image binary (`image/png`)

The endpoint resizes input to 256×256, normalizes to `[-1, 1]`, runs the U-Net generator, de-normalizes, and returns the colorized PNG.

| Code | Reason |
|------|--------|
| 400  | No file provided or empty filename |
| 500  | Inference error |

---

## Results

The model learns distinct colorization patterns per land-cover class:

- **Agricultural** — green/yellow tones reflecting vegetation
- **Urban** — grey/brown tones for built-up structures
- **Grassland** — light green tones
- **Barren land** — tan/brown tones for exposed soil

Training loss curves and example results are available in the frontend landing page.
