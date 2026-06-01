import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
  Coins,
  LogOut,
  Plus,
  TrendingUp,
  Wallet,
  CreditCard,
  X,
  Trash2,
  AlertCircle,
  Search,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  // States
  const [transactions, setTransactions] = useState<Transaccion[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar Toggles
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('fa_sidebar_collapsed') === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Form States
  const [formMonto, setFormMonto] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formCategoriaId, setFormCategoriaId] = useState('');
  const [formMetodoPago, setFormMetodoPago] = useState<'Nequi' | 'Tarjeta Crédito' | 'Tarjeta Débito' | 'Efectivo'>('Nequi');
  const [formTipo, setFormTipo] = useState<'Ingreso' | 'Gasto'>('Gasto');

  // Custom User Profile Name State
  const [customName, setCustomName] = useState('');
  const [tempName, setTempName] = useState('');

  // References
  const montoInputRef = useRef<HTMLInputElement>(null);

  // Mock initial data for fallback (Local Storage)
  const defaultCategories: Categoria[] = [
    { id: 1, nombre: 'Comida', limite_mensual: 500000 },
    { id: 2, nombre: 'Transporte', limite_mensual: 150000 },
    { id: 3, nombre: 'Entretenimiento', limite_mensual: 200000 },
    { id: 4, nombre: 'Servicios', limite_mensual: 300000 },
    { id: 5, nombre: 'Otros', limite_mensual: 100000 },
  ];

  const defaultTransactions: Transaccion[] = [
    {
      id: 101,
      categoria_id: 1,
      monto: 15000,
      descripcion: 'Almuerzo corriente',
      metodo_pago: 'Nequi',
      tipo: 'Gasto',
      fecha_transaccion: new Date().toISOString(),
      categoria: { nombre: 'Comida' },
    },
    {
      id: 102,
      categoria_id: 2,
      monto: 9500,
      descripcion: 'Viaje en Uber',
      metodo_pago: 'Tarjeta Crédito',
      tipo: 'Gasto',
      fecha_transaccion: new Date(Date.now() - 3600000 * 2).toISOString(),
      categoria: { nombre: 'Transporte' },
    },
    {
      id: 103,
      categoria_id: null,
      monto: 3200000,
      descripcion: 'Salario quincenal',
      metodo_pago: 'Tarjeta Débito',
      tipo: 'Ingreso',
      fecha_transaccion: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 104,
      categoria_id: 3,
      monto: 45000,
      descripcion: 'Cine y palomitas',
      metodo_pago: 'Efectivo',
      tipo: 'Gasto',
      fecha_transaccion: new Date(Date.now() - 86400000 * 5).toISOString(),
      categoria: { nombre: 'Entretenimiento' },
    },
    {
      id: 105,
      categoria_id: 1,
      monto: 180000,
      descripcion: 'Mercado de semana',
      metodo_pago: 'Tarjeta Débito',
      tipo: 'Gasto',
      fecha_transaccion: new Date(Date.now() - 86400000 * 6).toISOString(),
      categoria: { nombre: 'Comida' },
    },
  ];

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const isSupabaseConfigured =
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      setUsingFallback(true);
      const demoUser = { email: 'jenny.mo@finanzasapp.com', id: 'demo-user-id' };
      setUser(demoUser);
      loadLocalData();
      initializeDisplayName(demoUser.email);
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
      console.error('Error connecting to Supabase. Falling back to local.', err);
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

    if (cachedCats) {
      setCategories(JSON.parse(cachedCats));
    } else {
      setCategories(defaultCategories);
      localStorage.setItem('fa_categories', JSON.stringify(defaultCategories));
    }

    if (cachedTrans) {
      setTransactions(JSON.parse(cachedTrans));
    } else {
      setTransactions(defaultTransactions);
      localStorage.setItem('fa_transactions', JSON.stringify(defaultTransactions));
    }
    setLoading(false);
  };

  const loadDbData = async (userId: string) => {
    setLoading(true);
    try {
      let { data: cats, error: catError } = await supabase
        .from('categorias_presupuesto')
        .select('*')
        .eq('usuario_id', userId)
        .order('id', { ascending: true });

      if (catError) throw catError;

      if (!cats || cats.length === 0) {
        const defaults = defaultCategories.map(c => ({
          usuario_id: userId,
          nombre: c.nombre,
          limite_mensual: c.limite_mensual
        }));
        const { data: inserted, error: insertError } = await supabase
          .from('categorias_presupuesto')
          .insert(defaults)
          .select();
        if (insertError) throw insertError;
        cats = inserted || [];
      }

      setCategories(cats);

      const { data: trans, error: transError } = await supabase
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

      if (transError) throw transError;

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
      console.error('Failed to load DB resources:', err);
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

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(formMonto);
    if (isNaN(monto) || monto <= 0 || !formDescripcion.trim()) return;

    setLoading(true);
    const catId = formTipo === 'Gasto' && formCategoriaId ? Number(formCategoriaId) : null;
    const catName = catId ? categories.find(c => c.id === catId)?.nombre : undefined;

    if (usingFallback) {
      const newTx: Transaccion[] = [
        {
          id: Date.now(),
          categoria_id: catId,
          monto,
          descripcion: formDescripcion.trim(),
          metodo_pago: formMetodoPago,
          tipo: formTipo,
          fecha_transaccion: new Date().toISOString(),
          categoria: catName ? { nombre: catName } : undefined
        },
        ...transactions
      ];
      setTransactions(newTx);
      localStorage.setItem('fa_transactions', JSON.stringify(newTx));
      setLoading(false);
      resetForm();
    } else {
      try {
        const { error } = await supabase.from('transacciones').insert({
          usuario_id: user.id,
          categoria_id: catId,
          monto,
          descripcion: formDescripcion.trim(),
          metodo_pago: formMetodoPago,
          tipo: formTipo,
          fecha_transaccion: new Date().toISOString()
        });

        if (error) throw error;
        await loadDbData(user.id);
        resetForm();
      } catch (err) {
        alert('Error al guardar la transacción en Supabase');
        console.error(err);
        setLoading(false);
      }
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;
    setLoading(true);

    if (usingFallback) {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      localStorage.setItem('fa_transactions', JSON.stringify(updated));
      setLoading(false);
    } else {
      try {
        const { error } = await supabase.from('transacciones').delete().eq('id', id);
        if (error) throw error;
        await loadDbData(user.id);
      } catch (err) {
        alert('Error al eliminar de la base de datos');
        console.error(err);
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormMonto('');
    setFormDescripcion('');
    setFormCategoriaId(categories[0]?.id.toString() || '');
    setFormMetodoPago('Nequi');
    setFormTipo('Gasto');
    setShowModal(false);
  };

  const openExpenseModal = () => {
    setFormTipo('Gasto');
    setFormCategoriaId(categories[0]?.id.toString() || '');
    setShowModal(true);
    setTimeout(() => {
      montoInputRef.current?.focus();
    }, 100);
  };

  // Calculations
  const totalIngresos = transactions
    .filter(t => t.tipo === 'Ingreso')
    .reduce((sum, t) => sum + t.monto, 0);

  const totalGastos = transactions
    .filter(t => t.tipo === 'Gasto')
    .reduce((sum, t) => sum + t.monto, 0);

  const balanceNeto = totalIngresos - totalGastos;

  const getCategorySpend = (catId: number) => {
    return transactions
      .filter(t => t.tipo === 'Gasto' && t.categoria_id === catId)
      .reduce((sum, t) => sum + t.monto, 0);
  };

  const getCategoryColor = (nombre: string) => {
    switch (nombre.toLowerCase()) {
      case 'comida': return '#5f60eb';
      case 'transporte': return '#06b6d4';
      case 'entretenimiento': return '#ec4899';
      case 'servicios': return '#ff9f43';
      default: return '#10b981';
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Filter transactions by search query
  const filteredTx = transactions.filter(t => 
    t.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.monto.toString().includes(searchQuery) ||
    (t.categoria?.nombre && t.categoria.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Note text dynamic calculation based on food spending
  const comidaSpend = getCategorySpend(categories.find(c => c.nombre.toLowerCase() === 'comida')?.id || 0);
  const diningOutNote = comidaSpend > 0 
    ? `Gastaste ${formatCurrency(comidaSpend)} en comida este mes. ¡Intentemos reducirlo!`
    : '¡Excelente! No tienes gastos excesivos registrados en comida hoy.';

  // Donut chart calculations
  const totalBudget = categories.reduce((sum, c) => sum + c.limite_mensual, 0);
  const totalSpentInCategories = categories.reduce((sum, c) => sum + getCategorySpend(c.id), 0);
  const budgetRatio = totalBudget > 0 ? Math.min((totalSpentInCategories / totalBudget) * 100, 100) : 0;

  // Highest spending category
  const sortedCategoriesBySpend = [...categories]
    .map(c => ({ ...c, spend: getCategorySpend(c.id) }))
    .sort((a, b) => b.spend - a.spend);
  const highestSpendCat = sortedCategoriesBySpend[0];
  const highestSpendRatio = totalSpentInCategories > 0 && highestSpendCat
    ? ((highestSpendCat.spend / totalSpentInCategories) * 100).toFixed(0)
    : '0';

  // Sidebar Layout Helper (avoids duplication)
  const renderSidebarContent = (isMobile: boolean, onClose?: () => void) => {
    const collapsed = isMobile ? false : sidebarCollapsed;
    
    return (
      <div className="h-full flex flex-col justify-between">
        <div>
          {/* Profile Header */}
          <div className="p-6 border-b border-slate-50 flex flex-col items-center text-center relative py-8">
            
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
              <div className={`sidebar-avatar-container ${collapsed ? '' : 'w-16 h-16'} rounded-full overflow-hidden border-2 border-brand-primary/20 p-0.5 bg-white hover:border-brand-primary transition-all duration-300`}>
                <img 
                  src="/user_avatar.png" 
                  alt="Avatar de Usuario" 
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';
                  }}
                />
              </div>
              <div className={`sidebar-profile-gear absolute bottom-0 right-0 w-5 h-5 bg-brand-primary text-white rounded-full flex items-center justify-center border border-white shadow transition-all duration-300 ${collapsed ? '' : 'opacity-100'}`}>
                <Settings className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Name / Greeting */}
            <div className={`sidebar-profile-text ${collapsed ? '' : 'mt-4'} flex flex-col items-center text-center`}>
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
          </div>

          {/* Navigation Links */}
          <nav className={`px-4 py-8 space-y-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
            <button
              onClick={() => {
                navigate('/');
                if (isMobile && onClose) onClose();
              }}
              title="Inicio"
              className={`sidebar-nav-btn w-full flex items-center rounded-2xl text-sm font-semibold transition cursor-pointer bg-brand-primary text-white shadow-lg shadow-brand-primary/10 ${
                collapsed ? '' : 'gap-3.5 px-5 py-3.5'
              }`}
            >
              <Wallet className="w-5 h-5 flex-shrink-0" />
              <span className={collapsed ? 'sidebar-label-text' : ''}>Inicio</span>
            </button>
            
            <button
              onClick={() => {
                navigate('/reportes');
                if (isMobile && onClose) onClose();
              }}
              title="Estadísticas"
              className={`sidebar-nav-btn w-full flex items-center rounded-2xl text-sm font-semibold transition cursor-pointer text-slate-500 hover:bg-slate-50 hover:text-slate-800 ${
                collapsed ? '' : 'gap-3.5 px-5 py-3.5'
              }`}
            >
              <TrendingUp className="w-5 h-5 flex-shrink-0" />
              <span className={collapsed ? 'sidebar-label-text' : ''}>Estadísticas</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions: Settings & Logout */}
        <div className={`p-4 border-t border-slate-50 space-y-1 bg-slate-50/50 flex flex-col ${collapsed ? 'items-center' : ''}`}>
          <button
            onClick={() => {
              setShowSettingsModal(true);
              if (isMobile && onClose) onClose();
            }}
            title="Configuración de Cuenta"
            className={`sidebar-bottom-btn w-full flex items-center rounded-xl text-xs font-bold text-slate-600 hover:text-brand-primary hover:bg-white transition cursor-pointer ${
              collapsed ? '' : 'gap-3 px-4 py-2.5'
            }`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span className={collapsed ? 'sidebar-label-text' : ''}>Configuración</span>
          </button>
          
          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className={`sidebar-bottom-btn w-full flex items-center rounded-xl text-xs font-bold text-red-500 hover:text-white hover:bg-red-500 transition cursor-pointer ${
              collapsed ? '' : 'gap-3 px-4 py-2.5'
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className={collapsed ? 'sidebar-label-text' : ''}>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    );
  };

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

      {/* 3. DESKTOP PERMANENT COLLAPSIBLE SIDEBAR WITH HOVER EXPANSION */}
      {/* Dummy space-holding aside to prevent layout shifting */}
      <aside className={`hidden md:block flex-shrink-0 transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      }`} />
      
      {/* Actual floating/fixed aside */}
      <aside className={`hidden md:flex flex-col border-r border-slate-100 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.015)] absolute inset-y-0 left-0 z-30 ${
        sidebarCollapsed ? 'sidebar-collapsed-hoverable' : 'w-72'
      }`}>
        {renderSidebarContent(false)}
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 overflow-y-auto flex flex-col relative min-w-0">
        
        {/* Offline Warning Banner */}
        {usingFallback && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-6 md:px-10 py-2.5 flex items-center justify-between text-xs font-medium z-20 flex-shrink-0">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Demostración local (LocalStorage) - No sincronizado
            </span>
          </div>
        )}

        {/* TOP BAR / HEADER */}
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
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
                Hola, {customName.split(' ')[0]}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5 capitalize">
                {getGreeting()}, que tengas un excelente día financiero
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 md:w-80 sm:flex-initial">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar transacción..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-2xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none transition text-sm text-slate-700 placeholder-slate-400 shadow-sm"
              />
            </div>

            {/* Quick Gasto button */}
            <button
              onClick={openExpenseModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white font-bold rounded-2xl hover:bg-brand-primary/95 transition duration-150 cursor-pointer text-xs md:text-sm shadow-md shadow-brand-primary/15 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Nuevo Registro</span>
              <span className="xs:hidden">Nuevo</span>
            </button>
          </div>
        </header>

        {/* CONTENT AREA GRID */}
        <div className="p-4 md:p-10 space-y-8 flex-1">
          
          {/* Savings / Remaining Cash Box: HERO CARD CON COLORES INVERTIDOS (Mapeada arriba para visibilidad mobile/desktop inmediata) */}
          <div className="card-premium-hero p-6 md:p-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                <Wallet className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">Dinero Disponible</span>
                <span className="text-2xl md:text-3xl font-black text-white block mt-0.5 truncate">{formatCurrency(balanceNeto)}</span>
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0">
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">Margen Neto de Ahorro</span>
              <span className={`text-xs md:text-sm font-bold block mt-1 ${balanceNeto >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {totalIngresos > 0 
                  ? `${((balanceNeto / totalIngresos) * 100).toFixed(0)}% del total ingresado`
                  : 'N/A'
                }
              </span>
            </div>
          </div>

          {/* Main 3 columns layout: matches reference image grid structure but fully responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* COLUMN 1: Latest Transactions (Refactorizada con card-premium) */}
            <div className="card-premium p-6 md:p-8 flex flex-col h-[520px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Últimos Movimientos</h2>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {filteredTx.length}
                </span>
              </div>

              {/* Transactions List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {filteredTx.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <Coins className="w-12 h-12 stroke-[1.2] mb-3 text-slate-400 animate-bounce" />
                    <span className="text-sm font-semibold text-slate-500">Sin movimientos</span>
                    <span className="text-xs text-slate-500 mt-1">Registra un ingreso o gasto</span>
                  </div>
                ) : (
                  filteredTx.map(tx => (
                    <div
                      key={tx.id}
                      className="p-3.5 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100/50 flex justify-between items-center group transition duration-200"
                    >
                      <div className="space-y-1 flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm truncate max-w-[120px] block">{tx.descripcion}</span>
                          {tx.categoria && (
                            <span 
                              className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border flex-shrink-0"
                              style={{ 
                                color: getCategoryColor(tx.categoria.nombre),
                                backgroundColor: `${getCategoryColor(tx.categoria.nombre)}10`,
                                borderColor: `${getCategoryColor(tx.categoria.nombre)}20`
                              }}
                            >
                              {tx.categoria.nombre}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                          <span>{tx.metodo_pago}</span>
                          <span>•</span>
                          <span>{new Date(tx.fecha_transaccion).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-extrabold flex-shrink-0 ${
                            tx.tipo === 'Ingreso' ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {tx.tipo === 'Ingreso' ? '+' : '-'}{formatCurrency(tx.monto)}
                        </span>
                        
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer flex-shrink-0"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* COLUMN 2: Card Balance & Categories */}
            <div className="space-y-8 flex flex-col h-auto md:h-[520px]">
              
              {/* Card balance (Opción A: Unificada a blanco card-premium y nota con fondo gris tenue) */}
              <div className="card-premium p-6 md:p-7 flex flex-col justify-between flex-1 min-h-[220px]">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-550 tracking-wider uppercase">Saldo de Caja</h3>
                  <div className="mt-4 grid grid-cols-2 gap-4 divide-x divide-slate-100">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wide">Ingresos</span>
                      <span className="text-lg md:text-xl font-black text-emerald-500 mt-1 block truncate">
                        {formatCurrency(totalIngresos)}
                      </span>
                    </div>
                    <div className="pl-4">
                      <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wide">Gastos</span>
                      <span className="text-lg md:text-xl font-black text-rose-500 mt-1 block truncate">
                        {formatCurrency(totalGastos)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recuadro de mensaje analítico unificado en fondo gris claro tenue #F8FAFC */}
                <div className="mt-5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
                  <span className="font-extrabold text-slate-650 block uppercase tracking-wider text-[9px]">Mensaje de Análisis:</span>
                  <p className="text-slate-600 mt-1 font-medium leading-relaxed">
                    {diningOutNote}
                  </p>
                </div>
              </div>

              {/* Categories Donut Chart (Refactorizada con card-premium) */}
              <div className="card-premium p-6 md:p-7 flex flex-col justify-between flex-1 min-h-[260px]">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-extrabold text-slate-500 tracking-wider uppercase">Distribución</h3>
                  <span className="text-[11px] text-slate-550 font-bold uppercase tracking-wide">Presupuestal</span>
                </div>

                <div className="flex items-center justify-between gap-4 mt-3">
                  {/* Interactive SVG Circular Donut Chart */}
                  <div className="relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="none" 
                        stroke="#f1f5f9" 
                        strokeWidth="10" 
                      />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="none" 
                        stroke="url(#donutGradient)" 
                        strokeWidth="10" 
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - budgetRatio / 100)}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#5f60eb" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-base md:text-lg font-black text-slate-800">{budgetRatio.toFixed(0)}%</span>
                      <span className="text-[8px] text-slate-500 font-extrabold uppercase mt-0.5 tracking-wider">Límite</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex-1 space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {categories.slice(0, 4).map(c => {
                      const spend = getCategorySpend(c.id);
                      const pct = totalSpentInCategories > 0 ? (spend / totalSpentInCategories) * 100 : 0;
                      return (
                        <div key={c.id} className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5 text-slate-600 font-semibold truncate max-w-[90px]">
                            <span 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getCategoryColor(c.nombre) }}
                            />
                            {c.nombre}
                          </span>
                          <span className="font-extrabold text-slate-800 flex-shrink-0">{pct.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                  {highestSpendCat && highestSpendCat.spend > 0 ? (
                    <>
                      <span className="text-slate-500">Principal Gasto:</span>
                      <span className="text-slate-700">
                        {highestSpendCat.nombre} ({highestSpendRatio}%)
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-500 text-center w-full">Sin gastos registrados</span>
                  )}
                </div>
              </div>

            </div>

            {/* COLUMN 3: Account Balance & Spending Analyst */}
            <div className="space-y-8 flex flex-col h-auto md:h-[520px]">
              
              {/* Account Balance (Line Chart - Refactorizada con card-premium) */}
              <div className="card-premium p-6 md:p-7 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-550 tracking-wider uppercase">Historial de Balance</h3>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Trayectoria de egresos semanales</span>
                </div>

                {/* SVG Line Chart */}
                <div className="h-32 mt-4 relative w-full">
                  <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5f60eb" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#5f60eb" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="25" x2="200" y2="25" stroke="#f1f5f9" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="200" y2="50" stroke="#f1f5f9" strokeWidth="0.5" />
                    <line x1="0" y1="75" x2="200" y2="75" stroke="#f1f5f9" strokeWidth="0.5" />

                    <path 
                      d="M 0,80 Q 40,30 80,60 T 160,20 T 200,45" 
                      fill="none" 
                      stroke="#5f60eb" 
                      strokeWidth="3" 
                      strokeLinecap="round"
                    />
                    <path 
                      d="M 0,80 Q 40,30 80,60 T 160,20 T 200,45 L 200,100 L 0,100 Z" 
                      fill="url(#lineGrad)" 
                    />
                  </svg>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wide">
                  <span>Ene</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Abr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>

              {/* Spending Analyst (Bar Chart - Refactorizada con card-premium) */}
              <div className="card-premium p-6 md:p-7 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-550 tracking-wider uppercase">Analista de Gastos</h3>
                  <span className="text-[11px] text-slate-550 mt-0.5 block">Consumo porcentual por área</span>
                </div>

                {/* SVG Bar Chart */}
                <div className="h-32 mt-4 flex items-end justify-between gap-3 px-1">
                  {categories.map((c) => {
                    const spend = getCategorySpend(c.id);
                    const pct = c.limite_mensual > 0 ? (spend / c.limite_mensual) * 100 : 0;
                    const barHeight = Math.min(Math.max(pct, 10), 100);
                    return (
                      <div key={c.id} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer min-w-0">
                        <div className="w-full bg-slate-50 rounded-xl h-24 flex items-end relative overflow-hidden border border-slate-100">
                          <div 
                            className="w-full bg-brand-primary rounded-xl transition-all duration-500 ease-out group-hover:bg-brand-secondary"
                            style={{ height: `${barHeight}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase truncate w-full text-center tracking-wide block">
                          {c.nombre}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>

      </main>

      {/* 1. NEW TRANSACTION EXPRESS MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-2xl relative animate-float">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Coins className="w-5 h-5 text-brand-primary" />
                Registrar Movimiento
              </h3>
              <button
                onClick={resetForm}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer animate-pulse-slow"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setFormTipo('Gasto')}
                  className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    formTipo === 'Gasto'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Gasto Hormiga
                </button>
                <button
                  type="button"
                  onClick={() => setFormTipo('Ingreso')}
                  className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    formTipo === 'Ingreso'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Ingreso / Salario
                </button>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Monto (COP)</label>
                <input
                  type="number"
                  ref={montoInputRef}
                  required
                  value={formMonto}
                  onChange={(e) => setFormMonto(e.target.value)}
                  placeholder="20000"
                  min="1"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-primary focus:bg-white focus:outline-none transition text-slate-800 text-lg font-bold"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción</label>
                <input
                  type="text"
                  required
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Café espresso con pan"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-primary focus:bg-white focus:outline-none transition text-slate-800 text-sm"
                />
              </div>

              {/* Categoría */}
              {formTipo === 'Gasto' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Categoría</label>
                  <select
                    value={formCategoriaId}
                    onChange={(e) => setFormCategoriaId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-primary focus:bg-white focus:outline-none transition text-slate-800 text-sm cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Método de Pago */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Método de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Nequi', 'Tarjeta Crédito', 'Tarjeta Débito', 'Efectivo'] as const).map(mp => (
                    <button
                      key={mp}
                      type="button"
                      onClick={() => setFormMetodoPago(mp)}
                      className={`py-2.5 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition ${
                        formMetodoPago === mp
                          ? 'bg-brand-primary border-brand-primary text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      {mp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/95 transition cursor-pointer text-sm"
              >
                {formTipo === 'Gasto' ? 'Registrar Gasto' : 'Registrar Ingreso'}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* 2. SETTINGS / CONFIGURACION MODAL */}
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
