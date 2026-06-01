import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  PieChart,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Percent,
  ListFilter,
  Wallet,
  Settings,
  LogOut,
  ChevronDown,
  X,
  FileText,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Categoria {
  id: number;
  nombre: string;
  limite_mensual: number;
}

interface Transaccion {
  id: number;
  categoria_id: number | null;
  monto: number;
  descripcion: string;
  metodo_pago: 'Nequi' | 'Tarjeta Crédito' | 'Tarjeta Débito' | 'Efectivo';
  tipo: 'Ingreso' | 'Gasto';
  fecha_transaccion: string;
  categoria?: { nombre: string };
}

export default function Reportes() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const [transactions, setTransactions] = useState<Transaccion[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);

  // Filters
  const [filterPeriodo, setFilterPeriodo] = useState<'todos' | 'mes' | 'año'>('todos');
  const [filterMetodo, setFilterMetodo] = useState<string>('todos');

  // Sidebar Toggles
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('fa_sidebar_collapsed') === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Custom User Profile Name State
  const [customName, setCustomName] = useState('');
  const [tempName, setTempName] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    checkUserAndLoad();
  }, []);

  const checkUserAndLoad = async () => {
    const isSupabaseConfigured =
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      setUsingFallback(true);
      const demoUser = { email: 'jenny.mo@finanzasapp.com', id: 'demo-user-id' };
      setUser(demoUser);
      initializeDisplayName(demoUser.email);
      loadLocalData();
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      initializeDisplayName(user.email || 'jenny.mo@finanzasapp.com');
      await loadDbData(user.id);
    } catch (err) {
      console.error('Failed connection to database, using local', err);
      setUsingFallback(true);
      const offlineUser = { email: 'usuario.local@finanzasapp.com', id: 'local-user-id' };
      setUser(offlineUser);
      initializeDisplayName(offlineUser.email);
      loadLocalData();
    }
  };

  const initializeDisplayName = (email: string) => {
    const cached = localStorage.getItem('fa_custom_name');
    if (cached) {
      setCustomName(cached);
      setTempName(cached);
    } else {
      const parsed = email
        .split('@')[0]
        .split(/[._-]/)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      setCustomName(parsed);
      setTempName(parsed);
      localStorage.setItem('fa_custom_name', parsed);
    }
  };

  const saveDisplayName = () => {
    if (tempName.trim()) {
      setCustomName(tempName);
      localStorage.setItem('fa_custom_name', tempName);
      setShowSettingsModal(false);
    }
  };

  const loadLocalData = () => {
    const cachedCats = localStorage.getItem('fa_categories');
    const cachedTrans = localStorage.getItem('fa_transactions');

    if (cachedCats) setCategories(JSON.parse(cachedCats));
    if (cachedTrans) setTransactions(JSON.parse(cachedTrans));
    setLoading(false);
  };

  const loadDbData = async (userId: string) => {
    try {
      const { data: cats } = await supabase
        .from('categorias_presupuesto')
        .select('*')
        .eq('usuario_id', userId);
      
      setCategories(cats || []);

      const { data: trans } = await supabase
        .from('transacciones')
        .select(`
          id,
          categoria_id,
          monto,
          descripcion,
          metodo_pago,
          tipo,
          fecha_transaccion,
          categorias_presupuesto ( nombre )
        `)
        .eq('usuario_id', userId)
        .order('fecha_transaccion', { ascending: false });

      const mappedTrans: Transaccion[] = (trans || []).map((t: any) => ({
        id: t.id,
        categoria_id: t.categoria_id,
        monto: Number(t.monto),
        descripcion: t.descripcion,
        metodo_pago: t.metodo_pago,
        tipo: t.tipo,
        fecha_transaccion: t.fecha_transaccion,
        categoria: t.categorias_presupuesto ? { nombre: t.categorias_presupuesto.nombre } : undefined
      }));

      setTransactions(mappedTrans);
    } catch (err) {
      console.error(err);
      setUsingFallback(true);
      loadLocalData();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!usingFallback) {
      await supabase.auth.signOut();
    }
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      localStorage.setItem('fa_sidebar_collapsed', String(!prev));
      return !prev;
    });
  };

  // Date check utilities
  const isCurrentMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const isCurrentYear = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear();
  };

  // Filter calculations
  const filteredTransactions = transactions.filter(tx => {
    if (filterPeriodo === 'mes' && !isCurrentMonth(tx.fecha_transaccion)) return false;
    if (filterPeriodo === 'año' && !isCurrentYear(tx.fecha_transaccion)) return false;
    if (filterMetodo !== 'todos' && tx.metodo_pago !== filterMetodo) return false;
    return true;
  });

  const totalIngresos = filteredTransactions
    .filter(t => t.tipo === 'Ingreso')
    .reduce((sum, t) => sum + t.monto, 0);

  const totalGastos = filteredTransactions
    .filter(t => t.tipo === 'Gasto')
    .reduce((sum, t) => sum + t.monto, 0);

  const balance = totalIngresos - totalGastos;
  const savingsRate = totalIngresos > 0 ? (balance / totalIngresos) * 100 : 0;

  // Breakdown by category
  const categorySummary = categories.map(cat => {
    const total = filteredTransactions
      .filter(t => t.tipo === 'Gasto' && t.categoria_id === cat.id)
      .reduce((sum, t) => sum + t.monto, 0);
    return {
      nombre: cat.nombre,
      monto: total,
      porcentaje: totalGastos > 0 ? (total / totalGastos) * 100 : 0
    };
  }).sort((a, b) => b.monto - a.monto);

  // Breakdown by payment method
  const metodosPago = ['Nequi', 'Tarjeta Crédito', 'Tarjeta Débito', 'Efectivo'] as const;
  const paymentMethodSummary = metodosPago.map(mp => {
    const total = filteredTransactions
      .filter(t => t.tipo === 'Gasto' && t.metodo_pago === mp)
      .reduce((sum, t) => sum + t.monto, 0);
    return {
      nombre: mp,
      monto: total,
      porcentaje: totalGastos > 0 ? (total / totalGastos) * 100 : 0
    };
  }).sort((a, b) => b.monto - a.monto);

  const getCategoryColor = (nombre: string) => {
    switch (nombre.toLowerCase()) {
      case 'comida': return '#5f60eb';
      case 'transporte': return '#06b6d4';
      case 'entretenimiento': return '#ec4899';
      case 'servicios': return '#ff9f43';
      default: return '#10b981';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No hay transacciones para exportar.');
      return;
    }

    const headers = ['Fecha', 'Descripción', 'Tipo', 'Categoría', 'Método de Pago', 'Monto (COP)'];
    const rows = filteredTransactions.map(t => [
      new Date(t.fecha_transaccion).toLocaleString('es-CO'),
      `"${t.descripcion.replace(/"/g, '""')}"`,
      t.tipo,
      t.categoria?.nombre || 'N/A',
      t.metodo_pago,
      t.monto
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_finanzas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sidebar Layout Helper (Identical to Dashboard.tsx for 100% cohesion)
  const renderSidebarContent = (isMobile: boolean, onClose?: () => void) => {
    const collapsed = isMobile ? false : sidebarCollapsed;
    
    return (
      <div className="h-full flex flex-col justify-between">
        <div>
          {/* Profile Header */}
          <div className={`p-6 border-b border-slate-50 flex flex-col items-center text-center relative ${collapsed ? 'py-8' : 'py-8'}`}>
            
            {/* Collapse sidebar button (Only desktop) */}
            {!isMobile && (
              <button 
                onClick={toggleSidebar}
                title={collapsed ? "Expandir menú" : "Contraer menú"}
                className="absolute -right-3 top-8 w-6 h-6 bg-white hover:bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-primary shadow-sm cursor-pointer z-40 transition"
              >
                {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* User Avatar */}
            <div 
              className="relative group cursor-pointer" 
              onClick={() => {
                setShowSettingsModal(true);
                if (isMobile && onClose) onClose();
              }}
            >
              <div className={`${collapsed ? 'w-10 h-10' : 'w-16 h-16'} rounded-full overflow-hidden border-2 border-brand-primary/20 p-0.5 bg-white hover:border-brand-primary transition-all duration-300`}>
                <img 
                  src="/user_avatar.png" 
                  alt="Avatar de Usuario" 
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';
                  }}
                />
              </div>
              {!collapsed && (
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-brand-primary text-white rounded-full flex items-center justify-center border border-white shadow">
                  <Settings className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Name / Greeting (Hide if collapsed) */}
            {!collapsed && (
              <div className="animate-fade-in">
                <div 
                  className="mt-4 flex items-center justify-center gap-1.5 cursor-pointer" 
                  onClick={() => {
                    setShowSettingsModal(true);
                    if (isMobile && onClose) onClose();
                  }}
                >
                  <span className="font-bold text-slate-800 text-lg hover:text-brand-primary transition truncate max-w-[150px] block">
                    {customName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 block">
                  {getGreeting()}
                </span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className={`px-4 py-8 space-y-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
            <button
              onClick={() => {
                navigate('/');
                if (isMobile && onClose) onClose();
              }}
              title="Inicio"
              className={`w-full flex items-center ${
                collapsed 
                  ? 'justify-center w-12 h-12 p-0' 
                  : 'gap-3.5 px-5 py-3.5'
              } rounded-2xl text-sm font-semibold transition cursor-pointer text-slate-500 hover:bg-slate-50 hover:text-slate-800`}
            >
              <Wallet className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Inicio</span>}
            </button>
            
            <button
              onClick={() => {
                navigate('/reportes');
                if (isMobile && onClose) onClose();
              }}
              title="Estadísticas"
              className={`w-full flex items-center ${
                collapsed 
                  ? 'justify-center w-12 h-12 p-0' 
                  : 'gap-3.5 px-5 py-3.5'
              } rounded-2xl text-sm font-semibold transition cursor-pointer bg-brand-primary text-white shadow-lg shadow-brand-primary/10`}
            >
              <TrendingUp className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Estadísticas</span>}
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className={`p-4 border-t border-slate-50 space-y-1 bg-slate-50/50 flex flex-col ${collapsed ? 'items-center' : ''}`}>
          <button
            onClick={() => {
              setShowSettingsModal(true);
              if (isMobile && onClose) onClose();
            }}
            title="Configuración de Cuenta"
            className={`w-full flex items-center ${
              collapsed ? 'justify-center w-10 h-10 p-0' : 'gap-3 px-4 py-2.5'
            } text-xs font-bold text-slate-600 hover:text-brand-primary hover:bg-white rounded-xl transition cursor-pointer`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Configuración</span>}
          </button>
          
          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className={`w-full flex items-center ${
              collapsed ? 'justify-center w-10 h-10 p-0' : 'gap-3 px-4 py-2.5'
            } text-xs font-bold text-red-500 hover:text-white hover:bg-red-500 rounded-xl transition cursor-pointer`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F6] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-800 flex overflow-hidden relative">
      
      {/* 1. MOBILE OVERLAY BACKDROP */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* 2. MOBILE DRAWER SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-100 flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {renderSidebarContent(true, () => setMobileSidebarOpen(false))}
      </aside>

      {/* 3. DESKTOP PERMANENT COLLAPSIBLE SIDEBAR */}
      <aside className={`hidden md:flex flex-col flex-shrink-0 border-r border-slate-100 bg-white transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.015)] relative ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      }`}>
        {renderSidebarContent(false)}
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 overflow-y-auto flex flex-col relative min-w-0">
        
        {/* Offline Warning Banner */}
        {usingFallback && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-6 md:px-10 py-2.5 flex items-center justify-between text-xs font-medium z-20 flex-shrink-0">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              Demostración local (LocalStorage) - No sincronizado
            </span>
          </div>
        )}

        {/* HEADER BAR */}
        <header className="py-5 px-6 md:px-10 flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-white/40 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for mobile */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              title="Abrir menú"
              className="md:hidden p-2 hover:bg-slate-100/80 active:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 cursor-pointer shadow-sm"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200 shadow-sm transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight truncate flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-brand-primary" />
                  Reportes e Informes
                </h1>
                <p className="text-xs text-slate-500 font-medium">Análisis detallado e histórico de movimientos</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
            <button
              onClick={handleExportCSV}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white font-bold rounded-2xl transition duration-150 cursor-pointer text-xs border border-emerald-100 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="p-4 md:p-10 space-y-8 flex-1">
          
          {/* Filters Bar */}
          <div className="card-premium p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-600">
              <ListFilter className="w-4 h-4 text-brand-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">Filtros de Análisis</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Period Selector */}
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/50">
                {(['todos', 'mes', 'año'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterPeriodo(p)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer capitalize ${
                      filterPeriodo === p
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {p === 'todos' ? 'Todo' : p === 'mes' ? 'Este Mes' : 'Este Año'}
                  </button>
                ))}
              </div>

              {/* Payment Method Selector */}
              <select
                value={filterMetodo}
                onChange={(e) => setFilterMetodo(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:ring-1 focus:ring-brand-primary/10 focus:outline-none shadow-sm cursor-pointer"
              >
                <option value="todos">Todos los Medios</option>
                <option value="Nequi">Nequi</option>
                <option value="Tarjeta Crédito">Tarjeta Crédito</option>
                <option value="Tarjeta Débito">Tarjeta Débito</option>
                <option value="Efectivo">Efectivo</option>
              </select>
            </div>
          </div>

          {/* Stats Cards Row */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card-premium p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-550 font-bold uppercase tracking-wider">Ingresos Seleccionados</span>
                <h3 className="text-2xl font-black text-emerald-500 truncate">{formatCurrency(totalIngresos)}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100 flex-shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="card-premium p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-555 font-bold uppercase tracking-wider">Gastos Seleccionados</span>
                <h3 className="text-2xl font-black text-rose-500 truncate">{formatCurrency(totalGastos)}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 flex-shrink-0">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#FFFBF4] p-6 flex items-center justify-between border border-[#F5EAD4] shadow-[0_8px_30px_rgb(245,234,212,0.15)] card-premium-hover-only sm:col-span-2 lg:col-span-1">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Margen Ahorrado</span>
                <h3 className="text-2xl font-black text-slate-800 truncate">
                  {balance >= 0 ? '+' : ''}
                  {formatCurrency(balance)}
                  <span className="text-xs font-bold text-slate-500 ml-2">({savingsRate.toFixed(0)}%)</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-amber-500 border border-amber-100 flex-shrink-0">
                <Percent className="w-5 h-5" />
              </div>
            </div>
          </section>

          {/* Breakdown Analysis Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Category Breakdown Card */}
            <div className="card-premium p-6 md:p-8 space-y-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                <DollarSign className="w-5 h-5 text-brand-primary" />
                Gastos por Categoría
              </h2>

              <div className="space-y-4">
                {categorySummary.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600">{item.nombre}</span>
                      <div className="text-right">
                        <span className="text-slate-800 font-extrabold">{formatCurrency(item.monto)}</span>
                        <span className="text-slate-500 font-bold ml-1.5">({item.porcentaje.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-[1px] border border-slate-200/50">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${item.porcentaje}%`,
                          backgroundColor: getCategoryColor(item.nombre)
                        }}
                      ></div>
                    </div>
                  </div>
                ))}

                {categorySummary.reduce((sum, item) => sum + item.monto, 0) === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6 font-semibold">No hay gastos en este periodo.</p>
                )}
              </div>
            </div>

            {/* Payment Method Breakdown Card */}
            <div className="card-premium p-6 md:p-8 space-y-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                <CreditCard className="w-5 h-5 text-brand-secondary" />
                Métodos de Pago Utilizados
              </h2>

              <div className="space-y-4">
                {paymentMethodSummary.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600">{item.nombre}</span>
                      <div className="text-right">
                        <span className="text-slate-800 font-extrabold">{formatCurrency(item.monto)}</span>
                        <span className="text-slate-500 font-bold ml-1.5">({item.porcentaje.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-[1px] border border-slate-200/50">
                      <div
                        className="bg-brand-secondary h-full rounded-full"
                        style={{ width: `${item.porcentaje}%` }}
                      ></div>
                    </div>
                  </div>
                ))}

                {paymentMethodSummary.reduce((sum, item) => sum + item.monto, 0) === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6 font-semibold">No hay gastos en este periodo.</p>
                )}
              </div>
            </div>

          </section>

          {/* Transactions List breakdown */}
          <section className="card-premium p-6 md:p-8">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight mb-6">
              <Calendar className="w-5 h-5 text-brand-primary" />
              Listado Histórico ({filteredTransactions.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-5">Fecha</th>
                    <th className="py-4 px-5">Descripción</th>
                    <th className="py-4 px-5">Categoría</th>
                    <th className="py-4 px-5">Método</th>
                    <th className="py-4 px-5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-5 text-slate-500 font-medium">
                        {new Date(tx.fecha_transaccion).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">{tx.descripcion}</td>
                      <td className="py-3.5 px-5">
                        {tx.categoria ? (
                          <span 
                            className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border"
                            style={{ 
                              color: getCategoryColor(tx.categoria.nombre),
                              backgroundColor: `${getCategoryColor(tx.categoria.nombre)}10`,
                              borderColor: `${getCategoryColor(tx.categoria.nombre)}20`
                            }}
                          >
                            {tx.categoria.nombre}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{tx.metodo_pago}</td>
                      <td className={`py-3.5 px-5 text-right font-black ${
                        tx.tipo === 'Ingreso' ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {tx.tipo === 'Ingreso' ? '+' : '-'}{formatCurrency(tx.monto)}
                      </td>
                    </tr>
                  ))}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500 font-semibold">
                        Ningún movimiento coincide con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>

      </main>

      {/* Profile Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-2xl relative animate-float">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand-primary" />
                Configuración del Perfil
              </h3>
              <button
                onClick={() => {
                  setTempName(customName);
                  setShowSettingsModal(false);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre en Pantalla</label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Tu Nombre"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-primary focus:bg-white focus:outline-none transition text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Correo de Cuenta</label>
                <input
                  type="text"
                  disabled
                  value={user?.email || 'demo@finanzasapp.com'}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-400 cursor-not-allowed text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={saveDisplayName}
                  className="w-full py-3.5 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/95 transition cursor-pointer text-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
