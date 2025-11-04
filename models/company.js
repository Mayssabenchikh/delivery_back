
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

// Define the Company model
var Company = function (company) {
    this.user_id = company.user_id;
    this.name = company.name;
    this.logo_url = company.logo_url;
    this.tax_id = company.tax_id;
    this.legal_status = company.legal_status;
};

// Create a new Company record
Company.create = function (newCompany, result) {
    dbConn.query("INSERT INTO companies  SET ?", newCompany, function (err, res) {
        if (err) {
            console.log("error: ", err);
            result(err, null);
        } else {
            console.log(res.insertId);
            result(null, res.insertId);
        }
    });
};
// Get all Company records
Company.findAll = function (result) {
    dbConn.query("SELECT * FROM companies ", function (err, res) {
        if (err) {
            console.log("error: ", err);
            result(null, err);
        } else {
            console.log('Company : ', res);
            result(null, res);
        }
    });
};



module.exports = Company;