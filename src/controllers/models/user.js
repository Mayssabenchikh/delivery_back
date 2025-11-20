'use strict';
const db = require('../../config/database');
const bcrypt = require('bcryptjs');

var User = function (user) {
    this.name = user.name;
    this.email = user.email;
    this.phone = user.phone;
    this.password = user.password;
    this.role = user.role;
    this.address = user.address;
    this.status = user.status;
    this.verified = user.verified;
};

User.create = async function (newUser, result) {
    try {
        if (newUser.password) {
            newUser.password = await bcrypt.hash(newUser.password, 10);
        }
        
        const [res] = await db.query("INSERT INTO users SET ?", newUser);
        console.log("User created with ID: ", res.insertId);
        result(null, res.insertId);
    } catch (err) {
        console.log("error: ", err);
        result(err, null);
    }
};



// ----------------- READ ALL -----------------
User.getAll = async function (result) {
    try {
        const [rows] = await db.query("SELECT * FROM users");
        result(null, rows);
    } catch (err) {
        console.log("error: ", err);
        result(err, null);
    }
};


// ----------------- READ BY ID -----------------
User.getById = async function (id, result) {
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
        if (rows.length) {
            result(null, rows[0]);
        } else {
            result({ kind: "not_found" }, null);
        }
    } catch (err) {
        console.log("error: ", err);
        result(err, null);
    }
};

// ----------------- UPDATE -----------------
User.update = async function (id, user, result) {
    try {
        if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
        }

        const [res] = await db.query("UPDATE users SET ? WHERE id = ?", [user, id]);
        if (res.affectedRows == 0) {
            result({ kind: "not_found" }, null);
        } else {
            console.log("User updated with ID: ", id);
            result(null, res);
        }
    } catch (err) {
        console.log("error: ", err);
        result(err, null);
    }
};

// ----------------- DELETE -----------------
User.delete = async function (id, result) {
    try {
        // First, check if user exists and get their role
        const [user] = await db.query("SELECT id, role FROM users WHERE id = ?", [id]);
        
        if (user.length === 0) {
            return result({ kind: "not_found" }, null);
        }
        
        // If user is a company, delete the associated company record first
        if (user[0].role === 'company') {
            await db.query("DELETE FROM companies WHERE user_id = ?", [id]);
            console.log("Associated company deleted for user ID:", id);
        }
        
        // Then delete the user
        const [res] = await db.query("DELETE FROM users WHERE id = ?", [id]);
        console.log("User deleted with ID:", id);
        result(null, res);
    } catch (err) {
        console.log("error: ", err);
        result(err, null);
    }
};

module.exports = User;