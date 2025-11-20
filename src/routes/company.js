/*const express = require('express');
const router = express.Router();
const Company = require('../controllers/models/company');
const User = require('../controllers/models/user');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

router.get('/test', (req, res) => {
  res.json({ message: 'Test route works' });
});

// Créer le dossier uploads s'il n'existe pas
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // le fichier reste dans /uploads
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // garde juste le nom du fichier
  }
});


const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Inscription complète : User + Company avec upload d'image
router.post('/register', upload.single('logo'), (req, res) => {
    const { 
        email, 
        password, 
        address,
        phone,
        name,
        tax_id,
        legal_status
    } = req.body;

    // Validation des champs obligatoires
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password et nom de la company sont requis' });
    }

    // Récupérer le chemin du logo uploadé
const logo_url = req.file ? req.file.filename : '';

    // Étape 1 : Créer l'utilisateur
    const newUser = new User({
        name: name,
        email: email,
        phone: phone || '',
        password: password,
        role: 'company',
        address: address || '',
        status: 'suspended',
        verified: 0
    });

    User.create(newUser, (error, userId) => {
        if (error) {
            console.error('Erreur lors de la création de l\'utilisateur :', error);
            return res.status(500).json({ 
                error: 'Erreur lors de la création de l\'utilisateur',
                details: error.code || error.message
            });
        }

        // Étape 2 : Créer la company avec le logo_url
        const newCompany = new Company({
            user_id: userId,
            name: name,
            logo_url: logo_url,
            tax_id: tax_id || '',
            legal_status: legal_status || ''
        });

        Company.create(newCompany, (error, companyId) => {
            if (error) {
                console.error('Erreur lors de la création de la company :', error);
                return res.status(500).json({ 
                    error: 'Erreur lors de la création de la company',
                    details: error.code || error.message
                });
            }

            res.status(201).json({ 
                message: 'Inscription réussie',
                user_id: userId,
                company_id: companyId,
                logo_url: logo_url
            });
        });
    });
// GET ALL COMPANIES
router.get('/all', (req, res) => {
    Company.getAll((err, companies) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(companies);
    });
});

// ----------------- GET COMPANY BY ID -----------------
router.get('/companies/:id', (req, res) => {
    const id = req.params.id;
    Company.getById(id, (err, company) => {
        if (err) {
            if (err.kind === 'not_found') {
                return res.status(404).json({ message: 'Société non trouvée' });
            }
            return res.status(500).json({ error: err });
        }
        res.json(company);
    });
});

// ----------------- UPDATE COMPANY -----------------
router.put('/companies/:id', (req, res) => {
    const id = req.params.id;
    const updatedCompany = req.body;

    Company.update(id, updatedCompany, (err, data) => {
        if (err) {
            if (err.kind === 'not_found') return res.status(404).json({ message: 'Société non trouvée' });
            return res.status(500).json({ error: err });
        }
        res.json({ message: 'Société mise à jour', data });
    });
});

// ----------------- DELETE COMPANY -----------------
router.delete('/companies/:id', (req, res) => {
    const id = req.params.id;

    Company.delete(id, (err, data) => {
        if (err) {
            if (err.kind === 'not_found') return res.status(404).json({ message: 'Société non trouvée' });
            return res.status(500).json({ error: err });
        }
        res.json({ message: 'Société supprimée' });
    });
});});
module.exports = router;*/
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

    const logo_url = req.file ? req.file.filename : '';

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
