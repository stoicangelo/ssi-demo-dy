require('dotenv').config(); // Load from .env file

const config = {
    indyLedgerUrl: process.env.INDY_LEDGER_URL, // Indy ledger URL
    acapyAdminBase: process.env.ACA_PY_ADMIN_URL
};

module.exports = config;
