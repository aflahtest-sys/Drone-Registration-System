import React, { useState, useRef } from 'react';

function CameraCapture({ type, onPhotoCapture, photoPreview }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      setError('Cannot access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    const video = videoRef.current;

    canvasRef.current.width = video.videoWidth;
    canvasRef.current.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const photoData = canvasRef.current.toDataURL('image/jpeg');
    onPhotoCapture(photoData, type);

    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const handleRetake = () => {
    onPhotoCapture(null, type);
    startCamera();
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {!photoPreview ? (
        <div>
          {isCameraActive ? (
            <div style={{ textAlign: 'center' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  borderRadius: '5px',
                  marginBottom: '10px'
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  className="btn btn-success"
                  onClick={capturePhoto}
                >
                  📸 Capture Photo
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={stopCamera}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={startCamera}
              style={{ width: '100%' }}
            >
              📷 Open Camera
            </button>
          )}

          {error && (
            <div style={{ color: '#dc2626', marginTop: '10px', textAlign: 'center' }}>
              {error}
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <img
            src={photoPreview}
            alt="Captured"
            style={{
              width: '100%',
              maxWidth: '300px',
              borderRadius: '5px',
              marginBottom: '10px'
            }}
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={handleRetake}
            >
              🔄 Retake Photo
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default CameraCapture;
