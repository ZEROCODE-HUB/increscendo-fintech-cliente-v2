import { useState, useEffect } from "react";
import { useCountUp } from "@/hooks/use-count-up";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wallet,
  FileText
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import { supabase } from "@/lib/supabase";

const AdminDashboard = () => {
  const [membershipDateRange, setMembershipDateRange] = useState("6months");
  const [profitabilityDateRange, setProfitabilityDateRange] = useState("6months");

  // KPI Stats (real)
  const [stats, setStats] = useState({
    totalClients: 0,
    activeLoans: 0,
    pendingRequests: 0,
    totalDisbursed: 0,
    overdueLoans: 0,
    pendingDisbursement: 0,
  });

  const [activeLoanStatusDataDynamic, setActiveLoanStatusDataDynamic] = useState<any[]>([]);
  const [profitabilityDynamic, setProfitabilityDynamic] = useState<Record<string, any[]>>({ '3months': [], '6months': [], '12months': [] });
  const [membershipDynamic, setMembershipDynamic] = useState<Record<string, any[]>>({ '3months': [], '6months': [], '12months': [] });

  useEffect(() => {
    (async () => {
      try {
        const { data: users } = await supabase.from('users').select('id,created_at,metadata');
        const { data: userMemberships } = await supabase.from('user_memberships').select('user_id,started_at,status,expires_at');
        const { data: loans } = await supabase.from('loans').select('id,amount,status,approved_at,applied_at,created_at,installments,metadata');
        const { data: disbursements } = await supabase.from('loan_disbursements').select('amount,created_at');
        const { data: invoices } = await supabase.from('invoices').select('amount,created_at');

        const totalClients = Array.isArray(users) ? users.length : 0;

        const loansArr = Array.isArray(loans) ? loans : [];
        const activeLoans = loansArr.filter((l: any) => l.status === 'active').length;
        const pendingRequests = loansArr.filter((l: any) => ['pending', 'under_review'].includes(l.status)).length;

        const totalDisbursed = Array.isArray(disbursements) ? disbursements.reduce((s: any, d: any) => s + Number(d.amount || 0), 0) : 0;

        // pending disbursement: sum amounts of loans approved/signed but not disbursed
        const pendingDisbursement = loansArr.filter((l: any) => ['approved', 'signed'].includes(l.status)).reduce((s: any, l: any) => s + Number(l.amount || 0), 0);

        // overdue calculation: basic heuristic using metadata.next_payment_date or derived schedule
        const now = new Date();
        let overdueLoans = 0;
        const statusCounts = { onday: 0, overdue: 0, urgent: 0, juridico: 0 };
        for (const l of loansArr) {
          if (l.status !== 'active') continue;
          let nextDate: Date | null = null;
          if (l.metadata?.next_payment_date) {
            try { nextDate = new Date(l.metadata.next_payment_date); } catch { nextDate = null; }
          } else {
            const approved = l.approved_at ? new Date(l.approved_at) : (l.applied_at ? new Date(l.applied_at) : (l.created_at ? new Date(l.created_at) : null));
            if (approved) {
              const installments = Number(l.installments ?? l.metadata?.installments ?? 12);
              const installmentAmount = installments > 0 ? Math.round(Number(l.amount || 0) / installments) : Number(l.amount || 0);
              const paid = Number(l.metadata?.paid_amount ?? 0);
              const paidInst = installmentAmount > 0 ? Math.floor(paid / installmentAmount) : 0;
              const nextInst = paidInst + 1;
              const d = new Date(approved);
              d.setMonth(d.getMonth() + nextInst);
              nextDate = d;
            }
          }
          const isOverdue = nextDate && nextDate < now && (Number(l.metadata?.paid_amount ?? 0) < Number(l.amount ?? 0));
          if (isOverdue) {
            overdueLoans += 1;
            statusCounts.overdue += 1;
          } else {
            statusCounts.onday += 1;
          }
        }

        setStats({ totalClients, activeLoans, pendingRequests, totalDisbursed, overdueLoans, pendingDisbursement });

        setActiveLoanStatusDataDynamic([
          { name: 'Al día', value: statusCounts.onday, color: 'hsl(var(--success))' },
          { name: 'Atrasado', value: statusCounts.overdue, color: 'hsl(var(--warning))' },
          { name: 'Urgente', value: statusCounts.urgent, color: 'hsl(var(--danger))' },
          { name: 'Jurídico', value: statusCounts.juridico, color: 'hsl(142, 50%, 30%)' },
        ]);

        // membership: compute registered vs memberships (last 12 months, will slice to 3/6/12)
        try {
          const monthsForMembership = 12;
          const nowM = new Date();
          const labelsM: string[] = [];
          const registradosSeries: number[] = [];
          const conMembresiaSeries: number[] = [];
          for (let i = monthsForMembership - 1; i >= 0; i--) {
            const d = new Date(nowM.getFullYear(), nowM.getMonth() - i, 1);
            const label = d.toLocaleString('default', { month: 'short' });
            labelsM.push(label);
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);

            const monthRegs = Array.isArray(users) ? users.filter((u: any) => { const dt = new Date(u.created_at); return dt >= monthStart && dt < monthEnd; }) : [];
            const monthMemb = Array.isArray(userMemberships) ? userMemberships.filter((m: any) => { if (!m.started_at) return false; const dt = new Date(m.started_at); return dt >= monthStart && dt < monthEnd && m.status === 'active'; }) : [];
            registradosSeries.push(monthRegs.length);
            conMembresiaSeries.push(monthMemb.length);
          }
          const monthsArrM = labelsM.map((m, idx) => ({ month: m, registrados: registradosSeries[idx], conMembresia: conMembresiaSeries[idx] }));
          setMembershipDynamic({ '12months': monthsArrM, '6months': monthsArrM.slice(-6), '3months': monthsArrM.slice(-3) });
        } catch (err) {
          console.warn('membership calc error', err);
        }

        // profitability: aggregate last 6 months from disbursements and invoices
        const months = 6;
        const nowDate = new Date();
        const labels: string[] = [];
        const desembolsosSeries: number[] = [];
        const pagosSeries: number[] = [];
        for (let i = months - 1; i >= 0; i--) {
          const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
          const label = d.toLocaleString('default', { month: 'short' });
          labels.push(label);
          const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
          const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);

          const monthDes = Array.isArray(disbursements) ? disbursements.filter((x: any) => { const dt = new Date(x.created_at); return dt >= monthStart && dt < monthEnd; }) : [];
          const monthPag = Array.isArray(invoices) ? invoices.filter((x: any) => { const dt = new Date(x.created_at); return dt >= monthStart && dt < monthEnd; }) : [];
          desembolsosSeries.push(monthDes.reduce((s: any, x: any) => s + Number(x.amount || 0), 0));
          pagosSeries.push(monthPag.reduce((s: any, x: any) => s + Number(x.amount || 0), 0));
        }

        // construct profitabilityDynamic structure compatible with existing UI
        const monthsArr = labels.map((m, idx) => ({ month: m, desembolsos: desembolsosSeries[idx], pagos: pagosSeries[idx] }));
        setProfitabilityDynamic({ '6months': monthsArr, '3months': monthsArr.slice(-3), '12months': monthsArr.concat([]) });

      } catch (e) {
        console.error('AdminDashboard load error', e);
      }
    })();
  }, []);

  // Membership status data (Usuarios Registrados vs Con Membresía)
  const membershipData = {
    "3months": [
      { month: "Oct", registrados: 180, conMembresia: 145 },
      { month: "Nov", registrados: 210, conMembresia: 165 },
      { month: "Dic", registrados: 245, conMembresia: 190 },
    ],
    "6months": [
      { month: "Jul", registrados: 120, conMembresia: 95 },
      { month: "Ago", registrados: 145, conMembresia: 115 },
      { month: "Sep", registrados: 160, conMembresia: 130 },
      { month: "Oct", registrados: 180, conMembresia: 145 },
      { month: "Nov", registrados: 210, conMembresia: 165 },
      { month: "Dic", registrados: 245, conMembresia: 190 },
    ],
    "12months": [
      { month: "Ene", registrados: 50, conMembresia: 35 },
      { month: "Feb", registrados: 65, conMembresia: 48 },
      { month: "Mar", registrados: 80, conMembresia: 60 },
      { month: "Abr", registrados: 95, conMembresia: 72 },
      { month: "May", registrados: 105, conMembresia: 82 },
      { month: "Jun", registrados: 115, conMembresia: 90 },
      { month: "Jul", registrados: 120, conMembresia: 95 },
      { month: "Ago", registrados: 145, conMembresia: 115 },
      { month: "Sep", registrados: 160, conMembresia: 130 },
      { month: "Oct", registrados: 180, conMembresia: 145 },
      { month: "Nov", registrados: 210, conMembresia: 165 },
      { month: "Dic", registrados: 245, conMembresia: 190 },
    ],
  };

  // Active loans status (Donut chart data)
  const activeLoanStatusData = [
    { name: "Al día", value: 98, color: "hsl(var(--success))" },
    { name: "Atrasado", value: 18, color: "hsl(var(--warning))" },
    { name: "Urgente", value: 8, color: "hsl(var(--danger))" },
    { name: "Jurídico", value: 4, color: "hsl(142, 50%, 30%)" },
  ];

  const totalActiveLoans = (activeLoanStatusDataDynamic.length ? activeLoanStatusDataDynamic : activeLoanStatusData).reduce((acc, item) => acc + item.value, 0);

  // Profitability data (Desembolsos vs Pagos de Usuarios)
  const profitabilityData = {
    "3months": [
      { month: "Oct", desembolsos: 280000, pagos: 255000 },
      { month: "Nov", desembolsos: 320000, pagos: 290000 },
      { month: "Dic", desembolsos: 350000, pagos: 310000 },
    ],
    "6months": [
      { month: "Jul", desembolsos: 180000, pagos: 165000 },
      { month: "Ago", desembolsos: 220000, pagos: 195000 },
      { month: "Sep", desembolsos: 250000, pagos: 230000 },
      { month: "Oct", desembolsos: 280000, pagos: 255000 },
      { month: "Nov", desembolsos: 320000, pagos: 290000 },
      { month: "Dic", desembolsos: 350000, pagos: 310000 },
    ],
    "12months": [
      { month: "Ene", desembolsos: 120000, pagos: 105000 },
      { month: "Feb", desembolsos: 135000, pagos: 120000 },
      { month: "Mar", desembolsos: 150000, pagos: 138000 },
      { month: "Abr", desembolsos: 145000, pagos: 140000 },
      { month: "May", desembolsos: 160000, pagos: 152000 },
      { month: "Jun", desembolsos: 175000, pagos: 162000 },
      { month: "Jul", desembolsos: 180000, pagos: 165000 },
      { month: "Ago", desembolsos: 220000, pagos: 195000 },
      { month: "Sep", desembolsos: 250000, pagos: 230000 },
      { month: "Oct", desembolsos: 280000, pagos: 255000 },
      { month: "Nov", desembolsos: 320000, pagos: 290000 },
      { month: "Dic", desembolsos: 350000, pagos: 310000 },
    ],
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltipPie = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalActiveLoans) * 100).toFixed(1);
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">Cantidad: <span className="font-medium text-foreground">{data.value}</span></p>
          <p className="text-sm text-muted-foreground">Porcentaje: <span className="font-medium text-foreground">{percentage}%</span></p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipLine = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-medium">{entry.name.includes("$") || entry.dataKey.includes("desembolsos") || entry.dataKey.includes("pagos") ? formatCurrency(entry.value) : entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between  ">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Clientes
            </CardTitle>
            <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className=" ">
            <div className="text-2xl sm:text-3xl font-bold">
              <AnimatedNumber value={stats.totalClients} duration={800} delay={0} />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              <span className="inline-flex items-center text-success font-medium">
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                +8%
              </span>
              <span className="ml-1">este mes</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between ">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Préstamos Activos
            </CardTitle>
            <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent className="">
            <div className="text-2xl sm:text-3xl font-bold">
              <AnimatedNumber value={stats.activeLoans} duration={800} delay={50} />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              Cartera saludable
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between ">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Solicitudes Pendientes
            </CardTitle>
            <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-xl bg-warning/10 flex items-center justify-center">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent className="">
            <div className="text-2xl sm:text-3xl font-bold">
              <AnimatedNumber value={stats.pendingRequests} duration={800} delay={100} />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between ">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Desembolsado
            </CardTitle>
            <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-xl bg-success/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent className="">
            <div className="text-2xl sm:text-3xl font-bold">
              <AnimatedNumber
                value={stats.totalDisbursed}
                duration={800}
                delay={150}
                formatter={formatCurrency}
              />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              En el último semestre
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between ">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Préstamos Vencidos
            </CardTitle>
            <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-xl bg-danger/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-danger" />
            </div>
          </CardHeader>
          <CardContent className="">
            <div className="text-2xl sm:text-3xl font-bold">
              <AnimatedNumber value={stats.overdueLoans} duration={800} delay={200} />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              Atención requerida
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between ">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total por Desembolsar
            </CardTitle>
            <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="">
            <div className="text-2xl sm:text-3xl font-bold">
              <AnimatedNumber
                value={stats.pendingDisbursement}
                duration={800}
                delay={250}
                formatter={formatCurrency}
              />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              <FileText className="inline h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
              Pendiente + Pend. Firma
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Central Charts */}
      <div className="grid gap-4 mt-4 sm:gap-6 grid-cols-1 md:grid-cols-1 lg:grid-cols-2">
        {/* Membership Status - Line Chart */}
        <Card className="shadow-soft">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg">Estado de Membresías</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Usuarios Registrados vs Con Membresía</CardDescription>
              </div>
              <Select value={membershipDateRange} onValueChange={setMembershipDateRange}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">3 meses</SelectItem>
                  <SelectItem value="6months">6 meses</SelectItem>
                  <SelectItem value="12months">12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <LineChart data={(membershipDynamic[membershipDateRange] && membershipDynamic[membershipDateRange].length) ? membershipDynamic[membershipDateRange] : membershipData[membershipDateRange as keyof typeof membershipData]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltipLine />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="registrados"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Usuarios Registrados"
                  dot={{ fill: "hsl(var(--primary))" }}
                />
                <Line
                  type="monotone"
                  dataKey="conMembresia"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  name="Usuarios con Membresía"
                  dot={{ fill: "hsl(var(--success))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Active Loans Status - Donut Chart */}
        <Card className="shadow-soft">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Estado de Préstamos Activos</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Distribución de cartera activa</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <PieChart>
                <Pie
                  data={activeLoanStatusDataDynamic.length ? activeLoanStatusDataDynamic : activeLoanStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {(activeLoanStatusDataDynamic.length ? activeLoanStatusDataDynamic : activeLoanStatusData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipPie />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span className="text-sm text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Profitability Section */}
      <Card className="shadow-soft mt-4">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg">Rentabilidad</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Desembolsos vs Pagos de Usuarios</CardDescription>
            </div>
            <Select value={profitabilityDateRange} onValueChange={setProfitabilityDateRange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 meses</SelectItem>
                <SelectItem value="6months">6 meses</SelectItem>
                <SelectItem value="12months">12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <ResponsiveContainer width="100%" height={280} className="sm:h-[350px]">
            <LineChart data={(profitabilityDynamic[profitabilityDateRange] && profitabilityDynamic[profitabilityDateRange].length) ? profitabilityDynamic[profitabilityDateRange] : profitabilityData[profitabilityDateRange as keyof typeof profitabilityData]}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltipLine />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="desembolsos"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Desembolsos"
                dot={{ fill: "hsl(var(--primary))" }}
              />
              <Line
                type="monotone"
                dataKey="pagos"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                name="Pagos de Usuarios"
                dot={{ fill: "hsl(var(--success))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
