import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { DisbursementLoan } from "@/types/loans";

interface ModifyDisbursementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: DisbursementLoan | null;
  onSave: (data: { bank: string; accountNumber: string }) => void;
}

export const ModifyDisbursementModal = ({ open, onOpenChange, loan, onSave }: ModifyDisbursementModalProps) => {
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    if (loan) {
      setBank(loan.bank);
      setAccountNumber(loan.accountNumber);
    }
  }, [loan]);

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modificar Datos Bancarios</DialogTitle>
          <DialogDescription>
            {loan.firstName} {loan.lastName} - {loan.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Banco</Label>
            <Input
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              placeholder="Nombre del banco"
            />
          </div>
          <div>
            <Label>Cuenta/CLABE</Label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Número de cuenta o CLABE"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => { onSave({ bank, accountNumber }); onOpenChange(false); }}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ConfirmDisbursementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: DisbursementLoan | null;
  onConfirm: (file: File | null) => void;
}

export const ConfirmDisbursementModal = ({ open, onOpenChange, loan, onConfirm }: ConfirmDisbursementModalProps) => {
  const [file, setFile] = useState<File | null>(null);

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
          <DialogTitle>Confirmar Desembolso</DialogTitle>
          <DialogDescription>
            Adjuntar voucher de transferencia - {loan.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cliente:</span>
              <span className="font-medium">{loan.firstName} {loan.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Monto:</span>
              <span className="font-medium">${loan.amount.toLocaleString()} MXN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Banco:</span>
              <span className="font-medium">{loan.bankName || loan.bank}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cuenta:</span>
              <span className="font-medium">{loan.accountNumber}</span>
            </div>
          </div>

          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Adjuntar voucher (Imagen o documento)
            </p>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
              id="voucher-upload"
            />
            <label htmlFor="voucher-upload">
              <Button variant="outline" size="sm" asChild>
                <span>Seleccionar archivo</span>
              </Button>
            </label>
            {file && (
              <p className="text-sm text-primary mt-2">✓ {file.name}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { setFile(null); onOpenChange(false); }}>
            Cancelar
          </Button>
          <Button onClick={() => { onConfirm(file); setFile(null); onOpenChange(false); }}>
            Confirmar Desembolso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
