import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from './Navbar'
import './Demo.css'

// ── Sample images catalogue (served from /samples/) ───────────
const SAMPLES = {
  agri: {
    label: 'Agricultural',
    emoji: '🌾',
    files: [
      'ROIs1970_fall_s1_29_p97.png',
      'ROIs1970_fall_s1_29_p98.png',
      'ROIs1970_fall_s1_29_p987.png',
      'ROIs1970_fall_s1_29_p988.png',
      'ROIs1970_fall_s1_29_p99.png',
    ],
  },
  barrenland: {
    label: 'Barren Land',
    emoji: '🏜️',
    files: [
      'ROIs1970_fall_s1_73_p981.png',
      'ROIs1970_fall_s1_73_p982.png',
      'ROIs1970_fall_s1_73_p983.png',
      'ROIs1970_fall_s1_73_p984.png',
      'ROIs1970_fall_s1_73_p985.png',
    ],
  },
  grassland: {
    label: 'Grassland',
    emoji: '🌿',
    files: [
      'ROIs1970_fall_s1_72_p9.png',
      'ROIs1970_fall_s1_72_p90.png',
      'ROIs1970_fall_s1_72_p91.png',
      'ROIs1970_fall_s1_72_p92.png',
      'ROIs1970_fall_s1_72_p93.png',
    ],
  },
  urban: {
    label: 'Urban',
    emoji: '🏙️',
    files: [
      'ROIs1970_fall_s1_8_p68.png',
      'ROIs1970_fall_s1_8_p69.png',
      'ROIs1970_fall_s1_8_p7.png',
      'ROIs1970_fall_s1_8_p8.png',
      'ROIs1970_fall_s1_8_p9.png',
    ],
  },
}

function DemoPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl]     = useState(null)
  const [resultUrl, setResultUrl]       = useState(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const [dragOver, setDragOver]         = useState(false)
  const [activeTab, setActiveTab]       = useState('agri')
  const [sampleLoading, setSampleLoading] = useState(null)

  const uploadRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResultUrl(null)
    setError(null)
  }

  const handleFileSelect = (e) => handleFile(e.target.files[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  // Fetch a sample image from /samples/ and load it into the demo
  const loadSample = async (category, filename) => {
    const key = `${category}/${filename}`
    setSampleLoading(key)
    try {
      const res  = await fetch(`/samples/${category}/${filename}`)
      const blob = await res.blob()
      const file = new File([blob], filename, { type: 'image/png' })
      handleFile(file)
      uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {
      setError('Could not load sample image.')
    } finally {
      setSampleLoading(null)
    }
  }

  const handleTranslate = async () => {
    if (!selectedFile) {
      setError('Please select a SAR image first.')
      return
    }
    setLoading(true)
    setError(null)

    const form = new FormData()
    form.append('file', selectedFile)

    try {
      const res = await axios.post('/api/colorize', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
      })
      setResultUrl(URL.createObjectURL(res.data))
    } catch {
      setError('Translation failed. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = 'sar_optical_translation.png'
    a.click()
  }

  return (
    <div className="demo-page">
      <Navbar />

      {/* ── DEMO HEADER ─────────────────────────────────── */}
      <header className="demo-header">
        <div className="demo-header-inner">
          <Link to="/" className="back-link">← Back to Home</Link>
          <div className="demo-title-row">
            <span className="demo-sat-icon">🛰️</span>
            <div>
              <h1 className="demo-title">SAR to Optical Translation</h1>
              <p className="demo-subtitle">Upload a SAR image — the AI will generate its optical equivalent</p>
            </div>
          </div>
        </div>
      </header>

      <main className="demo-main">
        <div className="demo-container">

          {/* ── SAMPLE IMAGES ──────────────────────────── */}
          <section className="samples-section">
            <div className="samples-header">
              <div className="samples-title-row">
                <h2 className="card-title"><span>🗂️</span> Try a Sample SAR Image</h2>
                <a href="/api/download-samples" className="samples-zip-btn" download>
                  ⬇️ Download All Samples (.zip)
                </a>
              </div>
              <p className="samples-subtitle">
                Don't have a SAR image? Pick any patch below — it will load straight into the demo.
              </p>
            </div>

            {/* Category tabs */}
            <div className="sample-tabs">
              {Object.entries(SAMPLES).map(([key, cat]) => (
                <button
                  key={key}
                  className={`sample-tab ${activeTab === key ? 'active' : ''}`}
                  onClick={() => setActiveTab(key)}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            {/* Thumbnails */}
            <div className="sample-grid">
              {SAMPLES[activeTab].files.map((filename, i) => {
                const key = `${activeTab}/${filename}`
                const isLoading = sampleLoading === key
                return (
                  <button
                    key={filename}
                    className={`sample-thumb ${isLoading ? 'thumb-loading' : ''}`}
                    onClick={() => loadSample(activeTab, filename)}
                    title={`Load sample ${i + 1}`}
                    disabled={isLoading}
                  >
                    <img
                      src={`/samples/${activeTab}/${filename}`}
                      alt={`${SAMPLES[activeTab].label} sample ${i + 1}`}
                    />
                    {isLoading && <div className="thumb-spinner" />}
                    <div className="thumb-overlay">
                      <span>Load ↑</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── UPLOAD CARD ─────────────────────────────── */}
          <section className="upload-section" ref={uploadRef}>
            <div className="upload-card">
              <h2 className="card-title">
                <span>📡</span> Upload SAR Image
              </h2>

              <div
                className={`drop-zone ${dragOver ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-input"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="file-input-hidden"
                />
                <label htmlFor="file-input" className="drop-label">
                  <div className="drop-icon">{selectedFile ? '✅' : '🚀'}</div>
                  <p className="drop-text">
                    {selectedFile ? selectedFile.name : 'Click or drag & drop a SAR image'}
                  </p>
                  <p className="drop-hint">PNG · JPG · TIFF supported · 256×256 recommended</p>
                </label>
              </div>

              <button
                onClick={handleTranslate}
                disabled={!selectedFile || loading}
                className="translate-btn"
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    Processing…
                  </>
                ) : (
                  <><span>✨</span> Translate to Optical</>
                )}
              </button>

              {error && <div className="error-box">⚠️ {error}</div>}
            </div>
          </section>

          {/* ── RESULTS ─────────────────────────────────── */}
          {(previewUrl || resultUrl) && (
            <section className="results-section">
              <h2 className="card-title">
                <span>🌌</span> Comparison
              </h2>
              <div className="results-grid">

                {previewUrl && (
                  <div className="result-card">
                    <div className="result-badge sar-badge">SAR Input</div>
                    <div className="result-img-wrap">
                      <img src={previewUrl} alt="Original SAR" />
                    </div>
                    <p className="result-caption">Grayscale Radar Image</p>
                  </div>
                )}

                {resultUrl ? (
                  <div className="result-card result-card-output">
                    <div className="result-badge optical-badge">Optical Output</div>
                    <div className="result-img-wrap">
                      <img src={resultUrl} alt="Optical translation" />
                    </div>
                    <p className="result-caption">AI-Generated Optical Image</p>
                    <button onClick={handleDownload} className="download-btn">
                      ⬇️ Download PNG
                    </button>
                  </div>
                ) : (
                  previewUrl && (
                    <div className="result-card result-placeholder">
                      <div className="placeholder-inner">
                        <span className="placeholder-icon">🎨</span>
                        <p>Click <b>Translate to Optical</b> to generate the output</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          {/* ── MODEL INFO ──────────────────────────────── */}
          <section className="info-row">
            <div className="info-card">
              <h3>🤖 Model</h3>
              <div className="info-stats">
                <div className="info-stat">
                  <span className="info-label">Architecture</span>
                  <span className="info-val">Pix2Pix GAN (U-Net)</span>
                </div>
                <div className="info-stat">
                  <span className="info-label">Epochs</span>
                  <span className="info-val">265</span>
                </div>
                <div className="info-stat">
                  <span className="info-label">Input size</span>
                  <span className="info-val">256 × 256</span>
                </div>
                <div className="info-stat">
                  <span className="info-label">Model size</span>
                  <span className="info-val">~200 MB</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>⚡ How It Works</h3>
              <ol className="how-list">
                <li>Image resized to 256 × 256 and normalized to [−1, 1]</li>
                <li>Forward pass through U-Net generator with 8 encoder + 8 decoder blocks and skip connections</li>
                <li>Output de-normalized and returned as PNG</li>
              </ol>
            </div>

            <div className="info-card">
              <h3>🎯 Use Cases</h3>
              <ul className="use-list">
                <li>Remote sensing analysis</li>
                <li>Environmental monitoring</li>
                <li>Disaster &amp; damage assessment</li>
                <li>Agricultural mapping</li>
                <li>Urban expansion tracking</li>
              </ul>
            </div>
          </section>

        </div>
      </main>

      <footer className="demo-footer">
        <p>🌟 Pix2Pix GAN · Trained on Sentinel-1 &amp; Sentinel-2 · Built with React &amp; Flask</p>
      </footer>
    </div>
  )
}

export default DemoPage
