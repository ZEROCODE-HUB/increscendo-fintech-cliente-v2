import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Loader2 } from 'lucide-react';
import { increscendoApiFetch } from '@/lib/increscendoApi';


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: any | null;
}

interface ApiInstallment {
  installment_number: number;
  status: string;
  amount: number;
  due_date: string;
  payment_request_id: string | null;
  paid_at: string | null;
  failed_reason: string | null;
  failed_reason_message: string | null;
}

interface ApiResponse {
  ok: boolean;
  loan_id: string;
  loan_number: string;
  total_installments: number;
  monthly_payment: number;
  total_paid: number;
  installments: ApiInstallment[];
}

const getFailedReasonMessage = (reason: string | null): string | null => {
  if (!reason) return null;
  const map: Record<string, string> = {
    'account_invalid': 'Cuenta inválida',
    'canceled_by_operations': 'Cancelado por operaciones',
    'canceled_by_merchant': 'Cancelado por el comercio',
    'consent_not_confirmed': 'Consentimiento no confirmado',
    'customer_blocked': 'Cliente bloqueado',
    'document_invalid': 'Documento inválido',
    'high_risk': 'Riesgo alto',
    'high_risk_institution': 'Riesgo alto en institución',
    'transaction_limits_exceeded': 'Límite de transacción excedido',
  };
  return map[reason] || reason;
};

const getStatusBadge = (status: string) => {
  const s = status?.toLowerCase();
  switch (s) {
    case 'paid':
    case 'completed':
    case 'successful':
      return <Badge className="bg-success/20 text-success border-success text-xs">Pagado</Badge>;
    case 'pending':
      return <Badge className="bg-warning/20 text-warning border-warning text-xs">Pendiente</Badge>;
    case 'initial':
    case 'processing':
      return <Badge className="bg-warning/20 text-warning border-warning text-xs">En proceso</Badge>;
    case 'failed':
      return <Badge className="bg-danger/20 text-danger border-danger text-xs">Rechazado</Badge>;
    case 'canceled':
      return <Badge className="bg-muted text-muted-foreground border-muted-foreground text-xs">Cancelado</Badge>;
    case 'chargeback':
      return <Badge className="bg-danger/20 text-danger border-danger text-xs">Contracargo</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">Sin estado</Badge>;
  }
};

export const PaymentScheduleModal = ({ open, onOpenChange, loan }: Props) => {
  const [installments, setInstallments] = useState<ApiInstallment[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{ paid: number; pending: number; canceled?: number } | null>(null);

  useEffect(() => {
    if (!open || !loan) return;
    const loanId = loan.uuid ?? loan.raw?.id ?? loan.id;
    if (!loanId) return;

    setLoading(true);
    setInstallments([]);
    increscendoApiFetch(`/belvo/loans/${loanId}/installments`)
      .then(res => res.json())
      .then((data: ApiResponse) => {
        if (data.ok && data.installments) {
          setInstallments(data.installments);
          setSummary(data as any);
        }
      })
      .catch(err => console.error('Error loading installments', err))
      .finally(() => setLoading(false));
  }, [open, loan]);

  const sortedInstallments = useMemo(() => {
    return [...installments].sort((a, b) => a.installment_number - b.installment_number);
  }, [installments]);

  const handleExport = async () => {
    if (!loan || !sortedInstallments.length) return;
    const XLSX = await import("xlsx");
    const headers = ['#','Fecha','Monto (MXN)','Estado'];
    const rows = sortedInstallments.map(r => [
      r.installment_number,
      r.due_date ? new Date(r.due_date).toLocaleDateString('es-MX') : '-',
      r.amount,
      r.status,
    ]);
    const aoa = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cronograma');
    const filename = `cronograma_admin_${loan?.loan_number || loan?.id || 'loan'}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 w-[calc(100%-2rem)] sm:w-full rounded-2xl sm:rounded-lg">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <DialogTitle className="text-base sm:text-lg">Cronograma de Pagos {loan?.loan_number || loan?.id ? `- ${loan.loan_number || loan.id}` : ''}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {summary ? `${summary.paid} pagadas · ${summary.pending} pendientes${summary.canceled ? ` · ${summary.canceled} canceladas` : ''}` : 'Cuotas del préstamo'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 py-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-xs sm:text-sm text-muted-foreground">
              <span className="block sm:inline">Préstamo: {loan?.loan_number || loan?.id}</span>
              <span className="hidden sm:inline mx-2">—</span>
              <span className="block sm:inline">Monto: ${Number(loan?.amount ?? loan?.raw?.amount ?? 0).toLocaleString()}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={sortedInstallments.length === 0} className="w-full sm:w-auto">
              <Calendar className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          <div className="overflow-x-auto -mx-4 sm:mx-0 py-4">
            <div className="min-w-full inline-block align-middle px-4 sm:px-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sortedInstallments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay cuotas disponibles</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">#</TableHead>
                      <TableHead className="text-xs sm:text-sm">Fecha</TableHead>
                      <TableHead className="text-xs sm:text-sm">Monto</TableHead>
                      <TableHead className="text-xs sm:text-sm">Estado</TableHead>
                      <TableHead className="text-xs sm:text-sm">Observación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedInstallments.map(r => (
                      <TableRow key={r.installment_number}>
                        <TableCell className="text-xs sm:text-sm">#{r.installment_number}</TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                          {r.due_date ? new Date(r.due_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase()) : '-'}
                        </TableCell>
                        <TableCell className="font-semibold text-xs sm:text-sm whitespace-nowrap">${r.amount.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(r.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate" title={getFailedReasonMessage(r.failed_reason) || ''}>
                          {getFailedReasonMessage(r.failed_reason) || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentScheduleModal;
