import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client } from "@/types/clients";
import { Download, Upload, User, IdCard, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: Partial<Client>) => Promise<void> | void;
}

export const AddUserModal = ({ open, onOpenChange, onConfirm }: AddUserModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    role: "Usuario",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    birthDate: "",
    ine: "",
    curp: "",
  });

  const handleSubmit = () => {
    // Validaciones básicas
    if (!formData.email) {
      toast({ title: "Error", description: "El email es obligatorio", variant: "destructive" });
      return;
    }
    if (!formData.firstName || !formData.lastName) {
      toast({ title: "Error", description: "Nombre y apellido son obligatorios", variant: "destructive" });
      return;
    }

    Promise.resolve(onConfirm(formData))
      .then(() => {
        toast({ title: "Usuario agregado", description: "El usuario ha sido registrado exitosamente." });
        onOpenChange(false);
        setFormData({
          role: "Usuario",
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          phone: "",
          address: "",
          birthDate: "",
          ine: "",
          curp: "",
        });
      })
      .catch((err) => {
        console.error('[AddUserModal] onConfirm error', err);
        toast({ title: "Error", description: "No se pudo registrar el usuario", variant: "destructive" });
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
          <DialogDescription>Complete los datos del nuevo usuario</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Rol</Label>
            <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Usuario">Usuario</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nombres</Label>
            <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
          </div>
          <div>
            <Label>Apellidos</Label>
            <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div>
            <Label>Contraseña</Label>
            <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div>
            <Label>Dirección</Label>
            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div>
            <Label>Fecha de Nacimiento</Label>
            <Input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} />
          </div>
          <div>
            <Label>INE</Label>
            <Input value={formData.ine} onChange={(e) => setFormData({ ...formData, ine: e.target.value })} />
          </div>
          <div>
            <Label>CURP</Label>
            <Input value={formData.curp} onChange={(e) => setFormData({ ...formData, curp: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Registrar Usuario</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ModifyClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onConfirm: (data: Client) => void;
  plans?: { id: string; name: string }[];
}

export const ModifyClientModal = ({ open, onOpenChange, client, onConfirm, plans }: ModifyClientModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Client>>(client || {});

  const handleSubmit = () => {
    if (client) {
      onConfirm({ ...client, ...formData } as Client);
      toast({ title: "Usuario modificado", description: "Los datos han sido actualizados." });
      onOpenChange(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modificar Usuario</DialogTitle>
          <DialogDescription>Edite los datos del usuario {client.firstName} {client.lastName}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Rol</Label>
            <Select value={formData.role || client.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Usuario">Usuario</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nombres</Label>
            <Input defaultValue={client.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
          </div>
          <div>
            <Label>Apellidos</Label>
            <Input defaultValue={client.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" defaultValue={client.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input defaultValue={client.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div>
            <Label>Dirección</Label>
            <Input defaultValue={client.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div>
            <Label>Fecha de Nacimiento</Label>
            <Input type="date" defaultValue={client.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} />
          </div>
          <div>
            <Label>INE</Label>
            <Input defaultValue={client.ine} onChange={(e) => setFormData({ ...formData, ine: e.target.value })} />
          </div>
          <div>
            <Label>CURP</Label>
            <Input defaultValue={client.curp} onChange={(e) => setFormData({ ...formData, curp: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface DeleteClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onConfirm: () => Promise<void> | void;
}

export const DeleteClientModal = ({ open, onOpenChange, client, onConfirm }: DeleteClientModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar Usuario?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente al usuario {client?.firstName} {client?.lastName} y todos sus datos asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-danger hover:bg-danger/90" disabled={isDeleting}>
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface ViewPhotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export const ViewPhotoModal = ({ open, onOpenChange, client }: ViewPhotoModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Foto de Perfil</DialogTitle>
          <DialogDescription>{client?.firstName} {client?.lastName}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="w-48 h-48 bg-muted rounded-full flex items-center justify-center overflow-hidden border-4 border-border">
            {client?.photoUrl ? (
              <img src={client.photoUrl} alt={`${client.firstName} ${client.lastName}`} className="w-full h-full object-cover" />
            ) : (
              <User className="w-24 h-24 text-muted-foreground" />
            )}
          </div>
          {!client?.photoUrl && (
            <p className="text-sm text-muted-foreground text-center">
              Este usuario no tiene foto de perfil
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ViewDocumentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export const ViewDocumentsModal = ({ open, onOpenChange, client }: ViewDocumentsModalProps) => {
  const { toast } = useToast();
  const [ineFrontUrl, setIneFrontUrl] = useState<string | null>(null);
  const [ineBackUrl, setIneBackUrl] = useState<string | null>(null);
  const [curpUrl, setCurpUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ ineFront: boolean; ineBack: boolean; curp: boolean }>(
    { ineFront: false, ineBack: false, curp: false },
  );

  const ineFrontInputRef = useRef<HTMLInputElement | null>(null);
  const ineBackInputRef = useRef<HTMLInputElement | null>(null);
  const curpInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadDocumentUrls = async () => {
      if (!client?.id) {
        setIneFrontUrl(null);
        setIneBackUrl(null);
        setCurpUrl(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("ine_front_url, ine_back_url, curp_url")
          .eq("id", client.id)
          .single();

        if (error) {
          console.warn("[ViewDocumentsModal] error loading document urls", error);
          // fallback to values already presentes en client, si existen
          setIneFrontUrl((client as any).ineFrontUrl ?? null);
          setIneBackUrl((client as any).ineBackUrl ?? null);
          setCurpUrl((client as any).curpUrl ?? null);
          return;
        }

        setIneFrontUrl((data as any)?.ine_front_url ?? (client as any).ineFrontUrl ?? null);
        setIneBackUrl((data as any)?.ine_back_url ?? (client as any).ineBackUrl ?? null);
        setCurpUrl((data as any)?.curp_url ?? (client as any).curpUrl ?? null);
      } catch (err) {
        console.error("[ViewDocumentsModal] exception loading document urls", err);
        setIneFrontUrl((client as any).ineFrontUrl ?? null);
        setIneBackUrl((client as any).ineBackUrl ?? null);
        setCurpUrl((client as any).curpUrl ?? null);
      }
    };

    if (open) {
      loadDocumentUrls();
    }
  }, [client, open]);

  const handleUpload = async (type: "ineFront" | "ineBack" | "curp", file: File) => {
    if (!client?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar al usuario.",
        variant: "destructive",
      });
      return;
    }

    const userId = client.id;

    try {
      setUploading((prev) => ({ ...prev, [type]: true }));

      const ext = file.name.split(".").pop() || (type === "curp" ? "pdf" : "jpg");
      const objectName = `${type}-${Date.now()}.${ext}`;
      const path = `${userId}/${objectName}`;

      const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, {
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("documents").getPublicUrl(path);
      const publicUrl = publicData.publicUrl;

      const column =
        type === "ineFront" ? "ine_front_url" : type === "ineBack" ? "ine_back_url" : "curp_url";

      const { error: updateError } = await supabase
        .from("users")
        .update({ [column]: publicUrl })
        .eq("id", userId);
      if (updateError) throw updateError;

      if (type === "ineFront") setIneFrontUrl(publicUrl);
      if (type === "ineBack") setIneBackUrl(publicUrl);
      if (type === "curp") setCurpUrl(publicUrl);

      toast({ title: "Documento actualizado", description: "El archivo se ha subido correctamente." });
    } catch (err) {
      console.error("[ViewDocumentsModal] upload error", err);
      toast({
        title: "Error al subir",
        description: "No se pudo subir el documento. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleDownload = (type: "ineFront" | "ineBack" | "curp") => {
    const url = type === "ineFront" ? ineFrontUrl : type === "ineBack" ? ineBackUrl : curpUrl;
    if (!url) {
      toast({ title: "Sin archivo", description: "Aún no se ha cargado este documento." });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documentos del Usuario</DialogTitle>
          <DialogDescription>{client?.firstName} {client?.lastName}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="ine" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ine">INE</TabsTrigger>
            <TabsTrigger value="curp">CURP</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ine" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <IdCard className="h-5 w-5" /> INE - Frente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-accent rounded-lg p-8 text-center mb-4">
                  {ineFrontUrl ? (
                    <img
                      src={ineFrontUrl}
                      alt="INE frente"
                      className="max-h-48 rounded-md shadow-md object-contain bg-background mx-auto"
                    />
                  ) : (
                    <>
                      <IdCard className="h-16 w-16 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">(Imagen frontal del INE)</p>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownload("ineFront")}
                  >
                    <Download className="h-4 w-4 mr-2" /> Descargar
                  </Button>
                  <div className="flex-1">
                    <input
                      ref={ineFrontInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload("ineFront", file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => ineFrontInputRef.current?.click()}
                      disabled={uploading.ineFront}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading.ineFront ? "Subiendo..." : "Reemplazar"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <IdCard className="h-5 w-5" /> INE - Reverso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-accent rounded-lg p-8 text-center mb-4">
                  {ineBackUrl ? (
                    <img
                      src={ineBackUrl}
                      alt="INE reverso"
                      className="max-h-48 rounded-md shadow-md object-contain bg-background mx-auto"
                    />
                  ) : (
                    <>
                      <IdCard className="h-16 w-16 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">(Imagen trasera del INE)</p>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownload("ineBack")}
                  >
                    <Download className="h-4 w-4 mr-2" /> Descargar
                  </Button>
                  <div className="flex-1">
                    <input
                      ref={ineBackInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload("ineBack", file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => ineBackInputRef.current?.click()}
                      disabled={uploading.ineBack}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading.ineBack ? "Subiendo..." : "Reemplazar"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="curp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5" /> CURP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-accent rounded-lg p-8 text-center mb-4">
                  <FileText className="h-16 w-16 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">(PDF del CURP)</p>
                  <p className="text-xs text-muted-foreground mt-1">CURP: {client?.curp}</p>
                  {curpUrl ? (
                    <p className="mt-2 inline-flex items-center rounded-full bg-emerald-600/15 px-3 py-1 text-xs font-medium text-emerald-700">
                      PDF cargado
                    </p>
                  ) : (
                    <p className="mt-2 inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      Sin archivo
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownload("curp")}
                  >
                    <Download className="h-4 w-4 mr-2" /> Descargar PDF
                  </Button>
                  <div className="flex-1">
                    <input
                      ref={curpInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload("curp", file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => curpInputRef.current?.click()}
                      disabled={uploading.curp}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading.curp ? "Subiendo..." : "Reemplazar"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
