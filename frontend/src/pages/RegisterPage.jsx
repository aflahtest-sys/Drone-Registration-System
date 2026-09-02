import React, { useState } from 'react';
import CameraCapture from '../components/CameraCapture';
import OCRProcessor from '../components/OCRProcessor';
import { registerAPI } from '../utils/api';

const toRawBase64 = (dataUrl) => (dataUrl ? dataUrl.split(',')[1] : '');

function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    // Customer info
    customerName: '',
    idNumber: '',
    idExpiryDate: '',
    phoneNumber: '',
    idPhoto: null,
    idPhotoPreview: '',
    // Drone info
    droneModel: '',
    droneSerialNumber: '',
    dronePhoto: null,
    dronePhotoPreview: '',
    // OCR extracted data (matches backend's extractedIdData shape)
    extractedIdData: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoCapture = (photoData, type) => {
    if (type === 'id') {
      setFormData(prev => ({
        ...prev,
        idPhoto: photoData,
        idPhotoPreview: photoData
      }));
    } else if (type === 'drone') {
      setFormData(prev => ({
        ...prev,
        dronePhoto: photoData,
        dronePhotoPreview: photoData
      }));
    }
  };

  const handleOCRExtraction = (extractedData) => {
    setFormData(prev => ({
      ...prev,
      extractedIdData: {
        name: extractedData.name || '',
        idNumber: extractedData.id || '',
        expiryDate: extractedData.expiryDate || '',
        extractionConfidence: extractedData.confidence || 0
      },
      // Auto-fill the visible fields too, if they're still empty
      customerName: prev.customerName || extractedData.name || '',
      idNumber: prev.idNumber || extractedData.id || ''
    }));
  };

  const validateStep1 = () => {
    if (!formData.idPhoto) {
      setMessage('Please capture the ID card photo first');
      return false;
    }
    if (!formData.customerName.trim()) {
      setMessage('Please enter customer name');
      return false;
    }
    if (!formData.idNumber.trim()) {
      setMessage('Please enter ID number');
      return false;
    }
    if (!formData.idExpiryDate) {
      setMessage('Please select ID expiry date');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      setMessage('Please enter phone number');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.dronePhoto) {
      setMessage('Please capture the drone box photo first');
      return false;
    }
    if (!formData.droneModel.trim()) {
      setMessage('Please enter drone model');
      return false;
    }
    if (!formData.droneSerialNumber.trim()) {
      setMessage('Please enter drone serial number');
      return false;
    }
    return true;
  };

  const extractErrorMessage = (error) => {
    const data = error.response?.data;
    if (!data) return error.message;
    if (data.error) return data.error;
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map(e => e.msg).join(', ');
    }
    return error.message;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    setMessage('');

    try {
      const submitData = new FormData();
      submitData.append('customerName', formData.customerName);
      submitData.append('idNumber', formData.idNumber);
      submitData.append('idExpiryDate', formData.idExpiryDate);
      submitData.append('phoneNumber', formData.phoneNumber);
      submitData.append('droneModel', formData.droneModel);
      submitData.append('droneSerialNumber', formData.droneSerialNumber);

      if (formData.extractedIdData) {
        submitData.append('extractedIdData', JSON.stringify(formData.extractedIdData));
      }

      // Send raw base64 too (no data: prefix) so the backend can store it in
      // MongoDB and embed it in the PDF certificate later.
      if (formData.idPhoto) {
        submitData.append('idPhotoBase64', toRawBase64(formData.idPhoto));
        const idBlob = await fetch(formData.idPhoto).then(r => r.blob());
        submitData.append('idPhoto', idBlob, 'id-photo.jpg');
      }

      if (formData.dronePhoto) {
        submitData.append('dronePhotoBase64', toRawBase64(formData.dronePhoto));
        const droneBlob = await fetch(formData.dronePhoto).then(r => r.blob());
        submitData.append('dronePhoto', droneBlob, 'drone-photo.jpg');
      }

      const response = await registerAPI.submit(submitData);
      setMessage(`✅ Registration successful! ID: ${response.data.registrationId}`);

      // Reset form
      setTimeout(() => {
        setFormData({
          customerName: '',
          idNumber: '',
          idExpiryDate: '',
          phoneNumber: '',
          idPhoto: null,
          idPhotoPreview: '',
          droneModel: '',
          droneSerialNumber: '',
          dronePhoto: null,
          dronePhotoPreview: '',
          extractedIdData: null,
        });
        setStep(1);
        setMessage('');
      }, 2500);
    } catch (error) {
      setMessage(`❌ Error: ${extractErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {step === 1 ? (
        <div className="card">
          <h2 className="card-title">Step 1: Customer Information</h2>

          <div className="form-group">
            <label>ID Card Photo</label>
            <CameraCapture
              type="id"
              onPhotoCapture={handlePhotoCapture}
              photoPreview={formData.idPhotoPreview}
            />
          </div>

          {formData.idPhoto && (
            <div className="form-group">
              <label>Extract Text from ID Card (Optional)</label>
              <OCRProcessor
                photo={formData.idPhoto}
                onExtraction={handleOCRExtraction}
              />
            </div>
          )}

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              placeholder="Enter customer name"
            />
          </div>

          <div className="form-group">
            <label>ID Number</label>
            <input
              type="text"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleInputChange}
              placeholder="Enter ID number"
            />
          </div>

          <div className="form-group">
            <label>ID Expiry Date</label>
            <input
              type="date"
              name="idExpiryDate"
              value={formData.idExpiryDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="Enter phone number"
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={() => validateStep1() && setStep(2)}
          >
            Next: Drone Information →
          </button>
        </div>
      ) : (
        <div className="card">
          <h2 className="card-title">Step 2: Drone Information</h2>

          <div className="form-group">
            <label>Drone Box Photo</label>
            <CameraCapture
              type="drone"
              onPhotoCapture={handlePhotoCapture}
              photoPreview={formData.dronePhotoPreview}
            />
          </div>

          <div className="form-group">
            <label>Drone Model</label>
            <input
              type="text"
              name="droneModel"
              value={formData.droneModel}
              onChange={handleInputChange}
              placeholder="e.g., DJI Mavic 3"
            />
          </div>

          <div className="form-group">
            <label>Drone Serial Number</label>
            <input
              type="text"
              name="droneSerialNumber"
              value={formData.droneSerialNumber}
              onChange={handleInputChange}
              placeholder="Enter serial number"
            />
          </div>

          <div className="grid grid-2">
            <button
              className="btn btn-secondary"
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterPage;
