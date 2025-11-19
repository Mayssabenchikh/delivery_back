const express = require('express');
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

            const fullLogoUrl = logo_url ? `${process.env.SERVER_URL || 'http://localhost:3200'}/uploads/${logo_url}` : null;

            res.status(201).json({ 
                message: 'Inscription réussie',
                user_id: userId,
                company_id: companyId,
                logo_url: fullLogoUrl
            });
        });
    });
});

module.exports = router;