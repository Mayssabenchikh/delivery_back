const db = require('../../config/database');

// Define the Company model
var Company = function (company) {
    this.user_id = company.user_id;
    this.name = company.name;
    this.logo_url = company.logo_url;
    this.tax_id = company.tax_id;
    this.legal_status = company.legal_status;
};



// Create a new Company record
Company.create = async function (newCompany, result) {
    try {
        const [res] = await db.query("INSERT INTO companies SET ?", newCompany);
        console.log(res.insertId);
        result(null, res.insertId);
    } catch (err) {
        console.log("error: ", err);
        result(err, null);
    }
};

// Get all Company records
Company.findAll = async function (result) {
    try {
        const [res] = await db.query("SELECT * FROM companies");
        console.log("Company: ", res);
        result(null, res);
    } catch (err) {
        console.log("error: ", err);
        result(null, err);
    }
};

module.exports = Company;