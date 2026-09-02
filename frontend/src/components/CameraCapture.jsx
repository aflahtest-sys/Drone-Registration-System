import React, { useState, useRef, useEffect } from 'react';

function CameraCapture({ type, onPhotoCapture, photoPreview }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState('');
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Attach the stream to the video element once it exists and is mounted
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isCameraActive]);

  // Make sure the camera is released if the component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      setError('');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera is not supported in this browser.');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err) {
      setError('Cannot access camera. Please allow camera permission and make sure you are on a secure (https) page.');
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
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const handleRetake = () => {
    onPhotoCapture(null, type);
    startCamera();
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {!photoPreview ? (
        <div>
          {!isCameraActive && (
            <button
              className="btn btn-primary"
              onClick={startCamera}
              style={{ width: '100%' }}
            >
              📷 Open Camera
            </button>
          )}

          {isCameraActive && (
            <div style={{ textAlign: 'center' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  borderRadius: '5px',
                  marginBottom: '10px',
                  backgroundColor: '#000'
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
