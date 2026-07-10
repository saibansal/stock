import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import Trade from '../api/models/Trade.js';
import Bank from '../api/models/Bank.js';
import Platform from '../api/models/Platform.js';
import Transaction from '../api/models/Transaction.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Please add MONGODB_URI to your .env file before running this script.");
    process.exit(1);
}

const dataDir = path.join(__dirname, '..', 'server', 'data');

function readJson(filename) {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function migrate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB.");

        const tradesData = readJson('database_trades.json');
        if (tradesData && tradesData.trades) {
            await Trade.deleteMany({});
            await Trade.insertMany(tradesData.trades);
            console.log(`Migrated ${tradesData.trades.length} trades.`);
        }

        const banksData = readJson('database_banks.json');
        if (banksData && banksData.banks) {
            await Bank.deleteMany({});
            await Bank.insertMany(banksData.banks);
            console.log(`Migrated ${banksData.banks.length} banks.`);
        }

        const platformsData = readJson('database_platforms.json');
        if (platformsData && platformsData.platforms) {
            await Platform.deleteMany({});
            await Platform.insertMany(platformsData.platforms);
            console.log(`Migrated ${platformsData.platforms.length} platforms.`);
        }

        const walletData = readJson('database_wallet.json');
        if (walletData && walletData.transactions) {
            await Transaction.deleteMany({});
            await Transaction.insertMany(walletData.transactions);
            console.log(`Migrated ${walletData.transactions.length} wallet transactions.`);
        }

        console.log("Migration completed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        mongoose.disconnect();
    }
}

migrate();
