'use strict';
const mysql = require('mysql');

const dbConn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'w9ayetdelivery'
});

dbConn.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données : ' + err.stack);
        return;
    }
    console.log('Connecté à la base de données MySQL.');
});

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
User.create = function (newUser, result) {
    dbConn.query("INSERT INTO users SET ?", newUser, function (err, res) {
        if (err) {
            console.log("error: ", err);
            result(err, null);
        } else {
            console.log("User created with ID: ", res.insertId);
            result(null, res.insertId);
        }
    });
};

module.exports = User;