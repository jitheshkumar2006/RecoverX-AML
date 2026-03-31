// ============================================================
// RecoverX — Global System Context
// Flow-driven event-based state management
// Connects all pages: Onboarding → Alerts → Investigation → Recovery
// ============================================================

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const SystemContext = createContext(null);

// System phases for the status bar
export const SYSTEM_PHASES = {
  IDLE: { label: 'System Ready', color: 'var(--neon-green)', icon: 'idle' },
  MONITORING: { label: 'Monitoring Transactions…', color: 'var(--neon-blue)', icon: 'monitoring' },
  ONBOARDING_SCAN: { label: 'Onboarding Risk Scan Active…', color: 'var(--neon-amber)', icon: 'scanning' },
  FRAUD_DETECTED: { label: 'Fraud Detected — Escalating', color: 'var(--neon-red)', icon: 'alert' },
  INVESTIGATION: { label: 'Investigation in Progress', color: 'var(--neon-amber)', icon: 'investigating' },
  RECOVERY: { label: 'Recovery Initiated', color: 'var(--neon-green)', icon: 'recovery' },
  TRANSACTION_SCAN: { label: 'Transaction Analysis Running…', color: 'var(--neon-blue)', icon: 'scanning' },
  ALERT_ESCALATION: { label: 'Alert → Investigation Escalation…', color: 'var(--neon-red)', icon: 'alert' },
};

export function SystemProvider({ children }) {
  // ─── Core State ────────────────────────────────────────────
  const [systemPhase, setSystemPhase] = useState(SYSTEM_PHASES.IDLE);
  const [systemMessages, setSystemMessages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [riskScore, setRiskScore] = useState(null);
  const [riskResult, setRiskResult] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [investigationStatus, setInvestigationStatus] = useState(null);
  const [recoveryStatus, setRecoveryStatus] = useState(null);
  const [activeCase, setActiveCase] = useState(null);
  const [processingSteps, setProcessingSteps] = useState([]);

  // Track message ID for unique keys
  const msgIdRef = useRef(0);

  // ─── System Message Logger ─────────────────────────────────
  const addSystemMessage = useCallback((text, type = 'info') => {
    msgIdRef.current++;
    const msg = { id: msgIdRef.current, text, type, timestamp: Date.now() };
    setSystemMessages(prev => [msg, ...prev].slice(0, 50));
    return msg;
  }, []);

  // ─── Phase Transitions ─────────────────────────────────────
  const transitionPhase = useCallback((phase, message) => {
    setSystemPhase(phase);
    if (message) addSystemMessage(message, phase === SYSTEM_PHASES.FRAUD_DETECTED ? 'danger' : 'info');
  }, [addSystemMessage]);

  // ─── Processing Steps (for animated step displays) ─────────
  const addProcessingStep = useCallback((step) => {
    setProcessingSteps(prev => [...prev, { ...step, id: Date.now(), timestamp: Date.now() }]);
  }, []);

  const clearProcessingSteps = useCallback(() => {
    setProcessingSteps([]);
  }, []);

  // ─── Alert Management ──────────────────────────────────────
  const addAlert = useCallback((alert) => {
    const newAlert = {
      ...alert,
      id: `SYS_ALT_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'new',
    };
    setAlerts(prev => [newAlert, ...prev]);
    addSystemMessage(`Alert generated: ${alert.reason || 'Suspicious activity'}`, 'danger');
    return newAlert;
  }, [addSystemMessage]);

  const updateAlert = useCallback((alertId, updates) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, ...updates } : a));
  }, []);

  // ─── Case Management ──────────────────────────────────────
  const createCase = useCallback((data) => {
    const caseData = {
      ...data,
      caseId: `CASE_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'active',
      escalatedBy: 'RecoverX AML Engine',
    };
    setActiveCase(caseData);
    setInvestigationStatus('active');
    addSystemMessage(`Case ${caseData.caseId} created — escalated by system`, 'warning');
    return caseData;
  }, [addSystemMessage]);

  // ─── Recovery Trigger ──────────────────────────────────────
  const initiateRecovery = useCallback((accountId, accountName) => {
    const recovery = {
      accountId,
      accountName,
      initiatedAt: new Date().toISOString(),
      status: 'in_progress',
      steps: [
        { label: 'Freeze Account', status: 'pending' },
        { label: 'Trace Fund Flow', status: 'pending' },
        { label: 'Notify Partner Banks', status: 'pending' },
        { label: 'Generate SAR Report', status: 'pending' },
      ],
    };
    setRecoveryStatus(recovery);
    transitionPhase(SYSTEM_PHASES.RECOVERY, `Recovery initiated for ${accountName} (${accountId})`);
    return recovery;
  }, [transitionPhase]);

  const updateRecoveryStep = useCallback((stepIndex, status) => {
    setRecoveryStatus(prev => {
      if (!prev) return prev;
      const steps = [...prev.steps];
      steps[stepIndex] = { ...steps[stepIndex], status };
      return { ...prev, steps };
    });
  }, []);

  // ─── Reset ─────────────────────────────────────────────────
  const resetSystem = useCallback(() => {
    setSystemPhase(SYSTEM_PHASES.IDLE);
    setUserData(null);
    setRiskScore(null);
    setRiskResult(null);
    setAlerts([]);
    setInvestigationStatus(null);
    setRecoveryStatus(null);
    setActiveCase(null);
    setProcessingSteps([]);
    setSystemMessages([]);
  }, []);

  const value = {
    // State
    systemPhase,
    systemMessages,
    userData,
    riskScore,
    riskResult,
    alerts,
    investigationStatus,
    recoveryStatus,
    activeCase,
    processingSteps,

    // Setters
    setUserData,
    setRiskScore,
    setRiskResult,
    setInvestigationStatus,

    // Actions
    transitionPhase,
    addSystemMessage,
    addAlert,
    updateAlert,
    createCase,
    initiateRecovery,
    updateRecoveryStep,
    addProcessingStep,
    clearProcessingSteps,
    resetSystem,
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error('useSystem must be used within SystemProvider');
  return ctx;
}

export default SystemContext;
