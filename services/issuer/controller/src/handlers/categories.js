const dbClient = require('../clients/db/dbClient');
const { fetchCredentialSchemas } = require("../common/category");


async function listCategoriesHandler(req, res) {
    try {
        const credentialSchemas = await fetchCredentialSchemas(false); // false since I want full view of records
        if (credentialSchemas.length === 0) {
            return res.status(404).json({ message: 'No credential schemas found.' });
        }
        res.status(200).json(credentialSchemas);
    } catch (error) {
        console.error('Error fetching credential schema list:', error.message);
        res.status(500).json({ error: 'Failed to fetch credential schema list.', details: error.message });
    }
}

module.exports = { listCategoriesHandler };

module.exports = {
    listCategoriesHandler,
};
