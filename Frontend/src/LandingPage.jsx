import { Link } from 'react-router-dom'
import Navbar from './Navbar'
import './Landing.css'

function LandingPage() {
  return (
    <div className="landing">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg-glow" />
        <div className="hero-content">
          <div className="hero-badge">Deep Learning · Remote Sensing · GAN</div>
          <h1 className="hero-title">
            SAR to Optical
            <br />
            <span className="gradient-text">Image Translation</span>
          </h1>
          <p className="hero-subtitle">
            Transforming grayscale Sentinel-1 radar imagery into colorized
            optical representations using a Pix2Pix Generative Adversarial Network
            — enabling intuitive visual analysis of Earth's surface in any weather.
          </p>
          <div className="hero-actions">
            <Link to="/demo" className="btn-primary">
              🚀 Try Live Demo
            </Link>
            <a
              href="https://github.com/devgandhi2705/SAR-to-OPTICAL-GAN"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              ⭐ View on GitHub
            </a>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="orbit-outer" />
          <div className="orbit-inner" />
          <div className="satellite-icon">🛰️</div>
          <div className="orbit-dot orbit-dot-1" />
          <div className="orbit-dot orbit-dot-2" />
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────── */}
      <section className="stats-bar">
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-num">32K</span>
            <span className="stat-desc">Training Pairs</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-card">
            <span className="stat-num">265</span>
            <span className="stat-desc">Training Epochs</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-card">
            <span className="stat-num">4</span>
            <span className="stat-desc">Land Cover Types</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-card">
            <span className="stat-num">256²</span>
            <span className="stat-desc">Patch Resolution</span>
          </div>
        </div>
      </section>

      {/* ── ABOUT / PROBLEM ──────────────────────────────── */}
      <section className="section about-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Problem Statement</span>
            <h2>Why SAR-to-Optical Translation?</h2>
          </div>
          <div className="about-grid">
            <div className="about-card sar-card">
              <div className="about-icon">📡</div>
              <h3>SAR Imagery</h3>
              <p>
                Synthetic Aperture Radar sensors penetrate clouds and operate
                day &amp; night, but produce intensity images that are difficult
                to interpret without specialist training.
              </p>
              <ul className="about-list">
                <li className="pro">✓ All-weather capability</li>
                <li className="pro">✓ Day &amp; night operation</li>
                <li className="con">✗ Grayscale only</li>
                <li className="con">✗ Hard to visually interpret</li>
              </ul>
            </div>

            <div className="about-arrow-col">
              <div className="arrow-icon">⚡</div>
              <div className="arrow-label">AI Translation</div>
              <div className="arrow-body">↓</div>
            </div>

            <div className="about-card optical-card">
              <div className="about-icon">🌍</div>
              <h3>Optical Output</h3>
              <p>
                Our Pix2Pix GAN learns the SAR → optical mapping from 32 000
                paired satellite patches, producing colorized output that
                anyone can interpret instantly.
              </p>
              <ul className="about-list">
                <li className="pro">✓ Full RGB color</li>
                <li className="pro">✓ Intuitive interpretation</li>
                <li className="pro">✓ Land-cover visualization</li>
                <li className="pro">✓ No cloud limitations</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="section how-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Pipeline</span>
            <h2>How It Works</h2>
          </div>
          <div className="steps-row">
            <div className="step-card">
              <div className="step-num">01</div>
              <div className="step-icon">📤</div>
              <h3>Upload SAR Image</h3>
              <p>Provide a Sentinel-1 SAR image or any grayscale radar image (PNG / JPG / TIFF).</p>
            </div>
            <div className="step-connector" />
            <div className="step-card">
              <div className="step-num">02</div>
              <div className="step-icon">🧠</div>
              <h3>AI Inference</h3>
              <p>The U-Net generator processes the image through 8 encoder + 8 decoder blocks with skip connections.</p>
            </div>
            <div className="step-connector" />
            <div className="step-card">
              <div className="step-num">03</div>
              <div className="step-icon">🌈</div>
              <h3>Colorized Output</h3>
              <p>Download the optical-style colorized result, ready for analysis and visualization.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE ─────────────────────────────────── */}
      <section className="section arch-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Model Architecture</span>
            <h2>Pix2Pix GAN</h2>
          </div>
          <div className="arch-grid">
            {/* Generator */}
            <div className="arch-card">
              <h3>🏗️ U-Net Generator</h3>
              <p className="arch-desc">
                Encoder-decoder with skip connections that preserve high-frequency
                spatial details at every resolution level.
              </p>
              <div className="arch-flow-wrap">
                <div className="arch-flow">
                  <div className="arch-node pink-node">Input<br />3×256×256</div>
                  <span className="arch-arrow-sym">→</span>
                  <div className="arch-node blue-node">Encoder<br />8 blocks<br />64→512</div>
                  <span className="arch-arrow-sym">→</span>
                  <div className="arch-node purple-node">Bottleneck<br />512 ch</div>
                  <span className="arch-arrow-sym">→</span>
                  <div className="arch-node blue-node">Decoder<br />8 blocks<br />512→64</div>
                  <span className="arch-arrow-sym">→</span>
                  <div className="arch-node pink-node">Output<br />3×256×256</div>
                </div>
                <div className="skip-label">⟵ Skip Connections at every level ⟶</div>
              </div>
              <div className="arch-tags">
                <span className="arch-tag">Conv2d</span>
                <span className="arch-tag">BatchNorm</span>
                <span className="arch-tag">LeakyReLU(0.2)</span>
                <span className="arch-tag">ConvTranspose2d</span>
                <span className="arch-tag">Dropout(0.5)</span>
                <span className="arch-tag">Tanh</span>
              </div>
            </div>

            {/* Discriminator + Loss */}
            <div className="arch-card">
              <h3>🔍 PatchGAN Discriminator</h3>
              <p className="arch-desc">
                Classifies overlapping 70×70 image patches as real or generated,
                enforcing local texture consistency.
              </p>
              <div className="loss-box">
                <div className="loss-title">Combined Loss Function</div>
                <div className="loss-formula">
                  L<sub>total</sub> = L<sub>GAN</sub> + λ · L<sub>L1</sub>
                </div>
                <div className="loss-legend">
                  <div className="loss-row">
                    <span className="loss-sym">L<sub>GAN</sub></span>
                    <span className="loss-def">Adversarial loss — fools the discriminator</span>
                  </div>
                  <div className="loss-row">
                    <span className="loss-sym">L<sub>L1</sub></span>
                    <span className="loss-def">Pixel-wise reconstruction against ground truth</span>
                  </div>
                  <div className="loss-row">
                    <span className="loss-sym">λ = 100</span>
                    <span className="loss-def">Weight emphasising structural fidelity</span>
                  </div>
                </div>
              </div>
              <div className="arch-tags">
                <span className="arch-tag">Conv2d</span>
                <span className="arch-tag">BatchNorm</span>
                <span className="arch-tag">LeakyReLU(0.2)</span>
                <span className="arch-tag">PatchGAN</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DATASET ──────────────────────────────────────── */}
      <section className="section dataset-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Training Data</span>
            <h2>Dataset</h2>
            <p className="section-subtitle">
              32 000 paired 256×256 patches from Sentinel-1 (SAR) and Sentinel-2 (Optical)
              satellites across four land-cover categories.
            </p>
          </div>
          <div className="dataset-grid">
            <div className="dataset-card agri-card">
              <div className="ds-icon">🌾</div>
              <h4>Agricultural</h4>
              <p>Farmland and crop fields with seasonal variation patterns</p>
            </div>
            <div className="dataset-card urban-card">
              <div className="ds-icon">🏙️</div>
              <h4>Urban</h4>
              <p>Cities, infrastructure and built-up areas</p>
            </div>
            <div className="dataset-card grass-card">
              <div className="ds-icon">🌿</div>
              <h4>Grassland</h4>
              <p>Open grasslands and savanna regions</p>
            </div>
            <div className="dataset-card barren-card">
              <div className="ds-icon">🏜️</div>
              <h4>Barren Land</h4>
              <p>Desert and exposed-soil landscapes</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD RESOURCES ───────────────────────────── */}
      <section className="section download-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Open Data</span>
            <h2>Download Resources</h2>
            <p className="section-subtitle">
              Explore the data behind the model — sample images for quick testing or the full dataset for research.
            </p>
          </div>
          <div className="download-grid">

            {/* Sample images card */}
            <div className="dl-card dl-card-samples">
              <div className="dl-card-top">
                <span className="dl-icon">🗂️</span>
                <div>
                  <h3>Sample Images</h3>
                  <p className="dl-meta">20 SAR patches · 4 categories · ~1 MB</p>
                </div>
              </div>
              <p className="dl-desc">
                20 curated SAR image patches (5 per land-cover type) from the Sentinel-1 dataset.
                Perfect for quickly testing the demo without needing your own data.
              </p>
              <div className="dl-tags">
                <span className="dl-tag">🌾 Agricultural × 5</span>
                <span className="dl-tag">🏜️ Barren Land × 5</span>
                <span className="dl-tag">🌿 Grassland × 5</span>
                <span className="dl-tag">🏙️ Urban × 5</span>
              </div>
              <div className="dl-actions">
                <a href="/api/download-samples" className="dl-btn dl-btn-primary" download>
                  ⬇️ Download ZIP (~1 MB)
                </a>
                <a href="/demo" className="dl-btn dl-btn-secondary">
                  🚀 Use in Demo
                </a>
              </div>
            </div>

            {/* Complete dataset card */}
            <div className="dl-card dl-card-full">
              <div className="dl-card-top">
                <span className="dl-icon">🗄️</span>
                <div>
                  <h3>Complete Dataset</h3>
                  <p className="dl-meta">16 000 SAR patches · 4 categories · ~745 MB</p>
                </div>
              </div>
              <p className="dl-desc">
                The full training corpus — 4 000 Sentinel-1 SAR patches per land-cover class,
                paired with their Sentinel-2 optical counterparts. Ideal for reproducing results
                or fine-tuning the model.
              </p>
              <div className="dl-tags">
                <span className="dl-tag">16 000 SAR images</span>
                <span className="dl-tag">256 × 256 px</span>
                <span className="dl-tag">PNG format</span>
                <span className="dl-tag">Sentinel-1 / Fall 1970</span>
              </div>
              <div className="dl-actions">
                <a
                  href="https://www.kaggle.com/datasets/requiemonk/sentinel12-image-pairs-segregated-by-terrain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dl-btn dl-btn-primary"
                >
                  ⬇️ Download on Kaggle
                </a>
                <a
                  href="https://github.com/devgandhi2705/SAR-to-OPTICAL-GAN"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dl-btn dl-btn-secondary"
                >
                  ⭐ GitHub Repo
                </a>
              </div>
              <p className="dl-note">
                ⓘ Hosted on Kaggle — free account required to download.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── RESULTS GALLERY ──────────────────────────────── */}
      <section className="section gallery-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Example Outputs</span>
            <h2>Translation Results</h2>
            <p className="section-subtitle">
              Model outputs across different land-cover types, shown during faculty presentation.
            </p>
          </div>
          <div className="gallery-grid">
            <div className="gallery-card">
              <img src="/images/results/result1.jpeg" alt="SAR to Optical result 1" />
            </div>
            <div className="gallery-card">
              <img src="/images/results/result2.jpeg" alt="SAR to Optical result 2" />
            </div>
            <div className="gallery-card">
              <img src="/images/results/result3.jpeg" alt="SAR to Optical result 3" />
            </div>
            <div className="gallery-card">
              <img src="/images/results/result4.jpeg" alt="SAR to Optical result 4" />
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">🛰️ SAR to Optical GAN</span>
            <p>Pix2Pix GAN for SAR image translation · Built with React &amp; PyTorch</p>
          </div>
          <div className="footer-links">
            <a href="https://github.com/devgandhi2705/SAR-to-OPTICAL-GAN" target="_blank" rel="noopener noreferrer">GitHub</a>
            <Link to="/demo">Live Demo</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Trained on Sentinel-1 &amp; Sentinel-2 satellite imagery</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
