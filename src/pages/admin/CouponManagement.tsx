import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type Coupon = {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_amount: number | null;
  active: boolean;
  max_redemptions: number | null;
  redeemed_count?: number;
  starts_at?: string | null;
  ends_at?: string | null;
};

const CouponManagement = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ code: "", discount_percent: "", discount_amount: "", max_redemptions: "", starts_at: "", ends_at: "" });
  const [discountType, setDiscountType] = useState<'percent' | 'amount' | ''>('');
  const resetForm = () => {
    setForm({ code: "", discount_percent: "", discount_amount: "", max_redemptions: "", starts_at: "", ends_at: "" });
    setDiscountType('');
  };

  const toDatetimeLocal = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const { userRole } = useAuth();

  useEffect(() => {
    if (userRole === null || userRole === undefined) return;
    if (userRole !== 'admin') {
      toast({ title: 'Acceso denegado', description: 'No tienes permisos para acceder', variant: 'destructive' });
      return;
    }
    fetchCoupons();
  }, [userRole]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCoupons(data ?? []);
    } catch (err) {
      console.error('[CouponManagement] fetch', err);
      toast({ title: 'Error', description: 'No se pudieron cargar los cupones', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.code) return toast({ title: 'Código requerido', variant: 'destructive' });
    try {
      const payload: any = { code: form.code.toUpperCase().trim(), active: true };
      if (form.discount_percent) payload.discount_percent = Number(form.discount_percent);
      if (form.discount_amount) payload.discount_amount = Number(form.discount_amount);
      if (form.max_redemptions) payload.max_redemptions = Number(form.max_redemptions);
      const { error } = await supabase.from('coupons').insert([payload]);
      if (error) throw error;
      toast({ title: 'Cupón creado' });
      setIsOpen(false);
      resetForm()
      await fetchCoupons();
    } catch (err) {
      console.error('[CouponManagement] create', err);
      toast({ title: 'Error', description: 'No se pudo crear el cupón', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Eliminado' });
      await fetchCoupons();
    } catch (err) {
      console.error('[CouponManagement] delete', err);
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-semibold">Cupones de Descuento</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Crea y administra cupones de descuento</p>
          </div>
              <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setEditing(null); setForm({ code: "", discount_percent: "", discount_amount: "", max_redemptions: "", starts_at: "", ends_at: "" }); } setIsOpen(open); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditing(null); setForm({ code: "", discount_percent: "", discount_amount: "", max_redemptions: "", starts_at: "", ends_at: "" }); setIsOpen(true); }} className="text-xs sm:text-sm h-9 sm:h-10 w-fit px-3 sm:px-4 flex-shrink-0">
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Nuevo Cupón</span>
                    <span className="sm:hidden">Agregar</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-screen overflow-y-auto w-[95vw] sm:w-full sm:max-w-[520px]">
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-lg sm:text-xl">{editing ? 'Editar Cupón' : 'Nuevo Cupón'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-2 sm:gap-3 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="code" className="text-xs sm:text-sm">Código *</Label>
                      <Input id="code" value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} placeholder="Ej: VERANO2024" className="text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="grid gap-2">
                        <Label className="text-xs sm:text-sm">Tipo de Descuento</Label>
                        <Select value={discountType} onValueChange={(v: 'percent' | 'amount' | '') => {
                          setDiscountType(v);
                          if (v === 'percent') setForm((prev) => ({ ...prev, discount_percent: prev.discount_percent || '', discount_amount: '' }));
                          else if (v === 'amount') setForm((prev) => ({ ...prev, discount_amount: prev.discount_amount || '', discount_percent: '' }));
                          else setForm((prev) => ({ ...prev, discount_percent: '', discount_amount: '' }));
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">Porcentaje (%)</SelectItem>
                            <SelectItem value="amount">Monto ($ MXN)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs sm:text-sm">Valor del Descuento</Label>
                        <Input
                          value={discountType === 'percent' ? form.discount_percent : form.discount_amount}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (discountType === 'percent') setForm((prev) => ({ ...prev, discount_percent: val }));
                            else if (discountType === 'amount') setForm((prev) => ({ ...prev, discount_amount: val }));
                          }}
                          type="number"
                          placeholder={discountType === 'percent' ? '10' : discountType === 'amount' ? '50' : 'Selecciona tipo primero'}
                          className="text-sm"
                          disabled={!discountType}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs sm:text-sm">Máx. usos</Label>
                      <Input value={form.max_redemptions} onChange={(e) => setForm({...form, max_redemptions: e.target.value})} type="number" placeholder="Ilimitado" className="text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="grid gap-2">
                        <Label className="text-xs sm:text-sm">Inicia</Label>
                        <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({...form, starts_at: e.target.value})} className="text-xs sm:text-sm" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs sm:text-sm">Expira</Label>
                        <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({...form, ends_at: e.target.value})} className="text-xs sm:text-sm" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="flex gap-2 sm:gap-3 flex-col-reverse sm:flex-row">
                    <Button variant="outline" onClick={() => { setIsOpen(false); setEditing(null); }} className="text-sm">Cancelar</Button>
                    <Button onClick={async () => {
                      if (!discountType || (!form.discount_percent && !form.discount_amount)) {
                        return toast({ title: 'Error', description: 'Selecciona el tipo e ingresa el valor del descuento', variant: 'destructive' });
                      }
                      if (form.starts_at && form.ends_at) {
                        const s = new Date(form.starts_at);
                        const e = new Date(form.ends_at);
                        if (e <= s) return toast({ title: 'Error', description: 'La fecha de expiración debe ser posterior a la de inicio', variant: 'destructive' });
                      }
                      if (editing) {
                        try {
                          const payload: any = { code: form.code.toUpperCase().trim() };
                          if (form.discount_percent) payload.discount_percent = Number(form.discount_percent);
                          else payload.discount_percent = null;
                          if (form.discount_amount) payload.discount_amount = Number(form.discount_amount);
                          else payload.discount_amount = null;
                          if (form.max_redemptions) payload.max_redemptions = Number(form.max_redemptions);
                          else payload.max_redemptions = null;
                          if (form.starts_at) payload.starts_at = new Date(form.starts_at).toISOString();
                          else payload.starts_at = null;
                          if (form.ends_at) payload.ends_at = new Date(form.ends_at).toISOString();
                          else payload.ends_at = null;
                          const { error } = await supabase.from('coupons').update(payload).eq('id', editing.id);
                          if (error) throw error;
                          toast({ title: 'Cupón actualizado' });
                          setIsOpen(false);
                          setEditing(null);
                          setForm({ code: "", discount_percent: "", discount_amount: "", max_redemptions: "", starts_at: "", ends_at: "" });
                          await fetchCoupons();
                        } catch (err) {
                          console.error('[CouponManagement] update', err);
                          toast({ title: 'Error', description: 'No se pudo actualizar el cupón', variant: 'destructive' });
                        }
                      }
                      else {
                        try {
                          const payload: any = { code: form.code.toUpperCase().trim(), active: true };
                          if (form.discount_percent) payload.discount_percent = Number(form.discount_percent);
                          if (form.discount_amount) payload.discount_amount = Number(form.discount_amount);
                          if (form.max_redemptions) payload.max_redemptions = Number(form.max_redemptions);
                          if (form.starts_at) payload.starts_at = new Date(form.starts_at).toISOString();
                          if (form.ends_at) payload.ends_at = new Date(form.ends_at).toISOString();
                          const { error } = await supabase.from('coupons').insert([payload]);
                          if (error) throw error;
                          toast({ title: 'Cupón creado' });
                          setIsOpen(false);
                          setForm({ code: "", discount_percent: "", discount_amount: "", max_redemptions: "", starts_at: "", ends_at: "" });
                          await fetchCoupons();
                        } catch (err) {
                          console.error('[CouponManagement] create', err);
                          toast({ title: 'Error', description: 'No se pudo crear el cupón', variant: 'destructive' });
                        }
                      }
                    }} className="text-sm">{editing ? 'Guardar Cambios' : 'Crear Cupón'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Table Section */}
            <div className="rounded-lg border bg-card shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  <Table className="w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-gradient-to-r from-secondary/50 to-secondary/30 border-b-2">
                      <TableHead className="text-xs sm:text-sm font-bold whitespace-nowrap px-3 sm:px-4 py-2.5 sm:py-3">Código</TableHead>
                      <TableHead className="text-xs sm:text-sm font-bold whitespace-nowrap px-3 sm:px-4 py-2.5 sm:py-3">Descuento</TableHead>
                      <TableHead className="text-xs sm:text-sm font-bold whitespace-nowrap px-3 sm:px-4 py-2.5 sm:py-3 text-center">Usos</TableHead>
                      <TableHead className="text-xs sm:text-sm font-bold whitespace-nowrap px-3 sm:px-4 py-2.5 sm:py-3">Expira</TableHead>
                      <TableHead className="text-xs sm:text-sm font-bold whitespace-nowrap px-3 sm:px-4 py-2.5 sm:py-3 text-center">Estado</TableHead>
                      <TableHead className="text-xs sm:text-sm font-bold whitespace-nowrap px-3 sm:px-4 py-2.5 sm:py-3 text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-xs sm:text-sm text-center py-8 text-muted-foreground">Cargando cupones...</TableCell>
                      </TableRow>
                    ) : coupons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-xs sm:text-sm text-center py-8 text-muted-foreground">No hay cupones disponibles</TableCell>
                      </TableRow>
                    ) : (
                      coupons.map((c, idx) => {
                        const isExpired = c.ends_at && new Date(c.ends_at) < new Date();
                        const isUnused = c.max_redemptions === 0 || c.max_redemptions === null;
                        return (
                        <TableRow key={c.id} className={`hover:bg-secondary/20 transition-colors ${idx % 2 === 0 ? 'bg-background' : 'bg-secondary/5'}`}>
                          <TableCell className="font-semibold text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 sm:py-3">
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">{c.code}</span>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3">
                            <span className="font-semibold text-primary">{c.discount_percent ? `${c.discount_percent}%` : c.discount_amount ? `$${c.discount_amount}` : '-'}</span>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 text-center">
                            {isUnused ? (
                              <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs font-medium">Sin usar</span>
                            ) : (
                              <span className="bg-secondary/30 px-1.5 py-0.5 rounded text-xs">{c.max_redemptions ?? '∞'}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                            {c.ends_at ? (
                              <span className={isExpired ? 'font-medium text-red-600' : ''}>
                                {new Date(c.ends_at).toLocaleDateString('es-MX')}
                              </span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${isExpired ? 'bg-red-100 text-red-700' : c.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                              {isExpired ? '✗ Expirado' : c.active ? '✓ Activo' : '○ Inactivo'}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex gap-1 justify-center">
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditing(c);
                                setForm({ code: c.code, discount_percent: c.discount_percent ? String(c.discount_percent) : "", discount_amount: c.discount_amount ? String(c.discount_amount) : "", max_redemptions: c.max_redemptions ? String(c.max_redemptions) : "", starts_at: toDatetimeLocal(c.starts_at), ends_at: toDatetimeLocal(c.ends_at) });
                                setDiscountType(c.discount_percent ? 'percent' : c.discount_amount ? 'amount' : '');
                                setIsOpen(true);
                              }} className="h-7 w-7 p-0 hover:bg-blue-50" title="Editar">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)} className="h-7 w-7 p-0" title="Eliminar">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </>
    );
};

export default CouponManagement;
