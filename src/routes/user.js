const express = require('express');
const router = express.Router();
const User = require('../controllers/models/user');

// ----------------- TEST ROUTE -----------------
router.get('/test', (req, res) => {
    res.json({ message: 'User route works' });
});

// ----------------- CREATE USER -----------------
router.post('/users', (req, res) => {
    const { name, email, phone, password, role, address, status, verified } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email et password sont obligatoires' });
    }

    const newUser = new User({ name, email, phone, password, role, address, status, verified });

    User.create(newUser, (err, userId) => {
        if (err) return res.status(500).json({ error: err });
        res.status(201).json({ message: 'Utilisateur créé', user_id: userId });
    });
});

// ----------------- GET ALL USERS -----------------
router.get('/all', (req, res) => {
    User.getAll((err, users) => {
        if (err) return res.status(500).json({ error: err });
        res.json(users);
    });
});

// ----------------- GET USER BY ID -----------------
router.get('/users/:id', (req, res) => {
    const id = req.params.id;
    User.getById(id, (err, user) => {
        if (err) {
            if (err.kind === 'not_found') return res.status(404).json({ message: 'Utilisateur non trouvé' });
            return res.status(500).json({ error: err });
        }
        res.json(user);
    });
});

// ----------------- UPDATE USER -----------------
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const updatedUser = req.body;

    User.update(id, updatedUser, (err, data) => {
        if (err) {
            if (err.kind === 'not_found') return res.status(404).json({ message: 'Utilisateur non trouvé' });
            return res.status(500).json({ error: err });
        }
        res.json({ message: 'Utilisateur mis à jour', data });
    });
});

// ----------------- DELETE USER -----------------
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    User.delete(id, (err, data) => {
        if (err) {
            if (err.kind === 'not_found') return res.status(404).json({ message: 'Utilisateur non trouvé' });
            return res.status(500).json({ error: err });
        }
        res.json({ message: 'Utilisateur supprimé' });
    });
});

module.exports = router;
