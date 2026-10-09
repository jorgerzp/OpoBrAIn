import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, User, KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const LoginModal = ({ isOpen, onClose }) => {
  const { login, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    clearError();

    const result = await login(username, password);
    if (result.success) {
      setSuccessMsg(`¡Bienvenido/a, ${result.user.nombre}!`);
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 700);
    }
  };

  const handleQuickFill = (userOption) => {
    setUsername(userOption);
    setPassword('Aprobado');
    clearError();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop con desenfoque suave */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal Card con estilo Warm Cream idéntico al diseño */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22 }}
          className="warm-cream-card rounded-3xl p-7 sm:p-9 max-w-md w-full text-[#443930] shadow-2xl relative z-10 space-y-6"
        >
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-[#e4dacd] text-[#78695c] hover:text-[#3e342b] transition"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Cabecera del modal */}
          <div className="space-y-1.5 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#9a897b] text-white flex items-center justify-center shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-light text-[#372d25] pt-1">Acceso a OpoBrAIn</h2>
            <p className="text-xs text-[#736457]">
              Inicia sesión con tu cuenta oficial para guardar tu progreso
            </p>
          </div>

          {/* Botones de autorelleno rápido para prueba inmediata */}
          <div className="space-y-1.5 bg-[#eae2d7] p-3 rounded-2xl border border-[#d8ccc0]">
            <span className="text-[11px] font-semibold text-[#6d5e51] uppercase tracking-wider block text-center">
              Acceso Rápido (Contraseña: Aprobado)
            </span>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="flex-1 py-1.5 px-3 bg-white/80 hover:bg-white text-[#3e342b] rounded-xl text-xs font-medium border border-[#d5c7b9] transition shadow-2xs text-center"
              >
                👤 admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('Nemesis')}
                className="flex-1 py-1.5 px-3 bg-white/80 hover:bg-white text-[#3e342b] rounded-xl text-xs font-medium border border-[#d5c7b9] transition shadow-2xs text-center"
              >
                👤 Nemesis
              </button>
            </div>
          </div>

          {/* Mensajes de error o éxito */}
          {error && (
            <div className="p-3 rounded-xl bg-[#fbeae7] border border-[#d8897c] text-[#7a392e] text-xs flex items-center gap-2">
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
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#736457]">
                Usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8a796b] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin o Nemesis"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-[#d8ccc0] text-[#3e342b] rounded-xl text-sm focus:outline-none focus:border-[#8a796b] focus:bg-white transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#736457]">
                Contraseña
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#8a796b] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Aprobado"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-[#d8ccc0] text-[#3e342b] rounded-xl text-sm focus:outline-none focus:border-[#8a796b] focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-[#3e342b] hover:bg-[#2c241d] text-white font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 transition shadow-md disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
