import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, BookOpen } from 'lucide-react';

export const TopicSelect = ({ temas = [], selectedTema, onSelectTema, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Cerrar al hacer clic fuera del desplegable
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formatear tema para asegurar número y título
  const formatearTema = (item, idx) => {
    if (typeof item === 'string') {
      const match = item.match(/^Tema\s*(\d+)[:\s]*(.*)$/i);
      if (match) {
        return {
          numero: parseInt(match[1], 10),
          titulo: item,
          textoCorto: match[2] || item,
          bloque: 'C1 AGE',
        };
      }
      return {
        numero: idx + 1,
        titulo: `Tema ${idx + 1}: ${item}`,
        textoCorto: item,
        bloque: 'C1 AGE',
      };
    }

    const num = item.numero || idx + 1;
    let tit = item.titulo || item.titulo_tema || `Tema ${num}`;
    if (!tit.toLowerCase().startsWith('tema')) {
      tit = `Tema ${num}: ${tit}`;
    }

    return {
      numero: num,
      titulo: tit,
      textoCorto: tit.replace(/^Tema \d+:\s*/i, ''),
      bloque: item.bloque || 'C1 AGE',
    };
  };

  const listaTemas = temas.map(formatearTema);

  // Encontrar el tema actualmente seleccionado
  const temaActivo = listaTemas.find(
    (t) => t.titulo.toLowerCase() === (selectedTema || '').toLowerCase()
  ) || listaTemas[0] || { numero: 1, titulo: 'Tema 1: La Constitución Española de 1978', textoCorto: 'La Constitución Española' };

  // Filtrado por buscador
  const temasFiltrados = listaTemas.filter((t) =>
    t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(t.numero).includes(searchTerm)
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Botón Disparador del Desplegable (Estilo Warm Cream idéntico al diseño) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/90 hover:bg-white border border-[#d8ccc0] hover:border-[#9a897b] text-[#3e342b] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shadow-2xs transition-all active:scale-[0.99] text-left disabled:opacity-50"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Badge del Número de Tema */}
          <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#ebe3d8] text-[#54463a] border border-[#d8ccc0] tracking-wider uppercase">
            Tema {temaActivo.numero}
          </span>

          {/* Título truncado */}
          <span className="text-xs sm:text-sm font-medium text-[#372d25] truncate">
            {temaActivo.textoCorto}
          </span>
        </div>

        {/* Flecha indicadora */}
        <ChevronDown
          className={`w-4 h-4 text-[#8a796b] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Menú Desplegable Flotante */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 top-full mt-2 z-50 warm-cream-card rounded-2xl p-2 shadow-2xl border border-[#d8ccc0] bg-[#f9f6f0] text-[#3e342b]"
          >
            {/* Buscador Rápido de Temas */}
            <div className="p-1 pb-2 border-b border-[#ded3c7]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8a796b] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar tema o número..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white/90 border border-[#d8ccc0] text-[#3e342b] rounded-xl text-xs placeholder-[#9a897b] focus:outline-none focus:border-[#8a796b] transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de Temas Scrollable */}
            <div className="max-h-56 overflow-y-auto py-1 space-y-1 pr-1 custom-scrollbar">
              {temasFiltrados.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#8a796b]">
                  No se encontraron temas coincidentes.
                </div>
              ) : (
                temasFiltrados.map((t) => {
                  const isSelected = t.titulo === temaActivo.titulo;
                  return (
                    <button
                      key={t.numero}
                      type="button"
                      onClick={() => {
                        onSelectTema(t.titulo);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition text-xs ${
                        isSelected
                          ? 'bg-[#eae0d4] text-[#2c231c] font-semibold border border-[#d5c7b9]'
                          : 'hover:bg-[#f0e8de] text-[#4d4035]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          isSelected
                            ? 'bg-[#3e342b] text-white border-[#3e342b]'
                            : 'bg-[#ebe3d8] text-[#54463a] border-[#d8ccc0]'
                        }`}>
                          Tema {t.numero}
                        </span>

                        <span className="truncate leading-normal">
                          {t.textoCorto}
                        </span>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-[#487e5b] shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
