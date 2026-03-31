import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { runOnboardingRiskEngine, captureDeviceContext, createBehavioralTracker, generateRiskReport, DEMO_SCENARIOS } from '../services/onboardingEngine';
import { addAccount, generateAccountId, addPendingReview, generateAlertId } from '../services/mockData';
import TISIndicator from '../components/TISIndicator';
import { StepProgress, ScanRow, FlagRow, ScoreBar, DemoScenarioPanel, MODULE_ICONS, MODULE_LABELS, scoreColor, checkColor, CheckIcon } from '../components/onboarding/OnboardingHelpers';
import { UserPlus, Shield, Smartphone, Mail, Fingerprint, AlertTriangle, CheckCircle, XCircle, Clock, ChevronRight, Lock, Eye, EyeOff, Cpu, Wifi, Activity, Zap, User, FileText, RefreshCw, Search, Send, Camera, ChevronLeft } from 'lucide-react';

const STEPS = { FORM1: 'form1', FORM2: 'form2', SCANNING: 'scanning', RESULT: 'result', STEPUP: 'stepup', BLOCKED: 'blocked', SUCCESS: 'success' };

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.FORM1);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', govId: '', bank: 'Indian Overseas Bank (IOB)', accountType: 'savings' });
  const [showId, setShowId] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const trackerRef = useRef(createBehavioralTracker());
  const [deviceCtx] = useState(() => captureDeviceContext());
  const [scanChecks, setScanChecks] = useState({});
  const [riskResult, setRiskResult] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [livenessState, setLivenessState] = useState('idle');
  const otpInputs = useRef([]);
  const [createdAccount, setCreatedAccount] = useState(null);
  const [selfieCapture, setSelfieCapture] = useState(false);

  const stepIdx = step === STEPS.FORM1 ? 0 : step === STEPS.FORM2 ? 1 : step === STEPS.SCANNING ? 2 : step === STEPS.RESULT ? 3 : 4;

  const validateStep1 = () => {
    const e = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 3) e.fullName = 'Full name required (min 3 chars)';
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) e.phone = 'Valid 10-digit mobile number required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    return e;
  };
  const validateStep2 = () => {
    const e = {};
    if (!form.govId.trim() || form.govId.trim().length < 10) e.govId = 'Valid PAN (10 chars) or Aadhaar (12 digits) required';
    return e;
  };

  const goStep2 = () => {
    const e = validateStep1();
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setFormErrors({});
    setStep(STEPS.FORM2);
  };

  const handleSubmit = async () => {
    const e = validateStep2();
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setFormErrors({});
    setScanChecks({});
    setStep(STEPS.SCANNING);
    const timings = trackerRef.current.getTimings();
    const result = await runOnboardingRiskEngine(form, deviceCtx, timings, (key, checkResult) => {
      setScanChecks(prev => ({ ...prev, [key]: checkResult }));
    });
    setRiskResult(result);
    setTimeout(() => setStep(STEPS.RESULT), 600);
  };

  const handleDecision = () => {
    if (!riskResult) return;
    if (riskResult.decision === 'ALLOW') finalizeAccount();
    else if (riskResult.decision === 'STEP_UP') { setStep(STEPS.STEPUP); setOtp(['','','','','','']); setOtpVerified(false); setLivenessState('idle'); }
    else { sendToInvestigator(); setStep(STEPS.BLOCKED); }
  };

  const finalizeAccount = () => {
    const id = generateAccountId();
    const acc = {
      id, name: form.fullName, phone: form.phone, email: form.email,
      govId: form.govId.replace(/\s/g, '').toUpperCase(), bank: form.bank, type: form.accountType,
      status: 'active', tis: riskResult.totalScore, deviceFingerprint: deviceCtx.deviceFingerprint,
      linkedAccounts: [], createdAt: new Date().toISOString().slice(0, 10), balance: 0,
      onboardingFlags: riskResult.allFlags,
    };
    addAccount(acc);
    setCreatedAccount(acc);
    setStep(STEPS.SUCCESS);
  };

  const sendToInvestigator = () => {
    const report = generateRiskReport(riskResult, deviceCtx);
    addPendingReview({
      id: generateAlertId(), type: 'ONBOARDING_BLOCK', ...report.applicant,
      riskScore: riskResult.totalScore, decision: riskResult.decision, flags: riskResult.allFlags,
      deviceCtx, report, timestamp: new Date().toISOString(), status: 'pending_review',
    });
  };

  const handleOtpChange = (val, idx) => {
    const c = val.replace(/\D/g, '').slice(0, 1);
    const n = [...otp]; n[idx] = c; setOtp(n);
    if (c && idx < 5) otpInputs.current[idx + 1]?.focus();
  };
  const handleOtpKey = (e, idx) => { if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpInputs.current[idx - 1]?.focus(); };
  const verifyOtp = () => {
    if (otp.join('').length === 6) { setOtpVerified(true); setOtpError(''); } else setOtpError('Enter all 6 digits');
  };

  const startLiveness = () => {
    setLivenessState('scanning');
    setTimeout(() => setLivenessState('passed'), 2500);
  };

  useEffect(() => {
    if (otpVerified && livenessState === 'passed') {
      const t = setTimeout(() => finalizeAccount(), 800);
      return () => clearTimeout(t);
    }
  }, [otpVerified, livenessState]);

  const resetAll = () => {
    setStep(STEPS.FORM1); setRiskResult(null); setCreatedAccount(null); setScanChecks({});
    setForm({ fullName: '', phone: '', email: '', govId: '', bank: 'Indian Overseas Bank (IOB)', accountType: 'savings' });
    trackerRef.current = createBehavioralTracker();
  };

  const applyScenario = (formData) => setForm({ ...form, ...formData });
  const t = trackerRef.current;
  const inputProps = (field) => ({
    onKeyDown: () => t.recordKeystroke(),
    onPaste: () => t.recordPaste(),
    onFocus: () => t.recordFocusChange(field),
  });

  // ═══════ STEP 1 — Personal Info ═══════
  if (step === STEPS.FORM1) return (
    <div>
      <div className="page-header"><h2>Account Onboarding</h2><p>Real-time fraud assessment powered by RecoverX AML Intelligence Engine</p></div>
      <StepProgress currentIdx={0} />
      <div className="grid-2">
        <div>
          <DemoScenarioPanel scenarios={DEMO_SCENARIOS} onSelect={applyScenario} />
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title"><User size={16} className="icon" /> Personal Information</div><span className="badge badge-info">Step 1 of 2</span></div>
            <div className="form-group">
              <label className="form-label">Full Name (as per ID)</label>
              <input className="form-input" placeholder="e.g. Rajesh Kumar Sharma" value={form.fullName} {...inputProps('fullName')} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              {formErrors.fullName && <div style={{ color: 'var(--neon-red)', fontSize: 11, marginTop: 4 }}>{formErrors.fullName}</div>}
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mobile Number</label>
                <input className="form-input" placeholder="10-digit number" value={form.phone} maxLength={10} {...inputProps('phone')} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
                {formErrors.phone && <div style={{ color: 'var(--neon-red)', fontSize: 11, marginTop: 4 }}>{formErrors.phone}</div>}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input className="form-input" placeholder="you@example.com" value={form.email} {...inputProps('email')} onChange={e => setForm({ ...form, email: e.target.value })} />
                {formErrors.email && <div style={{ color: 'var(--neon-red)', fontSize: 11, marginTop: 4 }}>{formErrors.email}</div>}
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={goStep2} style={{ width: '100%', justifyContent: 'center', padding: '13px 24px', fontSize: 14, letterSpacing: 1.5 }}>
            <ChevronRight size={16} /> Continue to Identity Verification
          </button>
        </div>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title"><Zap size={16} className="icon" /> AML Risk Engine</div><span className="badge badge-purple">5 Parallel Checks</span></div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>Upon submission, RecoverX runs 5 intelligence modules simultaneously:</p>
            {[{ icon: User, label: 'Identity Intelligence', desc: 'PAN/Aadhaar validation, name match, ID reuse' },
              { icon: Cpu, label: 'Device Intelligence', desc: 'Emulator, VPN/proxy, fingerprint reuse' },
              { icon: Mail, label: 'Telecom & Email Intel', desc: 'Disposable email, SIM age, phone reuse' },
              { icon: Activity, label: 'Velocity Check', desc: 'Multiple signups from same IP/device' },
              { icon: Zap, label: 'Behavioral Signals', desc: 'Timing, keystrokes, paste detection, mouse' },
            ].map(({ icon: I, label, desc }) => (
              <div key={label} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-primary)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(229,57,53,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-red)', flexShrink: 0 }}><I size={15} /></div>
                <div><div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{label}</div><div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ═══════ STEP 2 — Identity & KYC ═══════
  if (step === STEPS.FORM2) return (
    <div>
      <div className="page-header"><h2>Account Onboarding</h2><p>Identity verification & KYC document collection</p></div>
      <StepProgress currentIdx={1} />
      <div className="grid-2">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title"><FileText size={16} className="icon" /> Government ID</div><span className="badge badge-warning">Sensitive</span></div>
            <div className="form-group">
              <label className="form-label">PAN Card / Aadhaar Number</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showId ? 'text' : 'password'} placeholder="PAN: ABCDE1234F or Aadhaar: 12-digit" value={form.govId} {...inputProps('govId')} onChange={e => setForm({ ...form, govId: e.target.value })} style={{ paddingRight: 44, textTransform: 'uppercase' }} />
                <button type="button" onClick={() => setShowId(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{showId ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              {formErrors.govId && <div style={{ color: 'var(--neon-red)', fontSize: 11, marginTop: 4 }}>{formErrors.govId}</div>}
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Bank</label>
                <select className="form-select" value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })}>
                  <option value="Indian Overseas Bank (IOB)">Indian Overseas Bank (IOB)</option>
                  <option value="State Bank of India">State Bank of India</option>
                  <option value="Bank of Baroda">Bank of Baroda</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Account Type</label>
                <select className="form-select" value={form.accountType} onChange={e => setForm({ ...form, accountType: e.target.value })}>
                  <option value="savings">Savings</option><option value="current">Current</option><option value="salary">Salary</option>
                </select>
              </div>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title"><Camera size={16} className="icon" /> Selfie Capture</div><span className="badge badge-info">Optional</span></div>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', margin: '0 auto 12px', background: selfieCapture ? 'rgba(0,200,83,0.1)' : 'var(--bg-void)', border: `2px dashed ${selfieCapture ? 'rgba(0,200,83,0.4)' : 'rgba(229,57,53,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: selfieCapture ? 'var(--neon-green)' : 'var(--text-muted)', transition: 'all 0.3s' }}>
                {selfieCapture ? <CheckCircle size={36} /> : <User size={36} />}
              </div>
              <button className={`btn ${selfieCapture ? 'btn-success' : 'btn-ghost'}`} onClick={() => setSelfieCapture(s => !s)} style={{ fontSize: 11 }}>
                {selfieCapture ? <><CheckCircle size={12} /> Captured</> : <><Camera size={12} /> Capture Selfie</>}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setStep(STEPS.FORM1)} style={{ flex: 1, justifyContent: 'center' }}><ChevronLeft size={14} /> Back</button>
            <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 2, justifyContent: 'center', padding: '13px 24px', fontSize: 14, letterSpacing: 1.5 }}><Shield size={16} /> Submit for Risk Assessment</button>
          </div>
        </div>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title"><Smartphone size={16} className="icon" /> Silent Device Capture</div><span className="badge badge-success">Live</span></div>
            {[['IP Address', deviceCtx.ip], ['Device', deviceCtx.os + ' / ' + deviceCtx.browser], ['Fingerprint', deviceCtx.deviceFingerprint], ['Location', deviceCtx.city], ['Timezone', deviceCtx.timezone], ['Screen', deviceCtx.screenRes], ['Platform', deviceCtx.platform], ['Emulator', deviceCtx.isEmulator ? '⚠️ Detected' : '✓ Clean']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border-primary)' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1 }}>{k}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: (k === 'Emulator' && deviceCtx.isEmulator) ? 'var(--neon-red)' : 'var(--text-secondary)' }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title"><Activity size={16} className="icon" /> Behavioral Telemetry</div><span className="badge badge-info">Recording</span></div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
              Tracking: keystroke cadence, paste events, mouse entropy, tab switches, form timing, field focus patterns. This data feeds the Behavioral Signals module during risk analysis.
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ═══════ STEP 3 — Scanning ═══════
  if (step === STEPS.SCANNING) return (
    <div>
      <div className="page-header"><h2>Risk Analysis Running</h2><p>RecoverX AML Engine processing 5 parallel intelligence checks…</p></div>
      <StepProgress currentIdx={2} />
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ textAlign: 'center', padding: '20px 0 24px' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px', background: 'rgba(229,57,53,0.08)', border: '2px solid rgba(229,57,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tisRingPulse 1.5s ease-in-out infinite', color: 'var(--neon-red)' }}><Shield size={32} /></div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: 2, color: 'var(--neon-red)', marginBottom: 4 }}>THREAT ANALYSIS IN PROGRESS</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Subject: {form.fullName} — {form.govId?.slice(0, 4)}****</div>
          </div>
          {['identity', 'device', 'telecom', 'velocity', 'behavior'].map((key, i) => (
            <ScanRow key={key} label={MODULE_LABELS[key]} icon={MODULE_ICONS[key]} done={!!scanChecks[key]} status={scanChecks[key]?.status} result={scanChecks[key]} delay={200 + i * 300} />
          ))}
          {Object.keys(scanChecks).length > 0 && (
            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-void)', border: '1px solid var(--border-primary)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Running Score</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: scoreColor(Object.values(scanChecks).reduce((s, c) => s + c.score, 0)) }}>
                {Object.values(scanChecks).reduce((s, c) => s + c.score, 0)}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/100</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes tisRingPulse { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.08); opacity: 1; } }`}</style>
    </div>
  );

  // ═══════ STEP 4 — Result / Decision ═══════
  if (step === STEPS.RESULT && riskResult) {
    const { checks, totalScore, allFlags, decision, decisionLabel } = riskResult;
    return (
      <div>
        <div className="page-header"><h2>Risk Assessment Complete</h2><p>Subject: {form.fullName} — {new Date(riskResult.timestamp).toLocaleTimeString()}</p></div>
        <StepProgress currentIdx={3} />
        <div className="grid-2">
          <div>
            {Object.entries(checks).map(([key, ch]) => {
              const Icon = MODULE_ICONS[key];
              return (
                <div key={key} className="card" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: `${checkColor(ch.status)}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: checkColor(ch.status) }}><Icon size={14} /></div>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: 1 }}>{MODULE_LABELS[key]}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: checkColor(ch.status) }}>{ch.score}<span style={{ fontSize: 10, color: 'var(--text-muted)' }}>/{ch.maxScore}</span></span>
                      <CheckIcon status={ch.status} />
                    </div>
                  </div>
                  <ScoreBar score={ch.score} max={ch.maxScore} color={checkColor(ch.status)} />
                  {ch.flags.length > 0 && <div style={{ marginTop: 10 }}>{ch.flags.map((f, i) => <FlagRow key={i} flag={f} />)}</div>}
                  {ch.flags.length === 0 && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--neon-green)', fontFamily: 'var(--font-mono)' }}>✓ No anomalies detected</div>}
                </div>
              );
            })}
          </div>
          <div>
            <div className="card" style={{ marginBottom: 16, textAlign: 'center' }}>
              <div className="card-header" style={{ justifyContent: 'center' }}><div className="card-title"><Shield size={16} className="icon" /> Threat Intelligence Score</div></div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><TISIndicator score={totalScore} level={totalScore >= 61 ? 'High' : totalScore >= 31 ? 'Medium' : 'Low'} size="large" /></div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ height: 12, borderRadius: 10, background: 'var(--bg-void)', border: '1px solid var(--border-primary)', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', height: '100%', borderRadius: 10, width: `${totalScore}%`, background: totalScore >= 61 ? 'linear-gradient(90deg, var(--neon-amber), var(--neon-red))' : totalScore >= 31 ? 'linear-gradient(90deg, var(--neon-green), var(--neon-amber))' : 'linear-gradient(90deg, var(--neon-blue), var(--neon-green))', boxShadow: `0 0 10px ${scoreColor(totalScore)}`, transition: 'width 1s ease' }} />
                  <div style={{ position: 'absolute', left: '30%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.15)' }} />
                  <div style={{ position: 'absolute', left: '60%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.15)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}><span>0 — ALLOW</span><span>30</span><span>60</span><span>100 — BLOCK</span></div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: decision === 'ALLOW' ? 'rgba(0,200,83,0.08)' : decision === 'STEP_UP' ? 'rgba(245,124,0,0.08)' : 'rgba(229,57,53,0.08)', border: `1px solid ${decision === 'ALLOW' ? 'rgba(0,200,83,0.25)' : decision === 'STEP_UP' ? 'rgba(245,124,0,0.25)' : 'rgba(229,57,53,0.25)'}`, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
                  {decision === 'ALLOW' && <CheckCircle size={18} style={{ color: 'var(--neon-green)' }} />}
                  {decision === 'STEP_UP' && <AlertTriangle size={18} style={{ color: 'var(--neon-amber)' }} />}
                  {decision === 'HIGH_RISK' && <XCircle size={18} style={{ color: 'var(--neon-red)' }} />}
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, letterSpacing: 1.5, color: decision === 'ALLOW' ? 'var(--neon-green)' : decision === 'STEP_UP' ? 'var(--neon-amber)' : 'var(--neon-red)' }}>{decisionLabel}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {decision === 'ALLOW' && 'Risk score within acceptable range. Proceed with account creation.'}
                  {decision === 'STEP_UP' && 'Elevated risk detected. OTP + liveness verification required.'}
                  {decision === 'HIGH_RISK' && 'Critical risk flags. Block onboarding and escalate to Investigator.'}
                </div>
              </div>
              {allFlags.length > 0 && <div style={{ textAlign: 'left', marginBottom: 16 }}><div style={{ fontSize: 10, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-secondary)', marginBottom: 8 }}>{allFlags.length} Risk Flag{allFlags.length > 1 ? 's' : ''}</div>{allFlags.slice(0, 4).map((f, i) => <FlagRow key={i} flag={f} />)}{allFlags.length > 4 && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>+{allFlags.length - 4} more</div>}</div>}
              <button className={`btn ${decision === 'ALLOW' ? 'btn-success' : decision === 'STEP_UP' ? 'btn-warning' : 'btn-danger'}`} onClick={handleDecision} style={{ width: '100%', justifyContent: 'center', padding: 13, fontSize: 13, letterSpacing: 1 }}>
                {decision === 'ALLOW' && <><CheckCircle size={15} /> Complete Onboarding</>}
                {decision === 'STEP_UP' && <><Lock size={15} /> Proceed to Step-Up Verification</>}
                {decision === 'HIGH_RISK' && <><Send size={15} /> Block &amp; Send to Investigator</>}
              </button>
              <button className="btn btn-ghost" onClick={resetAll} style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 11 }}><RefreshCw size={12} /> Start Over</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════ STEP 5a — Step-Up Verification ═══════
  if (step === STEPS.STEPUP) return (
    <div>
      <div className="page-header"><h2>Step-Up Verification</h2><p>Additional authentication required due to elevated risk signals</p></div>
      <StepProgress currentIdx={4} />
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px', background: 'rgba(245,124,0,0.1)', border: '2px solid rgba(245,124,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-amber)' }}><Lock size={28} /></div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: 2, color: 'var(--neon-amber)', marginBottom: 8 }}>MEDIUM RISK — STEP-UP REQUIRED</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>OTP sent to ****{form.phone.slice(-4)} and {form.email.split('@')[0].slice(0, 3)}***@{form.email.split('@')[1]}</div>
          </div>
          {!otpVerified ? (<>
            <label className="form-label" style={{ marginBottom: 12, display: 'block', textAlign: 'center' }}>Enter 6-Digit OTP</label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              {otp.map((digit, idx) => (
                <input key={idx} ref={el => otpInputs.current[idx] = el} value={digit} onChange={e => handleOtpChange(e.target.value, idx)} onKeyDown={e => handleOtpKey(e, idx)} maxLength={1}
                  style={{ width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', background: 'var(--bg-void)', border: `2px solid ${digit ? 'var(--neon-amber)' : 'var(--border-primary)'}`, borderRadius: 10, color: 'var(--text-primary)', outline: 'none' }} />
              ))}
            </div>
            {otpError && <div style={{ color: 'var(--neon-red)', fontSize: 12, fontFamily: 'var(--font-mono)', textAlign: 'center', marginBottom: 12 }}>{otpError}</div>}
            <button className="btn btn-warning" onClick={verifyOtp} style={{ width: '100%', justifyContent: 'center', padding: 13 }}><Shield size={15} /> Verify OTP</button>
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>For demo: enter any 6 digits</div>
          </>) : (
            <div style={{ textAlign: 'center', padding: 16 }}><CheckCircle size={40} style={{ color: 'var(--neon-green)', marginBottom: 8 }} /><div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--neon-green)', letterSpacing: 2 }}>OTP VERIFIED</div></div>
          )}
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title"><Eye size={14} className="icon" /> Liveness Check</div><span className={`badge ${livenessState === 'passed' ? 'badge-success' : 'badge-warning'}`}>{livenessState === 'passed' ? 'Passed' : 'Required'}</span></div>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', margin: '0 auto 12px', background: livenessState === 'passed' ? 'rgba(0,200,83,0.1)' : 'var(--bg-void)', border: `2px ${livenessState === 'scanning' ? 'solid' : 'dashed'} ${livenessState === 'passed' ? 'rgba(0,200,83,0.4)' : 'rgba(245,124,0,0.35)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: livenessState === 'passed' ? 'var(--neon-green)' : 'var(--text-muted)', animation: livenessState === 'scanning' ? 'tisRingPulse 1s ease-in-out infinite' : 'none', transition: 'all 0.3s' }}>
              {livenessState === 'passed' ? <CheckCircle size={40} /> : livenessState === 'scanning' ? <Camera size={40} style={{ color: 'var(--neon-amber)' }} /> : <User size={40} />}
            </div>
            {livenessState === 'idle' && <button className="btn btn-ghost" onClick={startLiveness} style={{ fontSize: 11 }}><Camera size={12} /> Start Liveness Scan</button>}
            {livenessState === 'scanning' && <div style={{ fontSize: 12, color: 'var(--neon-amber)', fontFamily: 'var(--font-mono)' }}>Analyzing facial landmarks…</div>}
            {livenessState === 'passed' && <div style={{ fontSize: 12, color: 'var(--neon-green)', fontFamily: 'var(--font-mono)' }}>✓ Liveness confirmed</div>}
          </div>
        </div>
        {otpVerified && livenessState === 'passed' && <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--neon-green)', fontFamily: 'var(--font-mono)' }}>All checks passed — creating account…</div>}
      </div>
      <style>{`@keyframes tisRingPulse { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.08); opacity: 1; } }`}</style>
    </div>
  );

  // ═══════ STEP 5b — Blocked ═══════
  if (step === STEPS.BLOCKED) return (
    <div>
      <div className="page-header"><h2>Onboarding Blocked</h2><p>High-risk application forwarded to Investigator Review Queue</p></div>
      <StepProgress currentIdx={4} />
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="card" style={{ borderColor: 'rgba(229,57,53,0.35)', marginBottom: 16 }}>
          <div style={{ textAlign: 'center', padding: '24px 0 20px' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px', background: 'rgba(229,57,53,0.1)', border: '2px solid rgba(229,57,53,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-red)', animation: 'emergencyPulse 2s ease-in-out infinite' }}><XCircle size={36} /></div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, letterSpacing: 2, color: 'var(--neon-red)', marginBottom: 6 }}>HIGH RISK — BLOCKED</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TIS Score: <strong style={{ color: 'var(--neon-red)' }}>{riskResult?.totalScore}/100</strong></div>
          </div>
          <div style={{ padding: 16, background: 'rgba(229,57,53,0.05)', borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-secondary)', marginBottom: 8 }}>Case Created in Investigator Queue</div>
            {[['Subject', form.fullName], ['Gov ID', form.govId?.slice(0, 3) + '****' + form.govId?.slice(-2)], ['Phone', '****' + form.phone.slice(-4)], ['Risk Score', `${riskResult?.totalScore}/100 — HIGH RISK`], ['Flags', `${riskResult?.allFlags.length} risk indicators`], ['Status', 'Pending Investigator Review']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-primary)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{k}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: k === 'Risk Score' ? 'var(--neon-red)' : k === 'Status' ? 'var(--neon-amber)' : 'var(--text-secondary)' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-danger" onClick={() => navigate('/investigation')} style={{ flex: 1, justifyContent: 'center' }}><Search size={14} /> View in Investigation</button>
            <button className="btn btn-ghost" onClick={resetAll} style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}><RefreshCw size={12} /> New Application</button>
          </div>
        </div>
        {riskResult?.allFlags.length > 0 && (
          <div className="card"><div className="card-header"><div className="card-title"><AlertTriangle size={14} className="icon" /> All Risk Flags ({riskResult.allFlags.length})</div></div>{riskResult.allFlags.map((f, i) => <FlagRow key={i} flag={f} />)}</div>
        )}
      </div>
      <style>{`@keyframes emergencyPulse { 0%,100% { box-shadow: 0 0 20px rgba(229,57,53,0.2); } 50% { box-shadow: 0 0 40px rgba(229,57,53,0.5); } }`}</style>
    </div>
  );

  // ═══════ STEP 6 — Success ═══════
  if (step === STEPS.SUCCESS && createdAccount) return (
    <div>
      <div className="page-header"><h2>Account Created</h2><p>Onboarding complete — account is active and monitored</p></div>
      <StepProgress currentIdx={4} />
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        <div className="card" style={{ borderColor: 'rgba(0,200,83,0.3)', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ padding: '24px 0 20px' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px', background: 'rgba(0,200,83,0.1)', border: '2px solid rgba(0,200,83,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-green)' }}><CheckCircle size={36} /></div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, letterSpacing: 2, color: 'var(--neon-green)', marginBottom: 4 }}>ONBOARDING SUCCESSFUL</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Account ID: <strong style={{ color: 'var(--text-primary)' }}>{createdAccount.id}</strong></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><TISIndicator score={createdAccount.tis} level={createdAccount.tis >= 61 ? 'High' : createdAccount.tis >= 31 ? 'Medium' : 'Low'} size="large" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[['Account ID', createdAccount.id], ['Holder', createdAccount.name], ['Bank', createdAccount.bank], ['Type', createdAccount.type], ['Status', '✓ Active'], ['TIS Score', `${createdAccount.tis}/100`]].map(([k, v]) => (
              <div key={k} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-void)', border: '1px solid var(--border-primary)', textAlign: 'left' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: k === 'Status' ? 'var(--neon-green)' : k === 'TIS Score' ? scoreColor(createdAccount.tis) : 'var(--text-primary)' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => navigate('/investigation')} style={{ flex: 1, justifyContent: 'center' }}><Search size={14} /> Investigate Account</button>
            <button className="btn btn-ghost" onClick={resetAll} style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}><UserPlus size={12} /> New Account</button>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
}
