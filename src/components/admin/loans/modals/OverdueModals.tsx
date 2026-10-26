import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, Plus } from "lucide-react";
import { OverdueLoan } from "@/types/loans";

interface SendReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: OverdueLoan | null;
  onConfirm: (emails: string[]) => void;
}

export const SendReminderModal = ({ open, onOpenChange, loan, onConfirm }: SendReminderModalProps) => {
  const [emails, setEmails] = useState<string[]>(['']);

  const primaryEmail = loan?.email?.trim() || '';

  useEffect(() => {
    if (!open) return;
    setEmails([primaryEmail]);
  }, [open, primaryEmail]);

  const addEmail = () => setEmails([...emails, '']);
  const removeEmail = (idx: number) => setEmails(emails.filter((_, i) => i !== idx));
  const updateEmail = (idx: number, value: string) => {
    const updated = [...emails];
    updated[idx] = value;
    setEmails(updated);
  };

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Recordatorio</DialogTitle>
          <DialogDescription>
            Se enviará un recordatorio de pago a {loan.firstName} {loan.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-sm">
              <strong>Estado:</strong> {loan.status} - {loan.paidInstallments}/{loan.installments} cuotas pagadas
            </p>
            <p className="text-sm">
              <strong>Fecha Próximo Pago:</strong> {loan.lastPaymentDate}
            </p>
          </div>

          <div>
            <Label className="mb-2 block">Correo electrónico</Label>
            {emails.map((email, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => updateEmail(idx, e.target.value)}
                  placeholder="correo@ejemplo.com"
                  readOnly={idx === 0}
                  disabled={idx === 0}
                />
                {idx > 0 && (
                  <Button variant="ghost" size="icon" onClick={() => removeEmail(idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addEmail}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar correo
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => { onConfirm(emails.filter(e => e)); onOpenChange(false); }}>
            Enviar Recordatorio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface SellPortfolioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: OverdueLoan | null;
  onConfirm: (file: File | null, comment: string) => void;
}

export const SellPortfolioModal = ({ open, onOpenChange, loan, onConfirm }: SellPortfolioModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vender Cartera</DialogTitle>
          <DialogDescription>
            Documentar la venta de cartera para {loan.firstName} {loan.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Adjuntar documentación
            </p>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
              id="portfolio-upload"
            />
            <label htmlFor="portfolio-upload">
              <Button variant="outline" size="sm" asChild>
                <span>Seleccionar archivo</span>
              </Button>
            </label>
            {file && (
              <p className="text-sm text-primary mt-2">✓ {file.name}</p>
            )}
          </div>

          <div>
            <Label>Comentario</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Detalles de la venta de cartera..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { setFile(null); setComment(''); onOpenChange(false); }}>
            Cancelar
          </Button>
          <Button onClick={() => { onConfirm(file, comment); setFile(null); setComment(''); onOpenChange(false); }}>
            Confirmar Venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface UpdateInstallmentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: OverdueLoan | null;
  onConfirm: (type: 'installments' | 'amount', value: number) => void;
}

export const UpdateInstallmentsModal = ({ open, onOpenChange, loan, onConfirm }: UpdateInstallmentsModalProps) => {
  const [updateType, setUpdateType] = useState<'installments' | 'amount' | null>(null);
  const [value, setValue] = useState(0);

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Actualizar Cuotas</DialogTitle>
          <DialogDescription>
            {loan.firstName} {loan.lastName} - {loan.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="by-installments"
              checked={updateType === 'installments'}
              onCheckedChange={(checked) => {
                setUpdateType(checked ? 'installments' : null);
                setValue(0);
              }}
            />
            <Label htmlFor="by-installments">Habilitar por cantidad de cuotas</Label>
          </div>

          {updateType === 'installments' && (
            <div>
              <Label>Cantidad de cuotas pagadas</Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                min={loan.paidInstallments}
                max={loan.installments}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="by-amount"
              checked={updateType === 'amount'}
              onCheckedChange={(checked) => {
                setUpdateType(checked ? 'amount' : null);
                setValue(0);
              }}
            />
            <Label htmlFor="by-amount">Habilitar por monto amortizado</Label>
          </div>

          {updateType === 'amount' && (
            <div>
              <Label>Monto amortizado (MXN)</Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                min={0}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { setUpdateType(null); setValue(0); onOpenChange(false); }}>
            Cancelar
          </Button>
          <Button
            onClick={() => { if (updateType) onConfirm(updateType, value); setUpdateType(null); setValue(0); onOpenChange(false); }}
            disabled={!updateType || value <= 0}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
