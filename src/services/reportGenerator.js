// Law Enforcement Report Generator (FIR-style PDF)
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAccount, getTransactionsForAccount, getActionLog } from './mockData';
import { calculateTIS } from './tisEngine';
import { investigate } from './iseEngine';

export function generateFIR(accountId) {
  try {
    const account = getAccount(accountId);
    if (!account) return null;

    const txns = getTransactionsForAccount(accountId);
    const tis = calculateTIS(accountId);
    const ise = investigate(accountId);
    const actions = getActionLog().filter(a => a.accountId === accountId);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RECOVERX — FRAUD INVESTIGATION REPORT', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Generated: ${new Date().toLocaleString()} | Classification: CONFIDENTIAL`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Report ID: FIR-${accountId}-${Date.now().toString(36).toUpperCase()}`, pageWidth / 2, 35, { align: 'center' });

    // Subject Account
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. SUBJECT ACCOUNT DETAILS', 14, 50);

    autoTable(doc, {
      startY: 55,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
      body: [
        ['Account ID', account.id],
        ['Account Holder', account.name],
        ['Bank', account.bank],
        ['Account Type', account.type],
        ['Current Status', account.status.toUpperCase()],
        ['Current Balance', `Rs. ${account.balance.toLocaleString()}`],
        ['Account Created', account.createdAt],
        ['Device Fingerprint', account.deviceFingerprint],
      ],
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    });

    // Threat Intelligence Score
    let y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. THREAT INTELLIGENCE SCORE (TIS)', 14, y);

    autoTable(doc, {
      startY: y + 5,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
      head: [['Factor', 'Value', 'Score', 'Max']],
      body: tis.factors.map(f => [f.name, f.detail, f.score.toString(), f.max.toString()]),
      foot: [['TOTAL TIS', tis.level, tis.score.toString(), '100']],
      footStyles: { fillColor: tis.level === 'High' ? [239, 68, 68] : tis.level === 'Medium' ? [245, 158, 11] : [34, 197, 94], textColor: [255, 255, 255], fontStyle: 'bold' },
    });

    // ISE Analysis
    y = doc.lastAutoTable.finalY + 10;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. INVESTIGATION SUPPORT ENGINE (ISE) ANALYSIS', 14, y);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Suspicion Reasons:', 14, y + 8);
    doc.setFont('helvetica', 'normal');
    ise.suspicionReasons.forEach((reason, i) => {
      doc.text(`  ${i + 1}. ${reason}`, 14, y + 14 + (i * 6));
    });

    y = y + 14 + (ise.suspicionReasons.length * 6) + 4;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text('Graph Insights:', 14, y);
    doc.setFont('helvetica', 'normal');
    ise.graphInsights.forEach((insight, i) => {
      doc.text(`  ${i + 1}. ${insight}`, 14, y + 6 + (i * 6));
    });

    y = y + 6 + (ise.graphInsights.length * 6) + 4;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text(`Recommended Action: ${ise.suggestedAction.toUpperCase()} (Confidence: ${ise.actionConfidence}%)`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(ise.actionReasoning, 14, y + 6, { maxWidth: pageWidth - 28 });

    // Transaction Details
    y = y + 18;
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4. TRANSACTION DETAILS', 14, y);

    autoTable(doc, {
      startY: y + 5,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
      head: [['TXN ID', 'From', 'To', 'Amount', 'Date', 'Flagged']],
      body: txns.map(t => [
        t.id,
        t.from,
        t.to,
        `Rs. ${t.amount.toLocaleString()}`,
        new Date(t.timestamp).toLocaleDateString(),
        t.flagged ? 'YES' : 'No',
      ]),
      styles: { fontSize: 8 },
    });

    // Actions Taken
    y = doc.lastAutoTable.finalY + 10;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('5. ACTIONS TAKEN', 14, y);

    if (actions.length > 0) {
      autoTable(doc, {
        startY: y + 5,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] },
        head: [['Action ID', 'Type', 'Detail', 'Timestamp']],
        body: actions.map(a => [a.id, a.type, a.detail, new Date(a.timestamp).toLocaleString()]),
        styles: { fontSize: 8 },
      });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No actions have been taken on this account yet.', 14, y + 8);
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`RecoverX Fraud Detection Platform | Page ${i} of ${pageCount} | CONFIDENTIAL`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  return doc;
  } catch (err) {
    console.error("Failed to generate PDF:", err);
    return null;
  }
}

export function downloadFIR(accountId) {
  const doc = generateFIR(accountId);
  if (doc) {
    doc.save(`RecoverX_FIR_${accountId}_${new Date().toISOString().slice(0, 10)}.pdf`);
    return true;
  }
  return false;
}
