import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, 
  User, 
  KeyRound, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { AmbientGlowCurve } from './AmbientGlowCurve';

export const LoginPage = () => {
  const { login, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    clearError();

    const result = await login(username, password);
    if (result.success) {
      setSuccessMsg(`¡Bienvenido/a, ${result.user.nombre}!`);
    }
  };

  return (
    <div className="min-h-screen warm-luxe-bg text-white flex flex-col justify-between relative overflow-x-hidden selection:bg-[#baa593] selection:text-white px-4 py-6 sm:py-8">
      {/* Estela luminosa de fondo idéntica a la imagen */}
      <AmbientGlowCurve />

      {/* Cabecera compacta y responsive */}
      <header className="relative z-20 max-w-5xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-white rounded-md shadow-sm" />
          <span className="text-xl font-normal tracking-tight text-white">
            OpoBrAIn
          </span>
        </div>

        <span className="pill-tag px-3.5 py-1 rounded-full text-[10px] tracking-widest uppercase">
          C1 ESTADO
        </span>
      </header>

      {/* Contenedor Central de Login (Mobile First) */}
      <main className="relative z-20 max-w-md w-full mx-auto my-auto py-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Título de Bienvenida */}
          <div className="text-center space-y-2">
            <div>
              <span className="pill-tag px-5 py-1 rounded-full inline-block tracking-[0.2em] text-[10px]">
                ACCESO RESTRINGIDO
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-white leading-tight">
              Start your journey
            </h1>
            <p className="text-white/80 text-xs sm:text-sm font-light max-w-xs mx-auto">
              Inicia sesión para acceder a los tests oficiales, temas con IA y tu batería de errores.
            </p>
          </div>

          {/* Tarjeta de Login (Estilo Warm Cream idéntica al diseño) */}
          <div className="warm-cream-card rounded-3xl p-6 sm:p-8 text-[#443930] shadow-2xl space-y-5">
            {/* Cabecera interna */}
            <div className="flex items-center gap-3 border-b border-[#ded3c7] pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#9a897b] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#372d25] leading-tight">
                  Identificación de Opositor
                </h2>
                <p className="text-xs text-[#736457]">
                  Cuerpo General Administrativo (AGE)
                </p>
              </div>
            </div>

            {/* Alertas de Error y Éxito */}
            {error && (
              <div className="p-3 rounded-xl bg-[#fbeae7] border border-[#d8897c] text-[#7a392e] text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-[#e2efe6] border border-[#74a584] text-[#285038] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Usuario */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#736457] block">
                  Usuario
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8a796b] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Usuario"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-[#d8ccc0] text-[#3e342b] rounded-xl text-sm focus:outline-none focus:border-[#8a796b] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#736457] block">
                  Contraseña
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#8a796b] absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full pl-10 pr-10 py-2.5 bg-white/80 border border-[#d8ccc0] text-[#3e342b] rounded-xl text-sm focus:outline-none focus:border-[#8a796b] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-1 text-[#8a796b] hover:text-[#3e342b] transition"
                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botón Principal (Táctil y Cómodo) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-[#3e342b] hover:bg-[#2c241d] active:scale-[0.98] text-white font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 transition shadow-md disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar a OpoBrAIn</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </main>

      {/* Pie de página */}
      <footer className="relative z-20 text-center text-[10px] sm:text-[11px] text-white/50 tracking-wider">
        OPOBRAIN STUDIO • ACCESO OFICIAL CUERPO GENERAL ADMINISTRATIVO (C1)
      </footer>
    </div>
  );
};
