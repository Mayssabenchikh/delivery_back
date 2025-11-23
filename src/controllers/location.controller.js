const { reverseGeocode, forwardGeocode } = require("../services/geoapify.service");
require("dotenv").config();

exports.getAddressFromCoordinates = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    const data = await reverseGeocode(lat, lon, process.env.GEOAPIFY_API_KEY);

    res.json({
      address: data.features[0].properties.formatted,
      raw: data.features[0].properties
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching address", details: error.message });
  }
};

exports.getCoordinatesFromAddress = async (req, res) => {
  try {
    const { q, lang } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Query (q) is required" });
    }

    // allow lang override (default handled in service)
    const data = await forwardGeocode(q, process.env.GEOAPIFY_API_KEY, lang);

    if (!data || !data.features || data.features.length === 0) {
      return res.status(404).json({ error: "No results" });
    }

    const first = data.features[0];
    const coords = first.geometry && first.geometry.coordinates ? first.geometry.coordinates : null; // [lon, lat]

    res.json({
      raw: first,
      formatted: first.properties?.formatted || null,
      coordinates: coords ? { lat: coords[1], lon: coords[0] } : null,
      features: data.features
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching coordinates", details: error.message });
  }
};
