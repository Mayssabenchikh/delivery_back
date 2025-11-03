

const express = require('express');
const router = express.Router();
const Company = require('../models/companymodel');



// GET /api/company - Get all companies
router.get('/all', (req, res) => {
  Company.getAll((err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(results);
  });
});

// GET /api/company/:id - Get company by ID
router.get('/:id', (req, res) => {
  Company.getById(req.params.id, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (results.length === 0) return res.status(404).json({ message: 'Company not found' });
    res.json(results[0]);
  });
});

// GET /api/company/email/:email - Get company by email
router.get('/email/:email', (req, res) => {
  Company.getByEmail(req.params.email, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (results.length === 0) return res.status(404).json({ message: 'Company not found' });
    res.json(results[0]);
  });
});

// POST /api/company - Create new company
router.post('/add', (req, res) => {
  Company.create(req.body, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.status(201).json({ message: 'Company created', id: result.insertId });
  });
});



module.exports = router;
