import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Coins, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.user && data.session === null) {
          setMessage({
            type: 'success',
            text: '¡Registro exitoso! Por favor revisa tu correo electrónico para confirmar tu cuenta.',
          });
        } else {
          setMessage({
            type: 'success',
            text: '¡Registro exitoso! Iniciando sesión...',
          });
          setTimeout(() => navigate('/'), 1500);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        setMessage({
          type: 'success',
          text: 'Sesión iniciada correctamente. Redireccionando...',
        });
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Ocurrió un error inesperado.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh flex items-center justify-center px-4 relative overflow-hidden bg-[#F4F6FA]">
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-brand-primary/5 blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-brand-secondary/5 blur-[120px] animate-pulse-slow"></div>

      <div className="w-full max-w-md bg-white p-10 rounded-[32px] border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.03)] relative z-10 animate-float">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 mb-4">
            <Coins className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 mb-2">
            Finanzas<span className="text-brand-primary">App</span>
          </h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Control de gastos y presupuestos inteligentes
          </p>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-2xl border mb-6 text-xs font-semibold ${
              message.type === 'error'
                ? 'bg-rose-50 border-rose-100 text-rose-600'
                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-primary focus:bg-white focus:outline-none transition text-slate-800 text-sm placeholder-slate-400 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-primary focus:bg-white focus:outline-none transition text-slate-800 text-sm placeholder-slate-400 shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/95 transition duration-150 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isSignUp ? 'Crear Cuenta' : 'Ingresar'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Auth Toggle */}
        <div className="text-center mt-6">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-bold text-brand-primary hover:underline cursor-pointer uppercase tracking-wider"
          >
            {isSignUp
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>
      </div>
    </div>
  );
}
