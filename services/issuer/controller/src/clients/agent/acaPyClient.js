const axios = require('axios');

const acaPyClient = axios.create({
    baseURL: process.env.ACAPY_ADMIN_URL, // ACA-Py admin API URL
});

module.exports = acaPyClient;
