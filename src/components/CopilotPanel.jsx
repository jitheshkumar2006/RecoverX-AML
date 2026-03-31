import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles } from 'lucide-react';

export default function CopilotPanel({ account }) {
  const [messages, setMessages] = useState([
    { role: 'system', text: 'RecoverX AI Copilot active. Select a node to begin.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (account) {
      setMessages([
        { role: 'system', text: `Analyzing node ${account.id} (${account.name}). How can I assist with this investigation?` }
      ]);
    } else {
      setMessages([
        { role: 'system', text: 'RecoverX AI Copilot active. Select a node from the graph to begin analysis.' }
      ]);
    }
  }, [account]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const query = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let response = '';
      const lowerQuery = query.toLowerCase();
      
      if (!account) {
        response = "Please select an account from the graph above before requesting analysis.";
      } else if (lowerQuery.includes('summarize') || lowerQuery.includes('risk') || lowerQuery.includes('profile')) {
        response = `Based on deep graph analysis, **${account.name}** currently holds a Threat Intelligence Score of **${account.tis}/100**. \n\nThe node exhibits 3 classic mule indicators: \n1. Rapid consecutive inbound structuring. \n2. Shared device fingerprint (${account.deviceFingerprint}). \n3. High-velocity outbound routing.`;
      } else if (lowerQuery.includes('action') || lowerQuery.includes('recommend') || lowerQuery.includes('freeze')) {
        response = `Given the immediate risk of asset flight, I strongly recommend initiating a **Core Freeze**. This will block any outbound RTGS/NEFT transfers. I have pre-staged the API freeze payload for you.`;
      } else if (lowerQuery.includes('who') || lowerQuery.includes('identity')) {
        response = `Identity check on '${account.name}' reveals suspicious anomalies. The PAN card number matches a known synthetic identity dump from a recent dark web breach. Highly probable compromised entity.`;
      } else {
        const isHighRisk = account.tis > 70;
        const balanceStr = `Rs. ${account.balance.toLocaleString()}`;
        
        let riskFactors = [];
        if (isHighRisk) riskFactors.push(`Critical Threat Intelligence Score (${account.tis}/100)`);
        if (account.linkedAccounts.length >= 1) riskFactors.push(`High network density (${account.linkedAccounts.length} direct links identified)`);
        if (account.deviceFingerprint.includes('suspect') || account.deviceFingerprint.includes('blacklisted')) riskFactors.push(`Device fingerprint matches known bad actors`);
        
        const riskNotesHTML = riskFactors.length 
          ? riskFactors.map(f => `- ${f}`).join('\n') 
          : `- No significant risk factors currently flagged.`;
          
        response = `**Deep Analysis: ${account.name} (ID: ${account.id})**\n\n` +
          `**Ledger Status:** ${isHighRisk ? '🚨 HIGH RISK SUSPECT' : '✅ NORMAL ACCOUNT'}\n` +
          `**Current Balance:** ${balanceStr}\n\n` +
          `**Identified Behavioral Anomalies:**\n` +
          riskNotesHTML +
          `\n\n**Investigator Synopsis:** ` + 
          (isHighRisk 
            ? `The velocity and structure of recent inbound transfers, combined with these risk factors, strongly indicates account compromise or mule behavior. **An immediate Core Freeze is recommended.**` 
            : `Transaction velocity and connections are within normal demographic parameters for this user. Continue standard monitoring.`);
      }

      setMessages(prev => [...prev, { role: 'system', text: response }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-header" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 12 }}>
        <div className="card-title">
          <Sparkles size={16} className="icon" style={{ color: 'var(--neon-blue)' }} /> 
          Investigator AI Co-Pilot
        </div>
      </div>
      
      <div style={{ flex: 1, minHeight: 250, maxHeight: 300, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            gap: 12, 
            alignItems: 'flex-start',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
          }}>
            <div style={{ 
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: msg.role === 'user' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 243, 255, 0.1)',
              color: msg.role === 'user' ? '#fff' : 'var(--neon-blue)'
            }}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div style={{ 
              background: msg.role === 'user' ? 'var(--bg-elevated)' : 'rgba(0, 243, 255, 0.05)',
              border: msg.role === 'user' ? '1px solid var(--border-primary)' : '1px solid rgba(0, 243, 255, 0.2)',
              padding: '10px 14px',
              borderRadius: 12,
              borderTopRightRadius: msg.role === 'user' ? 4 : 12,
              borderTopLeftRadius: msg.role === 'system' ? 4 : 12,
              fontSize: 13,
              lineHeight: 1.5,
              color: 'var(--text-primary)',
              maxWidth: '85%'
            }}>
              {msg.text.split('\n').map((line, i) => (
                <span key={i}>
                  {line.includes('**') ? 
                    <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--neon-blue)">$1</strong>') }} /> 
                    : line
                  }
                  <br/>
                </span>
              ))}
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0, 243, 255, 0.1)', color: 'var(--neon-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={14} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>AI is analyzing ledger...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-primary)' }}>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={account ? "Ask me anything about this node..." : "Select an account to chat"}
          disabled={!account || isTyping}
          style={{
            flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)',
            padding: '10px 16px', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none'
          }}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isTyping}
          style={{
            background: input.trim() ? 'var(--neon-blue)' : 'var(--bg-elevated)',
            color: input.trim() ? '#000' : 'var(--text-muted)',
            border: 'none', borderRadius: 8, width: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s'
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
