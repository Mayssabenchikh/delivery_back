const express = require('express');
const router = express.Router();
const Company = require('../controllers/models/company');
const User = require('../controllers/models/user');
const multer = require('multer');
const fs = require('fs');

// Créer dossier uploads si n'existe pas
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// ----------------- TEST ROUTE -----------------
router.get('/test', (req, res) => {
    res.json({ message: 'Test route works' });
});

// ----------------- REGISTER -----------------
router.post('/register', upload.single('logo'), (req, res) => {
    const { email, password, address, phone, name, tax_id, legal_status } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password et nom de la company sont requis' });
    }

    const baseUrl = process.env.SERVER_URL || 'http://localhost:3200';
    const logo_url = req.file ? `${baseUrl}/uploads/${req.file.filename}` : '';

    const newUser = new User({
        name,
        email,
        phone: phone || '',
        password,
        role: 'company',
        address: address || '',
        status: 'suspended',
        verified: 0
    });

    User.create(newUser, (err, userId) => {
        if (err) return res.status(500).json({ error: err });

        const newCompany = new Company({
            user_id: userId,
            name,
            logo_url,
            tax_id: tax_id || '',
            legal_status: legal_status || ''
        });

        Company.create(newCompany, (err, companyId) => {
            if (err) return res.status(500).json({ error: err });
            res.status(201).json({ message: 'Inscription réussie', user_id: userId, company_id: companyId, logo_url });
        });
    });
});

// ----------------- GET ALL -----------------
router.get('/all', (req, res) => {
    Company.getAll((err, companies) => {
        if (err) return res.status(500).json({ error: err });
        res.json(companies);
    });
});

// ----------------- GET BY ID -----------------
router.get('/:id', (req, res) => {
    const id = req.params.id;
    Company.getById(id, (err, company) => {
        if (err) {
            if (err.kind === 'not_found') return res.status(404).json({ message: 'Société non trouvée' });
            return res.status(500).json({ error: err });
        }
        res.json(company);
    });
});

// ----------------- UPDATE -----------------
router.put('/:id', (req, res) => {
    const id = req.params.id;
    Company.update(id, req.body, (err, data) => {
        if (err) {
            if (err.kind === 'not_found') return res.status(404).json({ message: 'Société non trouvée' });
            return res.status(500).json({ error: err });
        }
        res.json({ message: 'Société mise à jour', data });
    });
});

// ----------------- DELETE -----------------
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    Company.delete(id, (err, data) => {
        if (err) {
            if (err.kind === 'not_found') return res.status(404).json({ message: 'Société non trouvée' });
            return res.status(500).json({ error: err });
        }
        res.json({ message: 'Société supprimée' });
    });
});

module.exports = router;
