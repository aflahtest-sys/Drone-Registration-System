const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');

// Search registrations
router.get('/', async (req, res) => {
  try {
    const { query, type, page = 1, limit = 10 } = req.query;
    let searchQuery = {};

    if (query) {
      query.trim();

      // Search based on type
      if (type === 'name') {
        searchQuery.customerName = { $regex: query, $options: 'i' };
      } else if (type === 'phone') {
        searchQuery.phoneNumber = { $regex: query, $options: 'i' };
      } else if (type === 'droneModel') {
        searchQuery.droneModel = { $regex: query, $options: 'i' };
      } else if (type === 'serialNumber') {
        searchQuery.droneSerialNumber = { $regex: query, $options: 'i' };
      } else if (type === 'idNumber') {
        searchQuery.idNumber = { $regex: query, $options: 'i' };
      } else {
        // Search across all fields if type not specified
        searchQuery = {
          $or: [
            { customerName: { $regex: query, $options: 'i' } },
            { phoneNumber: { $regex: query, $options: 'i' } },
            { droneModel: { $regex: query, $options: 'i' } },
            { droneSerialNumber: { $regex: query, $options: 'i' } },
            { idNumber: { $regex: query, $options: 'i' } }
          ]
        };
      }
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Registration.countDocuments(searchQuery);
    const results = await Registration.find(searchQuery)
      .skip(skip)
      .limit(limitNum)
      .sort({ registrationDate: -1 });

    res.json({
      success: true,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      results
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all registrations (paginated)
router.get('/all/records', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Registration.countDocuments();
    const records = await Registration.find()
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

module.exports = router;
