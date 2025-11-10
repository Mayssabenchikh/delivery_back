'use strict';
const db = require('../../config/database');

// Define the User model
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

// Create a new User record
User.create = async function (newUser, result) {
    try {
        const [res] = await db.query("INSERT INTO users SET ?", newUser);
        console.log("User created with ID: ", res.insertId);
        result(null, res.insertId);
    } catch (err) {
        console.log("error: ", err);
        result(err, null);
    }
};

module.exports = User;