// Cross-Bank Alert Simulation
import { addAlert, generateAlertId, updateAlertStatus, logAction } from './mockData';

export function sendCrossBankAlert(accountId, accountName, targetBank, message) {
  const alertId = generateAlertId();

  const alert = addAlert({
    id: alertId,
    accountId,
    type: 'cross-bank',
    targetBank,
    status: 'sending',
    timestamp: new Date().toISOString(),
    message: message || `Suspicious activity detected on account ${accountId}. Requesting immediate action.`,
  });

  logAction({
    type: 'CROSS_BANK_ALERT',
    accountId,
    accountName,
    detail: `Cross-bank alert sent to ${targetBank} regarding account ${accountId}`,
  });

  return {
    alertId,
    accountId,
    targetBank,
    status: 'sending',
    message: alert.message,
    steps: [
      { step: 'Alert Created', status: 'completed', time: '0s' },
      { step: 'Encrypting Payload', status: 'in-progress', time: '~2s' },
      { step: 'Sending to Bank Network', status: 'pending', time: '~5s' },
      { step: 'Alert Received', status: 'pending', time: '~8s' },
      { step: 'Account Blocked in Target Bank', status: 'pending', time: '~12s' },
    ],
  };
}

export async function simulateAlertProgress(alertId, onUpdate) {
  const steps = [
    { delay: 2000, stepIndex: 1, status: 'completed', overallStatus: 'encrypting' },
    { delay: 3000, stepIndex: 2, status: 'completed', overallStatus: 'sending' },
    { delay: 3000, stepIndex: 3, status: 'completed', overallStatus: 'received' },
    { delay: 4000, stepIndex: 4, status: 'completed', overallStatus: 'blocked' },
  ];

  for (const { delay, stepIndex, status, overallStatus } of steps) {
    await new Promise(r => setTimeout(r, delay));
    if (onUpdate) onUpdate(stepIndex, status, overallStatus);
  }

  updateAlertStatus(alertId, 'completed');
  return { success: true, finalStatus: 'blocked' };
}
