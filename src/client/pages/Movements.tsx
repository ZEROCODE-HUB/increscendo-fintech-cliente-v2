import React, { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Download, ReceiptText, Search } from "lucide-react";
import { Btn, Card, Empty, KV, PageHeader, Pill, Segmented, SelectInput, Sheet, Skel, TextInput } from "../components/ui";
import { MovementRow } from "../components/rows";
import { KIND_LABEL, MovementsTable } from "../components/MovementsTable";
import { useJourney, useMovements } from "../hooks";
import { dateTime, money } from "../lib/format";
import type { Movement } from "../lib/types";

type Filter = "all" | "membresia" | "prestamo" | "servicio";
type StatusF = "all" | Movement["status"];
const PAGE = 15;

export function MovementDetail({ m, onClose }: { m: Movement | null; onClose: () => void }) {
  return (
    <Sheet open={!!m} onOpenChange={(v) => !v && onClose()} title={m?.title ?? ""} side>
      {m && (
        <div>
          <p className={`mt-2 text-center text-[34px] font-extrabold tracking-tight ${m.direction === "in" ? "text-emerald-600" : "text-slate-900"}`}>
            {m.direction === "in" ? "+" : "−"}
            {money(m.amount)}
          </p>
          <div className="mb-5 mt-1 flex justify-center">
            <Pill tone={m.status === "ok" ? "success" : m.status === "pending" ? "warning" : "danger"}>{m.statusLabel}</Pill>
          </div>
          <div className="divide-y divide-slate-100 rounded-2xl bg-slate-50 px-4">
            <KV k="Tipo" v={KIND_LABEL[m.kind]} />
            <KV k="Detalle" v={m.subtitle} />
            <KV k="Fecha" v={dateTime(m.date)} />
            <KV k="Dirección" v={m.direction === "in" ? "Entrada" : "Salida"} />
            {m.reference && <KV k="Referencia" v={<span className="font-mono text-xs">{m.reference}</span>} />}
          </div>
          {m.status === "failed" && <p className="mt-4 text-sm text-slate-500">Este cargo no se completó. Si crees que es un error, escríbenos desde Ayuda.</p>}
        </div>
      )}
    </Sheet>
  );
}

export default function Movements() {
  const { data, isLoading } = useMovements();
  const { loanInvited } = useJourney();
  const [filter, setFilter] = useState<Filter>("all");
  const [status, setStatus] = useState<StatusF>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<Movement | null>(null);

  const rows = useMemo(() => {
    let r = data ?? [];
    if (filter === "prestamo") r = r.filter((m) => m.kind === "prestamo" || m.kind === "cuota");
    else if (filter !== "all") r = r.filter((m) => m.kind === filter);
    if (status !== "all") r = r.filter((m) => m.status === status);
    if (from) r = r.filter((m) => new Date(m.date) >= new Date(`${from}T00:00:00`));
    if (to) r = r.filter((m) => new Date(m.date) <= new Date(`${to}T23:59:59`));
    if (q.trim()) {
      const s = q.toLowerCase();
      r = r.filter((m) => `${m.title} ${m.subtitle} ${m.reference ?? ""}`.toLowerCase().includes(s));
    }
    return r;
  }, [data, filter, status, from, to, q]);

  useEffect(() => setPage(0), [filter, status, from, to, q]);

  const totals = useMemo(() => {
    const ok = rows.filter((m) => m.status === "ok");
    return {
      out: ok.filter((m) => m.direction === "out").reduce((a, m) => a + m.amount, 0),
      inn: ok.filter((m) => m.direction === "in").reduce((a, m) => a + m.amount, 0),
    };
  }, [rows]);

  const groups = useMemo(() => {
    const g = new Map<string, Movement[]>();
    for (const m of rows) {
      const raw = new Date(m.date).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
      const k = raw.charAt(0).toUpperCase() + raw.slice(1);
      g.set(k, [...(g.get(k) ?? []), m]);
    }
    return Array.from(g.entries());
  }, [rows]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const pageRows = rows.slice(page * PAGE, page * PAGE + PAGE);

  const exportCsv = () => {
    const head = "Fecha,Concepto,Tipo,Detalle,Monto,Estatus,Referencia";
    const body = rows.map((m) =>
      [new Date(m.date).toLocaleString("es-MX"), m.title, KIND_LABEL[m.kind], m.subtitle, (m.direction === "in" ? "" : "-") + m.amount.toFixed(2), m.statusLabel, m.reference ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob(["﻿" + [head, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `movimientos-increscendo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const opts: { value: Filter; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "membresia", label: "Membresía" },
    { value: "servicio", label: "Servicios" },
    ...(loanInvited ? [{ value: "prestamo" as Filter, label: "Préstamo" }] : []),
  ];
  const filtered = filter !== "all" || status !== "all" || !!from || !!to || !!q;

  return (
    <div className="mx-auto max-w-3xl lg:max-w-none">
      <PageHeader
        title="Movimientos"
        subtitle="Todos tus pagos en un solo lugar."
        action={
          rows.length > 0 && (
            <Btn variant="outline" size="sm" icon={<Download size={15} />} onClick={exportCsv}>
              <span className="hidden sm:inline">Descargar</span>
            </Btn>
          )
        }
      />

      {/* Resumen del periodo filtrado (escritorio) */}
      <div className="mb-4 hidden grid-cols-3 gap-4 lg:grid">
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600">
            <ArrowUpRight size={18} />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-500">Pagado {filtered ? "(filtro)" : "(total)"}</p>
            <p className="text-lg font-extrabold tabular-nums text-slate-900">{money(totals.out)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <ArrowDownLeft size={18} />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-500">Recibido {filtered ? "(filtro)" : "(total)"}</p>
            <p className="text-lg font-extrabold tabular-nums text-slate-900">{money(totals.inn)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
            <ReceiptText size={18} />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-500">Movimientos</p>
            <p className="text-lg font-extrabold tabular-nums text-slate-900">{rows.length}</p>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <div className="mb-4 space-y-3 lg:flex lg:flex-wrap lg:items-center lg:gap-3 lg:space-y-0">
        <div className="lg:w-[420px]">
          <Segmented<Filter> value={filter} onChange={setFilter} options={opts} />
        </div>
        <div className="hidden lg:block lg:w-52">
          <SelectInput value={status} onChange={(e) => setStatus(e.target.value as StatusF)} className="h-12">
            <option value="all">Todos los estatus</option>
            <option value="ok">Completados</option>
            <option value="pending">En proceso</option>
            <option value="failed">Fallidos</option>
          </SelectInput>
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" aria-label="Desde" />
          <span className="text-slate-400">–</span>
          <TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" aria-label="Hasta" />
        </div>
        <div className="lg:min-w-[220px] lg:flex-1">
          <TextInput icon={<Search />} placeholder="Buscar por concepto o referencia" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <Skel className="h-72 rounded-2xl" />
      ) : !rows.length ? (
        <Card>
          <Empty icon={<ReceiptText />} title={filtered ? "Sin resultados" : "Aún no hay movimientos"} text="Tus pagos aparecerán aquí." />
        </Card>
      ) : (
        <>
          {/* Escritorio: tabla */}
          <Card className="hidden overflow-hidden lg:block">
            <MovementsTable rows={pageRows} onRowClick={setSel} />
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
              <span>
                {page * PAGE + 1}–{Math.min(rows.length, (page + 1) * PAGE)} de {rows.length}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100 disabled:opacity-40" aria-label="Anterior">
                  <ChevronLeft size={18} />
                </button>
                <span className="px-2 font-semibold text-slate-700">
                  {page + 1} / {pages}
                </span>
                <button type="button" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100 disabled:opacity-40" aria-label="Siguiente">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </Card>

          {/* Móvil: lista por mes */}
          <div className="space-y-5 lg:hidden">
            {groups.map(([month, list]) => (
              <section key={month}>
                <p className="mb-2 px-1 text-[13px] font-bold text-slate-400">{month}</p>
                <Card className="divide-y divide-slate-100 overflow-hidden">
                  {list.map((m) => (
                    <MovementRow key={m.id} m={m} onClick={() => setSel(m)} />
                  ))}
                </Card>
              </section>
            ))}
          </div>
        </>
      )}
      <p className="mt-6 text-center text-xs text-slate-400">Los pagos de servicios y recargas también aparecen en el historial de la plataforma de Servicios.</p>

      <MovementDetail m={sel} onClose={() => setSel(null)} />
    </div>
  );
}
