const pool = require('../config/database');
const bcrypt = require('bcryptjs');

exports.updateProfile = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { name, email, phone, address } = req.body;

        if (!name || !email || !phone || !address) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const [users] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userId = users[0].id;

        await connection.execute(
            'UPDATE users SET name = ?, phone = ?, address = ? WHERE email = ?',
            [name, phone, address, email]
        );
        const [updatedUser] = await connection.execute(
            'SELECT id, name, email, phone, address, role, status, verified, created_at FROM users WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    } finally {
        connection.release();
    }
};

exports.getProfile = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const [users] = await connection.execute(
            'SELECT id, name, email, phone, address, role, status, verified, created_at FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    } finally {
        connection.release();
    }
};

exports.verifyPassword = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { email, currentPassword } = req.body;

        if (!email || !currentPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email and current password are required'
            });
        }

        const [users] = await connection.execute(
            'SELECT id, password FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        res.json({
            success: true,
            message: 'Password verified successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    } finally {
        connection.release();
    }
};

exports.deleteAccount = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { UserId, email, password } = req.body;

        if (!UserId || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'UserId, email, and password are required'
            });
        }

        const [users] = await connection.execute(
            'SELECT id, password FROM users WHERE email = ? AND id = ?',
            [email, UserId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect password'
            });
        }
        await connection.execute(
            'DELETE FROM users WHERE id = ?',
            [user.id]
        );

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete Account Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    } finally {
        connection.release();
    }
};