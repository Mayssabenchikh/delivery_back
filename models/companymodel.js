const connection = require('../connect'); // Assure-toi que connect.js exporte la connexion MySQL

class Company {
  // Créer une nouvelle entreprise
  static create(data, callback) {
    const query = `
      INSERT INTO companies (name, email, phone, password, address, logo_url, tax_id, legal_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      data.name,
      data.email,
      data.phone,
      data.password,
      data.address,
      data.logo_url || null,
      data.tax_id || null,
      data.legal_status || null
    ];
    
    connection.query(query, values, callback);
  }

  // Récupérer toutes les entreprises
  static getAll(callback) {
    const query = 'SELECT * FROM companies ORDER BY created_at DESC';
    connection.query(query, callback);
  }

  // Récupérer une entreprise par ID
  static getById(id, callback) {
    const query = 'SELECT * FROM companies WHERE id = ?';
    connection.query(query, [id], callback);
  }

  // Récupérer une entreprise par email
  static getByEmail(email, callback) {
    const query = 'SELECT * FROM companies WHERE email = ?';
    connection.query(query, [email], callback);
  }

  // Mettre à jour une entreprise
  static update(id, data, callback) {
    const query = `
      UPDATE companies 
      SET name = ?, email = ?, phone = ?, address = ?, 
          logo_url = ?, tax_id = ?, legal_status = ?
      WHERE id = ?
    `;
    const values = [
      data.name,
      data.email,
      data.phone,
      data.address,
      data.logo_url || null,
      data.tax_id || null,
      data.legal_status || null,
      id
    ];
    
    connection.query(query, values, callback);
  }

  // Supprimer une entreprise
  static delete(id, callback) {
    const query = 'DELETE FROM companies WHERE id = ?';
    connection.query(query, [id], callback);
  }

  // Rechercher des entreprises
  static search(searchTerm, callback) {
    const query = `
      SELECT * FROM companies 
      WHERE name LIKE ? OR email LIKE ? OR address LIKE ?
      ORDER BY created_at DESC
    `;
    const searchValue = `%${searchTerm}%`;
    connection.query(query, [searchValue, searchValue, searchValue], callback);
  }
}

module.exports = Company;
