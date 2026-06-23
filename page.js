'use client';
import { useState, useCallback, useRef } from 'react';

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function Home() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadName, setDownloadName] = useState(null);
  const [error, setError] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndSetFile = (f) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(f.type)) {
      setError('Format tidak didukung. Gunakan file PDF, JPG, atau PNG.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Ukuran file maksimal 10MB.');
      return;
    }
    setError(null);
    setFile(f);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
      setDownloadName(null);
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSetFile(f);
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) validateAndSetFile(f);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
      setDownloadName(null);
    }
  };

  const handleProcess = async () => {
    if (!file || !agreed || isProcessing) return;
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/process-cv', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Try to extract filename from Content-Disposition header
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^";\n]+)"?/i);
      setDownloadName(match ? match[1] : 'CV_Harvard_ATS.docx');
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setError(null);
    setAgreed(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
      setDownloadName(null);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <header className="header">
        <div className="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div>
          <div className="header-title">CV Reformatter</div>
          <div className="header-sub">Harvard / ATS Standard</div>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">Upload CV Kamu</h1>
            <p className="card-desc">
              Kami akan memformat ulang CV-mu ke standar Harvard/ATS secara otomatis — hasilnya bisa langsung didownload dan diedit.
            </p>
          </div>

          <div className="card-body">

            {/* Upload Zone (hidden when file already selected) */}
            {!file && (
              <div
                className={`upload-zone${isDragging ? ' drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div className="upload-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 16 12 12 8 16"/>
                    <line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                </div>
                <div className="upload-title">Drag &amp; drop atau klik untuk pilih file</div>
                <div className="upload-sub">Maksimal ukuran file 10MB</div>
                <div className="upload-formats">
                  <span className="format-badge">PDF</span>
                  <span className="format-badge">JPG</span>
                  <span className="format-badge">PNG</span>
                </div>
              </div>
            )}

            {/* File Selected */}
            {file && (
              <div className="file-selected">
                <div className="file-selected-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="file-selected-name">{file.name}</div>
                  <div className="file-selected-size">{formatBytes(file.size)}</div>
                </div>
                <button className="file-remove" onClick={handleRemoveFile} title="Hapus file">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="error-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="error-text">{error}</span>
              </div>
            )}

            {/* Privacy Notice */}
            <div className="privacy-box">
              <div className="privacy-title">⚠ Privasi &amp; Data</div>
              <p className="privacy-text">
                File CV kamu <strong>tidak disimpan</strong> di server kami setelah diproses.
                CV akan dikirim ke <strong>Google Gemini AI</strong> untuk diformatkan ulang.{' '}
                Pada <strong>layanan gratis</strong>, data yang dikirim mungkin digunakan oleh Google untuk pengembangan model AI mereka.
                Hindari mengupload CV dengan informasi sangat sensitif (nomor KTP, rekening bank, dll).
              </p>
              <label className="privacy-agree">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span className="privacy-agree-label">
                  Saya memahami dan menyetujui ketentuan privasi di atas
                </span>
              </label>
            </div>

            {/* Loading State */}
            {isProcessing && (
              <div className="loading-box">
                <div className="spinner" />
                <div className="loading-title">Sedang memproses CV...</div>
                <div className="loading-sub">AI sedang membaca dan memformat ulang CV kamu. Harap tunggu 15–30 detik.</div>
              </div>
            )}

            {/* Success State */}
            {downloadUrl && !isProcessing && (
              <div className="success-box">
                <div className="success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="success-title">CV berhasil diformat!</div>
                <div className="success-sub">File .docx siap didownload dan diedit sesuai kebutuhan.</div>
                <a href={downloadUrl} download={downloadName} className="btn-download">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download CV (.docx)
                </a>
                <br />
                <button className="btn-reset" onClick={handleReset}>
                  Proses CV lain
                </button>
              </div>
            )}

            {/* Process Button */}
            {!isProcessing && !downloadUrl && (
              <button
                className="btn-process"
                onClick={handleProcess}
                disabled={!file || !agreed}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Proses CV Sekarang
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        Powered by Google Gemini AI &nbsp;·&nbsp; Harvard/ATS Standard Format
      </footer>
    </div>
  );
}
