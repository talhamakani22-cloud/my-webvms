
const Visitor = require('../models/Visitor');

const express = require('express');
const router = express.Router();

// GET /api/1001 - Get all visitors
router.get('/', async (req, res) => {
  try {
    const { search = '', startDate, endDate } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { emiratesId: { $regex: search, $options: 'i' } },
        { fullNameEnglish: { $regex: search, $options: 'i' } },
        { fullNameArabic: { $regex: search, $options: 'i' } },
        { nationality: { $regex: search, $options: 'i' } },
        { gender: { $regex: search, $options: 'i' } },
        { purposeOfVisit: { $regex: search, $options: 'i' } },
        { remark: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.dateOfBirth = {};
      if (startDate) query.dateOfBirth.$gte = startDate;
      if (endDate) query.dateOfBirth.$lte = endDate;
    }

    const visitors = await Visitor.find(query).sort({ createdAt: -1 });
    res.json({ success: true, visitors });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch visitors', error: err.message });
  }
});


// UAE Emirates ID format: 784-XXXX-XXXXXXX-X
const emiratesIdPattern = /^784-[0-9]{4}-[0-9]{7}-[0-9]{1}$/;

// POST /api/visitors - Add a new visitor
router.post('/', async (req, res) => {
  const {
    emiratesId,
    fullNameEnglish,
    fullNameArabic,
    nationality,
    dateOfBirth,
    gender,
    issueDate,
    expiryDate,
    purposeOfVisit,
    remark
  } = req.body;

  // Emirates ID validation
  if (!emiratesIdPattern.test(emiratesId)) {
    return res.status(400).json({ success: false, message: 'Invalid Emirates ID format.' });
  }

  // Required fields validation
  if (!emiratesId || !fullNameEnglish || !fullNameArabic || !nationality || !dateOfBirth || !gender || !issueDate || !expiryDate || !purposeOfVisit || !remark) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    const visitor = new Visitor({
      emiratesId,
      fullNameEnglish,
      fullNameArabic,
      nationality,
      dateOfBirth,
      gender,
      issueDate,
      expiryDate,
      purposeOfVisit,
      remark
    });
    await visitor.save();
    console.log('[Visitor Added]', {
      id: visitor._id,
      emiratesId: visitor.emiratesId,
      fullNameEnglish: visitor.fullNameEnglish,
      nationality: visitor.nationality,
      dateOfBirth: visitor.dateOfBirth,
      gender: visitor.gender,
      purposeOfVisit: visitor.purposeOfVisit,
      remark: visitor.remark
    });
    res.status(201).json(visitor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
