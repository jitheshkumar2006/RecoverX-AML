// Recovery Engine
import { getAccount, getTransactionsForAccount, updateAccountStatus, logAction } from './mockData';

export function calculateRecovery(accountId) {
  const account = getAccount(accountId);
  if (!account) return null;

  const txns = getTransactionsForAccount(accountId);

  const totalInflow = txns.filter(t => t.to === accountId).reduce((s, t) => s + t.amount, 0);
  const totalOutflow = txns.filter(t => t.from === accountId).reduce((s, t) => s + t.amount, 0);

  const amountFrozen = account.status === 'frozen' ? account.balance : 0;
  const totalSuspiciousAmount = txns.filter(t => t.flagged).reduce((s, t) => s + t.amount, 0);

  // Recoverable = frozen balance + amounts in connected frozen accounts
  const recoverableAmount = amountFrozen;

  // Already moved out
  const movedOut = totalOutflow;

  // Remaining risk = suspicious amounts that have moved beyond our reach
  const remainingRisk = Math.max(totalSuspiciousAmount - recoverableAmount, 0);

  const recoveryPercentage = totalSuspiciousAmount > 0 ? Math.round((recoverableAmount / totalSuspiciousAmount) * 100) : 0;

  return {
    accountId,
    accountName: account.name,
    bank: account.bank,
    status: account.status,
    amountFrozen,
    recoverableAmount,
    totalSuspiciousAmount,
    remainingRisk,
    recoveryPercentage,
    totalInflow,
    totalOutflow,
    currentBalance: account.balance,
    breakdown: [
      { label: 'Current Balance (Frozen)', amount: amountFrozen, type: 'frozen' },
      { label: 'Total Suspicious Transactions', amount: totalSuspiciousAmount, type: 'suspicious' },
      { label: 'Recoverable Amount', amount: recoverableAmount, type: 'recoverable' },
      { label: 'Remaining Risk', amount: remainingRisk, type: 'risk' },
    ],
    timeline: [
      { step: 'Account Flagged', status: 'completed', detail: 'AI-driven analysis detected suspicious activity' },
      { step: 'Investigation', status: 'completed', detail: 'ISE analysis completed with recommendation' },
      { step: 'Account Frozen', status: account.status === 'frozen' ? 'completed' : 'pending', detail: account.status === 'frozen' ? 'Account successfully frozen' : 'Awaiting freeze action' },
      { step: 'Cross-Bank Alert', status: 'pending', detail: 'Alert counterpart banks about suspicious activity' },
      { step: 'Fund Recovery', status: 'pending', detail: 'Initiate fund recovery proceedings' },
      { step: 'Case Closure', status: 'pending', detail: 'Complete all recovery steps and close case' },
    ],
  };
}

export function freezeAccount(accountId) {
  const account = getAccount(accountId);
  if (!account) return null;

  updateAccountStatus(accountId, 'frozen');

  logAction({
    type: 'FREEZE',
    accountId,
    accountName: account.name,
    detail: `Account ${accountId} (${account.name}) frozen. Balance: ₹${account.balance.toLocaleString()}`,
  });

  return { success: true, account: { ...account, status: 'frozen' } };
}

export function unfreezeAccount(accountId) {
  const account = getAccount(accountId);
  if (!account) return null;

  updateAccountStatus(accountId, 'active');

  logAction({
    type: 'UNFREEZE',
    accountId,
    accountName: account.name,
    detail: `Account ${accountId} (${account.name}) unfrozen.`,
  });

  return { success: true, account: { ...account, status: 'active' } };
}
