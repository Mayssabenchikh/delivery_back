const Delivery = require('../models/delivery');

exports.createDelivery = async (req, res) => {
  try {
    const data = req.body;
    // TODO: validate data
    const result = await Delivery.create(data);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
