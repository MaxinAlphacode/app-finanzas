import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  Settings,
  Menu,
  Coins,
  AlertCircle
} from 'lucide-react';

interface Categoria {
  id: number;
  nombre: string;
  limite_mensual: number;
  color?: string; // used locally or when offline
}

interface Transaccion {
  id: number;
  categoria_id: number | null;
  monto: number;
  descripcion: string;
  metodo_pago: 'Nequi' | 'Tarjeta Crédito' | 'Tarjeta Débito' | 'Efectivo';
  tipo: 'Ingreso' | 'Gasto';
  fecha_transaccion: string;
}

const BEAUTIFUL_COLORS = [
  '#5f60eb', // Indigo / Brand Primary
  '#ec4899', // Pink / Brand Secondary
  '#06b6d4', // Cyan / Brand Accent
  '#ff9f43', // Orange / Warning
  '#10b981', // Emerald / Success
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#eab308', // Gold
  '#3b82f6', // Blue
  '#a855f7', // Purple
];

export default function Presupuestos() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  // Data States
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [transactions, setTransactions] = useState<Transaccion[]>([]);

  // Navigation / Layout States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('fa_sidebar_collapsed') === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [tempName, setTempName] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Form / Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formLimite, setFormLimite] = useState('');
  const [formColor, setFormColor] = useState(BEAUTIFUL_COLORS[0]);

  // Delete Safe Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Categoria | null>(null);
  const [affectedTxCount, setAffectedTxCount] = useState(0);
  const [deleteAction, setDeleteAction] = useState<'reassign' | 'delete_all'>('reassign');
  const [reassignTargetId, setReassignTargetId] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
      console.error('Error connecting to database. Using local fallback.', err);
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

    const defaultCategories: Categoria[] = [
      { id: 1, nombre: 'Comida', limite_mensual: 500000, color: '#5f60eb' },
      { id: 2, nombre: 'Transporte', limite_mensual: 150000, color: '#06b6d4' },
      { id: 3, nombre: 'Entretenimiento', limite_mensual: 200000, color: '#ec4899' },
      { id: 4, nombre: 'Servicios', limite_mensual: 300000, color: '#ff9f43' },
      { id: 5, nombre: 'Otros', limite_mensual: 100000, color: '#10b981' },
    ];

    try {
      if (cachedCats) {
        setCategories(JSON.parse(cachedCats));
      } else {
        setCategories(defaultCategories);
        localStorage.setItem('fa_categories', JSON.stringify(defaultCategories));
      }
    } catch (e) {
      setCategories(defaultCategories);
      localStorage.setItem('fa_categories', JSON.stringify(defaultCategories));
    }

    try {
      if (cachedTrans) {
        setTransactions(JSON.parse(cachedTrans));
      } else {
        setTransactions([]);
      }
    } catch (e) {
      setTransactions([]);
    }
    setLoading(false);
  };

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

      // Initialize defaults if empty
      if (!cats || cats.length === 0) {
        const defaults = [
          { usuario_id: userId, nombre: 'Comida', limite_mensual: 500000.00 },
          { usuario_id: userId, nombre: 'Transporte', limite_mensual: 150000.00 },
          { usuario_id: userId, nombre: 'Entretenimiento', limite_mensual: 200000.00 },
          { usuario_id: userId, nombre: 'Servicios', limite_mensual: 300000.00 },
          { usuario_id: userId, nombre: 'Otros', limite_mensual: 100000.00 }
        ];
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
        .select('id, categoria_id, monto, descripcion, metodo_pago, tipo, fecha_transaccion')
        .eq('usuario_id', userId);

      if (transError) throw transError;

      const mappedTrans: Transaccion[] = (trans || []).map((t: any) => ({
        id: t.id,
        categoria_id: t.categoria_id,
        monto: Number(t.monto),
        descripcion: t.descripcion,
        metodo_pago: t.metodo_pago,
        tipo: t.tipo,
        fecha_transaccion: t.fecha_transaccion
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

  // Color Mapping Helper
  const getCategoryColor = (cat: Categoria) => {
    if (!cat) return '#10b981';
    // 1. Check if category itself has a saved color
    if (cat.color) return cat.color;

    // 2. Check in localStorage name/ID mappings
    try {
      const colorMapRaw = localStorage.getItem('fa_category_colors');
      if (colorMapRaw) {
        const colorMap = JSON.parse(colorMapRaw);
        if (colorMap[cat.id]) return colorMap[cat.id];
        if (cat.nombre && colorMap[cat.nombre.toLowerCase()]) return colorMap[cat.nombre.toLowerCase()];
      }
    } catch (e) {
      console.warn('Error reading category colors from localStorage', e);
    }

    // 3. Defaults based on name
    const nombre = cat.nombre || 'Otros';
    switch (nombre.toLowerCase()) {
      case 'comida': return '#5f60eb';
      case 'transporte': return '#06b6d4';
      case 'entretenimiento': return '#ec4899';
      case 'servicios': return '#ff9f43';
      case 'otros': return '#10b981';
      default:
        // Generate deterministic color based on hash of name
        let hash = 0;
        for (let i = 0; i < nombre.length; i++) {
          hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % BEAUTIFUL_COLORS.length;
        return BEAUTIFUL_COLORS[index];
    }
  };

  const saveCategoryColorMapping = (catId: number, color: string, nombre: string) => {
    try {
      const colorMapRaw = localStorage.getItem('fa_category_colors') || '{}';
      const colorMap = JSON.parse(colorMapRaw);
      colorMap[catId] = color;
      colorMap[nombre.toLowerCase()] = color;
      localStorage.setItem('fa_category_colors', JSON.stringify(colorMap));
    } catch (e) {
      console.error('Error saving category color mapping', e);
    }
  };

  // Date Check: Is inside current calendar month
  const isCurrentMonth = (dateStr: string) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } catch (e) {
      return false;
    }
  };

  // Calculate current monthly spending per category
  const getMonthlyCategorySpend = (catId: number) => {
    return transactions
      .filter(t => t.tipo === 'Gasto' && t.categoria_id === catId && isCurrentMonth(t.fecha_transaccion))
      .reduce((sum, t) => sum + t.monto, 0);
  };

  // Format COP
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Open Form Modal
  const openFormModal = (cat: Categoria | null = null) => {
    if (cat) {
      setEditingCategory(cat);
      setFormNombre(cat.nombre);
      setFormLimite(cat.limite_mensual.toString());
      setFormColor(getCategoryColor(cat));
    } else {
      setEditingCategory(null);
      setFormNombre('');
      setFormLimite('');
      setFormColor(BEAUTIFUL_COLORS[0]);
    }
    setShowFormModal(true);
  };

  // Submit form (Create / Edit)
  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(formLimite);
    if (!formNombre.trim() || isNaN(limit) || limit < 0) {
      alert('Por favor introduce un nombre válido y un límite mayor o igual a 0');
      return;
    }

    setLoading(true);

    if (usingFallback) {
      // LocalStorage mode
      const cachedCats = localStorage.getItem('fa_categories');
      let localCats: Categoria[] = cachedCats ? JSON.parse(cachedCats) : [];

      if (editingCategory) {
        // Edit mode
        localCats = localCats.map(c => 
          c.id === editingCategory.id 
            ? { ...c, nombre: formNombre.trim(), limite_mensual: limit, color: formColor } 
            : c
        );
        saveCategoryColorMapping(editingCategory.id, formColor, formNombre.trim());
      } else {
        // Create mode
        const newCat: Categoria = {
          id: Date.now(),
          nombre: formNombre.trim(),
          limite_mensual: limit,
          color: formColor
        };
        localCats.push(newCat);
        saveCategoryColorMapping(newCat.id, formColor, formNombre.trim());
      }

      setCategories(localCats);
      localStorage.setItem('fa_categories', JSON.stringify(localCats));
      setShowFormModal(false);
      setLoading(false);
    } else {
      // Supabase mode
      try {
        if (editingCategory) {
          const { error } = await supabase
            .from('categorias_presupuesto')
            .update({
              nombre: formNombre.trim(),
              limite_mensual: limit
            })
            .eq('id', editingCategory.id);

          if (error) throw error;
          saveCategoryColorMapping(editingCategory.id, formColor, formNombre.trim());
        } else {
          const { data, error } = await supabase
            .from('categorias_presupuesto')
            .insert({
              usuario_id: user.id,
              nombre: formNombre.trim(),
              limite_mensual: limit
            })
            .select();

          if (error) throw error;
          if (data && data[0]) {
            saveCategoryColorMapping(data[0].id, formColor, formNombre.trim());
          }
        }

        await loadDbData(user.id);
        setShowFormModal(false);
      } catch (err) {
        alert('Error al guardar en Supabase');
        console.error(err);
        setLoading(false);
      }
    }
  };

  // Open Safe Delete Modal
  const openDeleteModal = (cat: Categoria) => {
    setCategoryToDelete(cat);
    
    // Count transactions associated
    const count = transactions.filter(t => t.categoria_id === cat.id).length;
    setAffectedTxCount(count);
    
    // Pre-select target to reassign: pick first category that isn't this one
    const defaultTarget = categories.find(c => c.id !== cat.id);
    setReassignTargetId(defaultTarget ? defaultTarget.id.toString() : '');
    setDeleteAction('reassign');
    setConfirmText('');
    setShowDeleteModal(true);
  };

  // Execute Deletion Flow
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    if (affectedTxCount > 0 && deleteAction === 'delete_all' && confirmText.trim().toLowerCase() !== 'eliminar') {
      alert('Por favor escribe "ELIMINAR" para confirmar la eliminación masiva de transacciones.');
      return;
    }

    setIsDeleting(true);

    if (usingFallback) {
      // LocalStorage fallback
      try {
        let localTrans = [...transactions];
        
        if (affectedTxCount > 0) {
          if (deleteAction === 'reassign') {
            const targetId = Number(reassignTargetId);
            localTrans = localTrans.map(t => 
              t.categoria_id === categoryToDelete.id ? { ...t, categoria_id: targetId } : t
            );
          } else {
            // Delete all transactions
            localTrans = localTrans.filter(t => t.categoria_id !== categoryToDelete.id);
          }
          localStorage.setItem('fa_transactions', JSON.stringify(localTrans));
          setTransactions(localTrans);
        }

        // Delete category
        const cachedCats = localStorage.getItem('fa_categories');
        let localCats: Categoria[] = cachedCats ? JSON.parse(cachedCats) : [];
        localCats = localCats.filter(c => c.id !== categoryToDelete.id);
        localStorage.setItem('fa_categories', JSON.stringify(localCats));
        setCategories(localCats);

        setShowDeleteModal(false);
      } catch (err) {
        console.error(err);
      } finally {
        setIsDeleting(false);
      }
    } else {
      // Supabase Online Mode
      try {
        if (affectedTxCount > 0) {
          if (deleteAction === 'reassign') {
            const targetId = Number(reassignTargetId);
            const { error: txError } = await supabase
              .from('transacciones')
              .update({ categoria_id: targetId })
              .eq('categoria_id', categoryToDelete.id);

            if (txError) throw txError;
          } else {
            // Delete all transactions associated
            const { error: txError } = await supabase
              .from('transacciones')
              .delete()
              .eq('categoria_id', categoryToDelete.id);

            if (txError) throw txError;
          }
        }

        // Delete category
        const { error: catError } = await supabase
          .from('categorias_presupuesto')
          .delete()
          .eq('id', categoryToDelete.id);

        if (catError) throw catError;

        await loadDbData(user.id);
        setShowDeleteModal(false);
      } catch (err) {
        alert('Error al eliminar categoría en Supabase');
        console.error(err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // General Calculations
  const totalMonthlyBudget = categories.reduce((sum, c) => sum + c.limite_mensual, 0);
  const totalMonthlySpend = categories.reduce((sum, c) => sum + getMonthlyCategorySpend(c.id), 0);
  const budgetRatio = totalMonthlyBudget > 0 ? Math.min((totalMonthlySpend / totalMonthlyBudget) * 100, 100) : 0;

  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-[#F0F2F6] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-800 flex overflow-hidden relative">
      
      {/* SIDEBAR NAVIGATION COMPONENT */}
      <Sidebar
        activePage="presupuestos"
        customName={customName}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        onShowSettings={() => setShowSettingsModal(true)}
        onLogout={handleLogout}
      />

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
                  <Sliders className="w-5 h-5 text-brand-primary" />
                  Presupuestos y Categorías
                </h1>
                <p className="text-xs text-slate-500 font-medium">Asigna límites de gastos mensuales por categoría</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
            <button
              onClick={() => openFormModal(null)}
              className="w-full sm:w-auto px-4 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-2xl transition duration-150 cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-primary/10"
            >
              <Plus className="w-4 h-4" />
              Nueva Categoría
            </button>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="p-4 md:p-10 space-y-8 flex-1">
          
          {/* General Budget Progress Card */}
          <div className="card-premium p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="space-y-2 w-full md:w-auto text-center md:text-left">
              <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Presupuesto Mensual Total</span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800">{formatCurrency(totalMonthlyBudget)}</h2>
              <p className="text-xs text-slate-500 font-semibold">
                Has consumido {formatCurrency(totalMonthlySpend)} ({budgetRatio.toFixed(0)}%) este mes
              </p>
            </div>
            
            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>Progreso de Consumo</span>
                <span className={`${budgetRatio > 85 ? 'text-rose-500' : budgetRatio > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {budgetRatio.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-[2px] border border-slate-200/50">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${budgetRatio}%`,
                    backgroundColor: budgetRatio > 85 ? '#ff4d4d' : budgetRatio > 50 ? '#ff9f43' : '#00a389'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Categories Grid list */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(cat => {
              const spent = getMonthlyCategorySpend(cat.id);
              const limit = cat.limite_mensual;
              const ratio = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
              const ratioColor = ratio > 85 ? 'text-rose-500' : ratio > 50 ? 'text-amber-500' : 'text-emerald-500';
              const colorTheme = getCategoryColor(cat);

              return (
                <div key={cat.id} className="card-premium p-6 flex flex-col justify-between h-[210px]">
                  
                  {/* Category Header */}
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Dot indicator with category color */}
                        <div 
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white shadow-sm"
                          style={{ backgroundColor: colorTheme }}
                        />
                        <h3 className="font-extrabold text-slate-800 text-base truncate">{cat.nombre}</h3>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => openFormModal(cat)}
                          title="Editar categoría"
                          className="p-1.5 hover:bg-slate-100 active:bg-slate-200 text-slate-500 hover:text-brand-primary rounded-lg transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(cat)}
                          title="Eliminar categoría"
                          className="p-1.5 hover:bg-rose-50 active:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 divide-x divide-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Gastado (Mes)</span>
                        <span className="text-sm font-extrabold text-slate-800 mt-0.5 block truncate">
                          {formatCurrency(spent)}
                        </span>
                      </div>
                      <div className="pl-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Presupuesto</span>
                        <span className="text-sm font-extrabold text-slate-800 mt-0.5 block truncate">
                          {formatCurrency(limit)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar inside card */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span>Progreso</span>
                      <span className={ratioColor}>{ratio.toFixed(0)}%</span>
                    </div>
                    
                    <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden p-[1px] border border-slate-150">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${ratio}%`,
                          backgroundColor: colorTheme
                        }}
                      />
                    </div>

                    {/* Exceeded Warning text */}
                    {spent > limit && limit > 0 && (
                      <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        ¡Has superado el límite mensual!
                      </span>
                    )}
                  </div>

                </div>
              );
            })}

            {categories.length === 0 && (
              <div className="col-span-full card-premium p-10 flex flex-col items-center justify-center text-center text-slate-500">
                <Coins className="w-12 h-12 text-slate-300 stroke-[1.2] mb-3 animate-bounce" />
                <span className="font-bold">No hay categorías disponibles</span>
                <p className="text-xs text-slate-400 mt-1">Crea una nueva categoría para administrar presupuestos</p>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* CREATE / EDIT CATEGORY MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-2xl relative">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Sliders className="w-5 h-5 text-brand-primary" />
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>

            <form onSubmit={handleSubmitCategory} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre de Categoría</label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej. Alimentación, Ropa, Gimnasio"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-primary focus:bg-white focus:outline-none transition text-slate-800 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Límite Mensual (COP)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formLimite}
                  onChange={(e) => setFormLimite(e.target.value)}
                  placeholder="Monto máximo por mes"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-primary focus:bg-white focus:outline-none transition text-slate-800 font-bold text-sm"
                />
              </div>

              {/* Color picker grid */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Selecciona un Color</label>
                <div className="grid grid-cols-5 gap-3.5">
                  {BEAUTIFUL_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-full aspect-square rounded-xl border-2 transition cursor-pointer relative ${
                        formColor === c ? 'border-slate-800 scale-105 shadow-md' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {formColor === c && (
                        <div className="absolute inset-0 m-auto w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/95 transition cursor-pointer text-sm"
                >
                  {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMART/SAFE DELETE MODAL */}
      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-[32px] p-6 md:p-8 border border-slate-150 shadow-2xl relative">
            
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <AlertTriangle className="w-7 h-7 flex-shrink-0" />
              <h3 className="text-xl font-bold">¿Eliminar la categoría "{categoryToDelete.nombre}"?</h3>
            </div>

            {affectedTxCount > 0 ? (
              <div className="space-y-5">
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-800 font-medium">
                  <span className="font-bold uppercase tracking-wider block mb-1">¡Advertencia!</span>
                  Esta categoría tiene <span className="font-extrabold">{affectedTxCount}</span> transacciones asociadas en el historial. Debes decidir qué hacer con ellas antes de eliminar la categoría.
                </div>

                {/* Option selector */}
                <div className="space-y-3">
                  <label className="flex items-start gap-2.5 p-3.5 border border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="deleteAction"
                      checked={deleteAction === 'reassign'}
                      onChange={() => setDeleteAction('reassign')}
                      className="mt-0.5"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Reasignar transacciones</span>
                      <span className="text-slate-500 font-semibold block mt-0.5">Asociar todas las transacciones a otra categoría existente.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3.5 border border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="deleteAction"
                      checked={deleteAction === 'delete_all'}
                      onChange={() => setDeleteAction('delete_all')}
                      className="mt-0.5 text-rose-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-rose-600 block">Eliminar transacciones permanentemente</span>
                      <span className="text-slate-500 font-semibold block mt-0.5 text-rose-800/80">
                        ¡Cuidado! Borrará todos los registros históricos asociados de la base de datos.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Dropdown for reassign */}
                {deleteAction === 'reassign' && (
                  <div className="space-y-1.5 animate-slide-up">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoría Destino</label>
                    {categories.filter(c => c.id !== categoryToDelete.id).length > 0 ? (
                      <select
                        value={reassignTargetId}
                        onChange={(e) => setReassignTargetId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 focus:ring-1 focus:ring-brand-primary/10 focus:outline-none shadow-sm cursor-pointer"
                      >
                        {categories
                          .filter(c => c.id !== categoryToDelete.id)
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                          ))
                        }
                      </select>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-[11px] text-amber-800 font-bold">
                        No hay otras categorías disponibles para reasignar. Debes crear otra primero o eliminar las transacciones.
                      </div>
                    )}
                  </div>
                )}

                {/* Text confirmation for deletion */}
                {deleteAction === 'delete_all' && (
                  <div className="space-y-1.5 animate-slide-up">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Escribe <span className="font-extrabold text-rose-600">ELIMINAR</span> para confirmar
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Escribe ELIMINAR en mayúsculas"
                      className="w-full px-4 py-3 bg-rose-50/20 border border-rose-200 rounded-2xl focus:border-rose-500 focus:outline-none transition text-rose-600 font-extrabold text-sm"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-500 py-4 leading-relaxed">
                Esta categoría no tiene transacciones asociadas y se puede eliminar de forma segura. ¿Deseas continuar?
              </p>
            )}

            <div className="pt-6 flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition cursor-pointer text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  isDeleting ||
                  (affectedTxCount > 0 && deleteAction === 'reassign' && !reassignTargetId) ||
                  (affectedTxCount > 0 && deleteAction === 'delete_all' && confirmText.trim().toLowerCase() !== 'eliminar')
                }
                onClick={handleDeleteCategory}
                className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition cursor-pointer text-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-2xl relative">
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
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-655 transition cursor-pointer"
              >
                <span className="text-xl font-bold block w-5 h-5 leading-none">×</span>
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
                  className="w-full px-4 py-3 bg-slate-55 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-primary focus:bg-white focus:outline-none transition text-slate-800 font-bold"
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
