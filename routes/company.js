const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const User = require('../models/user');

// Inscription complète : User + Company
router.post('/register', (req, res) => {
    const { 
        // Champs pour users
        email, 
        password, 
        address,
        phone,          // ← Ajouté
        // Champs pour companies
        name,           // Company Name
        logo_url,       // Upload Company Logo
        tax_id,         // Tax ID
        legal_status    // Legal Status
    } = req.body;

    // Validation des champs obligatoires
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password et nom de la company sont requis' });
    }

    // Étape 1 : Créer l'utilisateur
    const newUser = new User({
        name: '',
        email: email,
        phone: phone || '',        // ← Phone du formulaire
        password: password,
        role: 'company',
        address: address || '',
        status: 'active',
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

        // Étape 2 : Créer la company
        const newCompany = new Company({
            user_id: userId,
            name: name,
            logo_url: logo_url || '',
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
                company_id: companyId
            });
        });
    });
});

module.exports = router;