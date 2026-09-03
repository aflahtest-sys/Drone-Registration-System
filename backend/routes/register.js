const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Registration = require('../models/Registration');
const upload = require('../middleware/upload');
const { generatePDF } = require('../utils/pdfGenerator');
const fs = require('fs');

// Register customer and drone information
router.post('/submit', upload.fields([
  { name: 'idPhoto', maxCount: 1 },
  { name: 'dronePhoto', maxCount: 1 }
]), [
  // Validation
  body('customerName').notEmpty().trim(),
  body('idNumber').notEmpty().trim(),
  body('idExpiryDate').isISO8601(),
  body('email').isEmail().withMessage('A valid email address is required').normalizeEmail(),
  body('droneModel').notEmpty().trim(),
  body('droneSerialNumber').notEmpty().trim(),
  body('phoneNumber').optional().isMobilePhone()
], async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customerName,
      idNumber,
      idExpiryDate,
      email,
      phoneNumber,
      droneModel,
      droneSerialNumber,
      extractedIdData,
      extractedDroneData,
      idPhotoBase64,
      dronePhotoBase64
    } = req.body;

    // Check for existing records
    const existingById = await Registration.findOne({ idNumber });
    if (existingById) {
      return res.status(400).json({ error: 'ID Number already registered' });
    }

    const existingDrone = await Registration.findOne({ droneSerialNumber });
    if (existingDrone) {
      return res.status(400).json({ error: 'Drone Serial Number already registered' });
    }

    // Create new registration
    const registration = new Registration({
      customerName,
      idNumber,
      idExpiryDate: new Date(idExpiryDate),
      email,
      phoneNumber,
      droneModel,
      droneSerialNumber,
      idPhotoPath: req.files?.idPhoto ? req.files.idPhoto[0].path : null,
      dronePhotoPath: req.files?.dronePhoto ? req.files.dronePhoto[0].path : null,
      idPhotoBase64,
      dronePhotoBase64,
      extractedIdData: extractedIdData ? JSON.parse(extractedIdData) : null,
      extractedDroneData: extractedDroneData ? JSON.parse(extractedDroneData) : null,
      status: 'completed'
    });

    await registration.save();

    // Generate PDF
    const pdfPath = await generatePDF(registration);
    registration.pdfPath = pdfPath;
    await registration.save();

    res.json({
      success: true,
      message: 'Registration completed successfully',
      registrationId: registration._id,
      pdfPath: pdfPath
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate & download the PDF certificate on demand. This rebuilds the PDF
// fresh from the data stored in MongoDB every time, so it still works even
// after the server restarts and any previously-generated file on disk is gone
// (Render's free tier disk is wiped on every restart/redeploy).
router.get('/:id/pdf', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const pdfPath = await generatePDF(registration);
    res.download(pdfPath, `registration-${registration._id}.pdf`);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get registration by ID
router.get('/:id', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update registration
router.put('/:id', async (req, res) => {
  try {
    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;