import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sliders,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  activePage: 'inicio' | 'reportes' | 'presupuestos';
  customName: string;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  onShowSettings: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  activePage,
  customName,
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  onShowSettings,
  onLogout
}: SidebarProps) {
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('fa_sidebar_collapsed', String(!sidebarCollapsed));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

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
                onShowSettings();
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
                  onShowSettings();
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
            {/* Inicio */}
            <button
              onClick={() => {
                navigate('/');
                if (isMobile && onClose) onClose();
              }}
              title="Inicio"
              className={`sidebar-nav-btn w-full flex items-center rounded-2xl text-sm font-semibold transition cursor-pointer ${
                activePage === 'inicio'
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/10'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              } ${collapsed ? '' : 'gap-3.5 px-5 py-3.5'}`}
            >
              <Wallet className="w-5 h-5 flex-shrink-0" />
              <span className={collapsed ? 'sidebar-label-text' : ''}>Inicio</span>
            </button>
            
            {/* Estadísticas */}
            <button
              onClick={() => {
                navigate('/reportes');
                if (isMobile && onClose) onClose();
              }}
              title="Estadísticas"
              className={`sidebar-nav-btn w-full flex items-center rounded-2xl text-sm font-semibold transition cursor-pointer ${
                activePage === 'reportes'
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/10'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              } ${collapsed ? '' : 'gap-3.5 px-5 py-3.5'}`}
            >
              <TrendingUp className="w-5 h-5 flex-shrink-0" />
              <span className={collapsed ? 'sidebar-label-text' : ''}>Estadísticas</span>
            </button>

            {/* Presupuestos */}
            <button
              onClick={() => {
                navigate('/presupuestos');
                if (isMobile && onClose) onClose();
              }}
              title="Presupuestos"
              className={`sidebar-nav-btn w-full flex items-center rounded-2xl text-sm font-semibold transition cursor-pointer ${
                activePage === 'presupuestos'
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/10'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              } ${collapsed ? '' : 'gap-3.5 px-5 py-3.5'}`}
            >
              <Sliders className="w-5 h-5 flex-shrink-0" />
              <span className={collapsed ? 'sidebar-label-text' : ''}>Presupuestos</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions: Settings & Logout */}
        <div className={`p-4 border-t border-slate-50 space-y-1 bg-slate-50/50 flex flex-col ${collapsed ? 'items-center' : ''}`}>
          <button
            onClick={() => {
              onShowSettings();
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
            onClick={onLogout}
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
    <>
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
    </>
  );
}
