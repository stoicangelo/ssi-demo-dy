const express = require('express');
const { connectToDatabase } = require('./clients/db/dbClient');
const { ensurePublicDid } = require('./handlers/publicDID');
const routes = require('./routes'); // Import routes
const { checkPreparatoryData } = require('./utils/ddlJobs');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

async function initializeServer() {
    try {
        let pool = await connectToDatabase();

        
        await ensurePublicDid();

        app.use('/verifier-api', routes); 

        app.listen(PORT, () => console.log(`Verfier Controller API running on port ${PORT}`));
    } catch (error) {
        console.error('Failed to initialize server:', error);
        process.exit(1); // Exit process on failure
    }
}

initializeServer();
