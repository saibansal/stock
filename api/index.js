import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Trade from './models/Trade.js';
import Bank from './models/Bank.js';
import Platform from './models/Platform.js';
import Transaction from './models/Transaction.js';

const app = express();

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("MONGODB_URI is missing in environment variables!");
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.error('MongoDB connection error:', err));
}

// Helper to get max ID
async function getNextId(Model) {
    const lastDoc = await Model.findOne().sort({ id: -1 });
    return lastDoc && lastDoc.id ? lastDoc.id + 1 : 1;
}

// --- Trades API ---
app.get('/api/trades', async (req, res) => {
    try {
        const trades = await Trade.find({});
        res.json({ trades });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read trades' });
    }
});

app.post('/api/trades', async (req, res) => {
    try {
        const newTradeData = req.body;
        newTradeData.id = await getNextId(Trade);
        const trade = await Trade.create(newTradeData);
        res.status(201).json(trade);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save trade' });
    }
});

app.put('/api/trades/:id', async (req, res) => {
    try {
        const updated = await Trade.findOneAndUpdate(
            { id: parseInt(req.params.id) },
            req.body,
            { new: true }
        );
        if (updated) {
            res.status(200).json(updated);
        } else {
            res.status(404).json({ error: 'Trade not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update trade' });
    }
});

app.delete('/api/trades/:id', async (req, res) => {
    try {
        const deleted = await Trade.findOneAndDelete({ id: parseInt(req.params.id) });
        if (deleted) {
            res.status(200).json({ message: 'Trade deleted' });
        } else {
            res.status(404).json({ error: 'Trade not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete trade' });
    }
});

// --- Bank API ---
app.get('/api/banks', async (req, res) => {
    try {
        const banks = await Bank.find({});
        res.json({ banks });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read banks' });
    }
});

app.post('/api/banks', async (req, res) => {
    try {
        const newBankData = req.body;
        newBankData.id = await getNextId(Bank);
        const bank = await Bank.create(newBankData);
        res.status(201).json(bank);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save bank' });
    }
});

app.put('/api/banks/:id', async (req, res) => {
    try {
        const updated = await Bank.findOneAndUpdate(
            { id: parseInt(req.params.id) },
            req.body,
            { new: true }
        );
        if (updated) {
            res.status(200).json(updated);
        } else {
            res.status(404).json({ error: 'Bank not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update bank' });
    }
});

app.delete('/api/banks/:id', async (req, res) => {
    try {
        const deleted = await Bank.findOneAndDelete({ id: parseInt(req.params.id) });
        if (deleted) {
            res.status(200).json({ message: 'Bank deleted' });
        } else {
            res.status(404).json({ error: 'Bank not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete bank' });
    }
});

// --- Wallet API ---
app.get('/api/wallet', async (req, res) => {
    try {
        const transactions = await Transaction.find({});
        
        const balances = {};
        let totalBalance = 0;
        
        transactions.forEach(tx => {
            if (tx.status === 'DRAFT' || tx.status === 'FAILED') return;
            
            const pId = tx.platformId || 'unassigned';
            if (!balances[pId]) balances[pId] = 0;
            
            const amt = parseFloat(tx.amount);
            if (tx.type === 'ADD' || tx.type === 'SELL') {
                balances[pId] += amt;
                totalBalance += amt;
            } else if (tx.type === 'WITHDRAW' || tx.type === 'BUY') {
                balances[pId] -= amt;
                totalBalance -= amt;
            }
        });
        
        res.json({ transactions, balances, balance: totalBalance });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read wallet' });
    }
});

app.post('/api/wallet/transaction', async (req, res) => {
    try {
        const txData = req.body;
        txData.id = await getNextId(Transaction);
        const tx = await Transaction.create(txData);
        const transactions = await Transaction.find({});
        res.status(201).json({ transactions });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process transaction' });
    }
});

app.put('/api/wallet/transaction/:id', async (req, res) => {
    try {
        const updated = await Transaction.findOneAndUpdate(
            { id: parseInt(req.params.id) },
            req.body,
            { new: true }
        );
        if (updated) {
            res.status(200).json(updated);
        } else {
            res.status(404).json({ error: 'Transaction not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

app.delete('/api/wallet/transaction/:id', async (req, res) => {
    try {
        const deleted = await Transaction.findOneAndDelete({ id: parseInt(req.params.id) });
        if (deleted) {
            res.status(200).json({ message: 'Deleted' });
        } else {
            res.status(404).json({ error: 'Transaction not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

// --- Platforms API ---
app.get('/api/platforms', async (req, res) => {
    try {
        const platforms = await Platform.find({});
        res.json({ platforms });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read platforms' });
    }
});

app.post('/api/platforms', async (req, res) => {
    try {
        const newPlatformData = req.body;
        newPlatformData.id = await getNextId(Platform);
        const platform = await Platform.create(newPlatformData);
        res.status(201).json(platform);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save platform' });
    }
});

app.put('/api/platforms/:id', async (req, res) => {
    try {
        const updated = await Platform.findOneAndUpdate(
            { id: parseInt(req.params.id) },
            req.body,
            { new: true }
        );
        if (updated) {
            res.status(200).json(updated);
        } else {
            res.status(404).json({ error: 'Platform not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update platform' });
    }
});

app.delete('/api/platforms/:id', async (req, res) => {
    try {
        const deleted = await Platform.findOneAndDelete({ id: parseInt(req.params.id) });
        if (deleted) {
            res.status(200).json({ message: 'Platform deleted' });
        } else {
            res.status(404).json({ error: 'Platform not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete platform' });
    }
});

// Export for Vercel
export default app;

// Local runner
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL;
if (!isVercel) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
    });
}
