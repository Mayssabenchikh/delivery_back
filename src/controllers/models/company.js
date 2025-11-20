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
// ----------------- READ ALL -----------------
Company.getAll = async function (result) {
    try {
        const [rows] = await db.query("SELECT * FROM companies");
        result(null, rows);
    } catch (err) {
        console.log("error: ", err);
        result(err, null);
    }
};

// ----------------- READ BY ID -----------------
Company.getById = async function (id, result) {
    try {
        const [rows] = await db.query("SELECT * FROM companies WHERE id = ?", [id]);
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
Company.update = async function (id, company, result) {
    try {
        const [res] = await db.query("UPDATE companies SET ? WHERE id = ?", [company, id]);
        if (res.affectedRows == 0) {
            result({ kind: "not_found" }, null);
        } else {
            console.log("Company updated with ID: ", id);
            result(null, res);
        }
    } catch (err) {
        console.log("error: ", err);
        result(err, null);
    }
};

// ----------------- DELETE -----------------
Company.delete = async function (id, result) {
    try {
        // First, get the user_id associated with this company
        const [company] = await db.query("SELECT user_id FROM companies WHERE id = ?", [id]);
        
        if (company.length === 0) {
            return result({ kind: "not_found" }, null);
        }
        
        const userId = company[0].user_id;
        
        // Delete the company first (to avoid foreign key constraint issues)
        const [companyRes] = await db.query("DELETE FROM companies WHERE id = ?", [id]);
        
        // Then delete the associated user
        await db.query("DELETE FROM users WHERE id = ?", [userId]);
        
        console.log("Company and associated user deleted. Company ID:", id, "User ID:", userId);
        result(null, companyRes);
    } catch (err) {
        console.log("error: ", err);
        result(err, null);
    }
};

module.exports = Company;