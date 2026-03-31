// Graph Analysis Engine
import { getTransactions, getAccounts } from './mockData';

export function buildGraph() {
  const transactions = getTransactions();
  const adjacency = {};

  transactions.forEach(txn => {
    if (!adjacency[txn.from]) adjacency[txn.from] = [];
    if (!adjacency[txn.to]) adjacency[txn.to] = [];
    adjacency[txn.from].push({ target: txn.to, txn });
    adjacency[txn.to].push({ target: txn.from, txn });
  });

  return adjacency;
}

export function getOutgoingEdges(accountId) {
  const transactions = getTransactions();
  return transactions.filter(t => t.from === accountId);
}

export function getIncomingEdges(accountId) {
  const transactions = getTransactions();
  return transactions.filter(t => t.to === accountId);
}

export function getChains(accountId, maxDepth = 5) {
  const transactions = getTransactions();
  const chains = [];

  function dfs(currentId, chain, visited, depth) {
    if (depth >= maxDepth) { chains.push([...chain]); return; }
    const outgoing = transactions.filter(t => t.from === currentId && !visited.has(t.to));
    if (outgoing.length === 0) { chains.push([...chain]); return; }
    for (const txn of outgoing) {
      visited.add(txn.to);
      chain.push({ accountId: txn.to, txn });
      dfs(txn.to, chain, visited, depth + 1);
      chain.pop();
      visited.delete(txn.to);
    }
  }

  const visited = new Set([accountId]);
  dfs(accountId, [{ accountId, txn: null }], visited, 0);
  return chains;
}

export function getChainDepth(accountId, graph) {
  if (!graph) graph = buildGraph();
  const visited = new Set();
  let maxDepth = 0;

  function dfs(nodeId, depth) {
    visited.add(nodeId);
    maxDepth = Math.max(maxDepth, depth);
    const neighbors = graph[nodeId] || [];
    for (const { target } of neighbors) {
      if (!visited.has(target)) {
        dfs(target, depth + 1);
      }
    }
  }

  dfs(accountId, 0);
  return maxDepth;
}

export function getSuspiciousChains() {
  const transactions = getTransactions();
  const accounts = getAccounts();
  const flaggedTxns = transactions.filter(t => t.flagged);
  const suspiciousNodes = new Set();

  flaggedTxns.forEach(t => {
    suspiciousNodes.add(t.from);
    suspiciousNodes.add(t.to);
  });

  // Build chains from flagged transactions
  const chains = [];
  const visited = new Set();

  for (const txn of flaggedTxns) {
    if (!visited.has(txn.id)) {
      const chain = [txn];
      visited.add(txn.id);
      let current = txn.to;
      let depth = 0;

      while (depth < 10) {
        const next = flaggedTxns.find(t => t.from === current && !visited.has(t.id));
        if (!next) break;
        chain.push(next);
        visited.add(next.id);
        current = next.to;
        depth++;
      }

      if (chain.length >= 2) {
        chains.push({
          chain,
          totalAmount: chain.reduce((s, t) => s + t.amount, 0),
          accounts: [...new Set(chain.flatMap(t => [t.from, t.to]))],
          riskLevel: chain.length >= 4 ? 'Critical' : chain.length >= 3 ? 'High' : 'Medium'
        });
      }
    }
  }

  return chains;
}

export function getNetworkData() {
  const accounts = getAccounts();
  const transactions = getTransactions();

  const nodes = accounts.map(acc => ({
    id: acc.id,
    label: `${acc.name}\n${acc.id}`,
    title: `${acc.name} | ${acc.bank} | TIS: ${acc.tis} | Status: ${acc.status}`,
    color: {
      background: acc.status === 'frozen' ? '#546e7a' : acc.tis >= 70 ? '#ff1744' : acc.tis >= 40 ? '#ff9100' : '#00e676',
      border: acc.status === 'frozen' ? '#37474f' : acc.tis >= 70 ? '#d50000' : acc.tis >= 40 ? '#e65100' : '#00c853',
      highlight: { background: '#00e5ff', border: '#00b8d4' },
    },
    font: { color: '#fce4ec', size: 12 },
    shape: acc.status === 'frozen' ? 'diamond' : 'dot',
    size: 20 + (acc.tis / 5),
    borderWidth: 2,
    shadow: { enabled: true, color: acc.tis >= 70 ? 'rgba(255,23,68,0.4)' : acc.tis >= 40 ? 'rgba(255,145,0,0.3)' : 'rgba(0,230,118,0.3)', size: 12 },
  }));

  const edges = transactions.map(txn => ({
    id: txn.id,
    from: txn.from,
    to: txn.to,
    label: `₹${(txn.amount / 1000).toFixed(0)}K`,
    title: `${txn.id} | ₹${txn.amount.toLocaleString()} | ${txn.flagged ? '⚠️ FLAGGED' : 'Normal'}`,
    color: { color: txn.flagged ? '#ff1744' : '#546e7a', highlight: '#00e5ff' },
    arrows: 'to',
    width: txn.flagged ? 3 : 1,
    dashes: txn.status === 'blocked' ? [5, 5] : false,
    font: { color: '#bf8a8a', size: 10, strokeWidth: 0 },
  }));

  return { nodes, edges };
}
