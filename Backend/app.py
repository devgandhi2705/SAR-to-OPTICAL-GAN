"""
Flask Backend for SAR Image Colorization
Connects to React Frontend
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
import numpy as np
from PIL import Image
import io

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

# Model Architecture
class DownsamplingBlock(nn.Module):
    def __init__(self, c_in, c_out, kernel_size=4, stride=2, 
                 padding=1, negative_slope=0.2, use_norm=True):
        super(DownsamplingBlock, self).__init__()
        block = []
        block += [nn.Conv2d(c_in, c_out, kernel_size, stride, padding, bias=(not use_norm))]
        if use_norm:
            block += [nn.BatchNorm2d(c_out)]
        block += [nn.LeakyReLU(negative_slope)]
        self.conv_block = nn.Sequential(*block)
        
    def forward(self, x):
        return self.conv_block(x)

class UpsamplingBlock(nn.Module):
    def __init__(self, c_in, c_out, kernel_size=4, stride=2, 
                 padding=1, use_dropout=False, use_upsampling=False, mode='nearest'):
        super(UpsamplingBlock, self).__init__()
        block = []
        if use_upsampling:
            block += [nn.Sequential(
                nn.Upsample(scale_factor=2, mode=mode),
                nn.Conv2d(c_in, c_out, 3, 1, padding, bias=False)
            )]
        else:
            block += [nn.ConvTranspose2d(c_in, c_out, kernel_size, stride, padding, bias=False)]
        
        block += [nn.BatchNorm2d(c_out)]
        if use_dropout:
            block += [nn.Dropout(0.5)]
        block += [nn.ReLU()]
        self.conv_block = nn.Sequential(*block)

    def forward(self, x):
        return self.conv_block(x)

class UnetEncoder(nn.Module):
    def __init__(self, c_in=3, c_out=512):
        super(UnetEncoder, self).__init__()
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
        super(UnetDecoder, self).__init__()
        self.dec1 = UpsamplingBlock(c_in, 512, use_dropout=True, use_upsampling=use_upsampling, mode=mode)
        self.dec2 = UpsamplingBlock(1024, 512, use_dropout=True, use_upsampling=use_upsampling, mode=mode)
        self.dec3 = UpsamplingBlock(1024, 512, use_dropout=True, use_upsampling=use_upsampling, mode=mode)
        self.dec4 = UpsamplingBlock(1024, 512, use_upsampling=use_upsampling, mode=mode)
        self.dec5 = UpsamplingBlock(1024, 256, use_upsampling=use_upsampling, mode=mode)
        self.dec6 = UpsamplingBlock(512, 128, use_upsampling=use_upsampling, mode=mode)
        self.dec7 = UpsamplingBlock(256, 64, use_upsampling=use_upsampling, mode=mode)
        self.dec8 = UpsamplingBlock(128, c_out, use_upsampling=use_upsampling, mode=mode)

    def forward(self, x):
        x9 = torch.cat([x[1], self.dec1(x[0])], 1)
        x10 = torch.cat([x[2], self.dec2(x9)], 1)
        x11 = torch.cat([x[3], self.dec3(x10)], 1)
        x12 = torch.cat([x[4], self.dec4(x11)], 1)
        x13 = torch.cat([x[5], self.dec5(x12)], 1)
        x14 = torch.cat([x[6], self.dec6(x13)], 1)
        x15 = torch.cat([x[7], self.dec7(x14)], 1)
        return self.dec8(x15)

class UnetGenerator(nn.Module):
    def __init__(self, c_in=3, c_out=3, use_upsampling=False, mode='nearest'):
        super(UnetGenerator, self).__init__()
        self.encoder = UnetEncoder(c_in=c_in)
        self.decoder = UnetDecoder(use_upsampling=use_upsampling, mode=mode)
        self.head = nn.Sequential(
            nn.Conv2d(64, c_out, 3, 1, 1, bias=True),
            nn.Tanh()
        )
    
    def forward(self, x):
        outE = self.encoder(x)
        outD = self.decoder(outE)
        return self.head(outD)

# Load model
print("Loading model...")
generator = UnetGenerator(c_in=3, c_out=3).to(device)
generator.load_state_dict(torch.load('../pix2pix_gen_265.pth', map_location=device))
generator.eval()
print("✓ Model loaded successfully!")

def preprocess_image(image):
    """Preprocess input image"""
    # Resize to 256x256
    image = image.resize((256, 256), Image.BILINEAR)
    
    # Convert to numpy array
    img_array = np.array(image).astype(np.float32) / 255.0
    
    # Ensure RGB (3 channels)
    if len(img_array.shape) == 2:
        img_array = np.stack([img_array] * 3, axis=-1)
    elif img_array.shape[2] == 4:
        img_array = img_array[:, :, :3]
    
    # Normalize to [-1, 1]
    img_array = (img_array - 0.5) / 0.5
    
    # Convert to tensor [1, C, H, W]
    img_tensor = torch.from_numpy(img_array).permute(2, 0, 1).unsqueeze(0)
    
    return img_tensor.to(device)

def postprocess_image(tensor):
    """Convert output tensor to image"""
    # Denormalize from [-1, 1] to [0, 1]
    tensor = (tensor + 1) / 2
    tensor = torch.clamp(tensor, 0, 1)
    
    # Convert to numpy [H, W, C]
    img_array = tensor.squeeze().cpu().permute(1, 2, 0).numpy()
    
    # Convert to uint8
    img_array = (img_array * 255).astype(np.uint8)
    
    return Image.fromarray(img_array)

@app.route('/')
def home():
    return jsonify({
        'status': 'online',
        'message': 'SAR Colorization API',
        'endpoints': {
            'POST /api/colorize': 'Colorize SAR image',
            'GET /health': 'Health check'
        }
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'device': str(device),
        'model_loaded': True
    })

@app.route('/api/colorize', methods=['POST'])
def colorize():
    """Colorize SAR image endpoint"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read image
        image = Image.open(file.stream).convert('RGB')
        
        # Preprocess
        input_tensor = preprocess_image(image)
        
        # Generate colorized image
        with torch.no_grad():
            output_tensor = generator(input_tensor)
        
        # Postprocess
        colorized = postprocess_image(output_tensor)
        
        # Convert to bytes
        img_io = io.BytesIO()
        colorized.save(img_io, 'PNG')
        img_io.seek(0)
        
        return send_file(img_io, mimetype='image/png')
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 SAR Colorization Backend Server")
    print("="*60)
    print(f"Device: {device}")
    print(f"Model: Loaded")
    print(f"Server: http://localhost:5000")
    print(f"API Endpoint: http://localhost:5000/api/colorize")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
