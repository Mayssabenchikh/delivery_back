const db = require('../config/database');

const Delivery = {
  create: async (data) => {
    const sql = `INSERT INTO deliveries (client_id, company_id, pickup_address, dropoff_address, receiver_name, receiver_phone, weight, size, price, payment_amount, currency, payment_method, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    
    // S'assurer que price est un nombre
    const price = Number(data.price) || 0;
    
    // Calculer payment_amount = price + 7 (valeur fixe)
    // Si payment_amount est déjà envoyé et valide, l'utiliser, sinon calculer price + 7
    let paymentAmount;
    if (data.payment_amount !== undefined && data.payment_amount !== null && !isNaN(Number(data.payment_amount))) {
      paymentAmount = Number(data.payment_amount);
    } else {
      paymentAmount = price + 7;
    }
    
    console.log('📦 [DELIVERY CREATE] Data received:', {
      price: price,
      payment_amount_sent: data.payment_amount,
      payment_amount_type: typeof data.payment_amount,
      payment_amount_calculated: paymentAmount,
      fullData: data
    });
    
    const values = [
      data.client_id || null,
      data.company_id || null,
      data.pickupAddress || data.pickup_address || '',
      data.dropoffAddress || data.dropoff_address || '',
      data.receiver_name || data.fullName || '',
      data.receiver_phone || data.phone || '',
      Number(data.packageWeight) || Number(data.weight) || 0,
      data.packageSize || data.size || 'M',
      price,
      paymentAmount, // Position 9 dans le tableau (index 9)
      data.currency || 'TND',
      data.payment_method || 'Cash on Delivery',
      data.status || 'pending'
    ];
    
    console.log('📦 [DELIVERY CREATE] SQL values:', values);
    console.log('📦 [DELIVERY CREATE] payment_amount value at index 9:', values[9]);
    
    const [result] = await db.query(sql, values);
    console.log('📦 [DELIVERY CREATE] Insert result:', result);
    
    // Vérifier que l'insertion a réussi en récupérant la livraison créée
    if (result.insertId) {
      const [checkResult] = await db.query('SELECT payment_amount FROM deliveries WHERE id = ?', [result.insertId]);
      console.log('📦 [DELIVERY CREATE] Verification - payment_amount in DB:', checkResult[0]?.payment_amount);
    }
    
    return result;
  },
  getAll: async () => {
    const sql = `
      SELECT d.*, 
        c.name AS company_name, c.logo_url AS company_logo, c.tax_id AS company_tax_id, c.legal_status AS company_legal_status,
        dr.status AS driver_status, u_driver.name AS driver_name, u_driver.phone AS driver_phone, u_driver.email AS driver_email
      FROM deliveries d
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN drivers dr ON d.driver_id = dr.id
      LEFT JOIN users u_driver ON dr.user_id = u_driver.id
    `;
    const [results] = await db.query(sql);
    return results;
  },

  getHistory: async (filters = {}) => {
    // Build base query
      let sql = `
        SELECT d.id, d.pickup_address, d.dropoff_address, d.receiver_name, d.receiver_phone, d.weight, d.size, d.price, d.currency, d.status, d.created_at,
          c.name AS company_name,
          u_driver.name AS driver_name
        FROM deliveries d
        LEFT JOIN companies c ON d.company_id = c.id
        LEFT JOIN drivers dr ON d.driver_id = dr.id
        LEFT JOIN users u_driver ON dr.user_id = u_driver.id
      `;

      let countSql = `
        SELECT COUNT(*) as total
        FROM deliveries d
        LEFT JOIN companies c ON d.company_id = c.id
        LEFT JOIN drivers dr ON d.driver_id = dr.id
        LEFT JOIN users u_driver ON dr.user_id = u_driver.id
      `;

      const where = [];
      const values = [];
      const countValues = [];

    // Free-text search across several columns
    if (filters.q) {
      const q = `%${filters.q}%`;
      const idAsNumber = Number(filters.q);
      const parts = [
        'd.pickup_address LIKE ?',
        'd.dropoff_address LIKE ?',
        'd.receiver_name LIKE ?',
        'c.name LIKE ?',
        'u_driver.name LIKE ?'
      ];
      // if q is numeric, also allow searching by id
      if (!isNaN(idAsNumber) && filters.q.toString().trim() !== '') {
        parts.push('d.id = ?');
      }
      where.push(`(${parts.join(' OR ')})`);
      // push values for the LIKE parts
      values.push(q, q, q, q, q);
      if (!isNaN(idAsNumber) && filters.q.toString().trim() !== '') {
        values.push(idAsNumber);
      }
    }

    // exact status filter — be tolerant to spelling variants (cancelled / canceled)
    if (filters.status) {
      const s = filters.status.toString();
      if (s === 'cancelled' || s === 'canceled') {
        where.push('(d.status = ? OR d.status = ?)');
        values.push('cancelled', 'canceled');
      } else {
        where.push('d.status = ?');
        values.push(s);
      }
    }

    // date range filters (expect YYYY-MM-DD or full timestamp)
    if (filters.startDate) {
      where.push('d.created_at >= ?');
      values.push(filters.startDate);
    }
    if (filters.endDate) {
      where.push('d.created_at <= ?');
      values.push(filters.endDate);
    }

      // Filtrage par client_id (utilisateur connecté) toujours en premier
      if (filters.client_id) {
        where.unshift('d.client_id = ?');
        values.unshift(filters.client_id);
      }
      if (where.length > 0) {
        sql += '\n WHERE ' + where.join(' AND ');
        countSql += '\n WHERE ' + where.join(' AND ');
        countValues.push(...values);
      }

      // Pagination
  let page = 1;
  let pageSize = 3;
  if (filters.page && !isNaN(Number(filters.page))) page = Math.max(1, Number(filters.page));
  if (filters.pageSize && !isNaN(Number(filters.pageSize))) pageSize = Math.max(1, Number(filters.pageSize));
  const offset = (page - 1) * pageSize;

  // default ordering
  sql += '\n ORDER BY d.created_at DESC';
  sql += `\n LIMIT ${pageSize} OFFSET ${offset}`;

      // Query for data and total
      const [results] = await db.query(sql, values);
      const [countResult] = await db.query(countSql, countValues);
      const total = countResult[0]?.total || 0;
      return { data: results, total };
  },

  cancelById: async (id) => {
    const sql = `UPDATE deliveries SET status = ? WHERE id = ?`;
    // use 'cancelled' as canonical status but accept DB variation elsewhere
    const values = ['cancelled', id];
    const [result] = await db.query(sql, values);
    return result;
  }
};

module.exports = Delivery;
