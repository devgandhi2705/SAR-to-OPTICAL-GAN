# SAR to Optical Image Translation using Pix2Pix GAN

A deep learning application that translates grayscale Synthetic Aperture Radar (SAR) images into colorized optical-style images using a Pix2Pix Generative Adversarial Network. The project includes a trained model, a Flask REST API backend, and a React frontend.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Dataset](#dataset)
- [Training](#training)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Results](#results)

---

## Overview

Synthetic Aperture Radar (SAR) sensors capture Earth surface data regardless of cloud cover or lighting conditions, but produce grayscale intensity images that are difficult to visually interpret. This project trains a **Pix2Pix GAN** to learn the mapping from SAR (Sentinel-1) images to their corresponding optical (Sentinel-2) counterparts, producing colorized outputs that are far more intuitive for analysis.

**Use cases:** Remote sensing analysis, environmental monitoring, disaster assessment, agricultural mapping.

---

## Architecture

The generator follows a **U-Net** encoder-decoder structure with skip connections. The discriminator is a PatchGAN that classifies overlapping image patches as real or fake.

### Generator — U-Net

```
Input (3×256×256)
        │
  ┌─────▼─────────────────────────────────────────────┐
  │  Encoder (8 Downsampling Blocks)                   │
  │  64 → 128 → 256 → 512 → 512 → 512 → 512 → 512    │
  └─────┬─────────────────────────────────────────────┘
        │  Bottleneck
  ┌─────▼─────────────────────────────────────────────┐
  │  Decoder (8 Upsampling Blocks) + Skip Connections  │
  │  512 → 512 → 512 → 512 → 256 → 128 → 64 → 64     │
  └─────┬─────────────────────────────────────────────┘
        │
  Conv2d + Tanh Head
        │
Output (3×256×256)
```

**Downsampling Block:** `Conv2d → BatchNorm → LeakyReLU(0.2)`  
**Upsampling Block:** `ConvTranspose2d → BatchNorm → [Dropout(0.5)] → ReLU`  
**Skip connections** concatenate encoder feature maps to decoder inputs at each level.

### Loss Function

The generator is trained with a combined loss:

```
L_total = L_GAN + λ × L_L1
```

- `L_GAN` — adversarial loss (fool the discriminator)
- `L_L1` — pixel-wise L1 loss against ground truth optical image
- `λ = 100` (weight for L1 term)

---

## Dataset

The dataset (`v_2/`) contains **32,000 paired image patches** sourced from Sentinel-1 (SAR) and Sentinel-2 (optical) satellites, organized by land cover type:

```
v_2/
├── agri/          # Agricultural land
│   ├── s1/        # SAR patches (grayscale input)
│   └── s2/        # Optical patches (RGB target)
├── barrenland/    # Barren / desert land
│   ├── s1/
│   └── s2/
├── grassland/     # Grassland / savanna
│   ├── s1/
│   └── s2/
└── urban/         # Urban areas
    ├── s1/
    └── s2/
```

- **Patch size:** 256 × 256 pixels
- **Format:** PNG
- **Normalization:** Images are normalized to `[-1, 1]` during training

---

## Training

The model was trained for **265 epochs**. Training curves are stored in `Frontend/public/images/`:

| Curve | Description |
|-------|-------------|
| Gen overall loss vs Epoch | Total generator loss (GAN + L1) |
| Gen GAN loss vs Epoch | Adversarial component of generator loss |
| L1 loss vs Epoch | Pixel-wise reconstruction loss |
| DISC loss vs Epoch | Discriminator loss |

The trained generator weights are saved as `pix2pix_gen_265.pth` (~200 MB).

---

## Project Structure

```
GAN/
├── pix2pix_gen_265.pth        # Trained generator weights (265 epochs)
├── README.md
├── .gitignore
│
├── Backend/
│   ├── app.py                 # Flask API server
│   └── requirements.txt       # Python dependencies
│
├── Frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   │   └── images/            # Training curve graphs
│   └── src/
│       ├── App.jsx            # Main React component
│       ├── App.css            # Styling
│       ├── main.jsx
│       └── index.css
│
└── v_2/                       # Dataset (gitignored)
    ├── agri/
    ├── barrenland/
    ├── grassland/
    └── urban/
```

---

## Setup & Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- (Optional) CUDA-compatible GPU for faster inference

### Backend

```bash
# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -r Backend/requirements.txt
```

### Frontend

```bash
cd Frontend
npm install
```

---

## Running the Application

### 1. Start the Backend

```bash
# From the project root, with .venv activated
cd Backend
python app.py
```

The server starts at `http://localhost:5000`. On startup it:
- Detects whether a CUDA GPU is available and uses it automatically
- Loads `pix2pix_gen_265.pth` into memory
- Logs the device and API endpoint

### 2. Start the Frontend

```bash
cd Frontend
npm run dev
```

The React app opens at `http://localhost:5173`.

### Usage

1. Open the frontend in your browser
2. Upload a SAR image (PNG, JPG, or TIFF)
3. Click **Colorize Image**
4. View the side-by-side comparison of the original SAR and the AI-generated optical output
5. Download the result with the **Download** button

---

## API Reference

### `GET /`

Returns API status and available endpoints.

### `GET /health`

```json
{
  "status": "healthy",
  "device": "cuda",
  "model_loaded": true
}
```

### `POST /api/colorize`

Colorizes a SAR image.

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | image | SAR image file (PNG / JPG / TIFF) |

**Response:** PNG image binary (`image/png`)

The endpoint resizes the input to 256×256, normalizes it to `[-1, 1]`, runs inference through the U-Net generator, denormalizes the output, and returns the colorized PNG.

**Error responses:**

| Code | Reason |
|------|--------|
| 400 | No file provided or empty filename |
| 500 | Internal inference error |

---

## Results

The model learns distinct colorization patterns per land cover class:

- **Agricultural** — green/yellow tones reflecting vegetation
- **Urban** — grey/brown tones for built-up structures
- **Grassland** — light green tones
- **Barren land** — tan/brown tones for exposed soil

Training loss curves are available in the frontend under the Model Information section.
