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


exports.getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.getAll();
    res.status(200).json(deliveries);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDeliveryHistory = async (req, res) => {
  try {
    // accept query params for search/filtering (e.g. q, status, startDate, endDate, page, pageSize)
    const filters = req.query || {};
    // page et pageSize sont transmis tels quels
    const { data, total } = await Delivery.getHistory(filters);
    res.status(200).json({ data, total });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.cancelDelivery = async (req, res) => {
  try {
    const id = req.params.id;
    console.log('cancelDelivery called for id=', id);
    if (!id) return res.status(400).json({ success: false, error: 'Missing id' });
    const result = await Delivery.cancelById(id);
    if (result && result.affectedRows && result.affectedRows > 0) {
      return res.status(200).json({ success: true, id });
    }
    return res.status(404).json({ success: false, error: 'Delivery not found' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
