// Prediction Engine — Predicts next likely fund movement
import { getTransactions, getAccounts } from './mockData';
import { buildGraph } from './graphEngine';

export function predictNextMovement(accountId) {
  const transactions = getTransactions();
  const accounts = getAccounts();
  const graph = buildGraph();

  const outgoing = transactions.filter(t => t.from === accountId);
  const account = accounts.find(a => a.id === accountId);

  if (outgoing.length === 0) {
    return {
      predictedAccount: null,
      confidence: 0,
      reasoning: 'No outgoing transactions found for this account.',
      riskLevel: 'Low',
      predictedAmount: 0,
    };
  }

  // Analyze frequency of transfers to each destination
  const destFrequency = {};
  const destAmounts = {};
  outgoing.forEach(txn => {
    destFrequency[txn.to] = (destFrequency[txn.to] || 0) + 1;
    destAmounts[txn.to] = (destAmounts[txn.to] || 0) + txn.amount;
  });

  // Score each potential destination
  const candidates = Object.keys(destFrequency).map(destId => {
    const destAccount = accounts.find(a => a.id === destId);
    const freq = destFrequency[destId];
    const totalToThis = destAmounts[destId];
    const avgAmount = totalToThis / freq;

    // Check if destination has onward transfers (layering behavior)
    const onwardTxns = transactions.filter(t => t.from === destId);
    const layeringScore = onwardTxns.length > 0 ? 20 : 0;

    // Check for shared device fingerprint
    const sharedDevice = account && destAccount && account.deviceFingerprint === destAccount.deviceFingerprint ? 15 : 0;

    // Recency bonus
    const lastTxn = outgoing.filter(t => t.to === destId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    const recencyDays = (new Date('2026-03-29') - new Date(lastTxn.timestamp)) / (1000 * 60 * 60 * 24);
    const recencyScore = recencyDays < 3 ? 20 : recencyDays < 7 ? 10 : 0;

    const score = (freq * 15) + layeringScore + sharedDevice + recencyScore;

    return {
      accountId: destId,
      accountName: destAccount?.name || 'Unknown',
      bank: destAccount?.bank || 'Unknown',
      score,
      frequency: freq,
      avgAmount,
      hasLayering: onwardTxns.length > 0,
      sharedDevice: sharedDevice > 0,
    };
  });

  candidates.sort((a, b) => b.score - a.score);

  const topCandidate = candidates[0];
  if (!topCandidate) {
    return { predictedAccount: null, confidence: 0, reasoning: 'Unable to determine prediction.', riskLevel: 'Low', predictedAmount: 0 };
  }

  const maxScore = 70;
  const confidence = Math.min(Math.round((topCandidate.score / maxScore) * 100), 98);

  const reasons = [];
  reasons.push(`${topCandidate.frequency} previous transfer(s) to ${topCandidate.accountName}`);
  if (topCandidate.hasLayering) reasons.push('Destination account shows layering behavior (onward transfers)');
  if (topCandidate.sharedDevice) reasons.push('Shared device fingerprint detected');
  reasons.push(`Average transfer amount: ₹${topCandidate.avgAmount.toLocaleString()}`);

  return {
    predictedAccount: topCandidate.accountId,
    predictedAccountName: topCandidate.accountName,
    predictedBank: topCandidate.bank,
    confidence,
    reasoning: reasons.join('. ') + '.',
    riskLevel: confidence >= 70 ? 'High' : confidence >= 40 ? 'Medium' : 'Low',
    predictedAmount: Math.round(topCandidate.avgAmount),
    alternatives: candidates.slice(1, 3).map(c => ({
      accountId: c.accountId,
      accountName: c.accountName,
      confidence: Math.min(Math.round((c.score / maxScore) * 100), 95),
    })),
  };
}
