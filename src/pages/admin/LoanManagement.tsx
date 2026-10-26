import { useState, useEffect, useMemo, useRef, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Eye, EyeOff, CheckCircle, XCircle, CheckCircle2, Edit, MoreHorizontal, Send, FileText, DollarSign, Bell, TrendingDown, RefreshCw, Calendar, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import PaymentScheduleModal from '@/components/admin/loans/modals/PaymentScheduleModal';
import { useToast } from "@/hooks/use-toast";

import { ColumnConfig, PendingLoan, ContractLoan, DisbursementLoan, OverdueLoan } from "@/types/loans";
import { useAdminPendingLoans, useAdminContractLoans, useAdminDisbursementLoans, useAdminActiveLoans, useAdminOverdueLoans, useAdminHistoryLoans } from "@/hooks/useLoans";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { increscendoApiFetch } from "@/lib/increscendoApi";
import { sendEmail } from "@/lib/emailService";
import { loanApprovedTemplate, loanRejectedTemplate, paymentReminderTemplate, disbursementConfirmedTemplate } from "@/lib/emailTemplates";
import { LoanTableFilters } from "@/components/admin/loans/LoanTableFilters";
import { INECURPModal } from "@/components/admin/loans/modals/INECURPModal";
import { ModifyLoanModal } from "@/components/admin/loans/modals/ModifyLoanModal";
import { ResendContractModal, AttachContractModal } from "@/components/admin/loans/modals/ContractModals";
import { ConsentRenewModal } from "@/components/admin/loans/modals/ConsentRenewModal";
import { ModifyDisbursementModal, ConfirmDisbursementModal } from "@/components/admin/loans/modals/DisbursementModals";
import { SendReminderModal, SellPortfolioModal, UpdateInstallmentsModal } from "@/components/admin/loans/modals/OverdueModals";


const BANK_LIST = [
  { id: "mx_afirme", name: "Banca Afirme" },
  { id: "mx_alianza", name: "Alianza" },
  { id: "mx_america", name: "Bank of America" },
  { id: "mx_amex", name: "American Express Bank" },
  { id: "mx_amigo", name: "Banco Amigo" },
  { id: "mx_azteca", name: "Banco Azteca" },
  { id: "mx_bajio", name: "Banco del Bajío" },
  { id: "mx_bancoppel", name: "Bancoppel" },
  { id: "mx_banjercito", name: "Banjercito" },
  { id: "mx_banorte", name: "Banorte" },
  { id: "mx_banxico", name: "Banco de Mexico" },
  { id: "mx_bbva_bancomer", name: "BBVA" },
  { id: "mx_ci", name: "CI Banco" },
  { id: "mx_citi_banamex", name: "City Banamex" },
  { id: "mx_compartamos", name: "Banco Compartamos" },
  { id: "mx_famsa", name: "Banco Ahorro Famsa" },
  { id: "mx_fundacion_donde", name: "Fundación Donde" },
  { id: "mx_hsbc", name: "HSBC" },
  { id: "mx_inbursa", name: "Banco Inbursa" },
  { id: "mx_ing", name: "ING MX" },
  { id: "mx_interacciones", name: "Banco Interacciones" },
  { id: "mx_intercam", name: "Intercam Banco" },
  { id: "mx_invex", name: "Banco Invex" },
  { id: "mx_ixe", name: "IXE Banco" },
  { id: "mx_mercantil_norte", name: "Banco Mercantil del Norte" },
  { id: "mx_mifel", name: "Banco Mifel" },
  { id: "mx_monterrey_regional", name: "Monterrey Regional" },
  { id: "mx_multiva", name: "Banco Multiva" },
  { id: "mx_nacional_ejercito", name: "Banco Nacional del Ejército" },
  { id: "mx_regional_monterrey", name: "Banco Regional de Monterrey" },
  { id: "mx_santander", name: "Santander" },
  { id: "mx_scotiabank", name: "Scotia Bank" },
  { id: "mx_scotiabank_inverlat", name: "Scotiabank Inverlat" },
];

const getBankName = (bankId: string) => BANK_LIST.find(b => b.id === bankId)?.name ?? bankId;

const defaultPendingColumns: ColumnConfig[] = [
  { key: 'id', label: 'ID', visible: true },
  { key: 'firstName', label: 'Nombres', visible: true },
  { key: 'lastName', label: 'Apellidos', visible: true },
  { key: 'amount', label: 'Monto', visible: true },
  { key: 'installments', label: 'Cuotas', visible: true },
  { key: 'preApproval', label: 'Pre-Aprob.', visible: true },
  { key: 'membership', label: 'Membresía', visible: true },
  { key: 'ine', label: 'INE', visible: true },
  { key: 'curp', label: 'CURP', visible: true },
  { key: 'consent', label: 'Consentimiento', visible: true },
  { key: 'requestDate', label: 'F. Solicitud', visible: true },
  { key: 'actions', label: 'Acciones', visible: true },
];

const defaultContractColumns: ColumnConfig[] = [
  { key: 'id', label: 'ID', visible: true },
  { key: 'firstName', label: 'Nombres', visible: true },
  { key: 'lastName', label: 'Apellidos', visible: true },
  { key: 'amount', label: 'Monto', visible: true },
  { key: 'installments', label: 'Cuotas', visible: true },
  { key: 'signatureStatus', label: 'Estado Firma', visible: true },
  { key: 'membership', label: 'Membresía', visible: true },
  { key: 'ine', label: 'INE', visible: true },
  { key: 'curp', label: 'CURP', visible: true },
  { key: 'consent', label: 'Consentimiento', visible: false },
  { key: 'actions', label: 'Acciones', visible: true },
  { key: 'preApproval', label: 'Pre-Aprob.', visible: false },
  { key: 'requestDate', label: 'F. Solicitud', visible: false },
];

const defaultDisbursementColumns: ColumnConfig[] = [
  { key: 'id', label: 'ID', visible: true },
  { key: 'firstName', label: 'Nombres', visible: true },
  { key: 'lastName', label: 'Apellidos', visible: true },
  { key: 'amount', label: 'Monto', visible: true },
  { key: 'installments', label: 'Cuotas', visible: true },
  { key: 'bank', label: 'Banco', visible: true },
  { key: 'accountNumber', label: 'Cta/CLABE', visible: true },
  { key: 'disbursementStatus', label: 'Est. Desembolso', visible: true },
  { key: 'contractStatus', label: 'Est. Contrato', visible: true },
  { key: 'membership', label: 'Membresía', visible: false },
  { key: 'ine', label: 'INE', visible: false },
  { key: 'curp', label: 'CURP', visible: false },
  { key: 'consent', label: 'Consentimiento', visible: true },
  { key: 'preApproval', label: 'Pre-Aprob.', visible: false },
  { key: 'requestDate', label: 'F. Solicitud', visible: false },
];

const defaultActiveColumns: ColumnConfig[] = [
  { key: 'id', label: 'ID', visible: true },
  { key: 'firstName', label: 'Nombres', visible: true },
  { key: 'lastName', label: 'Apellidos', visible: true },
  { key: 'amount', label: 'Monto', visible: true },
  { key: 'installments', label: 'Cuotas', visible: true },
  { key: 'paidInstallments', label: 'Cuot. Pagadas', visible: true },
  { key: 'status', label: 'Estado', visible: true },
  { key: 'membership', label: 'Membresía', visible: false },
  { key: 'ine', label: 'INE', visible: false },
  { key: 'consent', label: 'Consentimiento', visible: false },
  { key: 'lastPaymentDate', label: 'F. Últ. Pago', visible: false },
  { key: 'requestDate', label: 'F. Solicitud', visible: false },
];

const defaultOverdueColumns: ColumnConfig[] = [
  { key: 'id', label: 'ID', visible: true },
  { key: 'firstName', label: 'Nombres', visible: true },
  { key: 'lastName', label: 'Apellidos', visible: true },
  { key: 'amount', label: 'Monto', visible: true },
  { key: 'installments', label: 'Cuotas', visible: true },
  { key: 'paidInstallments', label: 'Cuot. Pagadas', visible: true },
  { key: 'status', label: 'Estado', visible: true },
  { key: 'membership', label: 'Membresía', visible: false },
  { key: 'ine', label: 'INE', visible: false },
  { key: 'consent', label: 'Consentimiento', visible: false },
  { key: 'lastPaymentDate', label: 'F. Últ. Pago', visible: false },
  { key: 'nextPaymentDate', label: 'Próximo Pago', visible: true },
  { key: 'requestDate', label: 'F. Solicitud', visible: false },
];

const defaultHistoryColumns: ColumnConfig[] = [
  { key: 'id', label: 'ID', visible: true },
  { key: 'firstName', label: 'Nombres', visible: true },
  { key: 'lastName', label: 'Apellidos', visible: true },
  { key: 'amount', label: 'Monto', visible: true },
  { key: 'installments', label: 'Cuotas', visible: true },
  { key: 'paidInstallments', label: 'Cuot. Pagadas', visible: true },
  { key: 'status', label: 'Estado', visible: true },
  { key: 'membership', label: 'Membresía', visible: false },
  { key: 'ine', label: 'INE', visible: false },
  { key: 'consent', label: 'Consentimiento', visible: false },
  { key: 'lastPaymentDate', label: 'F. Últ. Pago', visible: false },
  { key: 'requestDate', label: 'F. Solicitud', visible: false },
  { key: 'actions', label: 'Acciones', visible: true },
];

type PaymentRow = {
  installment: number;
  date: string;
  principal: number;
  interest: number;
  total: number;
  balance: number;
};

const formatMoney = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatShortDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const getMembershipLabel = (value: unknown) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const record = value as Record<string, any>;
    return record.name || record.title || record.label || record.membership_name || record.membership || record.status || '';
  }
  return String(value);
};

const normalizeMonthlyRate = (annualRate: number) => {
  if (!Number.isFinite(annualRate) || annualRate <= 0) return 0;
  if (annualRate > 1) return annualRate / 100 / 12;
  return annualRate / 12;
};

const calculateMonthlyPayment = (principal: number, monthlyRate: number, months: number) => {
  if (principal <= 0 || months <= 0) return 0;
  if (monthlyRate <= 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
};

const buildFrenchSchedule = (principal: number, monthlyRate: number, months: number, monthlyPayment: number, startDate: Date) => {
  const rows: PaymentRow[] = [];
  let remainingBalance = principal;

  for (let i = 1; i <= months; i++) {
    const interestPayment = remainingBalance * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment;

    if (i === months) {
      principalPayment = remainingBalance;
    }

    remainingBalance = Math.max(0, remainingBalance - principalPayment);

    const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + (i - 1), startDate.getDate());
    rows.push({
      installment: i,
      date: formatShortDate(dueDate),
      principal: principalPayment,
      interest: interestPayment,
      total: monthlyPayment,
      balance: remainingBalance,
    });
  }

  return rows;
};

const generateLoanSchedulePdfBase64 = async (loan: any) => {
  const { jsPDF } = await import("jspdf");
  const principal = Number(loan.amount ?? loan.raw?.amount ?? 0);
  const months = Number(loan.installments ?? loan.raw?.installments ?? 0);
  const storedAnnualRate = Number(loan.raw?.interest_rate ?? 0.42);
  const monthlyRate = normalizeMonthlyRate(storedAnnualRate);
  const monthlyPayment = Number(loan.raw?.monthly_payment ?? calculateMonthlyPayment(principal, monthlyRate, months));
  const firstDueDate = new Date();
  firstDueDate.setMonth(firstDueDate.getMonth() + 1);

  const rows = buildFrenchSchedule(principal, monthlyRate, months, monthlyPayment, firstDueDate);
  const totalToPay = Number(loan.raw?.total_to_pay ?? monthlyPayment * months);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 34;
  const right = pageWidth - 34;
  const rowHeight = 18;
  const tableTop = 146;
  const annualPercent = (storedAnnualRate > 1 ? storedAnnualRate : storedAnnualRate * 100).toFixed(2);
  const fullName = `${loan.firstName ?? ''} ${loan.lastName ?? ''}`.trim() || 'N/D';

  const columns = [
    { label: 'CUOTA', width: 50, align: 'center' as const },
    { label: 'FECHA', width: 84, align: 'center' as const },
    { label: 'CAPITAL', width: 93, align: 'right' as const },
    { label: 'INTERES', width: 93, align: 'right' as const },
    { label: 'TOTAL', width: 93, align: 'right' as const },
    { label: 'SALDO', width: 93, align: 'right' as const },
  ];

  const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
  const tableLeft = left;
  const tableRight = tableLeft + tableWidth;

  const getColumnX = (index: number) => {
    return tableLeft + columns.slice(0, index).reduce((sum, column) => sum + column.width, 0);
  };

  const drawCellText = (text: string, index: number, y: number) => {
    const column = columns[index];
    const x = getColumnX(index);
    const padding = 6;

    if (column.align === 'right') {
      doc.text(text, x + column.width - padding, y, { align: 'right' });
      return;
    }

    if (column.align === 'center') {
      doc.text(text, x + column.width / 2, y, { align: 'center' });
      return;
    }

    doc.text(text, x + padding, y);
  };

  const drawTopHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 77, 156);
    doc.setFontSize(17);
    doc.text('Tabla de amortizacion', pageWidth / 2, 46, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(44, 44, 44);
    doc.setFontSize(9);
    doc.text(`Cliente: ${fullName}`, left, 66);
    doc.text(`Solicitud: ${loan.id ?? 'N/D'}`, left, 80);
    doc.text(`Pagos: ${months}`, left, 94);

    doc.text(`Monto: ${formatMoney(principal)}`, right, 66, { align: 'right' });
    doc.text(`Pago mensual: ${formatMoney(monthlyPayment)}`, right, 80, { align: 'right' });
    doc.text(`Total a pagar: ${formatMoney(totalToPay)}`, right, 94, { align: 'right' });

    doc.text(`TNA: ${annualPercent}%`, left, 108);

    doc.setDrawColor(196, 204, 214);
    doc.line(left, 118, right, 118);
  };

  const drawTableHeader = (y: number) => {
    doc.setFillColor(234, 239, 246);
    doc.rect(tableLeft, y - 11, tableWidth, 18, 'F');
    doc.setDrawColor(188, 196, 206);
    doc.rect(tableLeft, y - 11, tableWidth, 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(46, 46, 46);
    columns.forEach((column, index) => {
      drawCellText(column.label, index, y);
    });

    doc.setDrawColor(205, 212, 220);
    let separatorX = tableLeft;
    for (let i = 0; i < columns.length - 1; i++) {
      separatorX += columns[i].width;
      doc.line(separatorX, y - 11, separatorX, y + 7);
    }
  };

  drawTopHeader();
  drawTableHeader(tableTop);

  doc.setFont('helvetica', 'normal');
  let y = tableTop + 16;

  rows.forEach((r, index) => {
    if (y > pageHeight - 84) {
      doc.addPage();
      drawTopHeader();
      drawTableHeader(tableTop);
      y = tableTop + 16;
    }

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 253);
      doc.rect(tableLeft, y - 10, tableWidth, rowHeight, 'F');
    }

    doc.setDrawColor(225, 230, 236);
    doc.line(tableLeft, y + 8, tableRight, y + 8);
    let separatorX = tableLeft;
    for (let i = 0; i < columns.length - 1; i++) {
      separatorX += columns[i].width;
      doc.line(separatorX, y - 10, separatorX, y + 8);
    }

    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    drawCellText(String(r.installment), 0, y);
    drawCellText(r.date, 1, y);
    drawCellText(formatMoney(r.principal), 2, y);
    drawCellText(formatMoney(r.interest), 3, y);
    drawCellText(formatMoney(r.total), 4, y);
    drawCellText(formatMoney(r.balance), 5, y);
    y += rowHeight;
  });

  // No client signature field per request — leave document without client signature area.

  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1] ?? '';
};

const SignatureStatusBadge = memo(({ status }: { status: string }) => {
  switch (status) {
    case 'Firmado': return <Badge className="bg-success/20 text-success border-success whitespace-nowrap">{status}</Badge>;
    case 'Espera': return <Badge className="bg-warning/20 text-warning border-warning whitespace-nowrap">{status}</Badge>;
    case 'Error': return <Badge className="bg-danger/20 text-danger border-danger whitespace-nowrap">{status}</Badge>;
    default: return <Badge variant="outline" className="whitespace-nowrap">{status}</Badge>;
  }
});
SignatureStatusBadge.displayName = 'SignatureStatusBadge';

const ConsentBadge = memo(({ status: rawStatus }: { status?: string }) => {
  const status = (rawStatus || '').toString();
  const key = status.toLowerCase();

  switch (key) {
    case 'awaiting_information':
      return <Badge className="bg-warning/20 text-warning border-warning whitespace-nowrap" title="Waiting for file uploads">Esperando archivos</Badge>;
    case 'submitted':
      return <Badge className="bg-info/20 text-info border-info whitespace-nowrap" title="All files uploaded, under review">En revisión</Badge>;
    case 'processing':
      return <Badge className="bg-info/20 text-info border-info whitespace-nowrap">KYC en progreso</Badge>;
    case 'incomplete_information':
      return <Badge className="bg-destructive/20 text-destructive border-destructive whitespace-nowrap" title="Missing required files">Archivos faltantes</Badge>;
    case 'confirmed':
      return <Badge className="bg-success/20 text-success border-success whitespace-nowrap" title="Approved - you can now create payment requests">Aprobado</Badge>;
    case 'rejected':
      return <Badge className="bg-destructive/20 text-destructive border-destructive whitespace-nowrap" title="Denied - check rejection reason and resubmit">Rechazado</Badge>;
    case 'received_chargeback':
      return <Badge className="bg-destructive/20 text-destructive border-destructive whitespace-nowrap">Chargeback</Badge>;
    default:
      return <Badge className="bg-warning/20 text-warning border-warning whitespace-nowrap">Pendiente</Badge>;
  }
});
ConsentBadge.displayName = 'ConsentBadge';

const StatusBadge = memo(({ status }: { status: string }) => {
  switch (status) {
    case 'pending': return <Badge className="bg-warning/20 text-warning border-warning whitespace-nowrap">Pendiente</Badge>;
    case 'approved': return <Badge className="bg-success/20 text-success border-success whitespace-nowrap">Aprobado</Badge>;
    case 'contract': return <Badge className="bg-info/20 text-info border-info whitespace-nowrap">En Firma</Badge>;
    case 'signed': return <Badge className="bg-info/20 text-info border-info whitespace-nowrap">Firmado</Badge>;
    case 'disbursed': return <Badge className="bg-success/20 text-success border-success whitespace-nowrap">Desembolsado</Badge>;
    case 'active': return <Badge className="bg-success/20 text-success border-success whitespace-nowrap">Activo</Badge>;
    case 'Al día': return <Badge className="bg-success/20 text-success border-success whitespace-nowrap">{status}</Badge>;
    case 'Atrasado': return <Badge className="bg-warning/20 text-warning border-warning whitespace-nowrap">{status}</Badge>;
    case 'Urgente': return <Badge className="bg-danger/20 text-danger border-danger whitespace-nowrap">{status}</Badge>;
    case 'Liquidado': return <Badge className="bg-success/20 text-success border-success whitespace-nowrap">{status}</Badge>;
    case 'Cartera Vendida': return <Badge className="bg-muted text-muted-foreground whitespace-nowrap">{status}</Badge>;
    case 'Rechazado': return <Badge className="bg-danger/20 text-danger border-danger whitespace-nowrap">{status}</Badge>;
    default: return <Badge variant="outline" className="whitespace-nowrap">{status}</Badge>;
  }
});
StatusBadge.displayName = 'StatusBadge';

const LoanManagement = () => {
  const { toast } = useToast();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const isProcessingRef = useRef(false);
  const approveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rejectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (approveIntervalRef.current) clearInterval(approveIntervalRef.current);
      if (rejectIntervalRef.current) clearInterval(rejectIntervalRef.current);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<string>('pending');
  const pageSize = 5;

  const [pendingPage, setPendingPage] = useState(1);
  const [contractPage, setContractPage] = useState(1);
  const [disbursementPage, setDisbursementPage] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const [overduePage, setOverduePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: ['loans', 'admin'] });
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [queryClient]);

  const mapLoan = (l: any) => {
    const user = l.users ?? {};
    const latestSignature = Array.isArray(l.loan_signatures) && l.loan_signatures.length ? l.loan_signatures[0] : null;
    const latestDisbursement = Array.isArray(l.loan_disbursements) && l.loan_disbursements.length ? l.loan_disbursements[0] : null;

    const userMemberships = user.user_memberships;
    const membershipPlan = Array.isArray(userMemberships) && userMemberships.length > 0 ? userMemberships[0]?.membership_plans : null;
    const membershipVal = getMembershipLabel(membershipPlan) || getMembershipLabel(l.metadata?.membership);
    const membershipRaw = membershipPlan || null;

    const paidAmount = Number(l.metadata?.paid_amount ?? 0);
    const amt = Number(l.amount ?? 0);
    const term = Number(l.installments ?? l.metadata?.installments ?? 12);
    const installmentAmount = term > 0 ? Math.round(amt / term) : amt;
    const paidInstallments = installmentAmount > 0 ? Math.floor(paidAmount / installmentAmount) : 0;
    const lastPaymentDate = l.metadata?.last_payment_date ? (new Date(l.metadata.last_payment_date)).toISOString().slice(0, 10) : '';

    let friendlyStatus = '';
    if (l.status === 'closed') friendlyStatus = 'Liquidado';
    else if (l.status === 'active') {
      if (l.metadata?.overdue === true) friendlyStatus = 'Atrasado';
      else friendlyStatus = 'Al día';
    } else if (l.status === 'cancelled') {
      friendlyStatus = 'Rechazado';
    } else {
      friendlyStatus = l.status ?? '';
    }

    const approvedDateForNext = l.approved_at ? new Date(l.approved_at) : (l.applied_at ? new Date(l.applied_at) : (l.created_at ? new Date(l.created_at) : null));
    let nextPaymentDate = '';
    if (l.metadata?.next_payment_date) {
      try { nextPaymentDate = new Date(l.metadata.next_payment_date).toISOString().slice(0, 10); } catch { nextPaymentDate = ''; }
    } else if (approvedDateForNext) {
      const termCount = Number(l.installments ?? l.metadata?.installments ?? 12);
      const amtVal = Number(l.amount ?? 0);
      const installmentAmount = termCount > 0 ? Math.round(amtVal / termCount) : amtVal;
      const paidAmt = Number(l.metadata?.paid_amount ?? 0);
      const paidInst = installmentAmount > 0 ? Math.floor(paidAmt / installmentAmount) : 0;
      const nextInst = paidInst + 1;
      const d = new Date(approvedDateForNext);
      d.setMonth(d.getMonth() + nextInst);
      nextPaymentDate = d.toISOString().slice(0, 10);
    }

    const today = new Date().toISOString().slice(0, 10);
    const totalAmount = Number(l.amount ?? 0);
    const overdueFlag = (l.status === 'active') && !!nextPaymentDate && (nextPaymentDate < today) && (paidAmount < totalAmount);

    return {
      id: l.loan_number ?? l.id,
      uuid: l.id,
      user_id: l.user_id,
      email: user.email ?? '',
      firstName: user.first_name ?? '',
      lastName: user.last_name ?? '',
      phone: user.phone ?? '',
      requestDate: l.applied_at ? new Date(l.applied_at).toISOString().slice(0, 10) : (l.created_at ? new Date(l.created_at).toISOString().slice(0, 10) : ''),
      amount: l.amount,
      installments: l.installments,
      paidInstallments,
      membership: membershipVal,
      membershipRaw,
      ineNumber: user.ine_key ?? l.metadata?.ine_key ?? '',
      curpNumber: user.curp ?? l.metadata?.curp ?? '',
      preApproval: l.metadata?.pre_approval ?? (l.status === 'pending' ? 'En Revisión' : 'Aprobado'),
      isAccountVerified: l.metadata?.account_verified === true,
      signatureStatus: latestSignature ? 'Firmado' : (l.status === 'signed' ? 'Firmado' : 'Espera'),
      contractStatus: l.status === 'signed' ? 'Firmado' : l.status,
      disbursementStatus: latestDisbursement ? 'Desembolsado' : (l.status === 'disbursed' ? 'Desembolsado' : 'Pendiente'),
      bank: latestDisbursement?.destination_account?.bank ?? l.metadata?.depositData?.bank ?? '',
      accountNumber: latestDisbursement?.destination_account?.clabe ?? l.metadata?.depositData?.clabe ?? '',
      lastPaymentDate,
      nextPaymentDate,
      overdue: overdueFlag,
      status: friendlyStatus,
      raw: l,
      userRaw: user,
    };
  };

  const { data: pendingData, isLoading: pendingLoading } = useAdminPendingLoans(pendingPage);
  const { data: contractData, isLoading: contractLoading } = useAdminContractLoans(contractPage);
  const { data: disbursementData, isLoading: disbursementLoading } = useAdminDisbursementLoans(disbursementPage);
  const { data: activeData, isLoading: activeLoading } = useAdminActiveLoans(activePage);
  const { data: overdueData, isLoading: overdueLoading } = useAdminOverdueLoans();
  const { data: historyData, isLoading: historyLoading } = useAdminHistoryLoans(historyPage);

  const pendingLoansData = pendingData?.loans.map(mapLoan) ?? [];
  const pendingTotal = pendingData?.total ?? 0;
  const contractLoansData = contractData?.loans.map(mapLoan) ?? [];
  const contractTotal = contractData?.total ?? 0;
  const disbursementLoansData = disbursementData?.loans.map(mapLoan) ?? [];
  const disbursementTotal = disbursementData?.total ?? 0;
  const activeLoansData = activeData?.loans.map(mapLoan) ?? [];
  const activeTotal = activeData?.total ?? 0;
  const overdueLoansData = overdueData?.loans
    .map(mapLoan)
    .filter((loan) => loan.overdue) ?? [];
  const overdueTotal = overdueLoansData.length;
  const historyLoansData = historyData?.loans.map(mapLoan) ?? [];
  const historyTotal = historyData?.total ?? 0;

  const renderSkeletonRows = (columns: ColumnConfig[]) => {
    const visibleCols = columns.filter(c => c.visible).length || 6;
    return Array.from({ length: pageSize }).map((_, i) => (
      <TableRow key={`skel-${i}`}>
        <TableCell colSpan={visibleCols}>
          <div className="py-2"><Skeleton className="h-6 w-full" /></div>
        </TableCell>
      </TableRow>
    ));
  };

  const renderPagination = (page: number, total: number, onPageChange: (p: number) => void) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages <= 1) return null;

    const pagesSet = new Set<number>();
    pagesSet.add(1);
    pagesSet.add(totalPages);
    for (let p = page - 1; p <= page + 1; p++) {
      if (p > 1 && p < totalPages) pagesSet.add(p);
    }
    // ensure nearby second/penultimate pages for nicer UX
    if (2 < totalPages) pagesSet.add(2);
    if (totalPages - 1 > 1) pagesSet.add(totalPages - 1);

    const pages = Array.from(pagesSet).sort((a, b) => a - b);

    const nodes: any[] = [];
    nodes.push(
      <Button key="first" size="sm" variant="ghost" onClick={() => onPageChange(1)} disabled={page <= 1} className="!p-2">
        ‹
      </Button>
    );
    nodes.push(
      <Button key="prev" size="sm" variant="ghost" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="!p-2">
        ←
      </Button>
    );

    let lastShown = 0;
    pages.forEach((p) => {
      if (lastShown && p - lastShown > 1) {
        nodes.push(<div key={`ell-${p}`} className="px-2 text-muted-foreground">…</div>);
      }
      lastShown = p;

      nodes.push(
        <Button
          key={`p-${p}`}
          size="sm"
          onClick={() => onPageChange(p)}
          className={`px-3 py-1 rounded-md ${p === page ? 'bg-primary text-primary-foreground shadow-md' : 'bg-transparent text-muted-foreground hover:bg-muted/50'}`}
        >
          {p}
        </Button>
      );
    });

    nodes.push(
      <Button key="next" size="sm" variant="ghost" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="!p-2">
        →
      </Button>
    );
    nodes.push(
      <Button key="last" size="sm" variant="ghost" onClick={() => onPageChange(totalPages)} disabled={page >= totalPages} className="!p-2">
        ›
      </Button>
    );

    return (
      <div className="bg-card/70 px-3 py-2 rounded-lg shadow-sm flex items-center gap-3">
        {nodes}
      </div>
    );
  };

  const reloadCurrentTab = () => {
    switch (activeTab) {
      case 'pending':
        queryClient.invalidateQueries({ queryKey: ['loans', 'admin', 'pending'] });
        setPendingPage(1);
        break;
      case 'contract':
        queryClient.invalidateQueries({ queryKey: ['loans', 'admin', 'contract'] });
        setContractPage(1);
        break;
      case 'disbursement':
        queryClient.invalidateQueries({ queryKey: ['loans', 'admin', 'disbursement'] });
        setDisbursementPage(1);
        break;
      case 'active':
        queryClient.invalidateQueries({ queryKey: ['loans', 'admin', 'active'] });
        setActivePage(1);
        break;
      case 'overdue':
        queryClient.invalidateQueries({ queryKey: ['loans', 'admin', 'overdue'] });
        setOverduePage(1);
        break;
      case 'history':
        queryClient.invalidateQueries({ queryKey: ['loans', 'admin', 'history'] });
        setHistoryPage(1);
        break;
      default: break;
    }
  };

  // Filter states for each tab
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingSort, setPendingSort] = useState('date-desc');
  const [pendingColumns, setPendingColumns] = useState(defaultPendingColumns);

  const [contractSearch, setContractSearch] = useState('');
  const [contractSort, setContractSort] = useState('date-desc');
  const [contractColumns, setContractColumns] = useState(defaultContractColumns);

  const [disbursementSearch, setDisbursementSearch] = useState('');
  const [disbursementSort, setDisbursementSort] = useState('date-desc');
  const [disbursementColumns, setDisbursementColumns] = useState(defaultDisbursementColumns);

  const [activeSearch, setActiveSearch] = useState('');
  const [activeSort, setActiveSort] = useState('date-desc');
  const [activeColumns, setActiveColumns] = useState(defaultActiveColumns);

  const [overdueSearch, setOverdueSearch] = useState('');
  const [overdueSort, setOverdueSort] = useState('date-desc');
  const [overdueColumns, setOverdueColumns] = useState(defaultOverdueColumns);

  const [historySearch, setHistorySearch] = useState('');
  const [historySort, setHistorySort] = useState('date-desc');
  const [historyColumns, setHistoryColumns] = useState(defaultHistoryColumns);

  // Modal states
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; loan: any | null; sourceTab?: string }>({ open: false, loan: null });
  const [showDetailClabe, setShowDetailClabe] = useState(false);
  const [ineCurpModal, setIneCurpModal] = useState<{ open: boolean; loan: any | null; type: 'ine' | 'curp' }>({ open: false, loan: null, type: 'ine' });
  const [modifyModal, setModifyModal] = useState<{ open: boolean; loan: any | null }>({ open: false, loan: null });
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; loan: any | null }>({ open: false, loan: null });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; loan: any | null }>({ open: false, loan: null });
  const [approvingState, setApprovingState] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [rejectingState, setRejectingState] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const [resendModal, setResendModal] = useState<{ open: boolean; loan: any | null }>({ open: false, loan: null });
  const [attachModal, setAttachModal] = useState<{ open: boolean; loan: any | null }>({ open: false, loan: null });
  const [consentRenewModal, setConsentRenewModal] = useState<{ open: boolean; loan: any }>({ open: false, loan: null });

  const [modifyDisbursementModal, setModifyDisbursementModal] = useState<{ open: boolean; loan: any | null }>({ open: false, loan: null });
  const [confirmDisbursementModal, setConfirmDisbursementModal] = useState<{ open: boolean; loan: any | null }>({ open: false, loan: null });

  const [reminderModal, setReminderModal] = useState<{ open: boolean; loan: any | null }>({ open: false, loan: null });
  const [sellPortfolioModal, setSellPortfolioModal] = useState<{ open: boolean; loan: any | null }>({ open: false, loan: null });
  const [updateInstallmentsModal, setUpdateInstallmentsModal] = useState<{ open: boolean; loan: any | null }>({ open: false, loan: null });
  const [scheduleModal, setScheduleModal] = useState<{ open: boolean; loan: any | null }>({ open: false, loan: null });

  useEffect(() => {
    if (detailsModal.open && detailsModal.loan?.uuid) {
      const existingInterestRate = detailsModal.loan?.raw?.interest_rate;
      supabase
        .from('loans')
        .select(`
          *,
          users(id, first_name, last_name, email, phone, ine_key, curp, address, birth_date, avatar_url)
        `)
        .eq('id', detailsModal.loan.uuid)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            supabase
              .from('user_memberships')
              .select('*, membership_plans(id, name, price, active, features)')
              .eq('user_id', data.user_id)
              .eq('status', 'active')
              .maybeSingle()
              .then(({ data: membershipData }) => {
                const updatedUser = membershipData
                  ? { ...data.users, user_memberships: [membershipData] }
                  : data.users;
                const preservedData = {
                  ...data,
                  interest_rate: data.interest_rate ?? existingInterestRate ?? 0.20
                };
                setDetailsModal(prev => ({
                  ...prev,
                  loan: {
                    ...prev.loan,
                    raw: {
                      ...prev.loan?.raw,
                      ...preservedData,
                      users: updatedUser
                    }
                  }
                }));
              });
          }
        });
    } else if (!detailsModal.open) {
      setShowDetailClabe(false);
    }
  }, [detailsModal.open]);

  const exportToExcel = async () => {
    const XLSX = await import("xlsx");
    const tabNames: Record<string, string> = {
      pending: 'Pendientes',
      contract: 'Firma',
      disbursement: 'Desembolso',
      active: 'Activos',
      overdue: 'Atrasados',
      history: 'Historial',
    };
    const tabData: Record<string, { data: any[]; columns: ColumnConfig[] }> = {
      pending: { data: pendingLoansData, columns: pendingColumns },
      contract: { data: contractLoansData, columns: contractColumns },
      disbursement: { data: disbursementLoansData, columns: disbursementColumns },
      active: { data: activeLoansData, columns: activeColumns },
      overdue: { data: overdueLoansData, columns: overdueColumns },
      history: { data: historyLoansData, columns: historyColumns },
    };
    const { data: exportData, columns: exportColumns } = tabData[activeTab] || { data: [], columns: [] };
    const visibleCols = exportColumns.filter(c => c.visible && !['actions', 'consent', 'resend', 'attach', 'preApproval', 'signatureStatus', 'disbursementStatus', 'contractStatus'].includes(c.key));
    const exportRows = exportData.map(loan => {
      const row: Record<string, string | number> = {};
      visibleCols.forEach(col => {
        const key = col.key;
        let value = (loan as Record<string, any>)[key];
        if (key === 'amount') value = `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
        else if (key === 'requestDate') value = loan.requestDate;
        else if (key === 'lastPaymentDate') value = loan.lastPaymentDate || 'N/A';
        else if (key === 'nextPaymentDate') value = loan.nextPaymentDate || 'N/A';
        else if (key === 'paidInstallments') value = `${loan.paidInstallments}/${loan.installments}`;
        else if (key === 'ine') value = loan.ineNumber || 'N/A';
        else if (key === 'curp') value = loan.curpNumber || 'N/A';
        else if (key === 'membership') value = loan.membership || 'N/A';
        else if (key === 'bank') value = getBankName(loan.bank) || 'N/A';
        else if (key === 'accountNumber') value = loan.accountNumber || 'N/A';
        row[col.label] = value ?? '';
      });
      return row;
    });
    if (exportRows.length === 0) {
      toast({ title: "Sin datos", description: "No hay datos para exportar en esta pestaña." });
      return;
    }
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tabNames[activeTab] || 'Préstamos');
    XLSX.writeFile(wb, `prestamos-${activeTab}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast({ title: "Exportado", description: `Archivo Excel descargado (${exportRows.length} registros).` });
  };

  const APPROVE_MESSAGES = [
    'Verificando consentimiento bancario...',
    'Validando información del cliente...',
    'Preparando contrato digital...',
    'Enviando invitación de firma...',
    'Enviando correo de notificación...',
    'Finalizando proceso de aprobación...',
  ];

  const handleApproveLoan = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    const loan = approveDialog.loan;
    if (!loan) { isProcessingRef.current = false; return; }
    const loanId = loan.uuid ?? loan.raw?.id ?? loan.id;

    setApproveDialog({ open: false, loan: null });
    setApprovingState({ open: true, message: 'Iniciando aprobación...' });

    let messageIndex = 0;
    const updateMessage = () => {
      setApprovingState(prev => ({ ...prev, message: APPROVE_MESSAGES[messageIndex] || APPROVE_MESSAGES[APPROVE_MESSAGES.length - 1] }));
      messageIndex = Math.min(messageIndex + 1, APPROVE_MESSAGES.length - 1);
    };

    approveIntervalRef.current = setInterval(updateMessage, 2000);
    const messageInterval = approveIntervalRef.current;
    updateMessage();

    try {
      setApprovingState(prev => ({ ...prev, message: 'Actualizando estado del préstamo...' }));
      const { data: rpcResult, error: rpcError } = await supabase.rpc('admin_update_loan_status', {
        p_loan_id: loanId,
        p_action: 'approve',
      });
      if (rpcError) throw rpcError;
      if (rpcResult?.error) throw new Error(rpcResult.error);

      if (loan.user_id) {
        try {
          await supabase.from('notifications').insert([
            {
              user_id: loan.user_id,
              type: 'loan_signature_pending',
              title: 'Firma pendiente',
              message: 'Tienes una firma pendiente. Por favor revisa tu correo para firmar el contrato.',
              url: '/my-loans',
              channels: ['email'],
            },
          ]);
        } catch (e) {
          console.warn('[admin] failed to insert notification', e);
        }
      }

      if (loan.email) {
        try {
          setApprovingState(prev => ({ ...prev, message: 'Preparando documento de contrato...' }));
          const optionalPdfBase64 = await generateLoanSchedulePdfBase64(loan);
          const optionalPdfName = `tabla-amortizacion-${loan.id ?? loan.uuid ?? 'prestamo'}.pdf`;
          setApprovingState(prev => ({ ...prev, message: 'Enviando invitación de firma...' }));
          const resp = await increscendoApiFetch('/signnow-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              loan_id: loanId,
              recipient_email: loan.email,
              optional_pdf_base64: optionalPdfBase64,
              optional_pdf_name: optionalPdfName,
            }),
          });
          const data = await resp.json().catch(() => null);
          if (!resp.ok) throw data || new Error('External function error');
          try {
            const updates: any = { metadata: Object.assign({}, loan.raw?.metadata || {}, { signnow_invite: data }) };
            if (data?.docId) updates.id_document = data.docId;
            await supabase.from('loans').update(updates).eq('id', loanId);
          } catch (e) {
            console.error('[admin] failed to save signnow_invite metadata', e);
          }
        } catch (e) {
          console.warn('[admin] signnow invite error', e);
        }
      }

      // Send approval email to client
      if (loan.email) {
        setApprovingState(prev => ({ ...prev, message: 'Enviando correo de notificación...' }));
        const userName = loan.firstName ? `${loan.firstName} ${loan.lastName || ''}`.trim() : 'Cliente';
        try {
          await sendEmail({
            to: loan.email,
            subject: '¡Préstamo Pre Aprobado!',
            html: loanApprovedTemplate({
              name: userName,
              loanId: loan.id || loan.uuid || loan.loan_id || '',
              amount: (loan.amount || 0).toLocaleString('es-MX'),
              installments: String(loan.installments || loan.raw?.installments || ''),
              bank: loan.bank ? getBankName(loan.bank) : 'No especificado',
              clabe: loan.accountNumber ? `****${loan.accountNumber.slice(-4)}` : 'No especificada',
            }),
            text: `Hola ${userName}, tu préstamo ha sido preaprobado. Folio: ${loan.id}. Monto: $${(loan.amount || 0).toLocaleString('es-MX')} MXN. Revisa tu correo para firmar el contrato.`,
          });
        } catch (e) {
          console.warn('[admin] failed to send approval email', e);
        }
      }

      clearInterval(messageInterval);
      setApprovingState({ open: false, message: '' });
      toast({ title: 'Aprobado', description: `La solicitud ${loan.id} pasó a estado Aprobado (firma pendiente).` });
      await reloadCurrentTab();
    } catch (err) {
      clearInterval(messageInterval);
      console.error('Error aprobando solicitud', err);
      setApprovingState({ open: false, message: '' });
      toast({ title: 'Error', description: 'No se pudo aprobar la solicitud.', variant: 'destructive' });
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleTestSignNow = async () => {
    const loan = detailsModal.loan as any;
    if (!loan?.email) {
      toast({ title: "Error", description: "No hay email disponible", variant: "destructive" });
      return;
    }
    const loanId = loan.uuid ?? loan.raw?.id ?? loan.id;
    try {
      const optionalPdfBase64 = generateLoanSchedulePdfBase64(loan);
      const optionalPdfName = `tabla-amortizacion-${loan.id ?? loan.uuid ?? 'prestamo'}.pdf`;
      const resp = await increscendoApiFetch('/signnow-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_id: loanId,
          recipient_email: loan.email,
          optional_pdf_base64: optionalPdfBase64,
          optional_pdf_name: optionalPdfName,
        }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw data || new Error('SignNow error');
      toast({ title: "Test OK", description: `SignNow invite: ${JSON.stringify(data)}` });
    } catch (err) {
      console.error('SignNow test error', err);
      toast({ title: "Error", description: "Falló el test de SignNow", variant: "destructive" });
    }
  };

  const handleDownloadTestLoanPdf = () => {
    const loan = detailsModal.loan as any;
    if (!loan) {
      toast({ title: "Error", description: "No hay préstamo para generar el PDF", variant: "destructive" });
      return;
    }

    try {
      const pdfBase64 = generateLoanSchedulePdfBase64(loan);
      const fileName = `test-pdf-prestamo-${loan.id ?? loan.uuid ?? 'prestamo'}.pdf`;
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: "PDF descargado", description: `Se descargó ${fileName}.` });
    } catch (err) {
      console.error('Test PDF download error', err);
      toast({ title: "Error", description: "No se pudo generar el PDF de prueba", variant: "destructive" });
    }
  };

  const REJECT_MESSAGES = [
    'Rechazando solicitud...',
    'Actualizando estado del préstamo...',
    'Notificando al cliente...',
    'Finalizando proceso...',
  ];

  const handleRejectLoan = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    const loan = rejectDialog.loan;
    if (!loan) { isProcessingRef.current = false; return; }
    setRejectDialog({ open: false, loan: null });
    setRejectingState({ open: true, message: REJECT_MESSAGES[0] });

    let msgIdx = 0;
    rejectIntervalRef.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % REJECT_MESSAGES.length;
      setRejectingState(prev => ({ ...prev, message: REJECT_MESSAGES[msgIdx] }));
    }, 2000);
    const msgInterval = rejectIntervalRef.current;

    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('admin_update_loan_status', {
        p_loan_id: loan.uuid ?? loan.raw?.id,
        p_action: 'reject',
      });
      if (rpcError) throw rpcError;
      if (rpcResult?.error) throw new Error(rpcResult.error);

      await reloadCurrentTab();

      // Send rejection email to client
      if (loan.email) {
        const userName = loan.firstName ? `${loan.firstName} ${loan.lastName || ''}`.trim() : 'Cliente';
        try {
          await sendEmail({
            to: loan.email,
            subject: 'Solicitud No Aprobada',
            html: loanRejectedTemplate({
              name: userName,
              loanId: loan.id || loan.uuid || loan.loan_id || '',
            }),
            text: `Hola ${userName}, lamentamos informarte que tu solicitud de préstamo Folio ${loan.id} no ha sido aprobada en esta ocasión.`,
          });
        } catch (e) {
          console.warn('[admin] failed to send rejection email', e);
        }
      }

      // Create in-app notification for the user
      if (loan.user_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: loan.user_id,
            type: 'loan_rejected',
            title: 'Solicitud rechazada',
            message: `Tu solicitud de préstamo Folio ${loan.id} no fue aprobada. Revisa tu correo para más detalles.`,
            url: '/my-loans',
            channels: ['email'],
          });
        } catch (e) {
          console.warn('[admin] failed to insert rejection notification', e);
        }
      }

      setRejectingState({ open: false, message: '' });
      toast({ title: 'Rechazado', description: `La solicitud ${loan.id} ha sido rechazada.`, variant: 'destructive' });
    } catch (err) {
      console.error('Error rechazando solicitud', err);
      setRejectingState({ open: false, message: '' });
      toast({ title: 'Error', description: 'No se pudo rechazar la solicitud.' });
    } finally {
      clearInterval(msgInterval);
      isProcessingRef.current = false;
    }
  };

  const handleConfirmDisbursement = async (file: File | null) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    const loan = confirmDisbursementModal.loan;
    if (!loan) { isProcessingRef.current = false; return; }
    try {
      toast({ title: 'Procesando', description: 'Confirmando desembolso...' });

      let publicUrl: string | null = null;
      if (file) {
        const userId = loan.user_id || 'unknown';
        const ext = file.name.split('.').pop() || 'pdf';
        const objectName = `voucher-${loan.uuid ?? loan.raw?.id}-${Date.now()}.${ext}`;
        const path = `${userId}/${objectName}`;

        const { error: uploadError } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: publicData } = await supabase.storage.from('documents').getPublicUrl(path);
        publicUrl = (publicData as any)?.publicUrl ?? null;
      }

      // insert loan_disbursement record
      const disbursementPayload: any = {
        loan_id: loan.uuid ?? loan.raw?.id,
        amount: loan.amount,
        destination_account: { bank: loan.bank, clabe: loan.accountNumber },
      };
      const { error: disbErr } = await supabase.from('loan_disbursements').insert([disbursementPayload]);
      if (disbErr) throw disbErr;

      // insert loan_documents if we uploaded a file
      if (publicUrl) {
        const docPayload = {
          loan_id: loan.uuid ?? loan.raw?.id,
          type: 'voucher',
          uploader_id: userId ?? null,
          file_url: publicUrl,
          file_name: file?.name ?? null,
          mime_type: file?.type ?? null,
        };
        const { error: docErr } = await supabase.from('loan_documents').insert([docPayload]);
        if (docErr) console.warn('Failed to insert loan_documents', docErr);
      }

      // update loan status to active and set disbursed_at
      const { data: rpcResult, error: rpcError } = await supabase.rpc('admin_update_loan_status', {
        p_loan_id: loan.uuid ?? loan.raw?.id,
        p_action: 'disburse',
      });
      if (rpcError) throw rpcError;
      if (rpcResult?.error) throw new Error(rpcResult.error);

      toast({ title: 'Desembolso confirmado', description: 'El préstamo se marcó como activo y el voucher fue subido.' });
      setConfirmDisbursementModal({ open: false, loan: null });
      await reloadCurrentTab();
      queryClient.invalidateQueries({ queryKey: ['loans', 'admin', 'active'] });

      // Send disbursement email to client
      if (loan.email) {
        const userName = loan.firstName ? `${loan.firstName} ${loan.lastName || ''}`.trim() : 'Cliente';
        try {
          await sendEmail({
            to: loan.email,
            subject: '¡Desembolso Exitoso!',
            html: disbursementConfirmedTemplate({
              name: userName,
              loanId: loan.id || loan.uuid || '',
              amount: (loan.amount || 0).toLocaleString('es-MX'),
              bank: loan.bankName || (loan.bank ? getBankName(loan.bank) : 'No especificado'),
              clabe: loan.accountNumber ? `****${loan.accountNumber.slice(-4)}` : 'No especificada',
            }),
            text: `Hola ${userName}, el desembolso de tu préstamo por $${(loan.amount || 0).toLocaleString('es-MX')} MXN ha sido procesado exitosamente. Los fondos están siendo transferidos a tu cuenta.`,
          });
        } catch (e) {
          console.warn('[admin] failed to send disbursement email', e);
        }
      }
    } catch (err) {
      console.error('Error confirmando desembolso', err);
      toast({ title: 'Error', description: 'No se pudo confirmar el desembolso.', variant: 'destructive' });
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleSendReminder = async () => {
    const loan = reminderModal.loan as any;
    if (!loan?.user_id) {
      toast({ title: 'Error', description: 'No se encontro el usuario para enviar recordatorio.' });
      return;
    }
    try {
      const nextPaymentDate = loan.nextPaymentDate || loan.raw?.next_payment_date || 'Próximamente';
      const userName = loan.firstName ? `${loan.firstName} ${loan.lastName || ''}`.trim() : 'Cliente';
      const installmentLabel = loan.paidInstallments
        ? `Cuota ${(loan.paidInstallments || 0) + 1} de ${loan.installments}`
        : `Cuota 1 de ${loan.installments}`;

      if (loan.email) {
        await sendEmail({
          to: loan.email,
          subject: 'Recordatorio de Pago',
          html: paymentReminderTemplate({
            name: userName,
            loanId: loan.id || loan.uuid || '',
            amount: (loan.amount || 0).toLocaleString('es-MX'),
            nextPaymentDate: typeof nextPaymentDate === 'string' ? nextPaymentDate : new Date(nextPaymentDate).toLocaleDateString('es-MX'),
            installment: installmentLabel,
            clabe: loan.accountNumber ? `****${loan.accountNumber.slice(-4)}` : 'No especificada',
          }),
          text: `Hola ${userName}, te recordamos que tu próxima cuota está por vencer. Tu próxima cuota (${installmentLabel}) por $${(loan.amount || 0).toLocaleString('es-MX')} MXN tiene como fecha límite ${nextPaymentDate}. Realiza tu pago a tiempo.`,
        });
      }

      toast({ title: 'Recordatorio enviado', description: 'El recordatorio fue enviado al correo del usuario.' });
      setReminderModal({ open: false, loan: null });
    } catch (err) {
      console.error('Error enviando recordatorio', err);
      toast({ title: 'Error', description: 'No se pudo enviar el recordatorio.' });
    }
  };

  const isColumnVisible = (columns: ColumnConfig[], key: string) =>
    columns.find(c => c.key === key)?.visible ?? true;

  return (
    <div className="p-4 sm:p-6 md:px-6 lg:p-8">
      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v);
      }} className="w-full">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mb-4 sm:mb-6">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:max-w-4xl sm:grid-cols-6">
            <TabsTrigger value="pending" className="text-xs sm:text-sm whitespace-nowrap">Pendiente</TabsTrigger>
            <TabsTrigger value="contract" className="text-xs sm:text-sm whitespace-nowrap">Firma</TabsTrigger>
            <TabsTrigger value="disbursement" className="text-xs sm:text-sm whitespace-nowrap">Desembolso</TabsTrigger>
            <TabsTrigger value="active" className="text-xs sm:text-sm whitespace-nowrap">Activos</TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs sm:text-sm whitespace-nowrap">Atrasados</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm whitespace-nowrap">Historial</TabsTrigger>
          </TabsList>
        </div>

        {/* PENDIENTE Tab */}
        <TabsContent value="pending">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Solicitudes Pendientes</CardTitle>
              <CardDescription>Revisa y aprueba nuevas solicitudes de préstamo</CardDescription>
            </CardHeader>
            <CardContent>
              <LoanTableFilters
                searchTerm={pendingSearch}
                onSearchChange={setPendingSearch}
                sortOrder={pendingSort}
                onSortChange={setPendingSort}
                columns={pendingColumns}
                onColumnsChange={setPendingColumns}
                showExport
                onExport={exportToExcel}
              />
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isColumnVisible(pendingColumns, 'id') && <TableHead>ID</TableHead>}
                      {isColumnVisible(pendingColumns, 'firstName') && <TableHead>Nombres</TableHead>}
                      {isColumnVisible(pendingColumns, 'lastName') && <TableHead>Apellidos</TableHead>}
                      {isColumnVisible(pendingColumns, 'amount') && <TableHead>Monto</TableHead>}
                      {isColumnVisible(pendingColumns, 'installments') && <TableHead>Cuotas</TableHead>}
                      {isColumnVisible(pendingColumns, 'preApproval') && <TableHead>Pre-Aprob.</TableHead>}
                      {isColumnVisible(pendingColumns, 'membership') && <TableHead>Membresía</TableHead>}
                      {isColumnVisible(pendingColumns, 'ine') && <TableHead>INE</TableHead>}
                      {isColumnVisible(pendingColumns, 'curp') && <TableHead>CURP</TableHead>}
                      {isColumnVisible(pendingColumns, 'consent') && <TableHead>Consentimiento</TableHead>}
                      {isColumnVisible(pendingColumns, 'requestDate') && <TableHead>F. Solicitud</TableHead>}
                      {isColumnVisible(pendingColumns, 'actions') && <TableHead>Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingLoading ? renderSkeletonRows(pendingColumns) : pendingLoansData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={pendingColumns.filter(c => c.visible).length || 12} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">No hay solicitudes pendientes</p>
                              <p className="text-sm text-muted-foreground mt-1">Las nuevas solicitudes aparecerán aquí</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingLoansData.filter(l =>
                        (l.firstName ?? '').toLowerCase().includes(pendingSearch.toLowerCase()) ||
                        (l.lastName ?? '').toLowerCase().includes(pendingSearch.toLowerCase()) ||
                        String(l.id ?? '').toLowerCase().includes(pendingSearch.toLowerCase())
                      ).map((loan) => (
                        <TableRow key={loan.id}>
                          {isColumnVisible(pendingColumns, 'id') && <TableCell className="font-medium whitespace-nowrap">{loan.id}</TableCell>}
                          {isColumnVisible(pendingColumns, 'firstName') && <TableCell>{loan.firstName}</TableCell>}
                          {isColumnVisible(pendingColumns, 'lastName') && <TableCell>{loan.lastName}</TableCell>}
                          {isColumnVisible(pendingColumns, 'amount') && <TableCell className="font-semibold">${loan.amount.toLocaleString()}</TableCell>}
                          {isColumnVisible(pendingColumns, 'installments') && <TableCell>{loan.installments}</TableCell>}
                          {isColumnVisible(pendingColumns, 'preApproval') && (
                            <TableCell>
                              {loan?.raw?.status === 'cancelled' || loan?.status === 'Rechazado' ? (
                                <StatusBadge status="Rechazado" />
                              ) : (
                                <Badge variant="outline" className="bg-warning/10 text-warning border-warning whitespace-nowrap">{loan.preApproval}</Badge>
                              )}
                            </TableCell>
                          )}
                          {isColumnVisible(pendingColumns, 'membership') && (
                            <TableCell className="min-w-[120px]">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 cursor-help whitespace-nowrap">
                                      <Star className="h-3 w-3 mr-1" />{loan.membership || 'Sin membresía'}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="font-semibold">{loan.membership || 'Sin membresía'}</p>
                                    {loan.membershipRaw?.price && <p className="text-xs text-muted-foreground">${Number(loan.membershipRaw.price).toLocaleString()}</p>}
                                    {loan.membershipRaw?.active !== false ? <p className="text-xs text-green-600">Activa</p> : <p className="text-xs text-muted-foreground">Inactiva</p>}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          )}
                          {isColumnVisible(pendingColumns, 'ine') && (
                            <TableCell>
                              <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setIneCurpModal({ open: true, loan, type: 'ine' })}>
                                {loan.ineNumber?.slice(0, 10) ?? 'N/A'}...
                              </Button>
                            </TableCell>
                          )}
                          {isColumnVisible(pendingColumns, 'curp') && (
                            <TableCell>
                              <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setIneCurpModal({ open: true, loan, type: 'curp' })}>
                                {loan.curpNumber?.slice(0, 10) ?? 'N/A'}...
                              </Button>
                            </TableCell>
                          )}
                          {isColumnVisible(pendingColumns, 'consent') && (
                            <TableCell>
                              <ConsentBadge status={loan.status_consent || loan.raw?.status_consent || loan.statusConsent} />
                            </TableCell>
                          )}
                          {isColumnVisible(pendingColumns, 'requestDate') && <TableCell className="whitespace-nowrap">{formatDisplayDate(loan.requestDate)}</TableCell>}
                          {isColumnVisible(pendingColumns, 'actions') && (
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => setDetailsModal({ open: true, loan, sourceTab: 'pending' })} title="Ver detalles">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setModifyModal({ open: true, loan })} title="Modificar">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-warning hover:text-warning" onClick={() => setConsentRenewModal({ open: true, loan })} title="Reenviar documentos de consentimiento">
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-success hover:text-success" onClick={() => setApproveDialog({ open: true, loan })} title="Aprobar">
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => setRejectDialog({ open: true, loan })} title="Rechazar">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      )))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">Mostrando {(pendingPage - 1) * pageSize + 1} - {Math.min(pendingPage * pageSize, pendingTotal)} de {pendingTotal}</div>
                <div className="flex items-center gap-2">
                  {renderPagination(pendingPage, pendingTotal, setPendingPage)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FIRMA CONTRATO Tab */}
        <TabsContent value="contract">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Firma de Contrato</CardTitle>
              <CardDescription>Gestiona el proceso de firma de contratos</CardDescription>
            </CardHeader>
            <CardContent>
              <LoanTableFilters
                searchTerm={contractSearch}
                onSearchChange={setContractSearch}
                sortOrder={contractSort}
                onSortChange={setContractSort}
                columns={contractColumns}
                onColumnsChange={setContractColumns}
                showExport
                onExport={exportToExcel}
              />
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isColumnVisible(contractColumns, 'id') && <TableHead>ID</TableHead>}
                      {isColumnVisible(contractColumns, 'firstName') && <TableHead>Nombres</TableHead>}
                      {isColumnVisible(contractColumns, 'lastName') && <TableHead>Apellidos</TableHead>}
                      {isColumnVisible(contractColumns, 'requestDate') && <TableHead>F. Solicitud</TableHead>}
                      {isColumnVisible(contractColumns, 'amount') && <TableHead>Monto</TableHead>}
                      {isColumnVisible(contractColumns, 'installments') && <TableHead>Cuotas</TableHead>}
                      {isColumnVisible(contractColumns, 'membership') && <TableHead>Membresía</TableHead>}
                      {isColumnVisible(contractColumns, 'ine') && <TableHead>INE</TableHead>}
                      {isColumnVisible(contractColumns, 'consent') && <TableHead>Consentimiento</TableHead>}
                      {isColumnVisible(contractColumns, 'curp') && <TableHead>CURP</TableHead>}
                      {isColumnVisible(contractColumns, 'preApproval') && <TableHead>Pre-Aprob.</TableHead>}
                      {isColumnVisible(contractColumns, 'signatureStatus') && <TableHead>Estado Firma</TableHead>}
                      {isColumnVisible(contractColumns, 'actions') && <TableHead>Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractLoading ? renderSkeletonRows(contractColumns) : contractLoansData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={contractColumns.filter(c => c.visible).length || 12} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">No hay contratos por firmar</p>
                              <p className="text-sm text-muted-foreground mt-1">Los contratos aprobados aparecerán aquí</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      contractLoansData.filter(l =>
                        (l.firstName ?? '').toLowerCase().includes(contractSearch.toLowerCase()) ||
                        (l.lastName ?? '').toLowerCase().includes(contractSearch.toLowerCase()) ||
                        String(l.id ?? '').toLowerCase().includes(contractSearch.toLowerCase())
                      ).map((loan) => (
                        <TableRow key={loan.id}>
                          {isColumnVisible(contractColumns, 'id') && <TableCell className="font-medium whitespace-nowrap">{loan.id}</TableCell>}
                          {isColumnVisible(contractColumns, 'firstName') && <TableCell>{loan.firstName}</TableCell>}
                          {isColumnVisible(contractColumns, 'lastName') && <TableCell>{loan.lastName}</TableCell>}
                          {isColumnVisible(contractColumns, 'requestDate') && <TableCell className="whitespace-nowrap">{formatDisplayDate(loan.requestDate)}</TableCell>}
                          {isColumnVisible(contractColumns, 'amount') && <TableCell className="font-semibold">${loan.amount.toLocaleString()}</TableCell>}
                          {isColumnVisible(contractColumns, 'installments') && <TableCell>{loan.installments}</TableCell>}
                          {isColumnVisible(contractColumns, 'membership') && (
                            <TableCell className="min-w-[120px]">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 cursor-help whitespace-nowrap">
                                      <Star className="h-3 w-3 mr-1" />{loan.membership || 'Sin membresía'}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="font-semibold">{loan.membership || 'Sin membresía'}</p>
                                    {loan.membershipRaw?.price && <p className="text-xs text-muted-foreground">${Number(loan.membershipRaw.price).toLocaleString()}</p>}
                                    {loan.membershipRaw?.active !== false ? <p className="text-xs text-green-600">Activa</p> : <p className="text-xs text-muted-foreground">Inactiva</p>}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          )}
                          {isColumnVisible(contractColumns, 'ine') && <TableCell>{loan.ineNumber?.slice(0, 10) ?? 'N/A'}...</TableCell>}
                          {isColumnVisible(contractColumns, 'consent') && (
                            <TableCell><ConsentBadge status={loan.status_consent || loan.raw?.status_consent || loan.statusConsent} /></TableCell>
                          )}
                          {isColumnVisible(contractColumns, 'curp') && <TableCell>{loan.curpNumber?.slice(0, 10) ?? 'N/A'}...</TableCell>}
                          {isColumnVisible(contractColumns, 'preApproval') && (
                            <TableCell>
                              <Badge className="bg-success/20 text-success border-success">{loan.preApproval}</Badge>
                            </TableCell>
                          )}
                          {isColumnVisible(contractColumns, 'signatureStatus') && (
                            <TableCell><SignatureStatusBadge status={loan.signatureStatus} /></TableCell>
                          )}
                          {isColumnVisible(contractColumns, 'actions') && (
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => setResendModal({ open: true, loan })} title="Reenviar Firma">
                                  <Send className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setDetailsModal({ open: true, loan, sourceTab: 'contract' })} title="Ver Detalles">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setAttachModal({ open: true, loan })} title="Adjuntar Contratos">
                                  <FileText className="h-4 w-4" />
                                </Button>
                                {(loan.status_consent || loan.raw?.status_consent || '').toString().toLowerCase() !== 'confirmed' && (
                                  <Button size="sm" variant="ghost" className="text-warning hover:text-warning" onClick={() => setConsentRenewModal({ open: true, loan })} title="Reenviar documentos de consentimiento">
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      )))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">Mostrando {(contractPage - 1) * pageSize + 1} - {Math.min(contractPage * pageSize, contractTotal)} de {contractTotal}</div>
                <div className="flex items-center gap-2">
                  {renderPagination(contractPage, contractTotal, setContractPage)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DESEMBOLSO Tab */}
        <TabsContent value="disbursement">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Desembolso</CardTitle>
              <CardDescription>Gestiona los desembolsos de préstamos aprobados</CardDescription>
            </CardHeader>
            <CardContent>
              <LoanTableFilters
                searchTerm={disbursementSearch}
                onSearchChange={setDisbursementSearch}
                sortOrder={disbursementSort}
                onSortChange={setDisbursementSort}
                columns={disbursementColumns}
                onColumnsChange={setDisbursementColumns}
                showExport
                onExport={exportToExcel}
              />
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isColumnVisible(disbursementColumns, 'id') && <TableHead>ID</TableHead>}
                      {isColumnVisible(disbursementColumns, 'firstName') && <TableHead>Nombres</TableHead>}
                      {isColumnVisible(disbursementColumns, 'lastName') && <TableHead>Apellidos</TableHead>}
                      {isColumnVisible(disbursementColumns, 'requestDate') && <TableHead>F. Solicitud</TableHead>}
                      {isColumnVisible(disbursementColumns, 'amount') && <TableHead>Monto</TableHead>}
                      {isColumnVisible(disbursementColumns, 'installments') && <TableHead>Cuotas</TableHead>}
                      {isColumnVisible(disbursementColumns, 'bank') && <TableHead>Banco</TableHead>}
                      {isColumnVisible(disbursementColumns, 'accountNumber') && <TableHead>Cta/CLABE</TableHead>}
                      {isColumnVisible(disbursementColumns, 'consent') && <TableHead>Consentimiento</TableHead>}
                      {isColumnVisible(disbursementColumns, 'ine') && <TableHead>INE</TableHead>}
                      {isColumnVisible(disbursementColumns, 'curp') && <TableHead>CURP</TableHead>}
                      {isColumnVisible(disbursementColumns, 'contractStatus') && <TableHead>Est. Contrato</TableHead>}
                      {isColumnVisible(disbursementColumns, 'disbursementStatus') && <TableHead>Est. Desembolso</TableHead>}
                      {isColumnVisible(disbursementColumns, 'actions') && <TableHead>Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disbursementLoading ? renderSkeletonRows(disbursementColumns) : disbursementLoansData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={disbursementColumns.filter(c => c.visible).length || 12} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <DollarSign className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">No hay préstamos por desembolsar</p>
                              <p className="text-sm text-muted-foreground mt-1">Los contratos firmados aparecerán aquí</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      disbursementLoansData.filter(l =>
                        (l.firstName ?? '').toLowerCase().includes(disbursementSearch.toLowerCase()) ||
                        (l.lastName ?? '').toLowerCase().includes(disbursementSearch.toLowerCase()) ||
                        String(l.id ?? '').toLowerCase().includes(disbursementSearch.toLowerCase())
                      ).map((loan) => (
                        <TableRow key={loan.id}>
                          {isColumnVisible(disbursementColumns, 'id') && <TableCell className="font-medium whitespace-nowrap">{loan.id}</TableCell>}
                          {isColumnVisible(disbursementColumns, 'firstName') && <TableCell>{loan.firstName}</TableCell>}
                          {isColumnVisible(disbursementColumns, 'lastName') && <TableCell>{loan.lastName}</TableCell>}
                          {isColumnVisible(disbursementColumns, 'requestDate') && <TableCell className="whitespace-nowrap">{formatDisplayDate(loan.requestDate)}</TableCell>}
                          {isColumnVisible(disbursementColumns, 'amount') && <TableCell className="font-semibold">${loan.amount.toLocaleString()}</TableCell>}
                          {isColumnVisible(disbursementColumns, 'installments') && <TableCell>{loan.installments}</TableCell>}
                          {isColumnVisible(disbursementColumns, 'bank') && <TableCell>{getBankName(loan.bank)}</TableCell>}
                          {isColumnVisible(disbursementColumns, 'accountNumber') && <TableCell>{loan.accountNumber}</TableCell>}
                          {isColumnVisible(disbursementColumns, 'consent') && (
                            <TableCell><ConsentBadge status={loan.status_consent || loan.raw?.status_consent || loan.statusConsent} /></TableCell>
                          )}
                          {isColumnVisible(disbursementColumns, 'ine') && <TableCell>{loan.ineNumber?.slice(0, 10) ?? 'N/A'}...</TableCell>}
                          {isColumnVisible(disbursementColumns, 'curp') && <TableCell>{loan.curpNumber?.slice(0, 10) ?? 'N/A'}...</TableCell>}
                          {isColumnVisible(disbursementColumns, 'contractStatus') && (
                            <TableCell>
                              <Badge className="bg-success/20 text-success border-success">{loan.contractStatus}</Badge>
                            </TableCell>
                          )}
                          {isColumnVisible(disbursementColumns, 'disbursementStatus') && (
                            <TableCell>
                              <Badge variant="outline" className="bg-warning/10 text-warning border-warning">{loan.disbursementStatus}</Badge>
                            </TableCell>
                          )}
                          {isColumnVisible(disbursementColumns, 'actions') && (
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => setDetailsModal({ open: true, loan, sourceTab: 'disbursement' })} title="Ver Detalles">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-warning hover:text-warning" onClick={() => setConsentRenewModal({ open: true, loan })} title="Reenviar documentos de consentimiento">
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="default" onClick={() => setConfirmDisbursementModal({ open: true, loan: { ...loan, bankName: getBankName(loan.bank) } })} title="Confirmar Desembolso">
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      )))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">Mostrando {(disbursementPage - 1) * pageSize + 1} - {Math.min(disbursementPage * pageSize, disbursementTotal)} de {disbursementTotal}</div>
                <div className="flex items-center gap-2">
                  {renderPagination(disbursementPage, disbursementTotal, setDisbursementPage)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACTIVOS Tab */}
        <TabsContent value="active">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Préstamos Activos</CardTitle>
              <CardDescription>Préstamos al día con sus pagos</CardDescription>
            </CardHeader>
            <CardContent>
              <LoanTableFilters
                searchTerm={activeSearch}
                onSearchChange={setActiveSearch}
                sortOrder={activeSort}
                onSortChange={setActiveSort}
                columns={activeColumns}
                onColumnsChange={setActiveColumns}
                showExport
                onExport={exportToExcel}
              />
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isColumnVisible(activeColumns, 'id') && <TableHead>ID</TableHead>}
                      {isColumnVisible(activeColumns, 'firstName') && <TableHead>Nombres</TableHead>}
                      {isColumnVisible(activeColumns, 'lastName') && <TableHead>Apellidos</TableHead>}
                      {isColumnVisible(activeColumns, 'requestDate') && <TableHead>F. Solicitud</TableHead>}
                      {isColumnVisible(activeColumns, 'amount') && <TableHead>Monto</TableHead>}
                      {isColumnVisible(activeColumns, 'installments') && <TableHead>Cuotas</TableHead>}
                      {isColumnVisible(activeColumns, 'paidInstallments') && <TableHead>Cuot. Pagadas</TableHead>}
                      {isColumnVisible(activeColumns, 'ine') && <TableHead>INE</TableHead>}
                      {isColumnVisible(activeColumns, 'consent') && <TableHead>Consentimiento</TableHead>}
                      {isColumnVisible(activeColumns, 'lastPaymentDate') && <TableHead>F. Últ. Pago</TableHead>}
                      {isColumnVisible(activeColumns, 'status') && <TableHead>Estado</TableHead>}
                      {isColumnVisible(activeColumns, 'actions') && <TableHead>Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeLoading ? renderSkeletonRows(activeColumns) : activeLoansData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={activeColumns.filter(c => c.visible).length || 12} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <CheckCircle className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">No hay préstamos activos</p>
                              <p className="text-sm text-muted-foreground mt-1">Los préstamos aprobados aparecerán aquí</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeLoansData.filter(l =>
                        (l.firstName ?? '').toLowerCase().includes(activeSearch.toLowerCase()) ||
                        (l.lastName ?? '').toLowerCase().includes(activeSearch.toLowerCase()) ||
                        String(l.id ?? '').toLowerCase().includes(activeSearch.toLowerCase())
                      ).map((loan) => (
                        <TableRow key={loan.id}>
                          {isColumnVisible(activeColumns, 'id') && <TableCell className="font-medium whitespace-nowrap">{loan.id}</TableCell>}
                          {isColumnVisible(activeColumns, 'firstName') && <TableCell>{loan.firstName}</TableCell>}
                          {isColumnVisible(activeColumns, 'lastName') && <TableCell>{loan.lastName}</TableCell>}
                          {isColumnVisible(activeColumns, 'requestDate') && <TableCell className="whitespace-nowrap">{formatDisplayDate(loan.requestDate)}</TableCell>}
                          {isColumnVisible(activeColumns, 'amount') && <TableCell className="font-semibold">${loan.amount.toLocaleString()}</TableCell>}
                          {isColumnVisible(activeColumns, 'installments') && <TableCell>{loan.installments}</TableCell>}
                          {isColumnVisible(activeColumns, 'paidInstallments') && <TableCell>{loan.paidInstallments}/{loan.installments}</TableCell>}
                          {isColumnVisible(activeColumns, 'ine') && <TableCell>{loan.ineNumber?.slice(0, 10) ?? 'N/A'}...</TableCell>}
                          {isColumnVisible(activeColumns, 'consent') && <TableCell><ConsentBadge status={loan.status_consent || loan.raw?.status_consent || loan.statusConsent} /></TableCell>}
                          {isColumnVisible(activeColumns, 'lastPaymentDate') && <TableCell className="whitespace-nowrap">{formatDisplayDate(loan.lastPaymentDate)}</TableCell>}
                          {isColumnVisible(activeColumns, 'status') && <TableCell><StatusBadge status={loan.status} /></TableCell>}
                          {isColumnVisible(activeColumns, 'actions') && (
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => setDetailsModal({ open: true, loan, sourceTab: 'active' })} title="Ver Detalle">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setScheduleModal({ open: true, loan })} title="Ver Cronograma">
                                  <Calendar className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setReminderModal({ open: true, loan })}>
                                      <Bell className="h-4 w-4 mr-2" />
                                      Enviar recordatorio
                                    </DropdownMenuItem>
                                    {/* <DropdownMenuItem onClick={() => setUpdateInstallmentsModal({ open: true, loan })}>
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Actualizar cuotas
                                    </DropdownMenuItem> */}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      )))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">Mostrando {(activePage - 1) * pageSize + 1} - {Math.min(activePage * pageSize, activeTotal)} de {activeTotal}</div>
                <div className="flex items-center gap-2">
                  {renderPagination(activePage, activeTotal, setActivePage)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ATRASADOS Tab */}
        <TabsContent value="overdue">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Préstamos Atrasados</CardTitle>
              <CardDescription>Préstamos con pagos pendientes o en mora</CardDescription>
            </CardHeader>
            <CardContent>
              <LoanTableFilters
                searchTerm={overdueSearch}
                onSearchChange={setOverdueSearch}
                sortOrder={overdueSort}
                onSortChange={setOverdueSort}
                columns={overdueColumns}
                onColumnsChange={setOverdueColumns}
                showExport
                onExport={exportToExcel}
              />
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isColumnVisible(overdueColumns, 'id') && <TableHead>ID</TableHead>}
                      {isColumnVisible(overdueColumns, 'firstName') && <TableHead>Nombres</TableHead>}
                      {isColumnVisible(overdueColumns, 'lastName') && <TableHead>Apellidos</TableHead>}
                      {isColumnVisible(overdueColumns, 'requestDate') && <TableHead>F. Solicitud</TableHead>}
                      {isColumnVisible(overdueColumns, 'amount') && <TableHead>Monto</TableHead>}
                      {isColumnVisible(overdueColumns, 'installments') && <TableHead>Cuotas</TableHead>}
                      {isColumnVisible(overdueColumns, 'paidInstallments') && <TableHead>Cuot. Pagadas</TableHead>}
                      {isColumnVisible(overdueColumns, 'ine') && <TableHead>INE</TableHead>}
                      {isColumnVisible(overdueColumns, 'consent') && <TableHead>Consentimiento</TableHead>}
                      {isColumnVisible(overdueColumns, 'lastPaymentDate') && <TableHead>F. Últ. Pago</TableHead>}
                      {isColumnVisible(overdueColumns, 'nextPaymentDate') && <TableHead>Próximo Pago</TableHead>}
                      {isColumnVisible(overdueColumns, 'status') && <TableHead>Estado</TableHead>}
                      {isColumnVisible(overdueColumns, 'actions') && <TableHead>Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueLoading ? renderSkeletonRows(overdueColumns) : overdueLoansData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={overdueColumns.filter(c => c.visible).length || 12} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <TrendingDown className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">No hay préstamos atrasados</p>
                              <p className="text-sm text-muted-foreground mt-1">¡Bien! No hay clientes con pagos vencidos</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      overdueLoansData.filter(l =>
                        (l.firstName ?? '').toLowerCase().includes(overdueSearch.toLowerCase()) ||
                        (l.lastName ?? '').toLowerCase().includes(overdueSearch.toLowerCase()) ||
                        String(l.id ?? '').toLowerCase().includes(overdueSearch.toLowerCase())
                      ).map((loan) => (
                        <TableRow key={loan.id}>
                          {isColumnVisible(overdueColumns, 'id') && <TableCell className="font-medium whitespace-nowrap">{loan.id}</TableCell>}
                          {isColumnVisible(overdueColumns, 'firstName') && <TableCell>{loan.firstName}</TableCell>}
                          {isColumnVisible(overdueColumns, 'lastName') && <TableCell>{loan.lastName}</TableCell>}
                          {isColumnVisible(overdueColumns, 'requestDate') && <TableCell className="whitespace-nowrap">{formatDisplayDate(loan.requestDate)}</TableCell>}
                          {isColumnVisible(overdueColumns, 'amount') && <TableCell className="font-semibold">${loan.amount.toLocaleString()}</TableCell>}
                          {isColumnVisible(overdueColumns, 'installments') && <TableCell>{loan.installments}</TableCell>}
                          {isColumnVisible(overdueColumns, 'paidInstallments') && <TableCell>{loan.paidInstallments}/{loan.installments}</TableCell>}
                          {isColumnVisible(overdueColumns, 'ine') && <TableCell>{loan.ineNumber?.slice(0, 10) ?? 'N/A'}...</TableCell>}
                          {isColumnVisible(overdueColumns, 'consent') && <TableCell><ConsentBadge status={loan.status_consent || loan.raw?.status_consent || loan.statusConsent} /></TableCell>}
                          {isColumnVisible(overdueColumns, 'lastPaymentDate') && <TableCell className="whitespace-nowrap">{formatDisplayDate(loan.lastPaymentDate)}</TableCell>}
                          {isColumnVisible(overdueColumns, 'nextPaymentDate') && <TableCell className="whitespace-nowrap">{formatDisplayDate(loan.nextPaymentDate)}</TableCell>}
                          {isColumnVisible(overdueColumns, 'status') && <TableCell><StatusBadge status="Atrasado" /></TableCell>}
                          {isColumnVisible(overdueColumns, 'actions') && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setDetailsModal({ open: true, loan, sourceTab: 'overdue' })}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver detalle
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setReminderModal({ open: true, loan })}>
                                    <Bell className="h-4 w-4 mr-2" />
                                    Enviar recordatorio
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setSellPortfolioModal({ open: true, loan })}>
                                    <TrendingDown className="h-4 w-4 mr-2" />
                                    Vender cartera
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setUpdateInstallmentsModal({ open: true, loan })}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Actualizar cuotas
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setScheduleModal({ open: true, loan })}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Cronograma de pagos
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      )))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">Mostrando {(overduePage - 1) * pageSize + 1} - {Math.min(overduePage * pageSize, overdueTotal)} de {overdueTotal}</div>
                <div className="flex items-center gap-2">
                  {renderPagination(overduePage, overdueTotal, setOverduePage)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORIAL Tab */}
        <TabsContent value="history">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Historial de Préstamos</CardTitle>
              <CardDescription>Préstamos liquidados o vendidos</CardDescription>
            </CardHeader>
            <CardContent>
              <LoanTableFilters
                searchTerm={historySearch}
                onSearchChange={setHistorySearch}
                sortOrder={historySort}
                onSortChange={setHistorySort}
                columns={historyColumns}
                onColumnsChange={setHistoryColumns}
                showExport
                onExport={exportToExcel}
              />
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isColumnVisible(historyColumns, 'id') && <TableHead>ID</TableHead>}
                      {isColumnVisible(historyColumns, 'firstName') && <TableHead>Nombres</TableHead>}
                      {isColumnVisible(historyColumns, 'lastName') && <TableHead>Apellidos</TableHead>}
                      {isColumnVisible(historyColumns, 'requestDate') && <TableHead>F. Solicitud</TableHead>}
                      {isColumnVisible(historyColumns, 'amount') && <TableHead>Monto</TableHead>}
                      {isColumnVisible(historyColumns, 'installments') && <TableHead>Cuotas</TableHead>}
                      {isColumnVisible(historyColumns, 'paidInstallments') && <TableHead>Cuot. Pagadas</TableHead>}
                      {isColumnVisible(historyColumns, 'ine') && <TableHead>INE</TableHead>}
                      {isColumnVisible(historyColumns, 'consent') && <TableHead>Consentimiento</TableHead>}
                      {isColumnVisible(historyColumns, 'lastPaymentDate') && <TableHead>F. Últ. Pago</TableHead>}
                      {isColumnVisible(historyColumns, 'status') && <TableHead>Estado</TableHead>}
                      {isColumnVisible(historyColumns, 'actions') && <TableHead>Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyLoading ? renderSkeletonRows(historyColumns) : historyLoansData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={historyColumns.filter(c => c.visible).length || 12} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">No hay historial de préstamos</p>
                              <p className="text-sm text-muted-foreground mt-1">Los préstamos cerrados aparecerán aquí</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      historyLoansData.filter(l =>
                        (l.firstName ?? '').toLowerCase().includes(historySearch.toLowerCase()) ||
                        (l.lastName ?? '').toLowerCase().includes(historySearch.toLowerCase()) ||
                        String(l.id ?? '').toLowerCase().includes(historySearch.toLowerCase())
                      ).map((loan) => (
                        <TableRow key={loan.id}>
                          {isColumnVisible(historyColumns, 'id') && <TableCell className="font-medium whitespace-nowrap">{loan.id}</TableCell>}
                          {isColumnVisible(historyColumns, 'firstName') && <TableCell>{loan.firstName}</TableCell>}
                          {isColumnVisible(historyColumns, 'lastName') && <TableCell>{loan.lastName}</TableCell>}
                          {isColumnVisible(historyColumns, 'requestDate') && <TableCell className="whitespace-nowrap">{formatDisplayDate(loan.requestDate)}</TableCell>}
                          {isColumnVisible(historyColumns, 'amount') && <TableCell className="font-semibold">${loan.amount.toLocaleString()}</TableCell>}
                          {isColumnVisible(historyColumns, 'installments') && <TableCell>{loan.installments}</TableCell>}
                          {isColumnVisible(historyColumns, 'paidInstallments') && <TableCell>{loan.paidInstallments}/{loan.installments}</TableCell>}
                          {isColumnVisible(historyColumns, 'ine') && <TableCell>{loan.ineNumber?.slice(0, 10) ?? 'N/A'}...</TableCell>}
                          {isColumnVisible(historyColumns, 'consent') && <TableCell><ConsentBadge status={loan.status_consent || loan.raw?.status_consent || loan.statusConsent} /></TableCell>}
                          {isColumnVisible(historyColumns, 'lastPaymentDate') && <TableCell className="whitespace-nowrap">{formatDisplayDate(loan.lastPaymentDate)}</TableCell>}
                          {isColumnVisible(historyColumns, 'status') && <TableCell><StatusBadge status={loan.status} /></TableCell>}
                          {isColumnVisible(historyColumns, 'actions') && (
                            <TableCell>
                              <Button size="sm" variant="ghost" onClick={() => setDetailsModal({ open: true, loan, sourceTab: 'history' })} title="Ver Detalles">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      )))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">Mostrando {(historyPage - 1) * pageSize + 1} - {Math.min(historyPage * pageSize, historyTotal)} de {historyTotal}</div>
                <div className="flex items-center gap-2">
                  {renderPagination(historyPage, historyTotal, setHistoryPage)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <INECURPModal
        open={ineCurpModal.open}
        onOpenChange={(open) => setIneCurpModal(prev => ({ ...prev, open }))}
        loan={ineCurpModal.loan}
        type={ineCurpModal.type}
      />

      <ModifyLoanModal
        open={modifyModal.open}
        onOpenChange={(open) => setModifyModal(prev => ({ ...prev, open }))}
        loan={modifyModal.loan}
        onSend={() => toast({ title: "Enviado", description: "La propuesta ha sido enviada al cliente." })}
        onSave={(updatedLoan) => {
          setModifyModal(prev => ({ ...prev, loan: updatedLoan }));
          queryClient.invalidateQueries({ queryKey: ['loans', 'admin'] });
          queryClient.invalidateQueries({ queryKey: ['admin-loans'] });
          toast({ title: "Guardado", description: "Los cambios han sido guardados." });
        }}
      />

      <AlertDialog open={detailsModal.open} onOpenChange={(open) => setDetailsModal(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-5 bg-white">
          {(() => {
            const loan = detailsModal.loan as any;
            const md = loan?.raw?.metadata ?? {};
            const user = loan?.raw?.users ?? {};
            const userMembership = user.user_memberships?.[0]?.membership_plans ?? {};
            const personal = md.personalData ?? {};

            const firstName = user.first_name || personal.firstName || '';
            const lastName = user.last_name || personal.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Usuario';
            const userInitial = firstName?.[0]?.toUpperCase() || '?';
            const profileColor = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'][Math.abs((loan?.id ?? '')?.charCodeAt(0) ?? 0) % 8];

            const phone = user.phone || personal.phone || '-';
            const phoneCountry = user.phone_country_code || '+52';
            const fullPhone = phone !== '-' ? `${phoneCountry}${phone.replace(/^\+\d+/, '')}` : '-';
            const birthDate = user.birth_date ? formatDisplayDate(new Date(user.birth_date).toISOString().slice(0, 10)) : (personal.birthDate ? formatDisplayDate(personal.birthDate) : '-');
            const ineKey = user.ine_key || personal.ineKey || '-';
            const curp = user.curp || personal.curp || '-';
            const address = user.address || personal.address || '-';
            const email = user.email || personal.email || '-';

            const membershipName = getMembershipLabel(userMembership) || getMembershipLabel(loan?.membership) || 'Sin membresía';
            const membershipColor = userMembership.color || 'bg-gray-100';
            const membershipIcon = userMembership.icon || '★';
            const loanInterestRateDecimal = Number(loan?.raw?.interest_rate ?? loan?.interest_rate) || 0.20;
            const clabeValue = loan?.accountNumber ? (showDetailClabe ? loan.accountNumber : `••••${loan.accountNumber.slice(-4)}`) : '-';

            const loanAmount = Number(loan?.amount ?? 0);
            const loanInstallments = Number(loan?.installments ?? 0);
            const calculatedMonthlyPayment = loan?.monthly_payment
              ? Number(loan.monthly_payment)
              : (loanAmount > 0 && loanInstallments > 0
                ? (loanAmount * (loanInterestRateDecimal / 12) * Math.pow(1 + loanInterestRateDecimal / 12, loanInstallments)) / (Math.pow(1 + loanInterestRateDecimal / 12, loanInstallments) - 1)
                : null);

            return (
              <div className="space-y-4">
                {/* Profile Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={fullName} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full ${profileColor} flex items-center justify-center text-white text-lg font-bold shadow-sm`}>
                      {userInitial}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold truncate">{fullName}</h3>
                    <p className="text-xs text-muted-foreground truncate">{email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] ${membershipColor} px-2 py-0.5 rounded-full font-medium flex items-center gap-1`}>
                        <span>{membershipIcon}</span> {membershipName}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2 text-right">
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Total Préstamo</p>
                    <p className="text-xl font-black text-primary">${Number(loan?.amount ?? 0).toLocaleString()}</p>
                    <p className="text-[9px] text-muted-foreground">MXN</p>
                  </div>
                </div>

                {/* Loan Summary Cards */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="border border-gray-200 rounded-lg p-2.5 text-center bg-white">
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Plazo</p>
                    <p className="text-lg font-bold">{loan?.installments ?? '-'}</p>
                    <p className="text-[9px] text-muted-foreground">cuotas</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-2.5 text-center bg-white">
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Cuota Mensual</p>
                    <p className="text-base font-bold">${calculatedMonthlyPayment ? Number(calculatedMonthlyPayment).toLocaleString() : '-'}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-2.5 text-center bg-white">
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Solicitud</p>
                    <p className="text-sm font-bold font-mono">{loan?.id ? String(loan.id).slice(-6) : '-'}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-2.5 text-center bg-white">
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Estatus</p>
                    <p className="text-sm font-bold"><StatusBadge status={loan?.status || '-'} /></p>
                  </div>
                </div>

                {/* Personal Data */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Datos Personales</h4>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="border border-gray-200 rounded-lg p-2 bg-white">
                      <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Teléfono</p>
                      <p className="text-xs font-bold font-mono">{fullPhone}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-2 bg-white">
                      <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Fecha Nac.</p>
                      <p className="text-xs font-bold">{birthDate}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-2 bg-white">
                      <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">INE</p>
                      <p className="text-xs font-bold font-mono">{ineKey}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-2 bg-white">
                      <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">CURP</p>
                      <p className="text-xs font-bold font-mono">{curp}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-2 bg-white col-span-4">
                      <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Dirección</p>
                      <p className="text-xs font-bold truncate">{address}</p>
                    </div>
                  </div>
                </div>

                {/* Bank Account */}
                {loan?.bank || loan?.accountNumber ? (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cuenta Bancaria</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border border-gray-200 rounded-lg p-2 bg-white">
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Banco</p>
                        <p className="text-xs font-bold">{loan?.bank || '-'}</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-2 bg-white">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">CLABE</p>
                          {loan?.accountNumber ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setShowDetailClabe(prev => !prev)}
                              title={showDetailClabe ? 'Ocultar CLABE' : 'Ver CLABE'}
                            >
                              {showDetailClabe ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                          ) : null}
                        </div>
                        <p className="text-xs font-bold font-mono">{clabeValue}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Membership Details */}
                {loan?.membershipRaw?.name ? (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Membresía</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="border border-gray-200 rounded-lg p-2 bg-white">
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Plan</p>
                        <p className="text-xs font-bold">{loan.membershipRaw.name}</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-2 bg-white">
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Tasa Anual</p>
                        <p className="text-xs font-bold">{(loanInterestRateDecimal * 100).toFixed(2)}%</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-2 bg-white">
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Estatus</p>
                        <p className="text-xs font-bold">{loan.membershipRaw.active !== false ? 'Activa' : 'Inactiva'}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })()}
          <AlertDialogFooter className="gap-2 mt-4 pt-3 border-t border-gray-200">
            <AlertDialogCancel onClick={() => setDetailsModal({ open: false, loan: null })} className="gap-2">Cerrar</AlertDialogCancel>
            <Button variant="outline" size="sm" onClick={handleDownloadTestLoanPdf}>Test PDF Préstamo</Button>
            <Button variant="outline" size="sm" onClick={handleTestSignNow}>Test SignNow</Button>
            {detailsModal.sourceTab === 'pending' && (
              <>
                <AlertDialogAction
                  className="bg-danger hover:bg-danger/90"
                  onClick={() => {
                    const loan = detailsModal.loan as any;
                    setDetailsModal({ open: false, loan: null });
                    setRejectDialog({ open: true, loan });
                  }}
                >
                  Rechazar
                </AlertDialogAction>
                <AlertDialogAction
                  onClick={() => {
                    const loan = detailsModal.loan as any;
                    setDetailsModal({ open: false, loan: null });
                    setApproveDialog({ open: true, loan });
                  }}
                >
                  Aprobar
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aprobar Solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              Se aprobará la solicitud de préstamo {approveDialog.loan?.id} por ${approveDialog.loan?.amount.toLocaleString()} MXN.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleApproveLoan()}>
              Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar Solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              Se rechazará la solicitud de préstamo {rejectDialog.loan?.id}. El cliente será notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-danger hover:bg-danger/90" onClick={() => handleRejectLoan()}>
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResendContractModal
        open={resendModal.open}
        onOpenChange={(open) => setResendModal(prev => ({ ...prev, open }))}
        loan={resendModal.loan}
        onResend={() => toast({ title: "Reenviado", description: "El contrato ha sido reenviado al cliente." })}
      />

      <AttachContractModal
        open={attachModal.open}
        onOpenChange={(open) => setAttachModal(prev => ({ ...prev, open }))}
        loan={attachModal.loan}
        onConfirm={() => toast({ title: "Adjuntado", description: "Los contratos firmados han sido adjuntados." })}
      />

      <ModifyDisbursementModal
        open={modifyDisbursementModal.open}
        onOpenChange={(open) => setModifyDisbursementModal(prev => ({ ...prev, open }))}
        loan={modifyDisbursementModal.loan}
        onSave={() => toast({ title: "Guardado", description: "Los datos bancarios se actualizaron." })}
      />

      <ConfirmDisbursementModal
        open={confirmDisbursementModal.open}
        onOpenChange={(open) => setConfirmDisbursementModal(prev => ({ ...prev, open }))}
        loan={confirmDisbursementModal.loan}
        onConfirm={(file) => handleConfirmDisbursement(file)}
      />

      <SendReminderModal
        open={reminderModal.open}
        onOpenChange={(open) => setReminderModal(prev => ({ ...prev, open }))}
        loan={reminderModal.loan}
        onConfirm={handleSendReminder}
      />

      <SellPortfolioModal
        open={sellPortfolioModal.open}
        onOpenChange={(open) => setSellPortfolioModal(prev => ({ ...prev, open }))}
        loan={sellPortfolioModal.loan}
        onConfirm={() => toast({ title: "Cartera vendida", description: "La venta de cartera ha sido registrada." })}
      />

      <UpdateInstallmentsModal
        open={updateInstallmentsModal.open}
        onOpenChange={(open) => setUpdateInstallmentsModal(prev => ({ ...prev, open }))}
        loan={updateInstallmentsModal.loan}
        onConfirm={() => toast({ title: "Cuotas actualizadas", description: "Las cuotas han sido actualizadas correctamente." })}
      />
      <ConsentRenewModal
        open={consentRenewModal.open}
        onOpenChange={(open) => setConsentRenewModal(prev => ({ ...prev, open }))}
        loan={consentRenewModal.loan}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['loans', 'admin'] });
          queryClient.invalidateQueries({ queryKey: ['admin-loans'] });
        }}
      />
      <PaymentScheduleModal
        open={scheduleModal.open}
        onOpenChange={(open) => setScheduleModal(prev => ({ ...prev, open }))}
        loan={scheduleModal.loan}
      />

      {approvingState.open && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Aprobando Solicitud</h3>
            <p className="text-sm text-muted-foreground">{approvingState.message}</p>
          </div>
        </div>
      )}

      {rejectingState.open && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="animate-spin h-12 w-12 border-4 border-danger border-t-transparent rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Rechazando Solicitud</h3>
            <p className="text-sm text-muted-foreground">{rejectingState.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;
