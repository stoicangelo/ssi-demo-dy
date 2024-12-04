const express = require('express');
const { connectToDatabase } = require('./clients/db/dbClient');
const { ensurePublicDid } = require('./handlers/publicDID');
const routes = require('./routes'); // Import routes
const { checkPreparatoryData } = require('./utils/ddlJobs');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

async function initializeServer() {
    try {
        // Step 1: Establish database connection
        let pool = await connectToDatabase();
        await checkPreparatoryData();

        
        // Step 2: Ensure public DID is set
        await ensurePublicDid();

        // Step 3: Setup routes
        app.use('/issuer-api', routes); // Prefix all routes with `/api`

        // Step 4: Start the server
        app.listen(PORT, () => console.log(`Issuer Controller API running on port ${PORT}`));
    } catch (error) {
        console.error('Failed to initialize server:', error);
        process.exit(1); // Exit process on failure
    }
}

initializeServer();
