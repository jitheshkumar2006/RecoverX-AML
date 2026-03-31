// TIS (Threat Intelligence Score) Calculation Engine
import { getTransactionsForAccount, getAccounts } from './mockData';
import { buildGraph, getChainDepth } from './graphEngine';

export function calculateTIS(accountId) {
  const accounts = getAccounts();
  const account = accounts.find(a => a.id === accountId);
  if (!account) return { score: 0, level: 'Low', factors: [] };

  const txns = getTransactionsForAccount(accountId);
  const graph = buildGraph();
  const factors = [];

  // Factor 1: Number of connections (25%)
  const connections = new Set();
  txns.forEach(t => {
    if (t.from === accountId) connections.add(t.to);
    if (t.to === accountId) connections.add(t.from);
  });
  const connectionScore = Math.min(connections.size * 12, 25);
  factors.push({ name: 'Connections', value: connections.size, score: connectionScore, max: 25, detail: `${connections.size} unique connected accounts` });

  // Factor 2: Chain depth (25%)
  const depth = getChainDepth(accountId, graph);
  const depthScore = Math.min(depth * 6, 25);
  factors.push({ name: 'Chain Depth', value: depth, score: depthScore, max: 25, detail: `Transaction chain depth of ${depth}` });

  // Factor 3: Transaction amount (25%)
  const totalAmount = txns.reduce((sum, t) => sum + t.amount, 0);
  const amountScore = Math.min(Math.floor(totalAmount / 200000), 25);
  factors.push({ name: 'Transaction Volume', value: totalAmount, score: amountScore, max: 25, detail: `₹${totalAmount.toLocaleString()} total volume` });

  // Factor 4: Frequency (25%)
  const flaggedCount = txns.filter(t => t.flagged).length;
  const freqScore = Math.min(flaggedCount * 5, 25);
  factors.push({ name: 'Flagged Frequency', value: flaggedCount, score: freqScore, max: 25, detail: `${flaggedCount} flagged transactions` });

  // Device fingerprint bonus
  const sharedDevice = accounts.filter(a => a.id !== accountId && a.deviceFingerprint === account.deviceFingerprint);
  let deviceBonus = 0;
  if (sharedDevice.length > 0) {
    deviceBonus = Math.min(sharedDevice.length * 5, 10);
    factors.push({ name: 'Shared Device', value: sharedDevice.length, score: deviceBonus, max: 10, detail: `Device shared with ${sharedDevice.length} accounts` });
  }

  const totalScore = Math.min(connectionScore + depthScore + amountScore + freqScore + deviceBonus, 100);
  const level = totalScore >= 70 ? 'High' : totalScore >= 40 ? 'Medium' : 'Low';

  return { score: totalScore, level, factors };
}

export function getTISColor(level) {
  switch (level) {
    case 'High': return '#ff1744';
    case 'Medium': return '#ff9100';
    case 'Low': return '#00e676';
    default: return '#546e7a';
  }
}

export function getTISGradient(level) {
  switch (level) {
    case 'High': return 'linear-gradient(135deg, #ff1744, #d50000)';
    case 'Medium': return 'linear-gradient(135deg, #ff9100, #e65100)';
    case 'Low': return 'linear-gradient(135deg, #00e676, #00c853)';
    default: return 'linear-gradient(135deg, #546e7a, #37474f)';
  }
}
