import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClientMembership } from "@/types/clients";
import { useToast } from "@/hooks/use-toast";

interface AddMembershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { clientId: string; membershipPlanId: string; activationDate: string }) => void;
  clients: { id: string; firstName: string; lastName: string }[];
  plans: { id: string; name: string }[];
}

export const AddMembershipModal = ({ open, onOpenChange, onConfirm, clients, plans }: AddMembershipModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    clientId: "",
    membershipPlanId: "",
    activationDate: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = () => {
    onConfirm(formData);
    toast({ title: "Membresía agregada", description: "La membresía ha sido registrada exitosamente." });
    onOpenChange(false);
    setFormData({
      clientId: "",
      membershipPlanId: "",
      activationDate: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Membresía</DialogTitle>
          <DialogDescription>Asignar una membresía a un cliente</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Cliente</Label>
            <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo de Membresía</Label>
            <Select value={formData.membershipPlanId} onValueChange={(v) => setFormData({ ...formData, membershipPlanId: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fecha de Activación</Label>
            <Input 
              type="date" 
              value={formData.activationDate} 
              onChange={(e) => setFormData({ ...formData, activationDate: e.target.value })} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ViewHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membership: ClientMembership | null;
}

export const ViewHistoryModal = ({ open, onOpenChange, membership }: ViewHistoryModalProps) => {
  const getStatusBadge = (status: string) => {
    if (status === "Completado") {
      return <Badge className="bg-success/20 text-success border-success">{status}</Badge>;
    }
    if (status === "Pendiente") {
      return <Badge className="bg-warning/20 text-warning border-warning">{status}</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Historial de Pagos</DialogTitle>
          <DialogDescription>
            {membership?.firstName} {membership?.lastName} - {membership?.membershipType}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membership?.paymentHistory.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.id}</TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell className="font-semibold">${payment.amount} MXN</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ExpireMembershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membership: ClientMembership | null;
  onConfirm: () => void;
}

export const ExpireMembershipModal = ({ open, onOpenChange, membership, onConfirm }: ExpireMembershipModalProps) => {
  const { toast } = useToast();

  const handleConfirm = () => {
    onConfirm();
    toast({ title: "Membresía vencida", description: "El estado de la membresía ha sido actualizado a 'Vencida'." });
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Vencer Membresía?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción marcará la membresía de {membership?.firstName} {membership?.lastName} como vencida. 
            El cliente perderá acceso a los beneficios de la membresía {membership?.membershipType}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-warning hover:bg-warning/90 text-warning-foreground">
            Vencer Membresía
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
