import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, CreditCard, Link as LinkIcon, Mail, MonitorCheck, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PlatformStatus = {
  ok: boolean;
  label: string;
  detail: string;
  checkedAt: string;
};

const statusStyles = {
  online: {
    dot: "bg-green-500",
    card: "border-green-500/30 bg-green-500/5",
    icon: "text-green-600",
    label: "En línea",
  },
  warning: {
    dot: "bg-yellow-500",
    card: "border-yellow-500/30 bg-yellow-500/5",
    icon: "text-yellow-600",
    label: "En desarrollo",
  },
  offline: {
    dot: "bg-red-500",
    card: "border-red-500/30 bg-red-500/5",
    icon: "text-red-600",
    label: "Sin respuesta",
  },
} as const;

const SystemConfig = () => {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [loanApprovals, setLoanApprovals] = useState(true);
  const [belvoStatus, setBelvoStatus] = useState<PlatformStatus>({
    ok: false,
    label: "Verificando...",
    detail: "Comprobando disponibilidad de Belvo",
    checkedAt: "",
  });
  const [conektaStatus, setConektaStatus] = useState<PlatformStatus>({
    ok: false,
    label: "Verificando...",
    detail: "Comprobando disponibilidad de Conekta",
    checkedAt: "",
  });
  const [tekaeStatus, setTekaeStatus] = useState<PlatformStatus>({
    ok: false,
    label: "Verificando...",
    detail: "Comprobando disponibilidad de Tekae",
    checkedAt: "",
  });

  useEffect(() => {
    let cancelled = false;

    const checkPlatform = async (
      url: string,
      setStatus: (status: PlatformStatus) => void,
      fallbackLabel: string,
      fallbackDetail: string,
    ) => {
      const checkedAt = new Date().toISOString();

      try {
        const response = await fetch(url, { method: "GET", mode: "no-cors" });
        if (cancelled) return;

        if (response) {
          setStatus({
            ok: true,
            label: "En línea",
            detail: fallbackDetail,
            checkedAt,
          });
          return;
        }
      } catch {
        if (cancelled) return;
      }

      setStatus({
        ok: false,
        label: fallbackLabel,
        detail: `No fue posible validar ${fallbackDetail.toLowerCase()}.`,
        checkedAt,
      });
    };

    checkPlatform(
      "https://auth.sandbox.directdebit.belvo.com/",
      setBelvoStatus,
      "Sin respuesta",
      "Belvo sandbox responde correctamente",
    );
    checkPlatform(
      "https://www.conekta.com/glosario/api",
      setConektaStatus,
      "Sin respuesta",
      "Conekta responde correctamente",
    );
    checkPlatform(
      "https://www.tekaebusiness.com.mx/",
      setTekaeStatus,
      "Sin respuesta",
      "Tekae Business responde correctamente",
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveNotifications = () => {
    toast({
      title: "Configuración Guardada",
      description: "Las preferencias de notificaciones han sido actualizadas.",
    });
  };

  const handleSaveIntegrations = () => {
    toast({
      title: "Integraciones Actualizadas",
      description: "El estado de las plataformas ha sido actualizado exitosamente.",
    });
  };

  const renderStatusCard = (
    title: string,
    description: string,
    status: PlatformStatus,
    tone: keyof typeof statusStyles,
    icon: React.ReactNode,
  ) => {
    const styles = tone === "online" ? statusStyles.online : tone === "warning" ? statusStyles.warning : statusStyles.offline;

    return (
      <Card className={`shadow-soft border ${styles.card}`}>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${styles.card}`}>
                <span className={`h-3.5 w-3.5 rounded-full ${styles.dot}`} />
              </div>
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg truncate">
                  <span className={styles.icon}>{icon}</span>
                  {title}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
              {status.label}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-2 text-sm">
          <p className="text-muted-foreground">{status.detail}</p>
          <p className="text-xs text-muted-foreground">
            Última verificación: {status.checkedAt ? new Date(status.checkedAt).toLocaleString('es-MX') : 'Pendiente'}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          </TabsList>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="mt-6 space-y-6">
                {/* Email Notifications */}
                <Card className="shadow-soft">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>Notificaciones por Email</CardTitle>
                        <CardDescription>
                          Configura alertas automáticas por correo electrónico
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-enabled">Habilitar Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Enviar notificaciones por correo electrónico
                        </p>
                      </div>
                      <Switch
                        id="email-enabled"
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>
                    {/* 
                    {emailNotifications && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="email-from">Email Remitente</Label>
                          <Input
                            id="email-from"
                            type="email"
                            placeholder="noreply@increscendo.com"
                            defaultValue="noreply@increscendo.com"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email-template-approval">Plantilla: Aprobación de Préstamo</Label>
                          <Textarea
                            id="email-template-approval"
                            placeholder="Estimado {nombre}, su préstamo ha sido aprobado..."
                            rows={4}
                            defaultValue="Estimado {nombre},&#10;&#10;Su préstamo por ${monto} ha sido aprobado. Los fondos serán depositados en las próximas 24 horas.&#10;&#10;Saludos,&#10;Increscendo Fintech"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email-template-payment">Plantilla: Recordatorio de Pago</Label>
                          <Textarea
                            id="email-template-payment"
                            placeholder="Estimado {nombre}, le recordamos que su pago vence el..."
                            rows={4}
                            defaultValue="Estimado {nombre},&#10;&#10;Le recordamos que su pago de ${monto} vence el {fecha}.&#10;&#10;Saludos,&#10;Increscendo Fintech"
                          />
                        </div>
                      </>
                    )} */}
                  </CardContent>
                </Card>


                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications}>
                    <Settings className="h-4 w-4 mr-2" />
                    Guardar Configuración
                  </Button>
                </div>
              </TabsContent>

              {/* Integrations Tab */}
              <TabsContent value="integrations" className="mt-6 space-y-6">
                {renderStatusCard(
                  "Belvo",
                  "Monitoreo de disponibilidad del sandbox de instituciones.",
                  belvoStatus,
                  belvoStatus.ok ? "online" : "offline",
                  <MonitorCheck className="h-5 w-5" />,
                )}

                {renderStatusCard(
                  "Conekta",
                  "Pasarela de pago y documentación de la API.",
                  conektaStatus,
                  conektaStatus.ok ? "online" : "offline",
                  <CreditCard className="h-5 w-5" />,
                )}

                <Card className={`shadow-soft border ${tekaeStatus.ok ? statusStyles.online.card : statusStyles.warning.card}`}>
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${tekaeStatus.ok ? statusStyles.online.card : statusStyles.warning.card}`}>
                          <span className={`h-3.5 w-3.5 rounded-full ${tekaeStatus.ok ? statusStyles.online.dot : statusStyles.warning.dot}`} />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="flex items-center gap-2 text-base sm:text-lg truncate">
                            <span className={tekaeStatus.ok ? statusStyles.online.icon : statusStyles.warning.icon}><LinkIcon className="h-5 w-5" /></span>
                            Tekae Business
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm">
                            Integración de incentivos digitales y conexión directa con la plataforma de Tekae.
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
                        <span className={`h-2.5 w-2.5 rounded-full ${tekaeStatus.ok ? statusStyles.online.dot : statusStyles.warning.dot}`} />
                        {tekaeStatus.label}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-2 text-sm">
                    <p className="text-muted-foreground">{tekaeStatus.detail}</p>
                    <p className="text-xs text-muted-foreground">
                      URL de referencia: https://www.tekaebusiness.com.mx/
                    </p>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={handleSaveIntegrations}>
                    <Settings className="h-4 w-4 mr-2" />
                    Guardar Monitoreo
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
      </div>
    </>
  );
};

export default SystemConfig;
