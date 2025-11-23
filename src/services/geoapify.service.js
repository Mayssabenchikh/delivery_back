const axios = require("axios");

async function reverseGeocode(lat, lon, apiKey) {
  // default to French language for formatted address
  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}&lang=fr`;

  const response = await axios.get(url);
  return response.data;
}

async function forwardGeocode(query, apiKey, lang = 'fr') {
  const encoded = encodeURIComponent(query);
  // allow language override
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encoded}&apiKey=${apiKey}&lang=${encodeURIComponent(lang)}`;

  const response = await axios.get(url);
  return response.data;
}

module.exports = { reverseGeocode, forwardGeocode };
