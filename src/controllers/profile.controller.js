const pool = require('../config/database');
const bcrypt = require('bcryptjs');

exports.updateProfile = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { name, email, phone, address } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !address) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if user exists with this email
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

        // Update user profile (excluding email)
        await connection.execute(
            'UPDATE users SET name = ?, phone = ?, address = ? WHERE email = ?',
            [name, phone, address, email]
        );

        // Fetch updated user data
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
        const { email } = req.query; // Get email from query parameter

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
        const { email, curentPassword } = req.body;

        // Validate required fields
        if (!email || !curentPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email and current password are required'
            });
        }

        // Get user by email
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

        // Verify password
        const isValidPassword = await bcrypt.compare(curentPassword, user.password);
        
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

        // Validate required fields
        if (!UserId || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'UserId, email, and password are required'
            });
        }

        // Get user by email and id
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

        // Verify password before deletion
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        // Delete the user account
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