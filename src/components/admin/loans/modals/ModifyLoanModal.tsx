import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

import { PendingLoan } from "@/types/loans";
import { supabase } from "@/lib/supabase";

interface ModifyLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: PendingLoan | null;
  onSend: (data: { amount: number; installments: number; rate: number; message: string }) => void;
  onSave?: () => void;
}

export const ModifyLoanModal = ({ open, onOpenChange, loan, onSend, onSave }: ModifyLoanModalProps) => {
  const [amount, setAmount] = useState(0);
  const [installments, setInstallments] = useState(12);
  const [rate, setRate] = useState(18);
  const [message, setMessage] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; installments?: string; rate?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!amount || amount <= 0) newErrors.amount = 'Ingresa un monto válido';
    if (!installments || installments <= 0 || isNaN(installments)) newErrors.installments = 'Ingresa un número de cuotas válido';
    if (!rate || rate <= 0 || isNaN(rate)) newErrors.rate = 'Ingresa una tasa válida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (loan) {
      setAmount(loan.amount ?? loan.raw?.amount ?? 0);
      setInstallments(loan.installments ?? loan.raw?.installments ?? 12);
      const dbRate = loan.raw?.interest_rate ?? loan.interest_rate ?? loan.metadata?.interest_rate ?? 0.18;
      setRate(Number(dbRate) * 100);
      setMessage('');
      setErrors({});
    }
  }, [loan]);

  const calculateSchedule = useMemo(() => {
    if (!loan) return [];

    const l = loan.raw ?? loan;
    const P = Number((amount || l.amount) ?? 0);
    const n = Number((installments || l.installments) ?? 12);
    const annualRate = rate / 100;
    const monthlyRate = annualRate / 12;

    let monthlyPayment = 0;
    if (monthlyRate === 0) monthlyPayment = P / n;
    else monthlyPayment = P * (monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
    monthlyPayment = Math.round(monthlyPayment);

    const schedule: any[] = [];
    let remaining = P;

    const paidAmount = Number(l.metadata?.paid_amount ?? 0);
    const approvedDate = l.approved_at ? new Date(l.approved_at) : (l.applied_at ? new Date(l.applied_at) : (l.created_at ? new Date(l.created_at) : new Date()));

    const paidInstallments = monthlyPayment > 0 ? Math.floor(paidAmount / monthlyPayment) : 0;

    for (let i = 1; i <= n; i++) {
      const due = new Date(approvedDate);
      due.setMonth(due.getMonth() + i);

      const interestRaw = remaining * monthlyRate;
      const interest = Math.round(interestRaw);
      let principal = Math.round(monthlyPayment - interest);
      if (i === n) principal = remaining;
      const total = principal + interest;
      const balanceAfter = Math.max(0, remaining - principal);

      const status = i <= paidInstallments ? 'paid' : 'pending';

      schedule.push({
        number: i,
        date: `${due.getDate().toString().padStart(2,'0')}/${(due.getMonth()+1).toString().padStart(2,'0')}/${due.getFullYear()}`,
        payment: total,
        principal,
        interest,
        balance: balanceAfter,
        status,
      });

      remaining = balanceAfter;
    }

    return schedule;
  }, [loan, amount, installments, rate]);

  const schedule = calculateSchedule;

  const monthlyPayment = useMemo(() => {
    const P = Number(amount || 0);
    const n = Number(installments || 12);
    const monthlyRate = (rate / 100) / 12;
    if (monthlyRate === 0) return P / n;
    return Math.round(P * monthlyRate / (1 - Math.pow(1 + monthlyRate, -n)));
  }, [amount, installments, rate]);

  const totalPayment = monthlyPayment * (Number(installments) || 12);

  const handleSave = async () => {
    if (!loan) return;
    if (!validate()) return;
    
    const loanId = loan.raw?.id ?? loan.uuid ?? loan.id;
    if (!loanId) return;
    
    setSaving(true);
    try {
      const rateDecimal = rate / 100;
      const monthlyPaymentValue = schedule[0]?.payment || 0;
      const totalToPay = monthlyPaymentValue * installments;

      const { data: rpcResult, error: rpcError } = await supabase.rpc('admin_modify_loan_terms', {
        p_loan_id: loanId,
        p_amount: amount,
        p_installments: installments,
        p_interest_rate: rateDecimal,
        p_monthly_payment: Math.round(monthlyPaymentValue * 100) / 100,
        p_total_to_pay: Math.round(totalToPay * 100) / 100,
      });
      if (rpcError) throw rpcError;
      if (rpcResult?.error) throw new Error(rpcResult.error);
      
      const updatedRaw = {
        ...loan.raw,
        amount,
        installments,
        interest_rate: rateDecimal,
        monthly_payment: Math.round(monthlyPaymentValue * 100) / 100,
        total_to_pay: Math.round(totalToPay * 100) / 100
      };
      const updatedLoan = { ...loan, raw: updatedRaw };
      
      onSave?.(updatedLoan);
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving loan:', err);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = () => {
    const rateDecimal = rate / 100;
    onSend({ amount, installments, rate: rateDecimal, message });
    onOpenChange(false);
  };

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modificar Préstamo</DialogTitle>
          <DialogDescription>
            Simulador de condiciones - {loan.firstName} {loan.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="mod-amount">Monto (MXN)</Label>
              <Input
                id="mod-amount"
                type="number"
                value={amount || ''}
                onChange={(e) => {
                  setAmount(e.target.value === '' ? 0 : Number(e.target.value));
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: undefined }));
                }}
                onBlur={(e) => {
                  if (e.target.value === '') setAmount(0);
                }}
                placeholder="Ej: 15000"
                className={errors.amount ? 'border-red-500' : ''}
              />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>
            <div>
              <Label htmlFor="mod-installments">Cuotas</Label>
              <Input
                id="mod-installments"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={installments || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setInstallments(val === '' ? NaN : Number(val));
                  if (errors.installments) setErrors(prev => ({ ...prev, installments: undefined }));
                }}
                placeholder="Ej: 12"
                className={errors.installments ? 'border-red-500' : ''}
              />
              {errors.installments && <p className="text-xs text-red-500 mt-1">{errors.installments}</p>}
            </div>
            <div>
              <Label htmlFor="mod-rate">Tasa Anual (%)</Label>
              <Input
                id="mod-rate"
                type="text"
                inputMode="decimal"
                value={rate || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = val.split('.');
                  const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                  setRate(formatted === '' ? NaN : Number(formatted));
                  if (errors.rate) setErrors(prev => ({ ...prev, rate: undefined }));
                }}
                placeholder="Ej: 42"
                className={errors.rate ? 'border-red-500' : ''}
              />
              {errors.rate && <p className="text-xs text-red-500 mt-1">{errors.rate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Pago Mensual</p>
              <p className="text-xl font-bold">${monthlyPayment.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total a Pagar</p>
              <p className="text-xl font-bold">${totalPayment.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <Collapsible open={showSchedule} onOpenChange={setShowSchedule}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                  Ver Cronograma de Pagos
                <ChevronDown className={`h-4 w-4 transition-transform ${showSchedule ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
                <div className="border rounded-lg max-h-[300px] overflow-auto">
                  <div className="p-3 flex justify-end">
                    <Button variant="outline" size="sm" onClick={async () => {
                      if (!schedule || schedule.length === 0) return;
                      const XLSX = await import("xlsx");
                      const headers = ['#','Fecha','Pago (MXN)','Capital (MXN)','Interés (MXN)','Saldo (MXN)','Estado'];
                      const rows = schedule.map((r:any) => [r.number, r.date, r.payment, r.principal, r.interest, r.balance, r.status === 'paid' ? 'Pagado' : 'Pendiente']);
                      const aoa = [headers, ...rows];
                      const ws = XLSX.utils.aoa_to_sheet(aoa);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Cronograma');
                      XLSX.writeFile(wb, `cronograma_loan_${loan?.id || 'loan'}.xlsx`);
                    }}>
                      Exportar
                    </Button>
                  </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead>Capital</TableHead>
                      <TableHead>Interés</TableHead>
                        <TableHead>Saldo</TableHead>
                        <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {schedule.map((row) => (
                        <TableRow key={row.number}>
                          <TableCell>{row.number}</TableCell>
                          <TableCell>{row.date}</TableCell>
                          <TableCell>${row.payment.toLocaleString(undefined, {maximumFractionDigits:0})}</TableCell>
                          <TableCell>${row.principal.toLocaleString(undefined, {maximumFractionDigits:0})}</TableCell>
                          <TableCell>${row.interest.toLocaleString(undefined, {maximumFractionDigits:0})}</TableCell>
                          <TableCell>${row.balance.toLocaleString(undefined, {maximumFractionDigits:0})}</TableCell>
                          <TableCell>
                            {row.status === 'paid' ? (
                              <span className="text-success">Pagado</span>
                            ) : (
                              <span className="text-muted-foreground">Pendiente</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div>
            <Label htmlFor="email-message">Mensaje para correo</Label>
            <Textarea
              id="email-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escriba el mensaje que se enviará al cliente..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button variant="secondary" onClick={handleSend}>
            Enviar Propuesta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
