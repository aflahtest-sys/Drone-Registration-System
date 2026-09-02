import React, { useState } from 'react';
import CameraCapture from '../components/CameraCapture';
import OCRProcessor from '../components/OCRProcessor';
import { registerAPI } from '../utils/api';

function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    // Customer info
    customerName: '',
    customerId: '',
    idExpiryDate: '',
    phoneNumber: '',
    idPhoto: null,
    idPhotoPreview: '',
    // Drone info
    droneModel: '',
    droneSerialNumber: '',
    droneBoxPhoto: null,
    droneBoxPhotoPreview: '',
    // OCR extracted data
    extractedName: '',
    extractedId: '',
    extractedExpiryDate: '',
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
        droneBoxPhoto: photoData,
        droneBoxPhotoPreview: photoData
      }));
    }
  };

  const handleOCRExtraction = (extractedData) => {
    setFormData(prev => ({
      ...prev,
      extractedName: extractedData.name || '',
      extractedId: extractedData.id || '',
      extractedExpiryDate: extractedData.expiryDate || '',
      // Auto-fill the visible fields too, if they're still empty
      customerName: prev.customerName || extractedData.name || '',
      customerId: prev.customerId || extractedData.id || ''
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
    if (!formData.customerId.trim()) {
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
    if (!formData.droneBoxPhoto) {
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

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    setMessage('');

    try {
      const submitData = new FormData();
      submitData.append('customerName', formData.customerName);
      submitData.append('customerId', formData.customerId);
      submitData.append('idExpiryDate', formData.idExpiryDate);
      submitData.append('phoneNumber', formData.phoneNumber);
      submitData.append('droneModel', formData.droneModel);
      submitData.append('droneSerialNumber', formData.droneSerialNumber);
      submitData.append('extractedName', formData.extractedName);
      submitData.append('extractedId', formData.extractedId);
      submitData.append('extractedExpiryDate', formData.extractedExpiryDate);

      // Convert base64 to blob
      if (formData.idPhoto) {
        const idBlob = await fetch(formData.idPhoto).then(r => r.blob());
        submitData.append('idPhoto', idBlob, 'id-photo.jpg');
      }

      if (formData.droneBoxPhoto) {
        const droneBlob = await fetch(formData.droneBoxPhoto).then(r => r.blob());
        submitData.append('droneBoxPhoto', droneBlob, 'drone-box-photo.jpg');
      }

      const response = await registerAPI.submit(submitData);
      setMessage(`✅ Registration successful! ID: ${response.data._id}`);

      // Reset form
      setTimeout(() => {
        setFormData({
          customerName: '',
          customerId: '',
          idExpiryDate: '',
          phoneNumber: '',
          idPhoto: null,
          idPhotoPreview: '',
          droneModel: '',
          droneSerialNumber: '',
          droneBoxPhoto: null,
          droneBoxPhotoPreview: '',
          extractedName: '',
          extractedId: '',
          extractedExpiryDate: '',
        });
        setStep(1);
      }, 2000);
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
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
              name="customerId"
              value={formData.customerId}
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
              photoPreview={formData.droneBoxPhotoPreview}
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
