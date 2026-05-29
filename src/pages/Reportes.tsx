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
  ListFilter
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
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const [transactions, setTransactions] = useState<Transaccion[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);

  // Filters
  const [filterPeriodo, setFilterPeriodo] = useState<'todos' | 'mes' | 'año'>('todos');
  const [filterMetodo, setFilterMetodo] = useState<string>('todos');

  useEffect(() => {
    checkUserAndLoad();
  }, []);

  const checkUserAndLoad = async () => {
    const isSupabaseConfigured =
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      setUsingFallback(true);
      loadLocalData();
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      await loadDbData(user.id);
    } catch (err) {
      console.error('Failed connection to database, using local', err);
      setUsingFallback(true);
      loadLocalData();
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
    // 1. Filter by period
    if (filterPeriodo === 'mes' && !isCurrentMonth(tx.fecha_transaccion)) return false;
    if (filterPeriodo === 'año' && !isCurrentYear(tx.fecha_transaccion)) return false;

    // 2. Filter by payment method
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

  // Format currency COP
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="min-h-svh bg-[#090b11] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-[#090b11] text-gray-100 flex flex-col relative overflow-hidden pb-12">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-brand-secondary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl border border-white/5 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-brand-primary" />
            Reportes e Informes
          </h1>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 mt-6 space-y-6 z-10">
        
        {/* Offline / Demo Warning Banner */}
        {usingFallback && (
          <div className="glass p-4 rounded-2xl flex items-center justify-between border-warning/20 bg-warning/5 text-warning-300 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Modo de Demostración Local (Reportes)</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Los datos mostrados corresponden a la base de datos temporal de tu navegador.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters Header Bar */}
        <div className="glass p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/5">
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-brand-accent" />
            <span className="text-sm font-semibold text-gray-300">Filtros de Análisis</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Period selector */}
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
              {(['todos', 'mes', 'año'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPeriodo(p)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer capitalize ${
                    filterPeriodo === p
                      ? 'bg-brand-primary text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {p === 'todos' ? 'Todo' : p === 'mes' ? 'Este Mes' : 'Este Año'}
                </button>
              ))}
            </div>

            {/* Payment method selector */}
            <select
              value={filterMetodo}
              onChange={(e) => setFilterMetodo(e.target.value)}
              className="px-3 py-2 bg-[#151926] border border-white/5 rounded-xl text-xs font-bold text-gray-300 focus:outline-none"
            >
              <option value="todos">Todos los Medios</option>
              <option value="Nequi">Nequi</option>
              <option value="Tarjeta Crédito">Tarjeta Crédito</option>
              <option value="Tarjeta Débito">Tarjeta Débito</option>
              <option value="Efectivo">Efectivo</option>
            </select>
          </div>
        </div>

        {/* 1. Main Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-5 rounded-2xl flex items-center justify-between border border-white/5">
            <div className="space-y-1">
              <span className="text-xs text-gray-400 font-medium">Ingresos Seleccionados</span>
              <h3 className="text-xl font-bold text-success">{formatCurrency(totalIngresos)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="glass p-5 rounded-2xl flex items-center justify-between border border-white/5">
            <div className="space-y-1">
              <span className="text-xs text-gray-400 font-medium">Gastos Seleccionados</span>
              <h3 className="text-xl font-bold text-danger">{formatCurrency(totalGastos)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="glass p-5 rounded-2xl flex items-center justify-between border border-brand-primary/20 bg-brand-primary/5">
            <div className="space-y-1">
              <span className="text-xs text-brand-accent font-medium">Tasa de Ahorro / Margen</span>
              <h3 className="text-xl font-bold text-white">
                {balance >= 0 ? '+' : ''}
                {formatCurrency(balance)}
                <span className="text-xs font-normal text-gray-400 ml-2">({savingsRate.toFixed(0)}%)</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center text-brand-primary">
              <Percent className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* 2. Visual Analysis Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Category Breakdown Card */}
          <div className="glass p-6 rounded-3xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-brand-primary" />
              Gastos por Categorías
            </h2>

            <div className="space-y-4">
              {categorySummary.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-200">{item.nombre}</span>
                    <div className="text-right">
                      <span className="text-white font-bold">{formatCurrency(item.monto)}</span>
                      <span className="text-gray-400 text-xs ml-1.5">({item.porcentaje.toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden p-[1px] border border-white/5">
                    <div
                      className="bg-brand-primary h-full rounded-full"
                      style={{ width: `${item.porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              ))}

              {categorySummary.reduce((sum, item) => sum + item.monto, 0) === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">No hay gastos en este periodo.</p>
              )}
            </div>
          </div>

          {/* Payment Method Breakdown Card */}
          <div className="glass p-6 rounded-3xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-secondary" />
              Distribución por Método de Pago
            </h2>

            <div className="space-y-4">
              {paymentMethodSummary.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-200">{item.nombre}</span>
                    <div className="text-right">
                      <span className="text-white font-bold">{formatCurrency(item.monto)}</span>
                      <span className="text-gray-400 text-xs ml-1.5">({item.porcentaje.toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden p-[1px] border border-white/5">
                    <div
                      className="bg-brand-secondary h-full rounded-full"
                      style={{ width: `${item.porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              ))}

              {paymentMethodSummary.reduce((sum, item) => sum + item.monto, 0) === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">No hay gastos en este periodo.</p>
              )}
            </div>
          </div>

        </section>

        {/* 3. Transaction list breakdown */}
        <section className="glass p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-accent" />
              Listado de Movimientos Filtados ({filteredTransactions.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 font-semibold">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Método de Pago</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/2">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/2 transition">
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(tx.fecha_transaccion).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{tx.descripcion}</td>
                    <td className="py-3 px-4">
                      {tx.categoria ? (
                        <span className="px-2 py-0.5 rounded-md bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold">
                          {tx.categoria.nombre}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-300 font-medium">{tx.metodo_pago}</td>
                    <td className={`py-3 px-4 text-right font-bold ${
                      tx.tipo === 'Ingreso' ? 'text-success' : 'text-danger'
                    }`}>
                      {tx.tipo === 'Ingreso' ? '+' : '-'}{formatCurrency(tx.monto)}
                    </td>
                  </tr>
                ))}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 font-medium">
                      Ningún movimiento coincide con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
