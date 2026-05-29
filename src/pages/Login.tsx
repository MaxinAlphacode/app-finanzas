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
        
        // Supabase behavior on signup: if email confirmation is enabled, they need to verify.
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
    <div className="min-h-svh flex items-center justify-center px-4 relative overflow-hidden bg-[#090b11]">
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-brand-primary/10 blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-brand-secondary/10 blur-[120px] animate-pulse-slow"></div>

      <div className="w-full max-w-md glass p-8 rounded-2xl shadow-2xl relative z-10 animate-float">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 mb-3">
            <Coins className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Finanzas<span className="text-gradient">App</span>
          </h1>
          <p className="text-sm text-gray-400">
            Control de gastos hormiga y presupuestos inteligentes
          </p>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-xl border mb-6 text-sm ${
              message.type === 'error'
                ? 'bg-danger/10 border-danger/20 text-danger-300'
                : 'bg-success/10 border-success/20 text-success-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full pl-10 pr-4 py-3 bg-dark-surface/50 border border-dark-border rounded-xl focus:border-brand-primary focus:outline-none transition text-white placeholder-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-dark-surface/50 border border-dark-border rounded-xl focus:border-brand-primary focus:outline-none transition text-white placeholder-gray-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl shadow-lg glow-hover flex items-center justify-center gap-2 cursor-pointer transition"
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
            className="text-sm text-brand-accent hover:underline cursor-pointer"
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
