const db = require('../config/database');

const Delivery = {
  create: async (data) => {
    // Adapt fields to match DB columns
    const sql = `INSERT INTO deliveries (client_id, company_id, pickup_address, dropoff_address, receiver_name, receiver_phone, weight, size, price, currency, payment_method, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    const values = [
      data.client_id || null,
      data.company_id || null,
      data.pickupAddress || '',
      data.dropoffAddress || '',
      data.receiver_name || data.fullName || '',
      data.receiver_phone || data.phone || '',
      data.packageWeight || 0,
      data.packageSize || 'M',
      data.price || 0,
      data.currency || 'TND',
    data.payment_method || 'Cash on Delivery',
      data.status || 'pending'
    ];
    return db.query(sql, values);
  }
};

module.exports = Delivery;
