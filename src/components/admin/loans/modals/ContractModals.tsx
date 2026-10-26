import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ContractLoan } from "@/types/loans";
import { supabase } from "@/lib/supabase";
import { increscendoApiFetch } from "@/lib/increscendoApi";

interface ResendContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: ContractLoan | null;
  onResend: (data: Partial<ContractLoan>) => void;
}

export const ResendContractModal = ({ open, onOpenChange, loan, onResend }: ResendContractModalProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    birthDate: '',
    phone: '',
    bank: '',
    accountNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [loanId, setLoanId] = useState<string | null>(null);

  useEffect(() => {
    if (open && loan) {
      const id = (loan as any).uuid ?? (loan as any).raw?.id ?? loan.id;
      if (!id) return;
      
      setLoanId(id);
      setLoading(true);
      supabase
        .from('loans')
        .select('*, users(id, first_name, last_name, email, phone, address, birth_date, ine_key, curp, avatar_url)')
        .eq('id', id)
        .single()
        .then(({ data: loanData, error: loanError }) => {
          if (loanError || !loanData) {
            setLoading(false);
            return;
          }
          
          supabase
            .from('user_memberships')
            .select('*, membership_plans(id, name, price, active)')
            .eq('user_id', loanData.user_id)
            .eq('status', 'active')
            .maybeSingle()
            .then(({ data: membershipData }) => {
              const user = loanData.users ?? {};
              const md = loanData.metadata ?? {};
              const personalData = md?.personalData ?? {};
              
              const firstName = user.first_name || personalData.firstName || loan.firstName || '';
              const lastName = user.last_name || personalData.lastName || loan.lastName || '';
              const address = user.address || personalData.address || loan.address || '';
              const birthDate = user.birth_date || personalData.birthDate || loan.birthDate || '';
              const phone = user.phone || personalData.phone || loan.phone || '';
              const getBankDisplayName = (code: string) => {
                const bankNames: Record<string, string> = {
                  'mx_santander': 'Santander',
                  'mx_bbva': 'BBVA Bancomer',
                  'mx_banorte': 'Banorte',
                  'mx_hsbc': 'HSBC',
                  'mx_banamex': 'Citibanamex',
                  'mx_scotiabank': 'Scotiabank',
                  'mx_inbursa': 'Inbursa',
                  'mx_banregio': 'Banregio',
                  'mx_afirme': 'Afirme'
                };
                return bankNames[code] || code || '';
              };
              
              const bankCode = loan.bank || md?.depositData?.bank || md?.payment_method_bank_name || md?.bank || '';
              const bankDisplay = getBankDisplayName(bankCode);
              const accountNumber = loan.accountNumber || md?.depositData?.clabe || md?.payment_method_clabe || md?.clabe || '';

              const phoneCountry = user.phone_country_code || '+52';
              const fullPhone = phone !== '-' && phone ? `${phoneCountry}${phone.replace(/^\+\d+/, '')}` : '-';
              const formattedBirthDate = birthDate ? (() => {
                try {
                  const d = new Date(birthDate);
                  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
                } catch { return birthDate; }
              })() : '-';

              setFormData({
                firstName,
                lastName,
                address,
                birthDate: formattedBirthDate,
                phone: fullPhone,
                bank: bankDisplay,
                accountNumber
              });
              setLoading(false);
            });
        });
    }
  }, [open, loan]);

  if (!loan) return null;

  const readonlyField = (label: string, value: string) => (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm font-medium mt-0.5 py-1.5">{value || '-'}</p>
    </div>
);

  const handleResend = async () => {
    if (!loanId) return;
    setResending(true);
    try {
      const resp = await increscendoApiFetch('/signnow-remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loan_id: loanId }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw data || new Error('SignNow remind error');
      onResend(formData);
      onOpenChange(false);
    } catch (err) {
      console.error('Error reenviando firma:', err);
      alert('Error al reenviar la firma');
    } finally {
      setResending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Reenviar Contrato</DialogTitle>
          <DialogDescription>
            Datos del cliente para el contrato - {loan.id}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center py-8">
              <p className="text-muted-foreground">Cargando datos del cliente...</p>
            </div>
          ) : (
            <>
              {readonlyField("Nombres", formData.firstName)}
              {readonlyField("Apellidos", formData.lastName)}
              <div className="col-span-2">
                {readonlyField("Dirección", formData.address)}
              </div>
              {readonlyField("Fecha de Nacimiento", formData.birthDate)}
              {readonlyField("Teléfono", formData.phone)}
              {readonlyField("Banco", formData.bank)}
              {readonlyField("Cuenta/CLABE", formData.accountNumber ? `••••${formData.accountNumber.slice(-4)}` : '-')}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={handleResend} disabled={resending || !loanId}>
            {resending ? 'Reenviando...' : 'Reenviar Firma'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
);
  };

interface AttachContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: ContractLoan | null;
  onConfirm: (files: File[]) => void;
}

export const AttachContractModal = ({ open, onOpenChange, loan, onConfirm }: AttachContractModalProps) => {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjuntar Contratos Firmados</DialogTitle>
          <DialogDescription>
            {loan.firstName} {loan.lastName} - {loan.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <Input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
              id="contract-upload"
            />
            <label htmlFor="contract-upload">
              <Button variant="outline" size="sm" asChild>
                <span>Seleccionar archivos</span>
              </Button>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Archivos seleccionados:</p>
              {files.map((file, idx) => (
                <p key={idx} className="text-sm text-muted-foreground">• {file.name}</p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { setFiles([]); onOpenChange(false); }}>
            Cancelar
          </Button>
          <Button onClick={() => { onConfirm(files); setFiles([]); onOpenChange(false); }} disabled={files.length === 0}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
