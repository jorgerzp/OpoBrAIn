import React from 'react';
import { Dashboard } from './components/Dashboard';
import { TestRunner } from './components/TestRunner';
import { AmbientGlowCurve } from './components/AmbientGlowCurve';
import { LoginPage } from './components/LoginPage';
import { useTestStore } from './store/useTestStore';
import { useAuthStore } from './store/useAuthStore';
import { User, LogOut, Shield } from 'lucide-react';

export function App() {
  const { testActive, resetTest } = useTestStore();
  const { user, isAuthenticated, logout } = useAuthStore();

  // Requisito estricto: El Login es la primera pantalla.
  // Sin hacer login no se puede acceder al dashboard ni a ningún test.
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen warm-luxe-bg text-white flex flex-col relative overflow-x-hidden selection:bg-[#baa593] selection:text-white">
      
      {/* Estela luminosa curva que atraviesa el fondo */}
      <AmbientGlowCurve />

      {/* Barra de navegación superior 100% responsive (móvil y escritorio) */}
      <header className="relative z-20 max-w-6xl w-full mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Logotipo: Squircle blanco con el nombre de la app */}
        <div 
          onClick={resetTest}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group"
        >
          <div className="w-6 h-6 bg-white rounded-md shadow-sm transition-transform group-hover:scale-105 shrink-0" />
          <span className="text-lg sm:text-xl font-normal tracking-tight text-white">
            OpoBrAIn
          </span>
          <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/20 uppercase tracking-wider">
            C1
          </span>
        </div>

        {/* Menú y Perfil de Usuario activo (Optimizado para móvil) */}
        <nav className="flex items-center gap-2.5 sm:gap-6 text-sm font-normal text-white/85">
          <button 
            onClick={resetTest} 
            className="hover:text-white transition hidden md:inline-block text-xs sm:text-sm"
          >
            Dashboard
          </button>

          {/* Insignia del usuario conectado con estilo píldora de la referencia */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="pill-outline-btn rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-semibold flex items-center gap-1.5 bg-white/10 max-w-[140px] sm:max-w-none truncate">
              {user.rol === 'admin' ? (
                <Shield className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              ) : (
                <User className="w-3.5 h-3.5 text-white/90 shrink-0" />
              )}
              <span className="truncate">{user.username}</span>
            </span>

            {/* Botón Salir / Desconectar */}
            <button
              onClick={() => {
                resetTest();
                logout();
              }}
              className="p-1.5 sm:p-2 rounded-full hover:bg-white/15 active:bg-white/25 text-white/80 hover:text-white transition flex items-center justify-center"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </header>

      {/* Contenido Principal Protegido */}
      <main className="flex-1 relative z-10 flex flex-col justify-center px-2 sm:px-0">
        {testActive ? <TestRunner /> : <Dashboard />}
      </main>

      {/* Pie de página discreto */}
      <footer className="relative z-10 py-4 sm:py-6 text-center text-[10px] sm:text-[11px] text-white/40 tracking-wider px-4">
        OPOBRAIN STUDIO • CUERPO GENERAL ADMINISTRATIVO DEL ESTADO (C1)
      </footer>
    </div>
  );
}

export default App;
