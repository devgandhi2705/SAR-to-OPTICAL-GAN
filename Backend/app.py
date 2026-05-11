"""
Flask Backend — SAR to Optical Image Translation
Serves the React SPA and the /api/colorize inference endpoint.
"""

import os
import io
import zipfile
from flask import Flask, request, send_file, jsonify, send_from_directory
from flask_cors import CORS
import torch
import torch.nn as nn
import numpy as np
from PIL import Image

# ── Path resolution (works both locally and in Docker) ─────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH   = os.environ.get(
    'MODEL_PATH',
    os.path.join(BASE_DIR, '..', 'pix2pix_gen_265.pth')
)
STATIC_DIR   = os.environ.get(
    'STATIC_DIR',
    os.path.join(BASE_DIR, '..', 'Frontend', 'dist')
)
SAMPLES_DIR  = os.environ.get(
    'SAMPLES_DIR',
    os.path.join(BASE_DIR, '..', 'Frontend', 'public', 'samples')
)

app = Flask(__name__, static_folder=None)
CORS(app)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")


# ── Model Architecture ─────────────────────────────────────────

class DownsamplingBlock(nn.Module):
    def __init__(self, c_in, c_out, kernel_size=4, stride=2,
                 padding=1, negative_slope=0.2, use_norm=True):
        super().__init__()
        block = [nn.Conv2d(c_in, c_out, kernel_size, stride, padding,
                           bias=(not use_norm))]
        if use_norm:
            block.append(nn.BatchNorm2d(c_out))
        block.append(nn.LeakyReLU(negative_slope))
        self.conv_block = nn.Sequential(*block)

    def forward(self, x):
        return self.conv_block(x)


class UpsamplingBlock(nn.Module):
    def __init__(self, c_in, c_out, kernel_size=4, stride=2,
                 padding=1, use_dropout=False, use_upsampling=False, mode='nearest'):
        super().__init__()
        block = []
        if use_upsampling:
            block.append(nn.Sequential(
                nn.Upsample(scale_factor=2, mode=mode),
                nn.Conv2d(c_in, c_out, 3, 1, padding, bias=False)
            ))
        else:
            block.append(nn.ConvTranspose2d(c_in, c_out, kernel_size,
                                            stride, padding, bias=False))
        block.append(nn.BatchNorm2d(c_out))
        if use_dropout:
            block.append(nn.Dropout(0.5))
        block.append(nn.ReLU())
        self.conv_block = nn.Sequential(*block)

    def forward(self, x):
        return self.conv_block(x)


class UnetEncoder(nn.Module):
    def __init__(self, c_in=3, c_out=512):
        super().__init__()
        self.enc1 = DownsamplingBlock(c_in, 64, use_norm=False)
        self.enc2 = DownsamplingBlock(64, 128)
        self.enc3 = DownsamplingBlock(128, 256)
        self.enc4 = DownsamplingBlock(256, 512)
        self.enc5 = DownsamplingBlock(512, 512)
        self.enc6 = DownsamplingBlock(512, 512)
        self.enc7 = DownsamplingBlock(512, 512)
        self.enc8 = DownsamplingBlock(512, c_out)

    def forward(self, x):
        x1 = self.enc1(x)
        x2 = self.enc2(x1)
        x3 = self.enc3(x2)
        x4 = self.enc4(x3)
        x5 = self.enc5(x4)
        x6 = self.enc6(x5)
        x7 = self.enc7(x6)
        x8 = self.enc8(x7)
        return [x8, x7, x6, x5, x4, x3, x2, x1]


class UnetDecoder(nn.Module):
    def __init__(self, c_in=512, c_out=64, use_upsampling=False, mode='nearest'):
        super().__init__()
        self.dec1 = UpsamplingBlock(c_in, 512, use_dropout=True,
                                    use_upsampling=use_upsampling, mode=mode)
        self.dec2 = UpsamplingBlock(1024, 512, use_dropout=True,
                                    use_upsampling=use_upsampling, mode=mode)
        self.dec3 = UpsamplingBlock(1024, 512, use_dropout=True,
                                    use_upsampling=use_upsampling, mode=mode)
        self.dec4 = UpsamplingBlock(1024, 512, use_upsampling=use_upsampling, mode=mode)
        self.dec5 = UpsamplingBlock(1024, 256, use_upsampling=use_upsampling, mode=mode)
        self.dec6 = UpsamplingBlock(512, 128,  use_upsampling=use_upsampling, mode=mode)
        self.dec7 = UpsamplingBlock(256, 64,   use_upsampling=use_upsampling, mode=mode)
        self.dec8 = UpsamplingBlock(128, c_out, use_upsampling=use_upsampling, mode=mode)

    def forward(self, x):
        x9  = torch.cat([x[1], self.dec1(x[0])], 1)
        x10 = torch.cat([x[2], self.dec2(x9)],  1)
        x11 = torch.cat([x[3], self.dec3(x10)], 1)
        x12 = torch.cat([x[4], self.dec4(x11)], 1)
        x13 = torch.cat([x[5], self.dec5(x12)], 1)
        x14 = torch.cat([x[6], self.dec6(x13)], 1)
        x15 = torch.cat([x[7], self.dec7(x14)], 1)
        return self.dec8(x15)


class UnetGenerator(nn.Module):
    def __init__(self, c_in=3, c_out=3, use_upsampling=False, mode='nearest'):
        super().__init__()
        self.encoder = UnetEncoder(c_in=c_in)
        self.decoder = UnetDecoder(use_upsampling=use_upsampling, mode=mode)
        self.head = nn.Sequential(
            nn.Conv2d(64, c_out, 3, 1, 1, bias=True),
            nn.Tanh()
        )

    def forward(self, x):
        return self.head(self.decoder(self.encoder(x)))


# ── Load model ─────────────────────────────────────────────────
print("Loading model…")
generator = UnetGenerator(c_in=3, c_out=3).to(device)
generator.load_state_dict(torch.load(MODEL_PATH, map_location=device))
generator.eval()
print("✓ Model loaded successfully!")


# ── Image helpers ───────────────────────────────────────────────

def preprocess_image(image: Image.Image) -> torch.Tensor:
    image = image.resize((256, 256), Image.BILINEAR)
    arr   = np.array(image).astype(np.float32) / 255.0
    if arr.ndim == 2:
        arr = np.stack([arr] * 3, axis=-1)
    elif arr.shape[2] == 4:
        arr = arr[:, :, :3]
    arr = (arr - 0.5) / 0.5
    return torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).to(device)


def postprocess_image(tensor: torch.Tensor) -> Image.Image:
    tensor = torch.clamp((tensor + 1) / 2, 0, 1)
    arr    = tensor.squeeze().cpu().permute(1, 2, 0).numpy()
    return Image.fromarray((arr * 255).astype(np.uint8))


# ── API routes (defined before the SPA catch-all) ──────────────

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'device': str(device), 'model_loaded': True})


@app.route('/api/colorize', methods=['POST'])
def colorize():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        image   = Image.open(file.stream).convert('RGB')
        tensor  = preprocess_image(image)
        with torch.no_grad():
            output = generator(tensor)
        result  = postprocess_image(output)

        buf = io.BytesIO()
        result.save(buf, 'PNG')
        buf.seek(0)
        return send_file(buf, mimetype='image/png')

    except Exception as exc:
        print(f"Inference error: {exc}")
        return jsonify({'error': str(exc)}), 500


# ── Download: sample images (20 patches, ~1 MB) ────────────────

@app.route('/api/download-samples')
def download_samples():
    if not os.path.exists(SAMPLES_DIR):
        return jsonify({'error': 'Sample images not found on this deployment'}), 404

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(SAMPLES_DIR):
            for fname in sorted(files):
                if not fname.lower().endswith('.png'):
                    continue
                fpath   = os.path.join(root, fname)
                arcname = os.path.relpath(fpath, SAMPLES_DIR)
                zf.write(fpath, arcname)
    buf.seek(0)
    return send_file(
        buf,
        mimetype='application/zip',
        as_attachment=True,
        download_name='SAR_sample_images.zip'
    )


# ── React SPA — serves index.html for all non-API paths ────────

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    full = os.path.join(STATIC_DIR, path)
    if path and os.path.exists(full):
        return send_from_directory(STATIC_DIR, path)
    return send_from_directory(STATIC_DIR, 'index.html')


# ── Entry point ─────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7860))
    print("\n" + "=" * 60)
    print("  SAR to Optical GAN — Backend Server")
    print("=" * 60)
    print(f"  Device  : {device}")
    print(f"  Model   : {MODEL_PATH}")
    print(f"  Static  : {STATIC_DIR}")
    print(f"  Port    : {port}")
    print("=" * 60 + "\n")
    app.run(host='0.0.0.0', port=port, debug=False)
