import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
  Coins,
  LogOut,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Sparkles,
  Utensils,
  Car,
  Tv,
  FileText,
  HelpCircle,
  Calendar,
  CreditCard,
  X,
  Trash2,
  AlertCircle
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

  // Form State
  const [formMonto, setFormMonto] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formCategoriaId, setFormCategoriaId] = useState('');
  const [formMetodoPago, setFormMetodoPago] = useState<'Nequi' | 'Tarjeta Crédito' | 'Tarjeta Débito' | 'Efectivo'>('Nequi');
  const [formTipo, setFormTipo] = useState<'Ingreso' | 'Gasto'>('Gasto');

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
  ];

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const isSupabaseConfigured =
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      // No credentials -> Offline Demo Mode
      setUsingFallback(true);
      setUser({ email: 'demo@finanzasapp.com', id: 'demo-user-id' });
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
      await loadDbData(user.id);
    } catch (err) {
      console.error('Error connecting to Supabase. Falling back to local.', err);
      setUsingFallback(true);
      setUser({ email: 'offline@finanzasapp.com', id: 'local-user-id' });
      loadLocalData();
    }
  };

  // Load from LocalStorage
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

  // Load from Supabase DB
  const loadDbData = async (userId: string) => {
    setLoading(true);
    try {
      // 1. Fetch categories
      let { data: cats, error: catError } = await supabase
        .from('categorias_presupuesto')
        .select('*')
        .eq('usuario_id', userId)
        .order('id', { ascending: true });

      if (catError) throw catError;

      // If user has no categories, insert default ones (failsafe in case trigger didn't fire)
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

      // 2. Fetch transactions
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

      // Map Supabase layout to match our React Interface
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
      // Fallback
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

  // Add Transaction
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

  // Delete Transaction
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

  // Open Modal and Focus input
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

  const cajaReal = totalIngresos - totalGastos;

  // Weekly Gastos Calculation (Last 7 days)
  const millisecondsInWeek = 7 * 24 * 60 * 60 * 1000;
  const totalGastosSemana = transactions
    .filter(t => t.tipo === 'Gasto' && (Date.now() - new Date(t.fecha_transaccion).getTime() <= millisecondsInWeek))
    .reduce((sum, t) => sum + t.monto, 0);

  // Category usage summary
  const getCategorySpend = (catId: number) => {
    return transactions
      .filter(t => t.tipo === 'Gasto' && t.categoria_id === catId)
      .reduce((sum, t) => sum + t.monto, 0);
  };

  // Category Icon Resolver
  const getCategoryIcon = (nombre: string) => {
    switch (nombre.toLowerCase()) {
      case 'comida':
        return <Utensils className="w-4 h-4" />;
      case 'transporte':
        return <Car className="w-4 h-4" />;
      case 'entretenimiento':
        return <Tv className="w-4 h-4" />;
      case 'servicios':
        return <FileText className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  // Format currency COP
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="min-h-svh bg-[#090b11] text-gray-100 flex flex-col relative overflow-hidden pb-12">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-10 w-80 h-80 rounded-full bg-brand-accent/5 blur-[100px] pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="glass sticky top-0 z-40 border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center rounded-xl">
            <Coins className="w-5 h-5 text-brand-primary" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Finanzas<span className="text-gradient">App</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/reportes')}
            className="text-sm font-medium text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-4 py-2 rounded-xl hover:bg-brand-accent/20 transition cursor-pointer"
          >
            Ver Reportes
          </button>
          
          <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>
          
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs text-gray-400">Usuario</span>
            <span className="text-sm text-gray-200 truncate max-w-[150px]">{user?.email}</span>
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl border border-white/5 transition cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 mt-6 space-y-8 z-10">
        
        {/* Offline / Demo Warning Banner */}
        {usingFallback && (
          <div className="glass p-4 rounded-2xl flex items-center justify-between border-warning/20 bg-warning/5 text-warning-300 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Modo de Demostración Local</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Las variables de Supabase no están configuradas. Los datos se guardarán temporalmente en tu navegador.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 1. Summary Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card: Ingresos Totales */}
          <div className="glass p-6 rounded-2xl flex items-center justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full blur-xl translate-x-4 -translate-y-4"></div>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Ingresos Totales</span>
              <span className="text-2xl font-bold text-white block">{formatCurrency(totalIngresos)}</span>
            </div>
            <div className="w-12 h-12 bg-success/10 border border-success/20 rounded-xl flex items-center justify-center text-success">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Card: Gasto Mensual Acumulado */}
          <div className="glass p-6 rounded-2xl flex items-center justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-full blur-xl translate-x-4 -translate-y-4"></div>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Gasto Mensual</span>
              <span className="text-2xl font-bold text-white block">{formatCurrency(totalGastos)}</span>
            </div>
            <div className="w-12 h-12 bg-danger/10 border border-danger/20 rounded-xl flex items-center justify-center text-danger">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>

          {/* Card: Gasto Semanal Acumulado */}
          <div className="glass p-6 rounded-2xl flex items-center justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-full blur-xl translate-x-4 -translate-y-4"></div>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Gasto Semanal</span>
              <span className="text-2xl font-bold text-white block">{formatCurrency(totalGastosSemana)}</span>
            </div>
            <div className="w-12 h-12 bg-warning/10 border border-warning/20 rounded-xl flex items-center justify-center text-warning">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          {/* Card: Caja Real (Restante) */}
          <div className="glass p-6 rounded-2xl flex items-center justify-between relative overflow-hidden group border-brand-primary/20 glow">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/10 rounded-full blur-xl translate-x-4 -translate-y-4"></div>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-brand-accent uppercase tracking-wider block">Caja Real (Restante)</span>
              <span className="text-2xl font-bold text-white block">{formatCurrency(cajaReal)}</span>
            </div>
            <div className="w-12 h-12 bg-brand-primary/20 border border-brand-primary/30 rounded-xl flex items-center justify-center text-brand-primary animate-pulse-slow">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

        </section>

        {/* 2. Budgets & Transactions Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT/MID COLUMN: Budgets Progress & Semaphores (2/3 width) */}
          <div className="glass p-6 rounded-3xl lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-primary" />
                Límites de Presupuesto Mensual
              </h2>
              <span className="text-xs text-gray-400">Consumo en base a gastos registrados</span>
            </div>

            <div className="space-y-5">
              {categories.map(cat => {
                const spend = getCategorySpend(cat.id);
                const pct = cat.limite_mensual > 0 ? (spend / cat.limite_mensual) * 100 : 0;
                
                // Semaphore styling
                let colorClass = 'bg-success';
                let textClass = 'text-success';
                if (pct >= 100) {
                  colorClass = 'bg-danger';
                  textClass = 'text-danger';
                } else if (pct >= 70) {
                  colorClass = 'bg-warning';
                  textClass = 'text-warning';
                }

                return (
                  <div key={cat.id} className="space-y-2 p-3 bg-white/2 rounded-2xl hover:bg-white/5 transition border border-white/2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${colorClass}/10 ${textClass}`}>
                          {getCategoryIcon(cat.nombre)}
                        </div>
                        <span className="font-semibold text-gray-200">{cat.nombre}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">{formatCurrency(spend)}</span>
                        <span className="text-gray-500 text-xs font-medium"> / {formatCurrency(cat.limite_mensual)}</span>
                      </div>
                    </div>

                    {/* Progress Bar container */}
                    <div className="w-full bg-white/5 h-3.5 rounded-full overflow-hidden p-[2px] border border-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Consumido</span>
                      <span className={`font-bold ${textClass}`}>{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Recent Transactions (1/3 width) */}
          <div className="glass p-6 rounded-3xl flex flex-col space-y-6 max-h-[500px]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-secondary" />
              Movimientos Recientes
            </h2>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {transactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                  <Coins className="w-12 h-12 stroke-[1.5] mb-2 text-gray-600" />
                  <span className="text-sm font-medium">No hay transacciones</span>
                  <span className="text-xs text-gray-600">Registra un gasto flotante</span>
                </div>
              ) : (
                transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="p-3 bg-white/2 hover:bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group relative overflow-hidden transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm truncate max-w-[120px]">{tx.descripcion}</span>
                        {tx.categoria && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-brand-accent font-medium uppercase">
                            {tx.categoria.nombre}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="font-medium text-gray-500">{tx.metodo_pago}</span>
                        <span>•</span>
                        <span>{new Date(tx.fecha_transaccion).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          tx.tipo === 'Ingreso' ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {tx.tipo === 'Ingreso' ? '+' : '-'}{formatCurrency(tx.monto)}
                      </span>
                      
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="p-1.5 bg-danger/10 hover:bg-danger text-danger-300 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer"
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

        </section>
      </main>

      {/* 3. Floating Action Button (FAB) */}
      <button
        onClick={openExpenseModal}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 z-30 cursor-pointer glow glow-hover border border-white/10"
        title="Registrar Gasto Exprés"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* 4. Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass rounded-3xl p-6 relative border border-white/10 shadow-2xl animate-float">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-brand-primary" />
                Registro Exprés
              </h3>
              <button
                onClick={resetForm}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddTransaction} className="space-y-4">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setFormTipo('Gasto')}
                  className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    formTipo === 'Gasto'
                      ? 'bg-danger text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Gasto Hormiga
                </button>
                <button
                  type="button"
                  onClick={() => setFormTipo('Ingreso')}
                  className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    formTipo === 'Ingreso'
                      ? 'bg-success text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Ingreso / Salario
                </button>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Monto (COP)</label>
                <input
                  type="number"
                  ref={montoInputRef}
                  required
                  value={formMonto}
                  onChange={(e) => setFormMonto(e.target.value)}
                  placeholder="20000"
                  min="1"
                  className="w-full px-4 py-3 bg-dark-surface/50 border border-dark-border rounded-xl focus:border-brand-primary focus:outline-none transition text-white text-lg font-bold"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Descripción</label>
                <input
                  type="text"
                  required
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Café espresso con pan"
                  className="w-full px-4 py-3 bg-dark-surface/50 border border-dark-border rounded-xl focus:border-brand-primary focus:outline-none transition text-white text-sm"
                />
              </div>

              {/* Categoría (Only for Gasto) */}
              {formTipo === 'Gasto' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categoría</label>
                  <select
                    value={formCategoriaId}
                    onChange={(e) => setFormCategoriaId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#151926] border border-dark-border rounded-xl focus:border-brand-primary focus:outline-none transition text-white text-sm"
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
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Método de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Nequi', 'Tarjeta Crédito', 'Tarjeta Débito', 'Efectivo'] as const).map(mp => (
                    <button
                      key={mp}
                      type="button"
                      onClick={() => setFormMetodoPago(mp)}
                      className={`py-2.5 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition ${
                        formMetodoPago === mp
                          ? 'bg-brand-primary border-brand-primary text-white'
                          : 'bg-dark-surface/50 border-dark-border text-gray-400 hover:text-white'
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
                className="w-full py-3 mt-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl shadow-lg glow-hover transition cursor-pointer"
              >
                {formTipo === 'Gasto' ? 'Registrar Gasto (-)' : 'Registrar Ingreso (+)'}
              </button>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
