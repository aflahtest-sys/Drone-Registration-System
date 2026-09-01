const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalRegistrations = await Registration.countDocuments();
    const completedRegistrations = await Registration.countDocuments({ status: 'completed' });
    const pendingRegistrations = await Registration.countDocuments({ status: 'pending' });
    const verifiedRegistrations = await Registration.countDocuments({ status: 'verified' });

    // Get registrations by date (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await Registration.countDocuments({
      registrationDate: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        totalRegistrations,
        completedRegistrations,
        pendingRegistrations,
        verifiedRegistrations,
        recentRegistrations
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all registrations with details
router.get('/records', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};
    if (status) {
      query.status = status;
    }

    const total = await Registration.countDocuments(query);
    const records = await Registration.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ registrationDate: -1 });

    res.json({
      success: true,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      records
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update registration status
router.put('/records/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'completed', 'verified'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      registration
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete registration
router.delete('/records/:id', async (req, res) => {
  try {
    const registration = await Registration.findByIdAndDelete(req.params.id);

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json({
      success: true,
      message: 'Registration deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export registrations as JSON
router.get('/export/json', async (req, res) => {
  try {
    const registrations = await Registration.find().select('-idPhotoBase64 -dronePhotoBase64');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="registrations.json"');
    res.send(JSON.stringify(registrations, null, 2));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
