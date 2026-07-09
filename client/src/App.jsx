import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [activeTab, setActiveTab] = useState('trades');
  const [trades, setTrades] = useState([]);
  const [banks, setBanks] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });

  // Forms
  const [tradeForm, setTradeForm] = useState({ name: '', quantity: 1, buyPrice: '', buyDate: '', platformId: '' });
  const [editingTrade, setEditingTrade] = useState(null);
  const [bankForm, setBankForm] = useState({ bankName: '', openingBalance: '', accountNumber: '' });
  const [editingBank, setEditingBank] = useState(null);
  
  const [platforms, setPlatforms] = useState([]);
  const [platformForm, setPlatformForm] = useState({ platformName: '', url: '', description: '', status: 'OPENED' });
  const [editingPlatform, setEditingPlatform] = useState(null);

  const [walletForm, setWalletForm] = useState({ type: 'ADD', amount: '', description: '', bankId: '', platformId: '', date: '', status: 'COMPLETED' });
  
  const [editingTx, setEditingTx] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tRes, bRes, wRes, pRes] = await Promise.all([
        fetch(`${API_BASE}/trades`),
        fetch(`${API_BASE}/banks`),
        fetch(`${API_BASE}/wallet`),
        fetch(`${API_BASE}/platforms`)
      ]);
      const tData = await tRes.json();
      const bData = await bRes.json();
      const wData = await wRes.json();
      const pData = await pRes.json();
      setTrades(tData.trades || []);
      setBanks(bData.banks || []);
      setWallet(wData || { balance: 0, transactions: [] });
      setPlatforms(pData.platforms || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTrade = async (e) => {
    e.preventDefault();
    const invAmount = tradeForm.quantity * tradeForm.buyPrice;
    
    if (editingTrade) {
        const oldInvAmount = editingTrade.quantity * editingTrade.buyPrice;
        if (wallet.balance + oldInvAmount < invAmount) {
            alert("Insufficient wallet balance for this updated trade!");
            return;
        }
        try {
            await fetch(`${API_BASE}/trades/${editingTrade.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tradeForm)
            });
            if (oldInvAmount !== invAmount) {
                await fetch(`${API_BASE}/wallet/transaction`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'SELL', amount: oldInvAmount, description: `Reversed old buy for ${editingTrade.name}` })
                });
                await fetch(`${API_BASE}/wallet/transaction`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'BUY', amount: invAmount, description: `Updated buy for ${tradeForm.name}` })
                });
            }
            setTradeForm({ name: '', quantity: 1, buyPrice: '', buyDate: '' });
            setEditingTrade(null);
            fetchData();
        } catch (e) { console.error(e); }
    } else {
        if (wallet.balance < invAmount) {
          alert("Insufficient wallet balance for this trade!");
          return;
        }
        try {
          await fetch(`${API_BASE}/trades`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tradeForm)
          });
          // Deduct from wallet if buying new stock
          if (!editingTrade) {
            await fetch(`${API_BASE}/wallet/transaction`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'BUY', amount: invAmount, description: `Bought ${tradeForm.quantity} of ${tradeForm.name}`, platformId: tradeForm.platformId, date: tradeForm.buyDate })
            });
          }
          
          setTradeForm({ name: '', quantity: 1, buyPrice: '', buyDate: '', platformId: '' });
          setEditingTrade(null);
          fetchData();
        } catch (e) { console.error(e); }
    }
  };

  const handleUpdateTrade = async (id, field, value) => {
    try {
      await fetch(`${API_BASE}/trades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleSellTrade = async (trade) => {
    if (!trade.sellPrice || !trade.sellDate) {
      alert("Please enter Sell Price and Sell Date");
      return;
    }
    const sellAmount = trade.quantity * trade.sellPrice;
    try {
      // Mark as sold
      await fetch(`${API_BASE}/trades/${trade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SOLD' })
      });
      // Add sell amount to wallet
      await fetch(`${API_BASE}/wallet/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SELL', amount: sellAmount, description: `Sold ${trade.quantity} of ${trade.name}`, platformId: trade.platformId, date: trade.sellDate })
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleAddBank = async (e) => {
    e.preventDefault();
    const url = editingBank ? `${API_BASE}/banks/${editingBank.id}` : `${API_BASE}/banks`;
    const method = editingBank ? 'PUT' : 'POST';
    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm)
      });
      setBankForm({ bankName: '', openingBalance: '', accountNumber: '' });
      setEditingBank(null);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleEditBank = (bank) => {
    setEditingBank(bank);
    setBankForm({ bankName: bank.bankName, openingBalance: bank.openingBalance || '', accountNumber: bank.accountNumber || '' });
    window.scrollTo(0, 0);
  };

  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    setTradeForm({ name: trade.name, quantity: trade.quantity, buyPrice: trade.buyPrice, buyDate: trade.buyDate, platformId: trade.platformId || '' });
    window.scrollTo(0, 0);
  };

  const handleDeleteBank = async (bank) => {
    if(!window.confirm('Delete this bank account?')) return;
    try {
      await fetch(`${API_BASE}/banks/${bank.id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleAddPlatform = async (e) => {
    e.preventDefault();
    const url = editingPlatform ? `${API_BASE}/platforms/${editingPlatform.id}` : `${API_BASE}/platforms`;
    const method = editingPlatform ? 'PUT' : 'POST';
    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platformForm)
      });
      setPlatformForm({ platformName: '', url: '', description: '', status: 'OPENED' });
      setEditingPlatform(null);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleEditPlatform = (platform) => {
    setEditingPlatform(platform);
    setPlatformForm({ platformName: platform.platformName, url: platform.url || '', description: platform.description || '', status: platform.status || 'OPENED' });
    window.scrollTo(0, 0);
  };

  const handleDeletePlatform = async (platform) => {
    if(!window.confirm('Delete this trading platform?')) return;
    try {
      await fetch(`${API_BASE}/platforms/${platform.id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleWalletTx = async (e) => {
    e.preventDefault();
    const url = editingTx ? `${API_BASE}/wallet/transaction/${editingTx.id}` : `${API_BASE}/wallet/transaction`;
    const method = editingTx ? 'PUT' : 'POST';
    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(walletForm)
      });
      setWalletForm({ type: 'ADD', amount: '', description: '', bankId: '', platformId: '', date: '', status: 'COMPLETED' });
      setEditingTx(null);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const deleteWalletTx = async (id) => {
    if(!window.confirm('Delete this transaction?')) return;
    try {
      await fetch(`${API_BASE}/wallet/transaction/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDeleteTrade = async (trade) => {
    if(!window.confirm('Delete this trade?')) return;
    try {
      const res = await fetch(`${API_BASE}/trades/${trade.id}`, { method: 'DELETE' });
      if (res.ok) {
          if (!trade.status || trade.status !== 'SOLD') {
             const invAmount = trade.quantity * trade.buyPrice;
             await fetch(`${API_BASE}/wallet/transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'SELL', amount: invAmount, description: `Refunded deleted trade ${trade.name}`, platformId: trade.platformId })
             });
          }
      }
      fetchData();
    } catch (e) { console.error(e); }
  };

  const editWalletTx = (tx) => {
    setEditingTx(tx);
    setWalletForm({ type: tx.type, amount: tx.amount, description: tx.description || '', bankId: tx.bankId || '', platformId: tx.platformId || '', date: tx.date || '', status: tx.status || 'COMPLETED' });
    setActiveTab('wallet');
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">📈 StockTracker</div>
        <nav className="sidebar-nav">
          <button className={`sidebar-link ${activeTab === 'trades' ? 'active' : ''}`} onClick={() => setActiveTab('trades')}>📉 Trades</button>
          <button className={`sidebar-link ${activeTab === 'banks' ? 'active' : ''}`} onClick={() => setActiveTab('banks')}>🏦 Bank Accounts</button>
          <button className={`sidebar-link ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => setActiveTab('wallet')}>👛 Wallet</button>
          <button className={`sidebar-link ${activeTab === 'platforms' ? 'active' : ''}`} onClick={() => setActiveTab('platforms')}>🖥️ Platforms</button>
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <h2>Dashboard</h2>
          <div className="glass-panel" style={{ padding: '0.5rem 1rem' }}>
            <strong>Total Wallet Balance:</strong> ₹{(wallet.balance || 0).toFixed(2)}
            {wallet.balances && Object.keys(wallet.balances).map(pId => (
               <div key={pId} style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.2rem' }}>
                 {platforms.find(p=>p.id == pId)?.platformName || 'General'}: ₹{(wallet.balances[pId] || 0).toFixed(2)}
               </div>
            ))}
          </div>
        </header>

        {activeTab === 'trades' && (
          <div>
            <div className="glass-panel" style={{ marginBottom: '2rem' }}>
              <h3>{editingTrade ? 'Edit Trade' : 'Add New Trade'}</h3>
              <form onSubmit={handleAddTrade} className="form-grid">
                <input className="form-control" placeholder="Stock Name" required value={tradeForm.name} onChange={e => setTradeForm({...tradeForm, name: e.target.value})} />
                <input className="form-control" type="number" min="1" placeholder="Quantity" required value={tradeForm.quantity} onChange={e => setTradeForm({...tradeForm, quantity: parseFloat(e.target.value)})} />
                <input className="form-control" type="number" step="0.01" placeholder="Buy Price" required value={tradeForm.buyPrice} onChange={e => setTradeForm({...tradeForm, buyPrice: parseFloat(e.target.value)})} />
                <input className="form-control" type="date" required value={tradeForm.buyDate} onChange={e => setTradeForm({...tradeForm, buyDate: e.target.value})} />
                <select className="form-control" required value={tradeForm.platformId} onChange={e => setTradeForm({...tradeForm, platformId: e.target.value})}>
                  <option value="">Select Platform</option>
                  {platforms.filter(p => p.status !== 'CLOSED' || p.id == tradeForm.platformId).map(p => <option key={p.id} value={p.id}>{p.platformName}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn" type="submit">{editingTrade ? 'Update Trade' : 'Buy Stock'}</button>
                  {editingTrade && <button className="btn btn-danger" type="button" onClick={() => { setEditingTrade(null); setTradeForm({ name: '', quantity: 1, buyPrice: '', buyDate: '', platformId: '' }); }}>Cancel</button>}
                </div>
              </form>
            </div>

            <div className="glass-panel">
              <h3>Trade Ledger</h3>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Sr No</th>
                      <th>Platform</th>
                      <th>Name</th>
                      <th>Qty</th>
                      <th>Buy Price</th>
                      <th>Buy Date</th>
                      <th>Inv. Amt</th>
                      <th>Sell Price</th>
                      <th>Sell Date</th>
                      <th>Sell Amt</th>
                      <th>P/L</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t, index) => {
                      const invAmt = t.quantity * t.buyPrice;
                      const sellAmt = t.sellPrice ? t.quantity * t.sellPrice : 0;
                      const pl = t.sellPrice ? sellAmt - invAmt : 0;
                      return (
                        <tr key={t.id}>
                          <td>{index + 1}</td>
                          <td>{t.platformId ? platforms.find(p=>p.id == t.platformId)?.platformName : '-'}</td>
                          <td>{t.name}</td>
                          <td>{t.quantity}</td>
                          <td>{t.buyPrice}</td>
                          <td>{t.buyDate}</td>
                          <td>{invAmt.toFixed(2)}</td>
                          <td>
                            <input className="form-control" type="number" step="0.01" style={{width: '80px'}} value={t.sellPrice || ''} onChange={e => handleUpdateTrade(t.id, 'sellPrice', parseFloat(e.target.value))} />
                          </td>
                          <td>
                            <input className="form-control" type="date" value={t.sellDate || ''} onChange={e => handleUpdateTrade(t.id, 'sellDate', e.target.value)} />
                          </td>
                          <td>{sellAmt ? sellAmt.toFixed(2) : '-'}</td>
                          <td className={pl > 0 ? 'text-success' : pl < 0 ? 'text-danger' : ''}>{pl ? pl.toFixed(2) : '-'}</td>
                          <td>
                            {!t.status || t.status !== 'SOLD' ? (
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button className="btn btn-success" onClick={() => handleSellTrade(t)}>Sell</button>
                                <button className="btn" onClick={() => handleEditTrade(t)}>Edit</button>
                                <button className="btn btn-danger" onClick={() => handleDeleteTrade(t)}>Del</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <span>Sold</span>
                                <button className="btn btn-danger" onClick={() => handleDeleteTrade(t)}>Del</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'banks' && (
          <div>
            <div className="glass-panel" style={{ marginBottom: '2rem' }}>
              <h3>{editingBank ? 'Edit Bank Account' : 'Add Bank Account'}</h3>
              <form onSubmit={handleAddBank} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <input className="form-control" placeholder="Bank Name (e.g. HDFC Bank)" required value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} />
                <input className="form-control" placeholder="Account Number" value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} />
                <input className="form-control" type="number" step="0.01" placeholder="Opening Balance (Optional)" value={bankForm.openingBalance} onChange={e => setBankForm({...bankForm, openingBalance: e.target.value})} />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn" type="submit">{editingBank ? 'Update Bank' : 'Add Bank'}</button>
                  {editingBank && <button className="btn btn-danger" type="button" onClick={() => { setEditingBank(null); setBankForm({ bankName: '', openingBalance: '' }); }}>Cancel</button>}
                </div>
              </form>
            </div>
            <div className="glass-panel">
              <h3>Registered Banks</h3>
              <table>
                <thead>
                  <tr><th>ID</th><th>Bank Name</th><th>Account Number</th><th>Opening Balance</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {banks.map(b => (
                    <tr key={b.id}>
                      <td>{b.id}</td>
                      <td>{b.bankName}</td>
                      <td>{b.accountNumber || '-'}</td>
                      <td>{b.openingBalance ? `₹${parseFloat(b.openingBalance).toFixed(2)}` : '-'}</td>
                      <td>
                        <button className="btn" style={{marginRight: '0.5rem'}} onClick={() => handleEditBank(b)}>Edit</button>
                        <button className="btn btn-danger" onClick={() => handleDeleteBank(b)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div>
            <div className="glass-panel" style={{ marginBottom: '2rem' }}>
              <h3>{editingTx ? 'Edit Transaction' : 'Add/Withdraw Funds'}</h3>
              <form onSubmit={handleWalletTx} className="form-grid">
                <select className="form-control" value={walletForm.type} onChange={e => setWalletForm({...walletForm, type: e.target.value})}>
                  <option value="ADD">Add Funds</option>
                  <option value="WITHDRAW">Withdraw Funds</option>
                </select>
                <input className="form-control" type="number" step="0.01" placeholder="Amount" required value={walletForm.amount} onChange={e => setWalletForm({...walletForm, amount: parseFloat(e.target.value)})} />
                {(walletForm.type === 'WITHDRAW' || walletForm.type === 'ADD') && (
                  <select className="form-control" required value={walletForm.bankId} onChange={e => setWalletForm({...walletForm, bankId: e.target.value})}>
                    <option value="">Select Bank Account</option>
                    {banks.map(b => <option key={b.id} value={b.id}>{b.bankName}</option>)}
                  </select>
                )}
                <select className="form-control" required value={walletForm.platformId} onChange={e => setWalletForm({...walletForm, platformId: e.target.value})}>
                  <option value="">Select Platform</option>
                  {platforms.filter(p => p.status !== 'CLOSED' || p.id == walletForm.platformId).map(p => <option key={p.id} value={p.id}>{p.platformName}</option>)}
                </select>
                <select className="form-control" value={walletForm.status} onChange={e => setWalletForm({...walletForm, status: e.target.value})}>
                  <option value="COMPLETED">Completed</option>
                  <option value="DRAFT">Draft</option>
                  <option value="FAILED">Failed</option>
                </select>
                <input className="form-control" type="date" required value={walletForm.date} onChange={e => setWalletForm({...walletForm, date: e.target.value})} />
                <input className="form-control" placeholder="Description (Optional)" value={walletForm.description} onChange={e => setWalletForm({...walletForm, description: e.target.value})} />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn" type="submit">{editingTx ? 'Update' : 'Submit'}</button>
                  {editingTx && <button className="btn btn-danger" type="button" onClick={() => { setEditingTx(null); setWalletForm({ type: 'ADD', amount: '', description: '', bankId: '', platformId: '', date: '', status: 'COMPLETED' }); }}>Cancel</button>}
                </div>
              </form>
            </div>
            <div className="glass-panel">
              <h3>Transaction History</h3>
              <table>
                <thead>
                  <tr><th>ID</th><th>Date</th><th>Platform</th><th>Type</th><th>Status</th><th>Amount</th><th>Bank</th><th>Description</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {wallet.transactions.map(tx => (
                    <tr key={tx.id}>
                      <td>{tx.id}</td>
                      <td>{tx.date || (tx.type === 'BUY' && tx.description?.startsWith('Bought') ? trades.find(t => tx.description.includes(t.name))?.buyDate : '') || '-'}</td>
                      <td>{tx.platformId ? platforms.find(p=>p.id == tx.platformId)?.platformName : '-'}</td>
                      <td className={tx.type === 'ADD' || tx.type === 'SELL' ? 'text-success' : 'text-danger'}>{tx.type}</td>
                      <td>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', background: tx.status === 'FAILED' ? '#dc3545' : tx.status === 'DRAFT' ? '#ffc107' : '#28a745', color: (tx.status === 'DRAFT') ? '#000' : '#fff' }}>
                          {tx.status || 'COMPLETED'}
                        </span>
                      </td>
                      <td>{tx.amount}</td>
                      <td>{tx.bankId ? banks.find(b=>b.id == tx.bankId)?.bankName : '-'}</td>
                      <td>{tx.description}</td>
                      <td>
                        <button className="btn" style={{marginRight: '0.5rem'}} onClick={() => editWalletTx(tx)}>Edit</button>
                        <button className="btn btn-danger" onClick={() => deleteWalletTx(tx.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'platforms' && (
          <div>
            <div className="glass-panel" style={{ marginBottom: '2rem' }}>
              <h3>{editingPlatform ? 'Edit Trading Platform' : 'Add Trading Platform'}</h3>
              <form onSubmit={handleAddPlatform} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <input className="form-control" placeholder="Platform Name (e.g. Zerodha)" required value={platformForm.platformName} onChange={e => setPlatformForm({...platformForm, platformName: e.target.value})} />
                <input className="form-control" placeholder="URL / Website" value={platformForm.url} onChange={e => setPlatformForm({...platformForm, url: e.target.value})} />
                <input className="form-control" placeholder="Notes / User ID" value={platformForm.description} onChange={e => setPlatformForm({...platformForm, description: e.target.value})} />
                <select className="form-control" value={platformForm.status} onChange={e => setPlatformForm({...platformForm, status: e.target.value})}>
                  <option value="OPENED">Opened</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn" type="submit">{editingPlatform ? 'Update Platform' : 'Add Platform'}</button>
                  {editingPlatform && <button className="btn btn-danger" type="button" onClick={() => { setEditingPlatform(null); setPlatformForm({ platformName: '', url: '', description: '', status: 'OPENED' }); }}>Cancel</button>}
                </div>
              </form>
            </div>
            <div className="glass-panel">
              <h3>Registered Trading Platforms</h3>
              <table>
                <thead>
                  <tr><th>ID</th><th>Platform Name</th><th>Status</th><th>URL</th><th>Notes</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {platforms.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.platformName}</td>
                      <td>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', background: p.status === 'CLOSED' ? '#dc3545' : '#28a745', color: '#fff' }}>
                          {p.status || 'OPENED'}
                        </span>
                      </td>
                      <td>{p.url ? <a href={p.url.startsWith('http') ? p.url : `https://${p.url}`} target="_blank" rel="noopener noreferrer">{p.url}</a> : '-'}</td>
                      <td>{p.description || '-'}</td>
                      <td>
                        <button className="btn" style={{marginRight: '0.5rem'}} onClick={() => handleEditPlatform(p)}>Edit</button>
                        <button className="btn btn-danger" onClick={() => handleDeletePlatform(p)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
