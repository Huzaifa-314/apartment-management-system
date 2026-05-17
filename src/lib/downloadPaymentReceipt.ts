import { format, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';
import type { Payment } from '../types';
import { formatAmount } from './formatAmount';

export type PaymentReceiptRoomInfo = {
  label: string;
  number?: string;
  floor?: number;
  type?: string;
  area?: number;
};

export type PaymentReceiptTenantInfo = {
  name: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
};

/** Full context for a PDF receipt and matching on-screen details. */
export type PaymentReceiptDetails = {
  payment: Payment;
  propertyName?: string;
  tenant: PaymentReceiptTenantInfo;
  room: PaymentReceiptRoomInfo;
};

function safeFilenamePart(s: string): string {
  const t = s.replace(/[^\w.-]+/g, '_').replace(/^_|_$/g, '');
  return t.slice(0, 64);
}

function formatDisplayDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMMM d, yyyy');
  } catch {
    return iso;
  }
}

function capitalizeRoomType(t: string | undefined): string | undefined {
  if (!t) return undefined;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Generates and downloads a PDF payment receipt in the browser. */
export function downloadPaymentReceiptPdf(details: PaymentReceiptDetails): void {
  const { payment, propertyName, tenant, room } = details;
  const ref = payment.reference?.trim();
  const filenameBase = safeFilenamePart(ref || '') || payment.id.slice(0, 12);

  const doc = new jsPDF();
  const margin = 14;
  const maxW = 182;
  let y = 18;
  const lineH = 5.5;

  const ensureSpace = (lines: number) => {
    const pageH = doc.internal.pageSize.getHeight();
    if (y + lines * lineH > pageH - 16) {
      doc.addPage();
      y = 18;
    }
  };

  const write = (text: string, size = 10, weight: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', weight);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxW);
    for (const line of lines) {
      ensureSpace(1);
      doc.text(line, margin, y);
      y += lineH;
    }
    y += 1;
  };

  write(propertyName ? `Payment receipt — ${propertyName}` : 'Payment receipt', 16, 'bold');
  y += 2;
  write(`Issued: ${formatDisplayDate(new Date().toISOString())}`, 9, 'normal');
  y += 4;

  write('Tenant', 11, 'bold');
  write(`Name: ${tenant.name}`);
  if (tenant.email) write(`Email: ${tenant.email}`);
  if (tenant.phone) write(`Phone: ${tenant.phone}`);
  if (tenant.alternatePhone) write(`Alternate phone: ${tenant.alternatePhone}`);
  y += 2;

  write('Room', 11, 'bold');
  write(`Unit: ${room.label}`);
  if (room.number) write(`Number: ${room.number}`);
  if (room.floor !== undefined) write(`Floor: ${String(room.floor)}`);
  const rt = capitalizeRoomType(room.type);
  if (rt) write(`Type: ${rt}`);
  if (room.area !== undefined) write(`Area: ${String(room.area)} sq units`);
  y += 2;

  write('Payment', 11, 'bold');
  write(`Payment record ID: ${payment.id}`);
  write(`Amount: ${formatAmount(payment.amount)}`);
  write(`Due date: ${formatDisplayDate(payment.dueDate)}`);
  write(`Paid on: ${formatDisplayDate(payment.date)}`);
  write(`Status: ${payment.status}`);
  if (payment.method) write(`Method: ${payment.method}`);
  write(`Reference: ${ref || payment.id}`);

  doc.save(`receipt-${filenameBase}.pdf`);
}
