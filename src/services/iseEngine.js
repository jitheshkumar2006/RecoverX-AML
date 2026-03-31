// Investigation Support Engine (ISE)
import { getAccount, getTransactionsForAccount, getAccounts } from './mockData';
import { calculateTIS } from './tisEngine';
import { getChains, getSuspiciousChains, buildGraph, getChainDepth } from './graphEngine';
import { predictNextMovement } from './predictionEngine';

export function investigate(accountId) {
  const account = getAccount(accountId);
  if (!account) return null;

  const txns = getTransactionsForAccount(accountId);
  const tis = calculateTIS(accountId);
  const prediction = predictNextMovement(accountId);
  const graph = buildGraph();
  const chainDepth = getChainDepth(accountId, graph);
  const chains = getChains(accountId);
  const accounts = getAccounts();

  const suspicionReasons = [];
  const graphInsights = [];

  // Analyze TIS factors
  if (tis.score >= 70) {
    suspicionReasons.push('Extremely high Threat Intelligence Score indicates systematic fraud behavior');
  } else if (tis.score >= 40) {
    suspicionReasons.push('Elevated Threat Intelligence Score warrants close monitoring');
  }

  // Check for rapid successive transactions
  const sortedTxns = [...txns].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  for (let i = 1; i < sortedTxns.length; i++) {
    const timeDiff = (new Date(sortedTxns[i].timestamp) - new Date(sortedTxns[i - 1].timestamp)) / (1000 * 60);
    if (timeDiff < 30) {
      suspicionReasons.push(`Rapid successive transactions detected (${timeDiff.toFixed(0)} minutes apart)`);
      break;
    }
  }

  // Check for structuring (just-below-threshold amounts)
  const largeAmounts = txns.filter(t => t.amount >= 100000);
  if (largeAmounts.length >= 3) {
    suspicionReasons.push(`${largeAmounts.length} high-value transactions (≥₹1,00,000) detected`);
  }

  // Check shared device fingerprint
  const sharedDevice = accounts.filter(a => a.id !== accountId && a.deviceFingerprint === account.deviceFingerprint);
  if (sharedDevice.length > 0) {
    suspicionReasons.push(`Device fingerprint shared with ${sharedDevice.length} other account(s): ${sharedDevice.map(a => a.name).join(', ')}`);
  }

  // Flagged transactions
  const flaggedTxns = txns.filter(t => t.flagged);
  if (flaggedTxns.length > 0) {
    suspicionReasons.push(`${flaggedTxns.length} flagged transaction(s) involving this account`);
  }

  // Graph insights
  graphInsights.push(`Connected to ${new Set(txns.flatMap(t => [t.from, t.to])).size - 1} unique accounts`);
  graphInsights.push(`Transaction chain depth: ${chainDepth}`);
  graphInsights.push(`${chains.length} distinct chain(s) originating from this account`);

  if (chainDepth >= 3) {
    graphInsights.push('Deep chain detected — possible layering/structuring pattern');
  }

  const totalOut = txns.filter(t => t.from === accountId).reduce((s, t) => s + t.amount, 0);
  const totalIn = txns.filter(t => t.to === accountId).reduce((s, t) => s + t.amount, 0);
  if (totalOut > totalIn * 1.5) {
    graphInsights.push('Significant outflow imbalance — potential fund siphoning');
  }

  // Determine suggested action
  let suggestedAction = 'Monitor';
  let actionConfidence = 0;
  let actionReasoning = '';

  if (tis.score >= 70 || (flaggedTxns.length >= 4 && chainDepth >= 3)) {
    suggestedAction = 'Freeze';
    actionConfidence = 92;
    actionReasoning = 'High TIS combined with deep transaction chains and multiple flagged transactions strongly indicates fraudulent activity. Immediate freeze recommended.';
  } else if (tis.score >= 50 || flaggedTxns.length >= 2) {
    suggestedAction = 'Freeze';
    actionConfidence = 75;
    actionReasoning = 'Moderate-to-high risk indicators present. Precautionary freeze recommended pending investigation.';
  } else if (tis.score >= 30) {
    suggestedAction = 'Monitor';
    actionConfidence = 60;
    actionReasoning = 'Some risk indicators present but insufficient for freeze action. Enhanced monitoring recommended.';
  } else {
    suggestedAction = 'Monitor';
    actionConfidence = 40;
    actionReasoning = 'Low risk indicators. Standard monitoring sufficient.';
  }

  return {
    accountId,
    accountName: account.name,
    bank: account.bank,
    status: account.status,
    tis,
    prediction,
    suspicionReasons,
    graphInsights,
    suggestedAction,
    actionConfidence,
    actionReasoning,
    transactionSummary: {
      total: txns.length,
      flagged: flaggedTxns.length,
      totalInflow: totalIn,
      totalOutflow: totalOut,
      netFlow: totalIn - totalOut,
    },
    chainDepth,
    chainCount: chains.length,
  };
}
