const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  // Customer Information
  customerName: {
    type: String,
    required: true,
    index: true
  },
  idNumber: {
    type: String,
    required: true,
    unique: true
  },
  idExpiryDate: {
    type: Date,
    required: true
  },
  phoneNumber: {
    type: String,
    index: true
  },

  // Drone Information
  droneModel: {
    type: String,
    required: true,
    index: true
  },
  droneSerialNumber: {
    type: String,
    required: true,
    index: true,
    unique: true
  },

  // Photo Information
  idPhotoPath: String,
  dronePhotoPath: String,
  idPhotoBase64: String,
  dronePhotoBase64: String,

  // Extracted Data
  extractedIdData: {
    name: String,
    idNumber: String,
    expiryDate: String,
    extractionConfidence: Number
  },
  extractedDroneData: {
    serialNumber: String,
    model: String,
    extractionConfidence: Number
  },

  // System Fields
  registrationDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  pdfPath: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'verified'],
    default: 'pending'
  },
  notes: String
});

// Create compound indexes for faster searches
RegistrationSchema.index({ customerName: 'text', droneModel: 'text' });

module.exports = mongoose.model('Registration', RegistrationSchema);
