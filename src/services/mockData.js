// RecoverX Mock Data Layer
// Simulates banking data for fraud detection demo

const seedAccounts = [
  { id: 'ACC001', name: 'Rajesh Kumar', bank: 'Indian Overseas Bank (IOB)', status: 'active', tis: 12, deviceFingerprint: 'fp_a1b2c3', govId: 'BKPK1234A', phone: '9876543210', email: 'rajesh.kumar@gmail.com', linkedAccounts: ['ACC002'], createdAt: '2025-11-15', type: 'savings', balance: 245000 },
  { id: 'ACC002', name: 'Priya Sharma', bank: 'Indian Overseas Bank (IOB)', status: 'active', tis: 8, deviceFingerprint: 'fp_d4e5f6', govId: 'CAPS5678D', phone: '9123456780', email: 'priya.sharma@outlook.com', linkedAccounts: ['ACC001'], createdAt: '2025-10-20', type: 'current', balance: 890000 },
  { id: 'ACC003', name: 'Vikram Singh', bank: 'Indian Overseas Bank (IOB)', status: 'active', tis: 45, deviceFingerprint: 'fp_g7h8i9', govId: 'DSPS9012B', phone: '8877665544', email: 'vikram.s@yahoo.com', linkedAccounts: ['ACC004', 'ACC005'], createdAt: '2026-01-05', type: 'savings', balance: 120000 },
  { id: 'ACC004', name: 'Ankit Patel', bank: 'Indian Overseas Bank (IOB)', status: 'active', tis: 88, deviceFingerprint: 'fp_j0k1l2', govId: 'APPP3456C', phone: '7788990011', email: 'ankit.patel@tempmail.com', linkedAccounts: ['ACC003', 'ACC005'], createdAt: '2026-02-10', type: 'current', balance: 3400000 },
  { id: 'ACC005', name: 'Sneha Reddy', bank: 'Indian Overseas Bank (IOB)', status: 'active', tis: 55, deviceFingerprint: 'fp_m3n4o5', govId: 'ERSR7890D', phone: '6655443322', email: 'sneha.reddy@iob.in', linkedAccounts: ['ACC003'], createdAt: '2026-01-22', type: 'savings', balance: 78000 },
];

const seedTransactions = [
  { id: 'TXN001', from: 'ACC001', to: 'ACC002', amount: 50000, timestamp: '2026-03-20T10:30:00', type: 'transfer', status: 'completed', flagged: false },
  { id: 'TXN002', from: 'ACC002', to: 'ACC003', amount: 120000, timestamp: '2026-03-20T11:15:00', type: 'transfer', status: 'completed', flagged: true },
  { id: 'TXN003', from: 'ACC003', to: 'ACC004', amount: 115000, timestamp: '2026-03-20T11:45:00', type: 'transfer', status: 'completed', flagged: true },
  { id: 'TXN004', from: 'ACC001', to: 'ACC003', amount: 75000, timestamp: '2026-03-21T10:00:00', type: 'transfer', status: 'completed', flagged: false },
  { id: 'TXN005', from: 'ACC004', to: 'ACC005', amount: 95000, timestamp: '2026-03-21T14:30:00', type: 'transfer', status: 'completed', flagged: true },
  { id: 'TXN006', from: 'ACC005', to: 'ACC004', amount: 80000, timestamp: '2026-03-22T11:00:00', type: 'transfer', status: 'completed', flagged: true },
];

let accounts = [];
let transactions = [];
let alerts = [];
let actionLog = [];
let pendingReviews = [];

export const getAccounts = () => [...accounts];
export const getAccount = (id) => accounts.find(a => a.id === id);

export const getTransactions = () => [...transactions];
export const getTransactionsForAccount = (id) => transactions.filter(t => t.from === id || t.to === id);

export const getAlerts = () => [...alerts];

export const getActionLog = () => [...actionLog];

export const getPendingReviews = () => [...pendingReviews];

export const addPendingReview = (review) => {
  pendingReviews = [review, ...pendingReviews];
  return review;
};

export const updatePendingReview = (id, updates) => {
  pendingReviews = pendingReviews.map(r => r.id === id ? { ...r, ...updates } : r);
  return pendingReviews.find(r => r.id === id);
};

export const addAccount = (account) => {
  accounts = [...accounts, account];
  return account;
};

export const addTransaction = (txn) => {
  transactions = [...transactions, txn];
  return txn;
};

export const updateAccountStatus = (id, status) => {
  accounts = accounts.map(a => a.id === id ? { ...a, status } : a);
  return accounts.find(a => a.id === id);
};

export const updateAccountTIS = (id, tis) => {
  accounts = accounts.map(a => a.id === id ? { ...a, tis } : a);
};

export const addAlert = (alert) => {
  alerts = [...alerts, alert];
  return alert;
};

export const updateAlertStatus = (id, status) => {
  alerts = alerts.map(a => a.id === id ? { ...a, status } : a);
};

export const logAction = (action) => {
  const entry = { ...action, id: `ACT${String(actionLog.length + 1).padStart(3, '0')}`, timestamp: new Date().toISOString() };
  actionLog = [...actionLog, entry];
  return entry;
};

export const generateAccountId = () => `ACC${String(accounts.length + 1).padStart(3, '0')}`;
export const generateTxnId = () => `TXN${String(transactions.length + 1).padStart(3, '0')}`;
export const generateAlertId = () => `ALT${String(alerts.length + 1).padStart(3, '0')}`;

// Bank Integration Event Emitter
let integrationListeners = [];
export const subscribeToIntegrations = (fn) => {
  integrationListeners.push(fn);
  return () => { integrationListeners = integrationListeners.filter(l => l !== fn); };
};

export const simulateExternalBankBatch = (bankName) => {
  // If this is the first ingestion, flood the system with the base core banking ledger data
  if (accounts.length === 0) {
    accounts = [...seedAccounts];
    transactions = [...seedTransactions];
  }

  // We keep the generic simulate function name but change logic to live IOB transactions
  // 1. Create a new suspected Mule Account that just opened in IOB
  const muleId = generateAccountId();
  addAccount({
    id: muleId,
    name: `Unknown Customer`,
    bank: 'Indian Overseas Bank (IOB)',
    status: 'active',
    tis: 92,
    deviceFingerprint: 'fp_suspect_mule',
    govId: 'ZZZZ9999Z',
    phone: '6000000000',
    email: 'unknown@mailinator.com',
    linkedAccounts: [],
    createdAt: new Date().toISOString().slice(0, 10),
    type: 'savings',
    balance: 4500000
  });

  // 2. Find internal local accounts to act as victims
  const victim1 = accounts[1] || accounts[0];
  const victim2 = accounts[2] || accounts[0];

  // 3. Inject rapid structuring transactions from victims to the new mule
  const tx1 = { id: generateTxnId(), from: victim1.id, to: muleId, amount: 2500000, timestamp: new Date().toISOString(), type: 'transfer', status: 'completed', flagged: true };
  addTransaction(tx1);
  const tx2 = { id: generateTxnId(), from: victim2.id, to: muleId, amount: 1800000, timestamp: new Date(Date.now() + 5000).toISOString(), type: 'transfer', status: 'completed', flagged: true };
  addTransaction(tx2);

  // 4. Boost local TIS score of the victims due to compromised accounts
  updateAccountTIS(victim1.id, Math.min(100, victim1.tis + 40));
  updateAccountTIS(victim2.id, Math.min(100, victim2.tis + 40));

  // 5. Fire integration alert showing live mule detection
  integrationListeners.forEach(fn => fn({ type: 'batch_received', entity: 'Suspected Mule', txns: [tx1, tx2], localId: muleId }));
  
  return [tx1, tx2];
};
