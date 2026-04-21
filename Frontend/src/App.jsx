import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [colorizedUrl, setColorizedUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setColorizedUrl(null)
      setError(null)
    }
  }

  const handleColorize = async () => {
    if (!selectedFile) {
      setError('Please select an image first')
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await axios.post('http://localhost:5000/api/colorize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      })

      const imageUrl = URL.createObjectURL(response.data)
      setColorizedUrl(imageUrl)
    } catch (err) {
      setError('Failed to colorize image. Make sure backend is running on port 5000.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (colorizedUrl) {
      const link = document.createElement('a')
      link.href = colorizedUrl
      link.download = 'colorized_sar.png'
      link.click()
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🛰️</span>
          <h1 className="logo-text">SAR TO OPTICAL TRANSLATION</h1>
        </div>
        <p className="tagline">Transform Radar Images with AI</p>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          
          {/* Upload Section */}
          <section className="upload-section">
            <div className="upload-card">
              <h2 className="section-title">
                <span className="title-icon">📡</span>
                Upload SAR Image
              </h2>
              
              <div className="upload-area">
                <input
                  type="file"
                  id="file-input"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                <label htmlFor="file-input" className="file-label">
                  <div className="upload-icon">🚀</div>
                  <p className="upload-text">
                    {selectedFile ? selectedFile.name : 'Click to select SAR image'}
                  </p>
                  <p className="upload-hint">PNG, JPG, TIFF supported</p>
                </label>
              </div>

              <button
                onClick={handleColorize}
                disabled={!selectedFile || loading}
                className="colorize-btn"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Colorize Image
                  </>
                )}
              </button>

              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}
            </div>
          </section>

          {/* Results Section */}
          {(previewUrl || colorizedUrl) && (
            <section className="results-section">
              <h2 className="section-title">
                <span className="title-icon">🌌</span>
                Results
              </h2>

              <div className="results-grid">
                {/* Original Image */}
                {previewUrl && (
                  <div className="result-card">
                    <h3 className="result-title">Original SAR</h3>
                    <div className="image-container">
                      <img src={previewUrl} alt="Original SAR" className="result-image" />
                    </div>
                    <div className="image-label">Grayscale Radar</div>
                  </div>
                )}

                {/* Colorized Image */}
                {colorizedUrl && (
                  <div className="result-card">
                    <h3 className="result-title">Colorized Output</h3>
                    <div className="image-container">
                      <img src={colorizedUrl} alt="Colorized" className="result-image" />
                    </div>
                    <div className="image-label">AI Enhanced</div>
                    <button onClick={handleDownload} className="download-btn">
                      ⬇️ Download
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Model Info Section */}
          <section className="model-info-section">
            <div className="model-info-card">
              <h2 className="section-title">
                <span className="title-icon">🤖</span>
                Model Information
              </h2>
              <div className="model-stats">
                <div className="stat-item">
                  <span className="stat-label">Architecture:</span>
                  <span className="stat-value">Pix2Pix GAN (U-Net Generator)</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Training Epochs:</span>
                  <span className="stat-value">265</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Model Size:</span>
                  <span className="stat-value">~200 MB</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Input Size:</span>
                  <span className="stat-value">256 x 256 pixels</span>
                </div>
              </div>
            </div>
          </section>

          {/* Info Section */}
          <section className="info-section">
            <div className="info-card">
              <h3>🔬 About SAR Colorization</h3>
              <p>
                Synthetic Aperture Radar (SAR) images are grayscale by nature. 
                Our AI model uses Pix2Pix GAN to transform these radar images 
                into colorized versions, making them easier to interpret and analyze.
              </p>
            </div>

            <div className="info-card">
              <h3>⚡ How It Works</h3>
              <ol>
                <li>Upload your SAR image</li>
                <li>AI processes the image using trained neural networks</li>
                <li>Download your colorized result</li>
              </ol>
            </div>

            <div className="info-card">
              <h3>🎯 Use Cases</h3>
              <ul>
                <li>Remote sensing analysis</li>
                <li>Environmental monitoring</li>
                <li>Disaster assessment</li>
                <li>Agricultural mapping</li>
              </ul>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>🌟 Powered by Pix2Pix GAN | Built with React</p>
      </footer>

    </div>
  )
}

export default App
