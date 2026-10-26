import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserPlus, MoreHorizontal, Edit, Trash2, Image, FileText, History, XCircle } from "lucide-react";
import { LoanTableFilters } from "@/components/admin/loans/LoanTableFilters";
import { Client, ClientMembership, ClientColumnConfig } from "@/types/clients";
import { clientsMockData, membershipsMockData, defaultClientColumns, defaultMembershipColumns } from "@/data/clientsMockData";
import { AddUserModal, ModifyClientModal, DeleteClientModal, ViewPhotoModal, ViewDocumentsModal } from "@/components/admin/clients/modals/ClientModals";
import { AddMembershipModal, ViewHistoryModal, ExpireMembershipModal } from "@/components/admin/clients/modals/MembershipModals";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ClientManagement = () => {
  const { toast } = useToast();
  // Data state
  const [clients, setClients] = useState<Client[]>([]);
  const [memberships, setMemberships] = useState<ClientMembership[]>([]);
  const [planOptions, setPlanOptions] = useState<{ id: string; name: string }[]>([]);
  const [loadingClients, setLoadingClients] = useState<boolean>(true);
  const [loadingMemberships, setLoadingMemberships] = useState<boolean>(true);
  const [clientPage, setClientPage] = useState<number>(1);
  const [clientPageSize, setClientPageSize] = useState<number>(10);
  const [clientTotal, setClientTotal] = useState<number>(0);
  
  // Column config
  const [clientColumns, setClientColumns] = useState(defaultClientColumns);
  const [membershipColumns, setMembershipColumns] = useState(defaultMembershipColumns);
  
  // Filter state
  const [clientSearch, setClientSearch] = useState("");
  const [clientSortOrder, setClientSortOrder] = useState("date-desc");
  
  const [membershipSearch, setMembershipSearch] = useState("");
  const [membershipSortOrder, setMembershipSortOrder] = useState("date-desc");
  
  // Modal state - Clients
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [modifyClientOpen, setModifyClientOpen] = useState(false);
  const [deleteClientOpen, setDeleteClientOpen] = useState(false);
  const [viewPhotoOpen, setViewPhotoOpen] = useState(false);
  const [viewDocumentsOpen, setViewDocumentsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Modal state - Memberships
  const [addMembershipOpen, setAddMembershipOpen] = useState(false);
  const [viewHistoryOpen, setViewHistoryOpen] = useState(false);
  const [expireMembershipOpen, setExpireMembershipOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<ClientMembership | null>(null);

  // Load clients, memberships and membership plans from DB
  useEffect(() => {
    const fetchData = async () => {
      setLoadingClients(true);
      setLoadingMemberships(true);
      try {
        const from = (clientPage - 1) * clientPageSize;
        const to = from + clientPageSize - 1;

        const [usersRes, userMembershipsRes, plansRes] = await Promise.all([
          supabase
            .from('users')
            .select('id, code, role, email, first_name, last_name, phone, address, birth_date, curp, ine_key, created_at, ine_front_url, ine_back_url, curp_url, avatar_url', { count: 'exact' })
            .eq('role', 'client')
            .order('created_at', { ascending: false })
            .range(from, to),
          supabase
            .from('user_memberships')
            .select('id, user_id, status, started_at, expires_at, created_at, membership_plans(name), users(first_name, last_name, ine_key)'),
          supabase
            .from('membership_plans')
            .select('id, name')
            .eq('active', true),
        ]);

        if (usersRes.error) throw usersRes.error;
        if (userMembershipsRes.error) throw userMembershipsRes.error;
        if (plansRes.error) throw plansRes.error;

        const users = usersRes.data ?? [];
        const userMemberships = userMembershipsRes.data ?? [];
        const plans = plansRes.data ?? [];

        setClientTotal(usersRes.count ?? 0);

        // Map membership by user for quick lookup in clients table
        type MembershipSummary = { membership: string; membershipStatus: string; rawStatus: string };
        const statusLabel = (s: string): string => {
          if (s === 'active') return 'Activa';
          if (s === 'expired') return 'Vencida';
          if (s === 'pending') return 'Pendiente';
          if (s === 'canceled') return 'Cancelada';
          return s;
        };
        const statusPriority = (s: string): number => {
          if (s === 'active') return 3;
          if (s === 'pending') return 2;
          if (s === 'expired') return 1;
          return 0;
        };

        const membershipByUser = new Map<string, MembershipSummary>();

        const mappedMemberships: ClientMembership[] = (userMemberships as any[]).map((m) => {
          const user = m.users || {};
          const plan = m.membership_plans || {};
          const rawStatus = m.status as string;
          const displayStatus = statusLabel(rawStatus);

          const current = membershipByUser.get(m.user_id as string);
          if (!current || statusPriority(rawStatus) > statusPriority(current.rawStatus)) {
            membershipByUser.set(m.user_id as string, {
              membership: plan.name ?? '',
              membershipStatus: displayStatus,
              rawStatus,
            });
          }

          return {
            id: m.id as string,
            clientId: m.user_id as string,
            firstName: user.first_name ?? '',
            lastName: user.last_name ?? '',
            ine: user.ine_key ?? '',
            membershipType: plan.name ?? '',
            activationDate: (m.started_at || m.created_at || '').slice(0, 10),
            expirationDate: (m.expires_at || '').slice(0, 10),
            renewalCount: 0,
            status: displayStatus,
            paymentHistory: [],
          };
        });

        // Fetch loan counts for each user
        const loansRes = await supabase
          .from('loans')
          .select('user_id, status', { count: 'exact' });

        if (loansRes.error) throw loansRes.error;

        const loans = loansRes.data ?? [];
        
        // Build a map of user_id -> { total, active }
        const loanCountsByUser = new Map<string, { total: number; active: number }>();
        loans.forEach((loan: any) => {
          const userId = loan.user_id as string;
          if (!loanCountsByUser.has(userId)) {
            loanCountsByUser.set(userId, { total: 0, active: 0 });
          }
          const counts = loanCountsByUser.get(userId)!;
          counts.total += 1;
          if (loan.status === 'active') {
            counts.active += 1;
          }
        });

        const mappedClients: Client[] = (users as any[]).map((u) => {
          const membership = membershipByUser.get(u.id as string);
          const loanCounts = loanCountsByUser.get(u.id as string) ?? { total: 0, active: 0 };
          return {
            id: u.id as string,
            code: u.code ?? '',
            role: u.role === 'admin' ? 'Admin' : 'Usuario',
            firstName: u.first_name ?? '',
            lastName: u.last_name ?? '',
            email: u.email ?? '',
            phone: u.phone ?? '',
            address: u.address ?? '',
            birthDate: u.birth_date ?? '',
            registrationDate: (u.created_at || '').slice(0, 10),
            ine: u.ine_key ?? '',
            curp: u.curp ?? '',
            photoUrl: u.avatar_url ?? undefined,
            ineFrontUrl: u.ine_front_url ?? undefined,
            ineBackUrl: u.ine_back_url ?? undefined,
            curpUrl: u.curp_url ?? undefined,
            membership: membership?.membership ?? '',
            membershipStatus: membership?.membershipStatus ?? 'Sin membresía',
            totalLoans: loanCounts.total,
            activeLoans: loanCounts.active,
          };
        });

        setClients(mappedClients);
        setMemberships(mappedMemberships);
        setPlanOptions(plans.map((p: any) => ({ id: p.id as string, name: p.name as string })));
      } catch (err) {
        console.error('[ClientManagement] Error loading clients/memberships', err);
      } finally {
        setLoadingClients(false);
        setLoadingMemberships(false);
      }
    };

    fetchData();
  }, [clientPage, clientPageSize]);

  // Filtered and sorted clients
  const filteredClients = useMemo(() => {
    let result = [...clients];
    if (clientSearch) {
      const search = clientSearch.toLowerCase();
      result = result.filter(c => 
        c.firstName.toLowerCase().includes(search) ||
        c.lastName.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        (c.code || '').toLowerCase().includes(search) ||
        c.id.toLowerCase().includes(search)
      );
    }
    // Parse sort order
    const [field, order] = clientSortOrder.split("-");
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      if (field === "date") {
        aVal = a.registrationDate;
        bVal = b.registrationDate;
      } else if (field === "name") {
        aVal = a.firstName;
        bVal = b.firstName;
      } else {
        aVal = a[field as keyof Client] || "";
        bVal = b[field as keyof Client] || "";
      }
      if (order === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
    return result;
  }, [clients, clientSearch, clientSortOrder]);

  // Filtered and sorted memberships
  const filteredMemberships = useMemo(() => {
    let result = [...memberships];
    if (membershipSearch) {
      const search = membershipSearch.toLowerCase();
      result = result.filter(m => 
        m.firstName.toLowerCase().includes(search) ||
        m.lastName.toLowerCase().includes(search) ||
        m.ine.toLowerCase().includes(search)
      );
    }
    const [field, order] = membershipSortOrder.split("-");
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      if (field === "date") {
        aVal = a.activationDate;
        bVal = b.activationDate;
      } else if (field === "name") {
        aVal = a.firstName;
        bVal = b.firstName;
      } else {
        aVal = a[field as keyof ClientMembership] || "";
        bVal = b[field as keyof ClientMembership] || "";
      }
      if (order === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
    return result;
  }, [memberships, membershipSearch, membershipSortOrder]);

  const handleExportClients = async () => {
    try {
      const XLSX = await import("xlsx");

      // Build query for all matching clients (ignoring pagination but respecting search & sort)
      let query = supabase
        .from("users")
        .select(
          "id, code, role, email, first_name, last_name, phone, address, birth_date, curp, ine_key, created_at, ine_front_url, ine_back_url, curp_url",
        )
        .eq("role", "client");

      if (clientSearch) {
        const search = clientSearch.trim();
        if (search) {
          query = query.or(
            `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,code.ilike.%${search}%,id.ilike.%${search}%`,
          );
        }
      }

      const [field, order] = clientSortOrder.split("-");
      if (field === "date") {
        query = query.order("created_at", { ascending: order === "asc" });
      } else if (field === "name") {
        query = query.order("first_name", { ascending: order === "asc" });
      }

      const { data, error } = await query;
      if (error) throw error;

      const users = (data ?? []) as any[];

      // Build membership summary per user from current memberships state
      const membershipSummary = new Map<
        string,
        { membership: string; membershipStatus: string; priority: number }
      >();
      const statusRank = (status: string): number => {
        if (status === "Activa" || status === "Activo") return 3;
        if (status === "Pendiente") return 2;
        if (status === "Vencida") return 1;
        return 0;
      };

      memberships.forEach((m) => {
        const current = membershipSummary.get(m.clientId);
        const rank = statusRank(m.status);
        if (!current || rank > current.priority) {
          membershipSummary.set(m.clientId, {
            membership: m.membershipType,
            membershipStatus: m.status,
            priority: rank,
          });
        }
      });

      const allClients: Client[] = users.map((u) => {
        const membership = membershipSummary.get(u.id as string);
        return {
          id: u.id as string,
          code: u.code ?? "",
          role: u.role === "admin" ? "Admin" : "Usuario",
          firstName: u.first_name ?? "",
          lastName: u.last_name ?? "",
          email: u.email ?? "",
          phone: u.phone ?? "",
          address: u.address ?? "",
          birthDate: u.birth_date ?? "",
          registrationDate: (u.created_at || "").slice(0, 10),
          ine: u.ine_key ?? "",
          curp: u.curp ?? "",
          membership: membership?.membership ?? "",
          membershipStatus: membership?.membershipStatus ?? "Sin membresía",
          totalLoans: 0,
          activeLoans: 0,
        };
      });

      const visibleColumns = clientColumns.filter((c) => c.visible);
      const rows = allClients.map((client) => {
        const row: Record<string, any> = {};
        visibleColumns.forEach((col) => {
          let value: any = "";
          switch (col.key) {
            case "id":
              value = client.code || String(client.id).split("-")[0];
              break;
            case "loans":
              value = `Total: ${client.totalLoans}, Activos: ${client.activeLoans}`;
              break;
            default:
              value = (client as any)[col.key];
          }
          row[col.label] = value;
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
      XLSX.writeFile(workbook, "clientes.xlsx");
    } catch (err) {
      console.error("[ClientManagement] Error exporting clients", err);
    }
  };

  const handleExportMemberships = async () => {
    try {
      const XLSX = await import("xlsx");

      const visibleColumns = membershipColumns.filter((c) => c.visible);
      const rows = filteredMemberships.map((m) => {
        const row: Record<string, any> = {};
        visibleColumns.forEach((col) => {
          let value: any = "";
          switch (col.key) {
            default:
              value = (m as any)[col.key];
          }
          row[col.label] = value;
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Membresias");
      XLSX.writeFile(workbook, "membresias.xlsx");
    } catch (err) {
      console.error("[ClientManagement] Error exporting memberships", err);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Activa" || status === "Activo") {
      return <Badge className="bg-success/20 text-success border-success">{status}</Badge>;
    }
    if (status === "Vencida") {
      return <Badge className="bg-danger/20 text-danger border-danger">{status}</Badge>;
    }
    return <Badge className="bg-muted text-muted-foreground border-muted-foreground">{status}</Badge>;
  };

  const getMembershipBadge = (type: string) => {
    const colors: Record<string, string> = {
      "Premier": "border-primary text-primary bg-primary/10",
      "Premium": "border-accent-foreground text-accent-foreground bg-accent/50",
      "Básico": "border-muted-foreground text-muted-foreground",
    };
    return <Badge variant="outline" className={colors[type] || ""}>{type}</Badge>;
  };

  const isColumnVisible = (columns: typeof defaultClientColumns, key: string) => 
    columns.find(c => c.key === key)?.visible ?? false;

  return (
    <>
      <div className="p-4 sm:p-6 md:px-6 lg:p-8 space-y-4 sm:space-y-6">
        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="memberships">Membresías</TabsTrigger>
          </TabsList>

              {/* Clients Tab */}
              <TabsContent value="clients" className="mt-6">
                <Card className="shadow-soft">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-base sm:text-lg">Base de Datos de Clientes</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Información completa de todos los usuarios registrados</CardDescription>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button onClick={() => setAddUserOpen(true)} className="text-sm">
                          <UserPlus className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Agregar Usuario</span>
                          <span className="sm:hidden">Agregar</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <LoanTableFilters
                      searchTerm={clientSearch}
                      onSearchChange={setClientSearch}
                      searchPlaceholder="Buscar por nombre, email, ID..."
                      sortOrder={clientSortOrder}
                      onSortChange={setClientSortOrder}
                      sortOptions={[
                        { value: "date-desc", label: "F. Reg. (más reciente)" },
                        { value: "date-asc", label: "F. Reg. (más antigua)" },
                        { value: "name-asc", label: "Nombre (A-Z)" },
                        { value: "name-desc", label: "Nombre (Z-A)" },
                      ]}
                      columns={clientColumns}
                      onColumnsChange={setClientColumns}
                      showExport
                      onExport={handleExportClients}
                    />
                    
                    <div className="overflow-x-auto border rounded-lg -mx-4 sm:mx-0">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            {isColumnVisible(clientColumns, "id") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">ID</TableHead>}
                            {isColumnVisible(clientColumns, "role") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">Rol</TableHead>}
                            {isColumnVisible(clientColumns, "firstName") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">Nombres</TableHead>}
                            {isColumnVisible(clientColumns, "lastName") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">Apellidos</TableHead>}
                            {isColumnVisible(clientColumns, "email") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">Email</TableHead>}
                            {isColumnVisible(clientColumns, "phone") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">Teléfono</TableHead>}
                            {isColumnVisible(clientColumns, "address") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">Dirección</TableHead>}
                            {isColumnVisible(clientColumns, "birthDate") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">F. Nac.</TableHead>}
                            {isColumnVisible(clientColumns, "registrationDate") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">F. Reg.</TableHead>}
                            {isColumnVisible(clientColumns, "ine") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">INE</TableHead>}
                            {isColumnVisible(clientColumns, "curp") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">CURP</TableHead>}
                            {isColumnVisible(clientColumns, "membership") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">Membresía</TableHead>}
                            {isColumnVisible(clientColumns, "membershipStatus") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">Est. Memb.</TableHead>}
                            {isColumnVisible(clientColumns, "loans") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">Préstamos</TableHead>}
                            <TableHead className="text-xs sm:text-sm whitespace-nowrap">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingClients && (
                            Array.from({ length: clientPageSize }).map((_, index) => (
                              <TableRow key={`skeleton-${index}`}>
                                {isColumnVisible(clientColumns, "id") && (
                                  <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                  </TableCell>
                                )}
                                {isColumnVisible(clientColumns, "role") && (
                                  <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                  </TableCell>
                                )}
                                {isColumnVisible(clientColumns, "firstName") && (
                                  <TableCell>
                                    <Skeleton className="h-4 w-24" />
                                  </TableCell>
                                )}
                                {isColumnVisible(clientColumns, "lastName") && (
                                  <TableCell>
                                    <Skeleton className="h-4 w-24" />
                                  </TableCell>
                                )}
                                {isColumnVisible(clientColumns, "email") && (
                                  <TableCell>
                                    <Skeleton className="h-4 w-36" />
                                  </TableCell>
                                )}
                                {isColumnVisible(clientColumns, "phone") && (
                                  <TableCell>
                                    <Skeleton className="h-4 w-24" />
                                  </TableCell>
                                )}
                                {isColumnVisible(clientColumns, "address") && (
                                  <TableCell>
                                    <Skeleton className="h-4 w-40" />
                                  </TableCell>
                                )}
                                {isColumnVisible(clientColumns, "birthDate") && (
                                  <TableCell>
                                    <Skeleton className="h-4 w-20" />
                                  </TableCell>
                                )}
                                {isColumnVisible(clientColumns, "registrationDate") && (
                                  <TableCell>
                                    <Skeleton className="h-4 w-20" />
                                  </TableCell>
                                )}
                                {isColumnVisible(clientColumns, "ine") && (
                                  <TableCell>
                                    <Skeleton className="h-4 w-24" />
                                  </TableCell>
                                )}
                                {isColumnVisible(clientColumns, "curp") && (
                                  <TableCell>
                                    <Skeleton className="h-4 w-24" />
                                  </TableCell>
                                )}
                                {isColumnVisible(clientColumns, "membership") && (
                                  <TableCell>
                                    <Skeleton className="h-4 w-24" />
                                  </TableCell>
                                )}
                                {isColumnVisible(clientColumns, "membershipStatus") && (
                                  <TableCell>
                                    <Skeleton className="h-4 w-20" />
                                  </TableCell>
                                )}
                                {isColumnVisible(clientColumns, "loans") && (
                                  <TableCell>
                                    <Skeleton className="h-10 w-20" />
                                  </TableCell>
                                )}
                                <TableCell>
                                  <Skeleton className="h-8 w-8" />
                                </TableCell>
                              </TableRow>
                            ))
                          )}

                          {!loadingClients && filteredClients.map((client) => (
                            <TableRow key={client.id}>
                              {isColumnVisible(clientColumns, "id") && (
                                <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">
                                  {client.code || String(client.id).split("-")[0]}
                                </TableCell>
                              )}
                              {isColumnVisible(clientColumns, "role") && <TableCell className="text-xs sm:text-sm"><Badge variant="outline" className="text-xs">{client.role}</Badge></TableCell>}
                              {isColumnVisible(clientColumns, "firstName") && <TableCell className="font-semibold text-xs sm:text-sm">{client.firstName}</TableCell>}
                              {isColumnVisible(clientColumns, "lastName") && <TableCell className="text-xs sm:text-sm">{client.lastName}</TableCell>}
                              {isColumnVisible(clientColumns, "email") && <TableCell className="text-xs sm:text-sm truncate">{client.email}</TableCell>}
                              {isColumnVisible(clientColumns, "phone") && <TableCell className="text-xs sm:text-sm whitespace-nowrap">{client.phone}</TableCell>}
                              {isColumnVisible(clientColumns, "address") && <TableCell className="max-w-[100px] sm:max-w-[150px] truncate text-xs sm:text-sm">{client.address}</TableCell>}
                              {isColumnVisible(clientColumns, "birthDate") && <TableCell className="text-xs sm:text-sm whitespace-nowrap">{client.birthDate}</TableCell>}
                              {isColumnVisible(clientColumns, "registrationDate") && <TableCell className="text-xs sm:text-sm whitespace-nowrap">{client.registrationDate}</TableCell>}
                              {isColumnVisible(clientColumns, "ine") && <TableCell className="font-mono text-xs">{client.ine}</TableCell>}
                              {isColumnVisible(clientColumns, "curp") && <TableCell className="font-mono text-xs">{client.curp}</TableCell>}
                              {isColumnVisible(clientColumns, "membership") && <TableCell className="text-xs sm:text-sm">{getMembershipBadge(client.membership)}</TableCell>}
                              {isColumnVisible(clientColumns, "membershipStatus") && <TableCell className="text-xs sm:text-sm">{getStatusBadge(client.membershipStatus)}</TableCell>}
                              {isColumnVisible(clientColumns, "loans") && (
                                <TableCell className="text-xs sm:text-sm">
                                  <div>
                                    <p>Total: {client.totalLoans}</p>
                                    <p className="text-muted-foreground text-xs">Activos: {client.activeLoans}</p>
                                  </div>
                                </TableCell>
                              )}
                              <TableCell className="text-xs sm:text-sm">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setSelectedClient(client); setModifyClientOpen(true); }}>
                                      <Edit className="h-4 w-4 mr-2" /> Modificar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setSelectedClient(client); setDeleteClientOpen(true); }}>
                                      <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setSelectedClient(client); setViewPhotoOpen(true); }}>
                                      <Image className="h-4 w-4 mr-2" /> Ver Foto
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setSelectedClient(client); setViewDocumentsOpen(true); }}>
                                      <FileText className="h-4 w-4 mr-2" /> Ver Documentos
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination & page size */}
                    <div className="flex flex-col gap-6 mt-6 pt-4 border-t">
                      {/* Page size selector and info */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <span className="hidden sm:inline">Mostrar</span>
                          <Select
                            value={String(clientPageSize)}
                            onValueChange={(value) => {
                              setClientPageSize(Number(value));
                              setClientPage(1);
                            }}
                          >
                            <SelectTrigger className="w-16 sm:w-20 h-8 text-xs sm:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-xs sm:text-sm">por página</span>
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-foreground bg-secondary/50 px-3 py-1.5 rounded-md">
                          {clientTotal > 0
                            ? `${(clientPage - 1) * clientPageSize + 1}-${
                                (clientPage - 1) * clientPageSize + filteredClients.length
                              } de ${clientTotal}`
                            : "Sin clientes"}
                        </div>
                      </div>

                      {/* Pagination controls */}
                      {clientTotal > 0 && (
                        <div className="flex justify-center sm:justify-end">
                          <Pagination>
                            <PaginationContent className="gap-0 sm:gap-1">
                              <PaginationItem>
                                <PaginationPrevious
                                  href="#"
                                  className={`text-xs sm:text-sm ${clientPage === 1 ? "pointer-events-none opacity-50" : "hover:bg-secondary transition-colors"}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (clientPage > 1) setClientPage(clientPage - 1);
                                  }}
                                />
                              </PaginationItem>

                              {Array.from({ length: Math.max(1, Math.ceil(clientTotal / clientPageSize)) }).map(
                                (_, index) => {
                                  const page = index + 1;
                                  const totalPages = Math.max(1, Math.ceil(clientTotal / clientPageSize));

                                  // Mostrar siempre primera, última, actual y vecinas, con puntos suspensivos
                                  if (
                                    page === 1 ||
                                    page === totalPages ||
                                    Math.abs(page - clientPage) <= 1
                                  ) {
                                    return (
                                      <PaginationItem key={page}>
                                        <PaginationLink
                                          href="#"
                                          isActive={page === clientPage}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            setClientPage(page);
                                          }}
                                          className="text-xs sm:text-sm h-8 w-8"
                                        >
                                          {page}
                                        </PaginationLink>
                                      </PaginationItem>
                                    );
                                  }

                                  // Insertar elipsis una sola vez entre bloques
                                  if (page === 2 && clientPage > 3) {
                                    return (
                                      <PaginationItem key="start-ellipsis">
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    );
                                  }
                                  if (page === totalPages - 1 && clientPage < totalPages - 2) {
                                    return (
                                      <PaginationItem key="end-ellipsis">
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    );
                                  }

                                  return null;
                                },
                              )}

                              <PaginationItem>
                                <PaginationNext
                                  href="#"
                                  className={`text-xs sm:text-sm ${
                                    clientPage >= Math.max(1, Math.ceil(clientTotal / clientPageSize))
                                      ? "pointer-events-none opacity-50"
                                      : "hover:bg-secondary transition-colors"
                                  }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const totalPages = Math.max(1, Math.ceil(clientTotal / clientPageSize));
                                    if (clientPage < totalPages) setClientPage(clientPage + 1);
                                  }}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Memberships Tab */}
              <TabsContent value="memberships" className="mt-6">
                <Card className="shadow-soft">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg sm:text-xl">Gestión de Membresías</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Administra las suscripciones de los clientes</CardDescription>
                      </div>
                      <Button onClick={() => setAddMembershipOpen(true)} className="text-sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Agregar Membresía</span>
                        <span className="sm:hidden">Agregar</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <LoanTableFilters
                      searchTerm={membershipSearch}
                      onSearchChange={setMembershipSearch}
                      searchPlaceholder="Buscar por nombre, INE..."
                      sortOrder={membershipSortOrder}
                      onSortChange={setMembershipSortOrder}
                      sortOptions={[
                        { value: "date-desc", label: "F. Activ. (más reciente)" },
                        { value: "date-asc", label: "F. Activ. (más antigua)" },
                        { value: "name-asc", label: "Nombre (A-Z)" },
                        { value: "name-desc", label: "Nombre (Z-A)" },
                      ]}
                      columns={membershipColumns}
                      onColumnsChange={setMembershipColumns}
                      showExport
                      onExport={handleExportMemberships}
                    />
                    
                    <div className="overflow-x-auto border rounded-lg -mx-4 sm:mx-0">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            {isColumnVisible(membershipColumns, "firstName") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">Nombre</TableHead>}
                            {isColumnVisible(membershipColumns, "lastName") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">Apellidos</TableHead>}
                            {isColumnVisible(membershipColumns, "ine") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">INE</TableHead>}
                            {isColumnVisible(membershipColumns, "membershipType") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">Membresía</TableHead>}
                            {isColumnVisible(membershipColumns, "activationDate") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">F. Activación</TableHead>}
                            {isColumnVisible(membershipColumns, "expirationDate") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">F. Expiración</TableHead>}
                            {isColumnVisible(membershipColumns, "renewalCount") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">Conteo Renov.</TableHead>}
                            {isColumnVisible(membershipColumns, "status") && <TableHead className="text-xs sm:text-sm whitespace-nowrap">Estado</TableHead>}
                            <TableHead className="text-xs sm:text-sm whitespace-nowrap">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {!loadingMemberships && filteredMemberships.map((membership) => (
                            <TableRow key={membership.id}>
                              {isColumnVisible(membershipColumns, "firstName") && <TableCell className="font-semibold text-xs sm:text-sm">{membership.firstName}</TableCell>}
                              {isColumnVisible(membershipColumns, "lastName") && <TableCell className="text-xs sm:text-sm">{membership.lastName}</TableCell>}
                              {isColumnVisible(membershipColumns, "ine") && <TableCell className="font-mono text-xs">{membership.ine}</TableCell>}
                              {isColumnVisible(membershipColumns, "membershipType") && <TableCell className="text-xs sm:text-sm">{getMembershipBadge(membership.membershipType)}</TableCell>}
                              {isColumnVisible(membershipColumns, "activationDate") && <TableCell className="text-xs sm:text-sm">{membership.activationDate}</TableCell>}
                              {isColumnVisible(membershipColumns, "expirationDate") && <TableCell className="text-xs sm:text-sm">{membership.expirationDate}</TableCell>}
                              {isColumnVisible(membershipColumns, "renewalCount") && <TableCell className="text-center text-xs sm:text-sm">{membership.renewalCount}</TableCell>}
                              {isColumnVisible(membershipColumns, "status") && <TableCell className="text-xs sm:text-sm">{getStatusBadge(membership.status)}</TableCell>}
                              <TableCell className="text-xs sm:text-sm">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setSelectedMembership(membership); setViewHistoryOpen(true); }}>
                                      <History className="h-4 w-4 mr-2" /> Ver Historial
                                    </DropdownMenuItem>
                                    {membership.status === "Activa" && (
                                      <DropdownMenuItem onClick={() => { setSelectedMembership(membership); setExpireMembershipOpen(true); }}>
                                        <XCircle className="h-4 w-4 mr-2" /> Vencer
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Client Modals */}
          <AddUserModal
          open={addUserOpen}
          onOpenChange={setAddUserOpen}
          onConfirm={async (data) => {
            try {
              const payload: any = {
                email: data.email,
                password: (data as any).password || undefined,
                first_name: data.firstName,
                last_name: data.lastName,
                phone: data.phone,
                address: data.address,
                birth_date: data.birthDate || null,
                curp: data.curp,
                ine_key: data.ine,
                role: data.role?.toLowerCase() === 'admin' ? 'admin' : 'client',
              };

              // Preferir usar supabase.functions.invoke si está disponible
              let fnResponse: any = null;
              try {
                // Ensure the caller is authenticated: supabase.functions.invoke will send the
                // Authorization header (user access token) automatically only if a session exists.
                const { data: sessionData } = await supabase.auth.getSession();
                const session = (sessionData as any)?.session;
                if (!session) {
                  throw new Error('Usuario no autenticado. Inicia sesión antes de crear usuarios.');
                }

                const { data: fnData, error: fnError } = await supabase.functions.invoke('create-user', {
                  body: payload,
                });

                if (fnError) {
                  // Attach more context to the thrown error for easier debugging
                  const enriched = new Error(`Edge function error: ${fnError.message || String(fnError)}`);
                  (enriched as any).original = fnError;
                  throw enriched;
                }

                fnResponse = fnData;
              } catch (fnErr) {
                console.error('[ClientManagement] Edge function error', fnErr);
                throw fnErr;
              }

              if (fnResponse?.error) {
                throw new Error(fnResponse.error);
              }

              const profileRow = fnResponse.profile || fnResponse.user || (fnResponse.data && fnResponse.data.profile) || {};
              const userId = profileRow.id || (fnResponse.user && fnResponse.user.id) || '';

              const row: any = profileRow || {};

              const newClient: Client = {
                id: (row.id as string) || userId || `local-${Date.now()}`,
                code: row.code ?? '',
                role: (row.role === 'admin' ? 'Admin' : 'Usuario') || (payload.role === 'admin' ? 'Admin' : 'Usuario'),
                firstName: row.first_name ?? (data.firstName || ''),
                lastName: row.last_name ?? (data.lastName || ''),
                email: row.email ?? (data.email || ''),
                phone: row.phone ?? (data.phone || ''),
                address: row.address ?? (data.address || ''),
                birthDate: row.birth_date ?? (data.birthDate || ''),
                registrationDate: (row.created_at || new Date().toISOString()).slice(0, 10),
                ine: row.ine_key ?? (data.ine || ''),
                curp: row.curp ?? (data.curp || ''),
                photoUrl: undefined,
                ineFrontUrl: undefined,
                ineBackUrl: undefined,
                curpUrl: undefined,
                membership: '',
                membershipStatus: 'Sin membresía',
                totalLoans: 0,
                activeLoans: 0,
              };

              setClients((prev) => [newClient, ...prev]);
            } catch (err) {
              console.error('[ClientManagement] Error creating client from admin', err);
              throw err;
            }
          }}
        />
        <ModifyClientModal 
          open={modifyClientOpen} 
          onOpenChange={setModifyClientOpen} 
          client={selectedClient}
          plans={planOptions}
          onConfirm={async (updated) => {
            try {
              const existing = clients.find((c) => c.id === updated.id);
              const payload: any = {
                first_name: updated.firstName,
                last_name: updated.lastName,
                email: updated.email,
                phone: updated.phone,
                address: updated.address,
                birth_date: updated.birthDate || null,
                ine_key: updated.ine,
                curp: updated.curp,
                role: updated.role?.toLowerCase() === "admin" ? "admin" : "client",
              };

              const { data, error } = await supabase
                .from("users")
                .update(payload)
                .eq("id", updated.id)
                .select(
                  "id, role, email, first_name, last_name, phone, address, birth_date, curp, ine_key, created_at",
                )
                .single();

              if (error) throw error;

              const newClient: Client = {
                id: data.id as string,
                code: (data as any).code ?? existing?.code ?? '',
                role: data.role === "admin" ? "Admin" : "Usuario",
                firstName: data.first_name ?? "",
                lastName: data.last_name ?? "",
                email: data.email ?? "",
                phone: data.phone ?? "",
                address: data.address ?? "",
                birthDate: data.birth_date ?? "",
                registrationDate: (data.created_at || "").slice(0, 10),
                ine: data.ine_key ?? "",
                curp: data.curp ?? "",
                photoUrl: existing?.photoUrl,
                ineFrontUrl: (data as any).ine_front_url ?? existing?.ineFrontUrl,
                ineBackUrl: (data as any).ine_back_url ?? existing?.ineBackUrl,
                curpUrl: (data as any).curp_url ?? existing?.curpUrl,
                membership: existing?.membership ?? "",
                membershipStatus: existing?.membershipStatus ?? "Sin membresía",
                totalLoans: existing?.totalLoans ?? 0,
                activeLoans: existing?.activeLoans ?? 0,
              };

              setClients(clients.map((c) => (c.id === newClient.id ? newClient : c)));
            } catch (err) {
              console.error("[ClientManagement] Error updating client", err);
            }
          }}
        />
        <DeleteClientModal 
          open={deleteClientOpen} 
          onOpenChange={setDeleteClientOpen} 
          client={selectedClient}
          onConfirm={async () => {
            if (!selectedClient) return;
            try {
              const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({ user_id: selectedClient.id }),
              });
              const result = await resp.json();
              if (!resp.ok) throw new Error(result.error || 'Error al eliminar usuario');
              setClients(clients.filter(c => c.id !== selectedClient.id));
              toast({ title: 'Usuario eliminado', description: `${selectedClient.firstName} ${selectedClient.lastName} fue eliminado del sistema.` });
            } catch (err) {
              console.error('[ClientManagement] Error deleting client', err);
              toast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo eliminar el usuario', variant: 'destructive' });
            }
          }}
        />
        <ViewPhotoModal 
          open={viewPhotoOpen} 
          onOpenChange={setViewPhotoOpen} 
          client={selectedClient}
        />
        <ViewDocumentsModal 
          open={viewDocumentsOpen} 
          onOpenChange={setViewDocumentsOpen} 
          client={selectedClient}
        />

        {/* Membership Modals */}
        <AddMembershipModal 
          open={addMembershipOpen} 
          onOpenChange={setAddMembershipOpen}
          clients={clients}
          plans={planOptions}
          onConfirm={async (data) => {
            try {
              const activation = new Date(data.activationDate);
              const expires = new Date(activation);
              expires.setFullYear(expires.getFullYear() + 1);

              const { error } = await supabase.from('user_memberships').insert({
                user_id: data.clientId,
                membership_plan_id: data.membershipPlanId,
                status: 'active',
                started_at: activation.toISOString(),
                expires_at: expires.toISOString(),
              });
              if (error) throw error;

              const client = clients.find((c) => c.id === data.clientId);
              const plan = planOptions.find((p) => p.id === data.membershipPlanId);
              if (client && plan) {
                const newMembership: ClientMembership = {
                  id: `local-${Date.now()}`,
                  clientId: client.id,
                  firstName: client.firstName,
                  lastName: client.lastName,
                  ine: client.ine,
                  membershipType: plan.name,
                  activationDate: data.activationDate,
                  expirationDate: expires.toISOString().slice(0, 10),
                  renewalCount: 0,
                  status: 'Activa',
                  paymentHistory: [],
                };
                setMemberships((prev) => [newMembership, ...prev]);
                setClients((prev) => prev.map((c) => c.id === client.id ? { ...c, membership: plan.name, membershipStatus: 'Activa' } : c));
              }
            } catch (err) {
              console.error('[ClientManagement] Error creating membership', err);
            }
          }}
        />
        <ViewHistoryModal 
          open={viewHistoryOpen} 
          onOpenChange={setViewHistoryOpen} 
          membership={selectedMembership}
        />
        <ExpireMembershipModal 
          open={expireMembershipOpen} 
          onOpenChange={setExpireMembershipOpen} 
          membership={selectedMembership}
          onConfirm={async () => {
            if (!selectedMembership) return;
            try {
              const { error } = await supabase
                .from('user_memberships')
                .update({ status: 'expired' })
                .eq('id', selectedMembership.id);
              if (error) throw error;

              setMemberships((prev) => prev.map((m) => 
                m.id === selectedMembership.id ? { ...m, status: 'Vencida' } : m
              ));
              setClients((prev) => prev.map((c) => 
                c.id === selectedMembership.clientId ? { ...c, membershipStatus: 'Vencida' } : c
              ));
            } catch (err) {
              console.error('[ClientManagement] Error expiring membership', err);
            }
          }}
        />
      </>
    );
  };

  export default ClientManagement;
