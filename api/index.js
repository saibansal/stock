const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const app = express();

app.use(cors());
app.use(express.json());

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL;
const dataDir = isVercel ? '/tmp' : path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const tradesJsonPath = path.join(dataDir, 'database_trades.json');
const tradesXmlPath = path.join(dataDir, 'database_trades.xml');
const walletJsonPath = path.join(dataDir, 'database_wallet.json');
const walletXmlPath = path.join(dataDir, 'database_wallet.xml');
const banksJsonPath = path.join(dataDir, 'database_banks.json');
const banksXmlPath = path.join(dataDir, 'database_banks.xml');
const platformsJsonPath = path.join(dataDir, 'database_platforms.json');
const platformsXmlPath = path.join(dataDir, 'database_platforms.xml');

// Default initial data
const initialTrades = { trades: [] };
const initialWallet = { balance: 0, transactions: [] };
const initialBanks = { banks: [] };
const initialPlatforms = { platforms: [] };

const builder = new xml2js.Builder();

const bundledDataDir = path.join(__dirname, '..', 'data');

function initOrCopy(jsonName, xmlName, initialData) {
    const jsonTmpPath = path.join(dataDir, jsonName);
    const xmlTmpPath = path.join(dataDir, xmlName);
    
    const jsonBundledPath = path.join(bundledDataDir, jsonName);
    const xmlBundledPath = path.join(bundledDataDir, xmlName);

    if (!fs.existsSync(jsonTmpPath)) {
        if (isVercel && fs.existsSync(jsonBundledPath)) {
            fs.copyFileSync(jsonBundledPath, jsonTmpPath);
        } else {
            fs.writeFileSync(jsonTmpPath, JSON.stringify(initialData, null, 2));
        }
    }

    if (!fs.existsSync(xmlTmpPath)) {
        if (isVercel && fs.existsSync(xmlBundledPath)) {
            fs.copyFileSync(xmlBundledPath, xmlTmpPath);
        } else {
            fs.writeFileSync(xmlTmpPath, builder.buildObject({ root: initialData }));
        }
    }
}

function initFiles() {
    initOrCopy('database_trades.json', 'database_trades.xml', initialTrades);
    initOrCopy('database_wallet.json', 'database_wallet.xml', initialWallet);
    initOrCopy('database_banks.json', 'database_banks.xml', initialBanks);
    initOrCopy('database_platforms.json', 'database_platforms.xml', initialPlatforms);
}
initFiles();

function readJson(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
}

function writeData(jsonObj, jsonPath, xmlPath) {
    fs.writeFileSync(jsonPath, JSON.stringify(jsonObj, null, 2));
    const xml = builder.buildObject({ root: jsonObj });
    fs.writeFileSync(xmlPath, xml);
}

// --- Trades API ---
app.get('/api/trades', (req, res) => {
    try {
        const data = readJson(tradesJsonPath);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read trades' });
    }
});

app.post('/api/trades', (req, res) => {
    try {
        const data = readJson(tradesJsonPath);
        const newTrade = req.body;
        newTrade.id = data.trades.length > 0 ? Math.max(...data.trades.map(t => t.id)) + 1 : 1;
        data.trades.push(newTrade);
        writeData(data, tradesJsonPath, tradesXmlPath);
        res.status(201).json(newTrade);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save trade' });
    }
});

app.put('/api/trades/:id', (req, res) => {
    try {
        const data = readJson(tradesJsonPath);
        const index = data.trades.findIndex(t => t.id === parseInt(req.params.id));
        if (index !== -1) {
            data.trades[index] = { ...data.trades[index], ...req.body };
            writeData(data, tradesJsonPath, tradesXmlPath);
            res.status(200).json(data.trades[index]);
        } else {
            res.status(404).json({ error: 'Trade not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update trade' });
    }
});

app.delete('/api/trades/:id', (req, res) => {
    try {
        const data = readJson(tradesJsonPath);
        const index = data.trades.findIndex(t => t.id === parseInt(req.params.id));
        if (index !== -1) {
            data.trades.splice(index, 1);
            writeData(data, tradesJsonPath, tradesXmlPath);
            res.status(200).json({ message: 'Trade deleted' });
        } else {
            res.status(404).json({ error: 'Trade not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete trade' });
    }
});

// --- Bank API ---
app.get('/api/banks', (req, res) => {
    try {
        const data = readJson(banksJsonPath);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read banks' });
    }
});

app.post('/api/banks', (req, res) => {
    try {
        const data = readJson(banksJsonPath);
        const newBank = req.body;
        newBank.id = data.banks.length > 0 ? Math.max(...data.banks.map(b => b.id)) + 1 : 1;
        data.banks.push(newBank);
        writeData(data, banksJsonPath, banksXmlPath);
        res.status(201).json(newBank);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save bank' });
    }
});

app.put('/api/banks/:id', (req, res) => {
    try {
        const data = readJson(banksJsonPath);
        const index = data.banks.findIndex(b => b.id === parseInt(req.params.id));
        if (index !== -1) {
            data.banks[index] = { ...data.banks[index], ...req.body };
            writeData(data, banksJsonPath, banksXmlPath);
            res.status(200).json(data.banks[index]);
        } else {
            res.status(404).json({ error: 'Bank not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update bank' });
    }
});

app.delete('/api/banks/:id', (req, res) => {
    try {
        const data = readJson(banksJsonPath);
        const index = data.banks.findIndex(b => b.id === parseInt(req.params.id));
        if (index !== -1) {
            data.banks.splice(index, 1);
            writeData(data, banksJsonPath, banksXmlPath);
            res.status(200).json({ message: 'Bank deleted' });
        } else {
            res.status(404).json({ error: 'Bank not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete bank' });
    }
});

// --- Wallet API ---
app.get('/api/wallet', (req, res) => {
    try {
        const data = readJson(walletJsonPath);
        
        const balances = {};
        let totalBalance = 0;
        
        data.transactions.forEach(tx => {
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
        
        res.json({ ...data, balances, balance: totalBalance });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read wallet' });
    }
});

app.post('/api/wallet/transaction', (req, res) => {
    try {
        const data = readJson(walletJsonPath);
        const tx = req.body;
        
        tx.id = data.transactions.length > 0 ? Math.max(...data.transactions.map(t => t.id || 0)) + 1 : 1;
        data.transactions.push(tx);
        
        writeData(data, walletJsonPath, walletXmlPath);
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to process transaction' });
    }
});

app.put('/api/wallet/transaction/:id', (req, res) => {
    try {
        const data = readJson(walletJsonPath);
        const index = data.transactions.findIndex(t => t.id === parseInt(req.params.id));
        if (index !== -1) {
            const oldTx = data.transactions[index];
            const newTx = { ...oldTx, ...req.body };
            data.transactions[index] = newTx;
            writeData(data, walletJsonPath, walletXmlPath);
            res.status(200).json(newTx);
        } else {
            res.status(404).json({ error: 'Transaction not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

app.delete('/api/wallet/transaction/:id', (req, res) => {
    try {
        const data = readJson(walletJsonPath);
        const index = data.transactions.findIndex(t => t.id === parseInt(req.params.id));
        if (index !== -1) {
            data.transactions.splice(index, 1);
            writeData(data, walletJsonPath, walletXmlPath);
            res.status(200).json({ message: 'Deleted' });
        } else {
            res.status(404).json({ error: 'Transaction not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});


// --- Platforms API ---
app.get('/api/platforms', (req, res) => {
    try {
        const data = readJson(platformsJsonPath);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read platforms' });
    }
});

app.post('/api/platforms', (req, res) => {
    try {
        const data = readJson(platformsJsonPath);
        const newPlatform = req.body;
        newPlatform.id = data.platforms.length > 0 ? Math.max(...data.platforms.map(p => p.id)) + 1 : 1;
        data.platforms.push(newPlatform);
        writeData(data, platformsJsonPath, platformsXmlPath);
        res.status(201).json(newPlatform);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save platform' });
    }
});

app.put('/api/platforms/:id', (req, res) => {
    try {
        const data = readJson(platformsJsonPath);
        const index = data.platforms.findIndex(p => p.id === parseInt(req.params.id));
        if (index !== -1) {
            data.platforms[index] = { ...data.platforms[index], ...req.body };
            writeData(data, platformsJsonPath, platformsXmlPath);
            res.status(200).json(data.platforms[index]);
        } else {
            res.status(404).json({ error: 'Platform not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update platform' });
    }
});

app.delete('/api/platforms/:id', (req, res) => {
    try {
        const data = readJson(platformsJsonPath);
        const index = data.platforms.findIndex(p => p.id === parseInt(req.params.id));
        if (index !== -1) {
            data.platforms.splice(index, 1);
            writeData(data, platformsJsonPath, platformsXmlPath);
            res.status(200).json({ message: 'Platform deleted' });
        } else {
            res.status(404).json({ error: 'Platform not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete platform' });
    }
});

// Export for Vercel
module.exports = app;

// Add local runner just in case
if (!isVercel) {
    const PORT = 3001;
    app.listen(PORT, () => {
        console.log(`Local dev server running on http://localhost:${PORT}`);
    });
}
