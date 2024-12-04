const express = require('express');
const { connectToDatabase } = require('./clients/db/dbClient');
const routes = require('./routes'); // Import routes

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4001;

async function initializeServer() {
    try {
        // Step 1: Establish database connection
        await connectToDatabase();

        // Step 3: Setup routes
        app.use('/holder-api', routes); // Prefix all routes with `/api`

        // Step 4: Start the server
        app.listen(PORT, () => console.log(`Holder Controller API running on port ${PORT}`));
    } catch (error) {
        console.error('Failed to initialize server:', error);
        process.exit(1); // Exit process on failure
    }
}

initializeServer();
