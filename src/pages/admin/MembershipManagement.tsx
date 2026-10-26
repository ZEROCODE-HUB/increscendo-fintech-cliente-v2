import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Users, CreditCard, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/lib/supabase';
import { increscendoApiFetch } from "@/lib/increscendoApi";
import { Skeleton } from '@/components/ui/skeleton';

type Plan = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  price: number;
  currency: string;
  duration_days: number | null;
  features: any;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

type Membership = {
  id: string;
  title: string;
  cost: number;
  currency: string;
  targetAudience: string;
  interestRate: number;
  renewalPeriod: string;
  benefits: string[];
  isActive: boolean;
};

type MembershipFormErrors = Partial<{
  title: string;
  cost: string;
  targetAudience: string;
  interestRate: string;
  frequency: string;
  benefits: string;
}>;

const MEMBERSHIP_TITLE_PATTERN = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s.,'&()\-]+$/;
const MEMBERSHIP_TEXT_PATTERN = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s.,'&()/:+\-]+$/;

const MembershipManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [costError, setCostError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<MembershipFormErrors>({});
  const [formData, setFormData] = useState({
    title: '',
    cost: '',
    targetAudience: '',
    interestRate: '42',
    frequency: '1',
    interval: 'month',
    benefits: ''
  });

  const { isAdmin, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para acceder a esta página",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [navigate, toast]);

  // fetch membership plans from DB
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from<Plan>('membership_plans').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const plans = data ?? [];
      const mapped: Membership[] = plans.map(p => {
        const features = p.features ?? {};
        const benefits = Array.isArray(features?.benefits) ? features.benefits : (Array.isArray(p.features) ? p.features : []);
        return {
          id: p.id,
          title: p.name,
          cost: Number(p.price ?? 0),
          currency: p.currency ?? 'MXN',
          targetAudience: features?.targetAudience ?? p.description ?? '',
          interestRate: Number(features?.interestRate ?? 0),
          renewalPeriod: p.duration_days ? String(p.duration_days) + 'd' : '30d',
          benefits,
          isActive: !!p.active
        };
      });
      setMemberships(mapped);
    } catch (err) {
      console.error('[MembershipManagement] fetchPlans error', err);
      toast({ title: 'Error', description: 'No se pudieron cargar las membresías', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const resetForm = () => {
    setCostError('');
    setFieldErrors({});
    setFormData({
      title: '',
      cost: '',
      targetAudience: '',
      interestRate: '42',
      frequency: '1',
      interval: 'month',
      benefits: ''
    });
    setEditingMembership(null);
  };

  const parseRenewalPeriod = (renewalPeriod: string) => {
    const value = renewalPeriod.toLowerCase();

    if (value.includes('sem')) return { frequency: '1', interval: 'week' };
    if (value.includes('an') || value.includes('365')) return { frequency: '1', interval: 'year' };

    const dayMatch = value.match(/(\d+)\s*d/);
    if (dayMatch?.[1]) {
      const days = Number(dayMatch[1]);
      if (days % 365 === 0) return { frequency: String(days / 365), interval: 'year' };
      if (days % 30 === 0) return { frequency: String(days / 30), interval: 'month' };
      if (days % 7 === 0) return { frequency: String(days / 7), interval: 'week' };
    }

    return { frequency: '1', interval: 'month' };
  };

  const handleCreateOpen = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const setFieldValue = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field === 'cost') setCostError('');
  };

  const validateForm = () => {
    const nextErrors: MembershipFormErrors = {};
    const title = formData.title.trim();
    const targetAudience = formData.targetAudience.trim();
    const costValue = Number(formData.cost);
    const interestRateValue = Number(formData.interestRate);
    const frequencyValue = Number(formData.frequency);
    const benefitsText = formData.benefits.trim();

    if (!title) {
      nextErrors.title = 'El título es obligatorio.';
    } else if (title.length < 3 || title.length > 60) {
      nextErrors.title = 'El título debe tener entre 3 y 60 caracteres.';
    } else if (!MEMBERSHIP_TITLE_PATTERN.test(title)) {
      nextErrors.title = 'El título solo puede incluir letras, números, espacios y signos básicos.';
    }

    if (!formData.cost) {
      nextErrors.cost = 'El costo es obligatorio.';
    } else if (!Number.isFinite(costValue)) {
      nextErrors.cost = 'El costo debe ser un número válido.';
    } else if (costValue < 1) {
      nextErrors.cost = 'El monto debe ser mayor a 1.';
    } else if (costValue > 999999.99) {
      nextErrors.cost = 'El costo es demasiado alto.';
    }

    if (!targetAudience) {
      nextErrors.targetAudience = 'El público objetivo es obligatorio.';
    } else if (!['Persona Natural', 'Persona Moral'].includes(targetAudience)) {
      nextErrors.targetAudience = 'Selecciona una opción válida.';
    }

    if (!formData.interestRate) {
      nextErrors.interestRate = 'La tasa es obligatoria.';
    } else if (!Number.isFinite(interestRateValue)) {
      nextErrors.interestRate = 'La tasa debe ser un número válido.';
    } else if (interestRateValue < 0 || interestRateValue > 100) {
      nextErrors.interestRate = 'La tasa debe estar entre 0 y 100.';
    }

    if (!formData.frequency) {
      nextErrors.frequency = 'La frecuencia es obligatoria.';
    } else if (!Number.isInteger(frequencyValue) || frequencyValue < 1 || frequencyValue > 60) {
      nextErrors.frequency = 'La frecuencia debe ser un entero entre 1 y 60.';
    }

    if (benefitsText.length > 200) {
      nextErrors.benefits = 'Los beneficios no pueden exceder 200 caracteres.';
    }

    setFieldErrors(nextErrors);
    setCostError(nextErrors.cost || '');

    return Object.keys(nextErrors).length === 0;
  };

  const handleEditOpen = (membership: Membership) => {
    const parsedRenewal = parseRenewalPeriod(membership.renewalPeriod);
    setFormData({
      title: membership.title,
      cost: membership.cost.toString(),
      targetAudience: membership.targetAudience,
      interestRate: membership.interestRate.toString(),
      frequency: parsedRenewal.frequency,
      interval: parsedRenewal.interval,
      benefits: membership.benefits.join(', ')
    });
    setEditingMembership(membership);
    setIsCreateOpen(true);
  };

  const handleSubmit = async () => {
    setCostError('');

    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Revisa los campos marcados antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    const costValue = Number(formData.cost);

    const benefitsArray = formData.benefits.split(',').map(b => b.trim()).filter(b => b);
    const frequency = Number(formData.frequency || '1');

    try {
      if (editingMembership) {
        // update plan in DB
        const duration_days = formData.interval === 'year'
          ? 365 * frequency
          : formData.interval === 'week'
            ? 7 * frequency
            : 30 * frequency;
        const features = { benefits: benefitsArray, interestRate: Number(formData.interestRate), targetAudience: formData.targetAudience };
        const { error } = await supabase.from('membership_plans').update({ name: formData.title, price: costValue, currency: 'MXN', duration_days, features }).eq('id', editingMembership.id);
        if (error) throw error;
        toast({ title: 'Membresía actualizada', description: `${formData.title} actualizada` });
      } else {
        // create new plan through external API instead of Supabase
        const payload = {
          name: formData.title,
          amount: costValue,
          currency: 'MXN',
          interval: formData.interval,
          frequency,
          description: formData.targetAudience,
          features: {
            benefits: benefitsArray,
            interestRate: Number(formData.interestRate),
            targetAudience: formData.targetAudience,
          },
          active: true,
        };

        const response = await increscendoApiFetch('/conekta-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const rawError = await response.text();
          throw new Error(rawError || `Error HTTP ${response.status}`);
        }

        toast({ title: 'Membresía creada', description: `${formData.title} creada` });
        await fetchPlans();
      }
      if (editingMembership) {
        await fetchPlans();
      }
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      console.error('[MembershipManagement] submit error', err);
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Operación falló', variant: 'destructive' });
    }
  };

  const handleDelete = async (membershipId: string) => {
    try {
      const { error } = await supabase.from('membership_plans').delete().eq('id', membershipId);
      if (error) throw error;
      toast({ title: 'Membresía eliminada', description: 'El plan fue eliminado' });
      await fetchPlans();
    } catch (err) {
      console.error('[MembershipManagement] delete error', err);
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-hero rounded-lg p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Administrar Membresías</h2>
            <p className="text-white/90">Crea, edita y gestiona los planes de membresía</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleCreateOpen}
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Membresía
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full sm:max-w-[700px]">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-lg sm:text-xl">
                  {editingMembership ? 'Editar Membresía' : 'Nueva Membresía'}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  {editingMembership
                    ? 'Modifica los detalles de la membresía'
                    : 'Completa los datos para crear una nueva membresía'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-xs sm:text-sm">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFieldValue('title', e.target.value)}
                    placeholder="Ej: Membresía Premium"
                    maxLength={60}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">3 a 60 caracteres, letras, números y signos básicos.</p>
                  {fieldErrors.title && <p className="text-xs text-destructive">{fieldErrors.title}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cost" className="text-xs sm:text-sm">Costo (MXN) *</Label>
                    <Input
                      id="cost"
                      type="number"
                      min={1}
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFieldValue('cost', e.target.value)}
                      placeholder="100"
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Debe ser mayor a 1.</p>
                    {costError && <p className="text-xs text-destructive">{costError}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="interestRate" className="text-xs sm:text-sm">Tasa (%)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={formData.interestRate}
                      onChange={(e) => setFieldValue('interestRate', e.target.value)}
                      placeholder="42"
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Entre 0 y 100.</p>
                    {fieldErrors.interestRate && <p className="text-xs text-destructive">{fieldErrors.interestRate}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="frequency" className="text-xs sm:text-sm">Frecuencia *</Label>
                    <Input
                      id="frequency"
                      type="number"
                      min={1}
                      max={60}
                      step={1}
                      value={formData.frequency}
                      onChange={(e) => setFieldValue('frequency', e.target.value)}
                      placeholder="1"
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Entero entre 1 y 60.</p>
                    {fieldErrors.frequency && <p className="text-xs text-destructive">{fieldErrors.frequency}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="interval" className="text-xs sm:text-sm">Intervalo *</Label>
                    <Select value={formData.interval} onValueChange={(value) => setFormData({ ...formData, interval: value })}>
                      <SelectTrigger id="interval" className="text-sm">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Semana</SelectItem>
                        <SelectItem value="month">Mes</SelectItem>
                        <SelectItem value="year">Año</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="targetAudience" className="text-xs sm:text-sm">Público Objetivo *</Label>
                  <Select
                    value={formData.targetAudience}
                    onValueChange={(value) => setFieldValue('targetAudience', value)}
                  >
                    <SelectTrigger id="targetAudience" className="text-sm">
                      <SelectValue placeholder="Selecciona el público objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Persona Natural">Persona Natural</SelectItem>
                      <SelectItem value="Persona Moral">Persona Moral</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.targetAudience && <p className="text-xs text-destructive">{fieldErrors.targetAudience}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="benefits" className="text-xs sm:text-sm">Beneficios (separados por coma)</Label>
                  <Textarea
                    id="benefits"
                    value={formData.benefits}
                    onChange={(e) => setFieldValue('benefits', e.target.value)}
                    placeholder="Ej: Descuentos, Promociones, Atención preferencial"
                    rows={3}
                    maxLength={200}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Máximo 200 caracteres.</p>
                  {fieldErrors.benefits && <p className="text-xs text-destructive">{fieldErrors.benefits}</p>}
                </div>
              </div>
              <DialogFooter className="flex gap-2 sm:gap-3 flex-col-reverse sm:flex-row">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="text-sm">
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} className="text-sm">
                  {editingMembership ? 'Guardar Cambios' : 'Crear Membresía'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Memberships Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // show 6 shimmer cards
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={`skeleton-${i}`} className="shadow-soft transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-2/3">
                    <Skeleton className="h-6 w-40" />
                    <div className="mt-2"><Skeleton className="h-4 w-28" /></div>
                  </div>
                  <div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="border-t pt-3">
                  <Skeleton className="h-4 w-full" />
                  <div className="mt-2 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="flex gap-2 pt-3 border-t">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-12" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          memberships.map((membership) => (
            <Card key={membership.id} className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{membership.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3" />
                      {membership.targetAudience}
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="bg-success text-success-foreground">
                    Activo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pricing */}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">
                    ${membership.cost.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">MXN / {membership.renewalPeriod}</span>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Percent className="h-4 w-4" />
                    <span>Tasa: {membership.interestRate}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>Renovación: {membership.renewalPeriod}</span>
                  </div>
                </div>

                {/* Benefits */}
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">Beneficios:</p>
                  <ul className="space-y-1">
                    {membership.benefits.map((benefit, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEditOpen(membership)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar membresía?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente "{membership.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(membership.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {memberships.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay membresías</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu primera membresía para comenzar
          </p>
          <Button onClick={handleCreateOpen}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Membresía
          </Button>
        </div>
      )}
    </div>
  );
};

export default MembershipManagement;
