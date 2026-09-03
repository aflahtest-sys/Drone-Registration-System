import React, { useState } from 'react';
import CameraCapture from '../components/CameraCapture';
import OCRProcessor from '../components/OCRProcessor';
import { registerAPI } from '../utils/api';

const toRawBase64 = (dataUrl) => (dataUrl ? dataUrl.split(',')[1] : '');
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const emptyFormData = {
  customerName: '',
  idNumber: '',
  idExpiryDate: '',
  email: '',
  phoneNumber: '',
  idPhoto: null,
  idPhotoPreview: '',
  droneModel: '',
  droneSerialNumber: '',
  dronePhoto: null,
  dronePhotoPreview: '',
  extractedIdData: null,
};

function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [step1Error, setStep1Error] = useState('');
  const [step2Error, setStep2Error] = useState('');
  const [formData, setFormData] = useState(emptyFormData);
  const [successInfo, setSuccessInfo] = useState(null);

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
      setStep1Error('Please capture the ID card photo first.');
      return false;
    }
    if (!formData.customerName.trim()) {
      setStep1Error('Please enter the customer name.');
      return false;
    }
    if (!formData.idNumber.trim()) {
      setStep1Error('Please enter the ID number.');
      return false;
    }
    if (!formData.idExpiryDate) {
      setStep1Error('Please select the ID expiry date.');
      return false;
    }
    if (!formData.email.trim()) {
      setStep1Error('Please enter an email address.');
      return false;
    }
    if (!isValidEmail(formData.email.trim())) {
      setStep1Error('Please enter a valid email address.');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      setStep1Error('Please enter a phone number.');
      return false;
    }
    setStep1Error('');
    return true;
  };

  const validateStep2 = () => {
    if (!formData.dronePhoto) {
      setStep2Error('Please capture the drone box photo first.');
      return false;
    }
    if (!formData.droneModel.trim()) {
      setStep2Error('Please enter the drone model.');
      return false;
    }
    if (!formData.droneSerialNumber.trim()) {
      setStep2Error('Please enter the drone serial number.');
      return false;
    }
    setStep2Error('');
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
    setStep2Error('');

    try {
      const submitData = new FormData();
      submitData.append('customerName', formData.customerName);
      submitData.append('idNumber', formData.idNumber);
      submitData.append('idExpiryDate', formData.idExpiryDate);
      submitData.append('email', formData.email.trim());
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

      // Show a clear, dedicated success screen instead of a small banner.
      setSuccessInfo({
        registrationId: response.data.registrationId,
        customerName: formData.customerName,
        email: formData.email,
        droneModel: formData.droneModel,
        droneSerialNumber: formData.droneSerialNumber
      });
    } catch (error) {
      setStep2Error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAnother = () => {
    setFormData(emptyFormData);
    setStep1Error('');
    setStep2Error('');
    setSuccessInfo(null);
    setStep(1);
  };

  // ---- Success screen ----
  if (successInfo) {
    return (
      <div className="register-page">
        <div className="card" style={{ textAlign: 'center', border: '2px solid #16a34a' }}>
          <div style={{ fontSize: '64px', lineHeight: 1, marginBottom: '10px' }}>✅</div>
          <h2 style={{ color: '#16a34a', marginBottom: '10px', fontSize: '24px' }}>
            Registration Successful!
          </h2>
          <p style={{ marginBottom: '20px', color: '#334155', fontSize: '16px' }}>
            Thank you, <strong>{successInfo.customerName}</strong>. Your drone has been
            registered successfully.
          </p>

          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ marginBottom: '8px' }}><strong>Registration ID:</strong> {successInfo.registrationId}</p>
            <p style={{ marginBottom: '8px' }}><strong>Drone Model:</strong> {successInfo.droneModel}</p>
            <p style={{ marginBottom: '8px' }}><strong>Serial Number:</strong> {successInfo.droneSerialNumber}</p>
            <p><strong>Confirmation sent to:</strong> {successInfo.email}</p>
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            Please keep your Registration ID for your records.
          </p>

          <button className="btn btn-primary" onClick={handleRegisterAnother}>
            Register Another Drone
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
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
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
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

          {step1Error && (
            <div className="alert alert-error" style={{ marginTop: '15px', marginBottom: 0 }}>
              {step1Error}
            </div>
          )}
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
              disabled={loading}
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

          {step2Error && (
            <div className="alert alert-error" style={{ marginTop: '15px', marginBottom: 0 }}>
              {step2Error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RegisterPage;
