// ============================================================
// RecoverX — Onboarding Risk Engine v2.0
// Production-grade AML onboarding fraud detection
// Staggered async checks with per-module callbacks
// ============================================================

import { getAccounts } from './mockData';

// ── Disposable email domains (comprehensive blacklist) ───────
const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'temp-mail.org', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'maildrop.cc', 'dispostable.com',
  'trashmail.com', 'fakeinbox.com', '10minutemail.com', 'tempmail.com',
  'mailnull.com', 'spamgourmet.com', 'spamgourmet.net', 'discard.email',
  'guerrillamailblock.com', 'grr.la', 'mailforspam.com', 'trash-mail.com',
  'bugmenot.com', 'getairmail.com', 'mintemail.com', 'mohmal.com',
];

// ── VPN/Proxy IP ranges (simplified simulation) ──────────────
const VPN_IP_PREFIXES = ['10.8.', '172.16.', '192.168.56.', '100.64.', '198.18.'];

// ── Known suspicious device fingerprints ─────────────────────
const SUSPICIOUS_DEVICES = ['fp_j0k1l2', 'fp_suspect_mule', 'fp_emulator_01', 'fp_shared_99'];

// ── Demo Scenario Presets ────────────────────────────────────
export const DEMO_SCENARIOS = {
  clean: {
    label: 'Clean Applicant',
    description: 'Low-risk legitimate customer — passes all checks',
    color: '#00c853',
    form: {
      fullName: 'Meera Krishnamurthy',
      phone: '9845123678',
      email: 'meera.krishna@gmail.com',
      govId: 'BKPM4523K',
      bank: 'Indian Overseas Bank (IOB)',
      accountType: 'savings',
    },
  },
  suspicious: {
    label: 'Suspicious Applicant',
    description: 'Medium-risk — disposable email + fast form fill triggers step-up',
    color: '#f57c00',
    form: {
      fullName: 'Ravi',
      phone: '6012340099',
      email: 'quickopen42@yopmail.com',
      govId: 'CXTR8821M',
      bank: 'Indian Overseas Bank (IOB)',
      accountType: 'current',
    },
  },
  mule: {
    label: 'Known Mule',
    description: 'High-risk — reused ID, VPN, device match, bot-like behavior',
    color: '#e53935',
    form: {
      fullName: 'Ankit Patel',
      phone: '6000000001',
      email: 'fastcash88@mailinator.com',
      govId: 'APPP3456C',
      bank: 'Indian Overseas Bank (IOB)',
      accountType: 'current',
    },
  },
};

// ── Simulate getting real client metadata ────────────────────
export function captureDeviceContext() {
  const ua = navigator.userAgent;
  const isEmulator = /Android.*Emulator|Genymotion|BlueStacks|NoxPlayer/i.test(ua);
  const isMobile  = /Android|iPhone|iPad|iPod/i.test(ua);
  const os        = isMobile ? 'Mobile' : 'Desktop';
  const browser   = /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : /Safari/i.test(ua) ? 'Safari' : 'Other';

  // Simulate IP — in production this would come from server
  const simulatedIPs = [
    '192.168.1.7', '10.8.0.2', '103.21.244.0', '172.16.5.10',
    '49.207.192.1', '182.75.0.1', '198.18.0.5',
  ];
  const ip = simulatedIPs[Math.floor(Math.random() * simulatedIPs.length)];

  // Geolocation city (simulated)
  const cities = ['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Unknown'];
  const city = cities[Math.floor(Math.random() * cities.length)];

  // Fingerprint — derive from browser/os/screen
  const fp = `fp_${btoa(`${ua.slice(0,12)}${screen.width}${screen.colorDepth}`).slice(0, 8)}`;

  // Enhanced context
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language || 'en-US';
  const screenRes = `${screen.width}x${screen.height}`;
  const colorDepth = screen.colorDepth;
  const platform = navigator.platform || 'Unknown';
  const cookiesEnabled = navigator.cookieEnabled;
  const doNotTrack = navigator.doNotTrack === '1';

  return {
    ip, city, os, browser, isMobile, isEmulator, deviceFingerprint: fp,
    timezone, language, screenRes, colorDepth, platform,
    cookiesEnabled, doNotTrack,
    capturedAt: new Date().toISOString(),
  };
}

// ── Enhanced form behavioral telemetry ──────────────────────
export function createBehavioralTracker() {
  const tracker = {
    formStartTime: Date.now(),
    keystrokeCount: 0,
    keystrokeTimings: [],
    pasteEvents: 0,
    focusChanges: 0,
    tabSwitches: 0,
    mouseMovements: 0,
    lastMousePos: null,
    mouseDistance: 0,
    fieldFocusTimes: {},
    currentField: null,
    fieldEntryTime: null,
  };

  return {
    getTracker: () => tracker,

    recordKeystroke: () => {
      tracker.keystrokeCount++;
      tracker.keystrokeTimings.push(Date.now());
    },

    recordPaste: () => {
      tracker.pasteEvents++;
    },

    recordFocusChange: (fieldName) => {
      tracker.focusChanges++;
      // Track time spent in previous field
      if (tracker.currentField && tracker.fieldEntryTime) {
        const elapsed = Date.now() - tracker.fieldEntryTime;
        tracker.fieldFocusTimes[tracker.currentField] =
          (tracker.fieldFocusTimes[tracker.currentField] || 0) + elapsed;
      }
      tracker.currentField = fieldName;
      tracker.fieldEntryTime = Date.now();
    },

    recordTabSwitch: (isVisible) => {
      if (!isVisible) tracker.tabSwitches++;
    },

    recordMouseMove: (x, y) => {
      tracker.mouseMovements++;
      if (tracker.lastMousePos) {
        const dx = x - tracker.lastMousePos.x;
        const dy = y - tracker.lastMousePos.y;
        tracker.mouseDistance += Math.sqrt(dx * dx + dy * dy);
      }
      tracker.lastMousePos = { x, y };
    },

    getTimings: () => ({
      formStartTime: tracker.formStartTime,
      submitTime: Date.now(),
      keystrokes: tracker.keystrokeCount,
      pasteEvents: tracker.pasteEvents,
      focusChanges: tracker.focusChanges,
      tabSwitches: tracker.tabSwitches,
      mouseMovements: tracker.mouseMovements,
      mouseDistance: Math.round(tracker.mouseDistance),
      fieldFocusTimes: { ...tracker.fieldFocusTimes },
      keystrokeTimings: [...tracker.keystrokeTimings],
    }),
  };
}

// ── Analyze behavioral data ─────────────────────────────────
export function analyzeBehavior(timings) {
  const { formStartTime, submitTime, keystrokes, pasteEvents, mouseMovements, mouseDistance, tabSwitches } = timings;
  const elapsed = (submitTime - formStartTime) / 1000; // seconds
  const flags = [];
  let score = 0;

  // Speed checks
  if (elapsed < 8) {
    flags.push('Submission under 8 seconds — bot-like speed');
    score += 10;
  } else if (elapsed < 20) {
    flags.push('Very fast form completion (' + Math.round(elapsed) + 's)');
    score += 5;
  }

  // Keystroke checks
  if (keystrokes < 15) {
    flags.push('Low keystroke count (' + keystrokes + ') — possible paste/autofill script');
    score += 5;
  }

  // Paste detection
  if (pasteEvents >= 3) {
    flags.push('Multiple paste events (' + pasteEvents + ') — data may be scripted');
    score += 5;
  }

  // Mouse movement entropy
  if (mouseMovements < 5 && elapsed > 5) {
    flags.push('Minimal mouse movement — possible headless automation');
    score += 5;
  }

  // Tab switching
  if (tabSwitches >= 3) {
    flags.push('Frequent tab switching (' + tabSwitches + ') during form fill');
    score += 3;
  }

  // Typing cadence analysis (if enough keystrokes)
  const kt = timings.keystrokeTimings || [];
  if (kt.length >= 5) {
    const intervals = [];
    for (let i = 1; i < kt.length; i++) intervals.push(kt[i] - kt[i-1]);
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((s, v) => s + (v - avgInterval) ** 2, 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    // Unnaturally consistent typing (very low variance) → bot
    if (stdDev < 15 && avgInterval < 100) {
      flags.push('Machine-like keystroke cadence (σ=' + Math.round(stdDev) + 'ms)');
      score += 5;
    }
  }

  return {
    elapsed: Math.round(elapsed * 10) / 10,
    keystrokes,
    pasteEvents: pasteEvents || 0,
    mouseMovements: mouseMovements || 0,
    mouseDistance: mouseDistance || 0,
    tabSwitches: tabSwitches || 0,
    flags,
    score,
  };
}

// ════════════════════════════════════════════════════════════
// CHECK A — Identity Intelligence
// ════════════════════════════════════════════════════════════
export function checkIdentity(formData) {
  const { fullName, govId } = formData;
  const flags = [];
  let score = 0;

  // PAN format: AAAAA0000A (5 letters, 4 digits, 1 letter)
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  // Aadhaar: 12 digits
  const aadhaarRegex = /^\d{12}$/;

  let idValid = false;
  let idType = 'Unknown';

  const cleanId = govId.replace(/\s/g, '').toUpperCase();

  if (panRegex.test(cleanId)) {
    idType = 'PAN';
    // Check name initial matches PAN 4th char convention
    const nameInitial = fullName.trim().split(' ').pop()?.[0]?.toUpperCase();
    if (nameInitial && cleanId[3] !== nameInitial && nameInitial !== cleanId[3]) {
      flags.push('PAN surname initial mismatch with provided name');
      score += 30;
    }
    idValid = true;
  } else if (aadhaarRegex.test(cleanId)) {
    idType = 'Aadhaar';
    // First digit of aadhaar cannot be 0 or 1
    if (cleanId[0] === '0' || cleanId[0] === '1') {
      flags.push('Invalid Aadhaar — starts with 0 or 1');
      score += 30;
    }
    idValid = true;
  } else {
    flags.push('ID format invalid or unrecognized');
    score += 25;
  }

  // ── Check ID reuse across existing accounts ───────────────
  const existingAccounts = getAccounts();
  const idInUse = existingAccounts.filter(a => a.govId === cleanId);
  if (idInUse.length > 0) {
    flags.push(`Government ID already linked to ${idInUse.length} existing account(s): ${idInUse.map(a => a.id).join(', ')}`);
    score += 35;
  }

  // ── Short name check ──────────────────────────────────────
  if (fullName.trim().split(' ').length < 2) {
    flags.push('Single-word name — may indicate fake identity');
    score += 10;
  }

  // ── Name reuse check ──────────────────────────────────────
  const nameMatches = existingAccounts.filter(a => a.name?.toLowerCase() === fullName.trim().toLowerCase());
  if (nameMatches.length > 0) {
    flags.push(`Name exact match with existing account(s): ${nameMatches.map(a => a.id).join(', ')}`);
    score += 15;
  }

  return {
    checkName: 'Identity Intelligence',
    idType,
    idValid,
    flags,
    score: Math.min(score, 40),
    maxScore: 40,
    status: score === 0 ? 'clean' : score < 20 ? 'warning' : 'risk',
  };
}

// ════════════════════════════════════════════════════════════
// CHECK B — Device Intelligence
// ════════════════════════════════════════════════════════════
export function checkDevice(deviceCtx) {
  const { ip, deviceFingerprint, isEmulator } = deviceCtx;
  const flags = [];
  let score = 0;

  // VPN detection
  const vpnDetected = VPN_IP_PREFIXES.some(prefix => ip.startsWith(prefix));
  if (vpnDetected) {
    flags.push(`VPN/Proxy IP detected: ${ip}`);
    score += 25;
  }

  // Emulator detection
  if (isEmulator) {
    flags.push('Emulator / virtual device detected');
    score += 30;
  }

  // Known suspicious device
  if (SUSPICIOUS_DEVICES.includes(deviceFingerprint)) {
    flags.push('Device fingerprint matches known mule-linked device');
    score += 40;
  } else {
    // Check if device fingerprint already used for another account
    const existingAccounts = getAccounts();
    const sharedDevice = existingAccounts.filter(a => a.deviceFingerprint === deviceFingerprint);
    if (sharedDevice.length > 0) {
      flags.push(`Device already used for ${sharedDevice.length} existing account(s): ${sharedDevice.map(a => a.id).join(', ')}`);
      score += 40;
    }
  }

  // Do Not Track flag (slightly suspicious for banking)
  if (deviceCtx.doNotTrack) {
    flags.push('Do Not Track enabled — privacy masking detected');
    score += 5;
  }

  return {
    checkName: 'Device Intelligence',
    vpnDetected,
    isEmulator,
    ip,
    deviceFingerprint,
    flags,
    score: Math.min(score, 40),
    maxScore: 40,
    status: score === 0 ? 'clean' : score < 25 ? 'warning' : 'risk',
  };
}

// ════════════════════════════════════════════════════════════
// CHECK C — Telecom & Email Intelligence
// ════════════════════════════════════════════════════════════
export function checkTelecom(formData) {
  const { email, phone } = formData;
  const flags = [];
  let score = 0;

  // Email domain check
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (!emailDomain) {
    flags.push('Invalid email format');
    score += 20;
  } else if (DISPOSABLE_DOMAINS.includes(emailDomain)) {
    flags.push(`Disposable email domain detected: ${emailDomain}`);
    score += 25;
  }

  // Phone number checks
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    flags.push('Invalid Indian mobile number — must be 10 digits');
    score += 15;
  } else {
    const prefix = cleanPhone.slice(0, 2);
    const validPrefixes = ['60','61','62','63','64','65','66','67','68','69',
                           '70','71','72','73','74','75','76','77','78','79',
                           '80','81','82','83','84','85','86','87','88','89',
                           '90','91','92','93','94','95','96','97','98','99'];
    if (!validPrefixes.includes(prefix)) {
      flags.push(`Non-standard mobile prefix: ${prefix}xx — may be VoIP/temp SIM`);
      score += 20;
    }
    // Simulate newly-activated SIM (numbers starting with 6 are newer series)
    if (prefix.startsWith('6')) {
      flags.push('Phone number in newly-activated series (6xx)');
      score += 20;
    }
  }

  // Phone reuse check
  const existingAccounts = getAccounts();
  const phoneInUse = existingAccounts.filter(a => a.phone === cleanPhone);
  if (phoneInUse.length > 0) {
    flags.push(`Phone number already registered to ${phoneInUse.length} account(s)`);
    score += 15;
  }

  // Email reuse check
  const emailInUse = existingAccounts.filter(a => a.email?.toLowerCase() === email.toLowerCase());
  if (emailInUse.length > 0) {
    flags.push(`Email already registered to ${emailInUse.length} account(s)`);
    score += 10;
  }

  return {
    checkName: 'Telecom & Email Intelligence',
    email,
    emailDomain,
    phone: cleanPhone,
    flags,
    score: Math.min(score, 30),
    maxScore: 30,
    status: score === 0 ? 'clean' : score < 15 ? 'warning' : 'risk',
  };
}

// ════════════════════════════════════════════════════════════
// CHECK D — Velocity Check
// ════════════════════════════════════════════════════════════
const sessionRegistry = { byIP: {}, byDevice: {} };

export function checkVelocity(deviceCtx) {
  const { ip, deviceFingerprint } = deviceCtx;
  const now = Date.now();
  const WINDOW_MS = 60 * 60 * 1000; // 1-hour rolling window
  const flags = [];
  let score = 0;

  // Register this attempt
  sessionRegistry.byIP[ip] = sessionRegistry.byIP[ip] || [];
  sessionRegistry.byDevice[deviceFingerprint] = sessionRegistry.byDevice[deviceFingerprint] || [];

  // Purge old entries outside window
  sessionRegistry.byIP[ip] = sessionRegistry.byIP[ip].filter(t => now - t < WINDOW_MS);
  sessionRegistry.byDevice[deviceFingerprint] = sessionRegistry.byDevice[deviceFingerprint].filter(t => now - t < WINDOW_MS);

  const ipCount     = sessionRegistry.byIP[ip].length;
  const deviceCount = sessionRegistry.byDevice[deviceFingerprint].length;

  sessionRegistry.byIP[ip].push(now);
  sessionRegistry.byDevice[deviceFingerprint].push(now);

  if (ipCount >= 3) {
    flags.push(`${ipCount + 1} signup attempts from IP ${ip} within 1 hour`);
    score += 25;
  } else if (ipCount >= 1) {
    flags.push(`${ipCount + 1} signups from same IP in this session`);
    score += 10;
  }

  if (deviceCount >= 2) {
    flags.push(`${deviceCount + 1} accounts attempted from same device fingerprint`);
    score += 20;
  }

  return {
    checkName: 'Velocity Check',
    ipAttempts: ipCount + 1,
    deviceAttempts: deviceCount + 1,
    windowMs: WINDOW_MS,
    flags,
    score: Math.min(score, 30),
    maxScore: 30,
    status: score === 0 ? 'clean' : score < 15 ? 'warning' : 'risk',
  };
}

// ════════════════════════════════════════════════════════════
// CHECK E — Behavioral Signals
// ════════════════════════════════════════════════════════════
export function checkBehavior(timings) {
  const result = analyzeBehavior(timings);
  return {
    checkName: 'Behavioral Signals',
    elapsed: result.elapsed,
    keystrokes: result.keystrokes,
    pasteEvents: result.pasteEvents,
    mouseMovements: result.mouseMovements,
    tabSwitches: result.tabSwitches,
    flags: result.flags,
    score: Math.min(result.score, 15),
    maxScore: 15,
    status: result.score === 0 ? 'clean' : result.score < 5 ? 'warning' : 'risk',
  };
}

// ════════════════════════════════════════════════════════════
// MASTER — Run All 5 Checks with Staggered Async Callbacks
// ════════════════════════════════════════════════════════════
export async function runOnboardingRiskEngine(formData, deviceCtx, timings, onCheckComplete) {
  const checkFns = [
    { key: 'identity', fn: () => checkIdentity(formData),    delay: 600 },
    { key: 'device',   fn: () => checkDevice(deviceCtx),     delay: 1100 },
    { key: 'telecom',  fn: () => checkTelecom(formData),     delay: 1700 },
    { key: 'velocity', fn: () => checkVelocity(deviceCtx),   delay: 2200 },
    { key: 'behavior', fn: () => checkBehavior(timings),     delay: 2800 },
  ];

  const checks = {};

  // Run each check with staggered delays and fire callback per completion
  await Promise.all(
    checkFns.map(({ key, fn, delay }) =>
      new Promise(resolve => {
        setTimeout(() => {
          const result = fn();
          checks[key] = result;
          if (onCheckComplete) onCheckComplete(key, result);
          resolve();
        }, delay);
      })
    )
  );

  const totalScore = Math.min(
    checks.identity.score +
    checks.device.score +
    checks.telecom.score +
    checks.velocity.score +
    checks.behavior.score,
    100
  );

  const allFlags = [
    ...checks.identity.flags,
    ...checks.device.flags,
    ...checks.telecom.flags,
    ...checks.velocity.flags,
    ...checks.behavior.flags,
  ];

  let decision, decisionLabel, decisionColor;
  if      (totalScore <= 30) { decision = 'ALLOW';       decisionLabel = 'Low Risk — Allow';               decisionColor = 'success'; }
  else if (totalScore <= 60) { decision = 'STEP_UP';     decisionLabel = 'Medium Risk — Step-Up Verify';   decisionColor = 'warning'; }
  else                       { decision = 'HIGH_RISK';   decisionLabel = 'High Risk — Block / Review';      decisionColor = 'danger';  }

  return {
    checks,
    totalScore,
    allFlags,
    decision,
    decisionLabel,
    decisionColor,
    timestamp: new Date().toISOString(),
    deviceContext: deviceCtx,
    applicant: {
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      govId: formData.govId?.replace(/\s/g, '').toUpperCase(),
      bank: formData.bank,
      accountType: formData.accountType,
    },
  };
}

// ════════════════════════════════════════════════════════════
// RISK REPORT GENERATOR — For Investigator Queue
// ════════════════════════════════════════════════════════════
export function generateRiskReport(riskResult, deviceCtx) {
  const { checks, totalScore, allFlags, decision, applicant } = riskResult;

  return {
    reportType: 'ONBOARDING_RISK_ASSESSMENT',
    generatedAt: new Date().toISOString(),
    applicant,
    threatIntelligenceScore: {
      total: totalScore,
      max: 100,
      level: totalScore >= 61 ? 'HIGH' : totalScore >= 31 ? 'MEDIUM' : 'LOW',
      decision,
    },
    moduleScores: {
      identity: { score: checks.identity.score, max: checks.identity.maxScore, flags: checks.identity.flags },
      device:   { score: checks.device.score,   max: checks.device.maxScore,   flags: checks.device.flags },
      telecom:  { score: checks.telecom.score,  max: checks.telecom.maxScore,  flags: checks.telecom.flags },
      velocity: { score: checks.velocity.score, max: checks.velocity.maxScore, flags: checks.velocity.flags },
      behavior: { score: checks.behavior.score, max: checks.behavior.maxScore, flags: checks.behavior.flags },
    },
    totalFlags: allFlags.length,
    flags: allFlags,
    deviceIntelligence: {
      ip: deviceCtx.ip,
      city: deviceCtx.city,
      os: deviceCtx.os,
      browser: deviceCtx.browser,
      fingerprint: deviceCtx.deviceFingerprint,
      timezone: deviceCtx.timezone,
      language: deviceCtx.language,
      screenRes: deviceCtx.screenRes,
      platform: deviceCtx.platform,
      isEmulator: deviceCtx.isEmulator,
      vpnDetected: checks.device.vpnDetected,
    },
    recommendation: decision === 'ALLOW'
      ? 'Applicant cleared for account creation. Standard monitoring applies.'
      : decision === 'STEP_UP'
      ? 'Elevated risk detected. Step-up verification (OTP + liveness) required before approval.'
      : 'Critical risk indicators detected. Block onboarding and escalate to AML investigation team immediately.',
  };
}
