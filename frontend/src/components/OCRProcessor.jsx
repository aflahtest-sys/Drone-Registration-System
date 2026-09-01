import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

function OCRProcessor({ photo, onExtraction }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedId, setEditedId] = useState('');
  const [editedExpiryDate, setEditedExpiryDate] = useState('');

  const processImage = async () => {
    if (!photo) return;

    setIsProcessing(true);
    try {
      const result = await Tesseract.recognize(photo, 'eng', {
        logger: (m) => console.log('OCR Progress:', m.progress)
      });

      const text = result.data.text;
      setExtractedText(text);
      setConfidence(Math.round(result.data.confidence));

      // Simple parsing - extract name, ID, and date patterns
      const nameMatch = text.match(/(?:name|name:)\s*([A-Za-z\s]+)/i);
      const idMatch = text.match(/(?:id|id:|number)\s*(\d+)/i);
      const dateMatch = text.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);

      setEditedName(nameMatch ? nameMatch[1].trim() : '');
      setEditedId(idMatch ? idMatch[1].trim() : '');
      setEditedExpiryDate(dateMatch ? dateMatch[1].trim() : '');

      setIsEditing(true);
    } catch (error) {
      alert('OCR processing failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmExtraction = () => {
    onExtraction({
      name: editedName,
      id: editedId,
      expiryDate: editedExpiryDate,
      text: extractedText,
      confidence
    });
    setIsEditing(false);
  };

  const handleCancelExtraction = () => {
    setExtractedText('');
    setConfidence(0);
    setIsEditing(false);
    setEditedName('');
    setEditedId('');
    setEditedExpiryDate('');
  };

  if (isEditing) {
    return (
      <div style={{
        backgroundColor: '#f0f0f0',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h4 style={{ marginBottom: '10px' }}>
          Edit Extracted Information (Confidence: {confidence}%)
        </h4>

        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            placeholder="Enter name"
          />
        </div>

        <div className="form-group">
          <label>ID Number</label>
          <input
            type="text"
            value={editedId}
            onChange={(e) => setEditedId(e.target.value)}
            placeholder="Enter ID number"
          />
        </div>

        <div className="form-group">
          <label>Expiry Date</label>
          <input
            type="text"
            value={editedExpiryDate}
            onChange={(e) => setEditedExpiryDate(e.target.value)}
            placeholder="Enter date (e.g., 12/31/2025)"
          />
        </div>

        <details style={{ marginBottom: '15px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
            View Full Extracted Text
          </summary>
          <pre style={{
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '5px',
            overflowX: 'auto',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {extractedText}
          </pre>
        </details>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-success"
            onClick={handleConfirmExtraction}
          >
            ✓ Confirm Extraction
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleCancelExtraction}
          >
            ✕ Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#e0f2fe',
      padding: '15px',
      borderRadius: '5px',
      border: '2px solid #0284c7'
    }}>
      <p style={{ marginBottom: '10px', color: '#0c2e4a' }}>
        ℹ️ Extract text from the ID card photo using AI recognition (OCR)
      </p>
      <button
        className="btn btn-primary"
        onClick={processImage}
        disabled={isProcessing}
        style={{ width: '100%' }}
      >
        {isProcessing ? '🔄 Processing...' : '🤖 Extract Text with OCR'}
      </button>
    </div>
  );
}

export default OCRProcessor;
