require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

const db = async () => {
    try {
        const connect = mongoose.connect(process.env.MongoDB_URI);
        console.log(`MongoDB Connected on: ${(await connect).connection.name}`);
    } catch (error) {
        console.error(`Error to connect MongoDB ${error}`);
        process.exit(1);
    };
};

module.exports = db;