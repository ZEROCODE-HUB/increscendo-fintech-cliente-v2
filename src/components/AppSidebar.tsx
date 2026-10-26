import { useState, useEffect } from "react";
import { Home, CreditCard, DollarSign, History, Users, Bell, LayoutDashboard, Cog, Wallet, User, Crown, LogOut, Tag, MoreHorizontal } from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import logoIcon from "@/assets/logo-icon.webp";
import logoSidebar from "@/assets/logo-sidebar.webp";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Solicitar Préstamo", url: "/prestamos/solicitar", icon: DollarSign },
  { title: "Mis Préstamos", url: "/my-loans", icon: CreditCard },
  { title: "Membresías", url: "/memberships", icon: Crown },
  { title: "Historial", url: "/history", icon: History },
  { title: "Métodos de Pago", url: "/payment-methods", icon: Wallet },
];

const adminItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Gestión Préstamos", url: "/admin/loans", icon: CreditCard },
  { title: "Gestión Clientes", url: "/admin/clients", icon: Users },
  { title: "Gestión Membresías", url: "/admin/memberships", icon: Crown },
  { title: "Gestión Cupones", url: "/admin/coupons", icon: Tag },
  { title: "Configuración", url: "/admin/config", icon: Cog },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const { user, signOut, userRole: authUserRole } = useAuth();
  const isCollapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = authUserRole?.toLowerCase() === 'admin';
  const isClient = authUserRole?.toLowerCase() === 'client';
  const showAdminMenu = isAdmin;
  const showClientMenu = isClient;
  const [showLoanOnboarding, setShowLoanOnboarding] = useState(false);
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('client');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();
    const channel = supabase
      .channel('unread-notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        fetchUnread();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // Cargar datos del localStorage primero, luego de la DB y sincronizar
  useEffect(() => {
    const loadUserData = async () => {
      // 1. Cargar primero del localStorage (rápido, para evitar parpadeo)
      try {
        const stored = localStorage.getItem('increscendo_user');
        if (stored) {
          const data = JSON.parse(stored);
          setUserFirstName(data.firstName || '');
          setUserLastName(data.lastName || '');
          setAvatarUrl(data.avatar || null);
          setUserRole(data.role || 'client');
        }
      } catch (e) { /* ignore */ }

      setIsLoaded(true);

      // 2. Si hay usuario logueado, cargar de la DB y actualizar localStorage
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('first_name, last_name, avatar_url, role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('[AppSidebar] failed to fetch user data', error);
          return;
        }

        if (data) {
          const newFirstName = data.first_name || '';
          const newLastName = data.last_name || '';
          const newAvatarUrl = data.avatar_url || null;
          const newRole = data.role || 'client';

          setUserFirstName(newFirstName);
          setUserLastName(newLastName);
          setAvatarUrl(newAvatarUrl);
          setUserRole(newRole);

          // 3. Sincronizar al localStorage
          try {
            const stored = localStorage.getItem('increscendo_user');
            const currentData = stored ? JSON.parse(stored) : {};
            const updated = {
              ...currentData,
              firstName: newFirstName,
              lastName: newLastName,
              avatar: newAvatarUrl,
              role: newRole,
            };
            localStorage.setItem('increscendo_user', JSON.stringify(updated));
          } catch (e) { /* ignore */ }
        }
      } catch (e) {
        console.warn('[AppSidebar] failed to load user data', e);
      }
    };

    loadUserData();
  }, [user?.id, refreshKey]);

  // Escuchar cambios en localStorage (para refrescar cuando se actualiza el perfil en otra página)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'increscendo_user' && e.newValue) {
        try {
          const userData = JSON.parse(e.newValue);
          setUserFirstName(userData.firstName || '');
          setUserLastName(userData.lastName || '');
          setAvatarUrl(userData.avatar || null);
          setUserRole(userData.role || 'client');
        } catch (err) {
          console.warn('[Sidebar] failed to parse user data from storage', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Función para refrescar los datos del usuario (llamar desde otros componentes)
  const refreshUserData = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Exponer refreshUserData globalmente para que MyAccount pueda llamarlo
  useEffect(() => {
    (window as any).refreshSidebarUserData = refreshUserData;
    return () => {
      delete (window as any).refreshSidebarUserData;
    };
  }, []);

  const isRouteActive = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(url + '/');
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) => {
    return isActive
      ? "bg-[#223f6c] text-white font-semibold"
      : "hover:bg-sidebar-accent/50";
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error during logout', err);
    }
    window.location.href = '/auth';
  };

  const getUserInitial = () => {
    if (userFirstName || userLastName) {
      return (userFirstName.charAt(0) + userLastName.charAt(0)).toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    if (userFirstName || userLastName) {
      return `${userFirstName} ${userLastName}`.trim();
    }
    return 'Usuario';
  };

  const handleMenuClick = (item: typeof menuItems[0], e: React.MouseEvent) => {
    if ((item as any).isOnboarding) {
      e.preventDefault();
      // Sin popup: el ítem navega directo a /prestamos/solicitar.
    }
  };

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        {/* User Profile - Top Section */}
        <div className="pl-4 py-5 border-b border-sidebar-border/50">
          {!isCollapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full group cursor-pointer focus:outline-none rounded-lg p-2 -m-2 transition-all hover:bg-sidebar-accent/30">
                  <Avatar className="h-12 w-12 ring-2 ring-success/40 ring-offset-2 ring-offset-sidebar-background transition-all group-hover:ring-success/60 group-hover:scale-105 flex-shrink-0">
                    <AvatarImage src={avatarUrl || user?.user_metadata?.avatar_url} alt={user?.email} className="object-cover" />
                    <AvatarFallback className="bg-success text-white text-lg font-bold">
                      {getUserInitial()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-base font-semibold text-sidebar-foreground truncate max-w-full transition-colors">
                      {getUserDisplayName()}
                    </span>
                    <span className="text-xs text-sidebar-foreground/60 capitalize">
                      {userRole?.toLowerCase() === 'admin' ? 'Administrador' : 'Cliente'}
                    </span>
                  </div>
                  <MoreHorizontal className="h-5 w-5 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70 transition-colors flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="w-48 bg-popover border border-border shadow-lg z-50">
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/mi-cuenta')}>
                  <User className="mr-2 h-4 w-4" />
                  Mi Cuenta
                </DropdownMenuItem>
                {!isAdmin && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/memberships')}>
                    <Crown className="mr-2 h-4 w-4" />
                    Mi Membresía
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {isCollapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center justify-center w-full gap-2 focus:outline-none hover:bg-sidebar-accent/30 rounded-lg py-2 -my-2 transition-all">
                  <Avatar className="h-10 w-10 ring-2 ring-success/40 ring-offset-1 ring-offset-sidebar-background hover:ring-success/60 transition-all cursor-pointer">
                    <AvatarImage src={avatarUrl || user?.user_metadata?.avatar_url} alt={user?.email} className="object-cover" />
                    <AvatarFallback className="bg-success text-white text-sm font-bold">
                      {getUserInitial()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-sidebar-foreground/60 capitalize">
                      {userRole?.toLowerCase() === 'admin' ? 'Admin' : 'Cliente'}
                    </span>
                    <MoreHorizontal className="h-4 w-4 text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-48 bg-popover border border-border shadow-lg z-50">
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/mi-cuenta')}>
                  <User className="mr-2 h-4 w-4" />
                  Mi Cuenta
                </DropdownMenuItem>
                {!isAdmin && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/memberships')}>
                    <Crown className="mr-2 h-4 w-4" />
                    Mi Membresía
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Client Menu - visible en rutas cliente o cuando no aplique menú admin */}
        {showClientMenu && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    return (
                      <SidebarMenuItem key={item.title}>
                        {(item as any).isOnboarding ? (
                          <button
                            onClick={(e) => { handleMenuClick(item, e); }}
                            className={`flex items-center gap-3 w-full px-3 py-3 md:py-2 rounded-md hover:bg-sidebar-accent/50`}
                          >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            {!isCollapsed && <span className="text-sm md:text-xs">{item.title}</span>}
                          </button>
                        ) : (
                          <NavLink to={item.url} end onClick={() => setOpenMobile(false)} className={({ isActive }) => {

                            return `flex items-center gap-3 w-full px-3 py-3 md:py-2 rounded-md ${getNavClass({ isActive })}`;
                          }}>
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            {!isCollapsed && <span className="text-sm md:text-xs">{item.title}</span>}
                          </NavLink>
                        )}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Notificaciones</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <NavLink to="/notifications" end onClick={() => setOpenMobile(false)} className={({ isActive }) => `flex items-center gap-3 w-full px-3 py-3 md:py-2 rounded-md ${getNavClass({ isActive })}`}>
                      <Bell className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="text-sm md:text-xs">Notificaciones</span>}
                      {unreadCount > 0 && location.pathname !== '/notifications' && <span className="ml-auto inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">{unreadCount}</span>}
                    </NavLink>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Admin Section - visible solo para admins */}
        {showAdminMenu && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <NavLink to={item.url} end onClick={() => setOpenMobile(false)} className={({ isActive }) => `flex items-center gap-3 w-full px-3 py-3 md:py-2 rounded-md ${getNavClass({ isActive })}`}>
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm md:text-xs">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Notificaciones</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <NavLink to="/notifications" end onClick={() => setOpenMobile(false)} className={({ isActive }) => `flex items-center gap-3 w-full px-3 py-3 md:py-2 rounded-md ${getNavClass({ isActive })}`}>
                      <Bell className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="text-sm md:text-xs">Notificaciones</span>}
                      {unreadCount > 0 && location.pathname !== '/notifications' && <span className="ml-auto inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">{unreadCount}</span>}
                    </NavLink>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Logo - Bottom Section */}
        <div className="mt-auto px-4 py-6 border-t border-sidebar-border/30">
          {!isCollapsed && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={logoSidebar}
                alt="Increscendo Fintech"
                className="h-14 w-auto brightness-0 invert"
              />
              <p className="text-xs font-medium text-white/80 tracking-wider uppercase">
                Fintech
              </p>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center">
              <img
                src={logoIcon}
                alt="Increscendo"
                className="h-8 w-8 rounded-full object-cover brightness-0 invert"
              />
            </div>
          )}
        </div>
      </SidebarContent>

    </Sidebar>
  );
}
