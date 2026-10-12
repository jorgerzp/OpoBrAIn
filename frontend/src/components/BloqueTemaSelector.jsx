import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Check, 
  Minus, 
  Search, 
  CheckSquare, 
  Sliders, 
  RotateCcw,
  X
} from 'lucide-react';
import { BLOQUES_TEMARIO } from '../services/temarioData';

export const BloqueTemaSelector = ({ 
  selectedTopicIds = [], 
  onSelectionChange,
  onProceedToConfig,
  onClose,
  disabled = false 
}) => {
  // Estado de qué bloques están desplegados (abiertos)
  const [openBlocks, setOpenBlocks] = useState({ 'bloque-1': true });
  const [searchQuery, setSearchQuery] = useState('');

  // Alternar apertura de un bloque
  const toggleBlockOpen = (bloqueId) => {
    setOpenBlocks((prev) => ({
      ...prev,
      [bloqueId]: !prev[bloqueId],
    }));
  };

  // Abrir todos o cerrar todos
  const expandAll = () => {
    const all = {};
    BLOQUES_TEMARIO.forEach((b) => { all[b.id] = true; });
    setOpenBlocks(all);
  };

  const collapseAll = () => {
    setOpenBlocks({});
  };

  // Filtrado de bloques y temas según el buscador
  const bloquesFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return BLOQUES_TEMARIO;

    const q = searchQuery.toLowerCase().trim();
    return BLOQUES_TEMARIO.map((bloque) => {
      const matchBloque = bloque.nombre.toLowerCase().includes(q) || bloque.numeroRomano.toLowerCase().includes(q);
      const temasCoincidentes = bloque.temas.filter((t) => 
        t.titulo.toLowerCase().includes(q) ||
        `tema ${t.numero}`.toLowerCase().includes(q) ||
        (t.leyes && t.leyes.toLowerCase().includes(q))
      );

      if (matchBloque) return bloque;
      if (temasCoincidentes.length > 0) {
        return {
          ...bloque,
          temas: temasCoincidentes,
        };
      }
      return null;
    }).filter(Boolean);
  }, [searchQuery]);

  // Manejar selección de un tema individual
  const toggleTopic = (topicId) => {
    if (disabled) return;
    if (selectedTopicIds.includes(topicId)) {
      onSelectionChange(selectedTopicIds.filter((id) => id !== topicId));
    } else {
      onSelectionChange([...selectedTopicIds, topicId]);
    }
  };

  // Manejar selección de un bloque entero (checklist del bloque)
  const toggleEntireBlock = (bloque) => {
    if (disabled) return;
    const topicIdsInBlock = bloque.temas.map((t) => t.id);
    const allSelected = topicIdsInBlock.every((id) => selectedTopicIds.includes(id));

    if (allSelected) {
      onSelectionChange(selectedTopicIds.filter((id) => !topicIdsInBlock.includes(id)));
    } else {
      const newSelection = Array.from(new Set([...selectedTopicIds, ...topicIdsInBlock]));
      onSelectionChange(newSelection);
    }
  };

  // Seleccionar todos los temas de todos los bloques
  const selectAllTopics = () => {
    if (disabled) return;
    const allIds = BLOQUES_TEMARIO.flatMap((b) => b.temas.map((t) => t.id));
    onSelectionChange(allIds);
  };

  // Deseleccionar todos
  const clearSelection = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  // Presets rápidos para opositores
  const selectPreset = (bloqueId) => {
    const b = BLOQUES_TEMARIO.find((item) => item.id === bloqueId);
    if (!b) return;
    const ids = b.temas.map((t) => t.id);
    onSelectionChange(ids);
    setOpenBlocks({ [bloqueId]: true });
  };

  // Estadísticas de selección actual
  const totalTemasSeleccionados = selectedTopicIds.length;
  const totalTemasDisponibles = BLOQUES_TEMARIO.reduce((acc, b) => acc + b.temas.length, 0);

  return (
    <div className="flex flex-col h-[88vh] max-h-[680px] w-full text-[#3e342b] overflow-hidden bg-[#fbf9f5]">
      
      {/* 1. CABECERA FIJA SUPERIOR (Siempre visible en pantalla, incluye botón X para cerrar) */}
      <div className="shrink-0 p-4 sm:p-5 border-b border-[#ded3c7] bg-[#f7f2ea] space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#3e342b] text-white uppercase tracking-wider">
                Paso 1 de 2
              </span>
              <span className="text-xs font-semibold text-[#8a796b] tracking-wider uppercase">
                Temario Oficial C1
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-light text-[#342a22] truncate">
              Selección de Bloques y Temas
            </h2>
            <p className="text-[11px] sm:text-xs text-[#736457] line-clamp-1">
              Haz clic en cualquier bloque para desplegar sus temas o marca la casilla para seleccionarlo entero.
            </p>
          </div>

          {/* BOTÓN X PARA CERRAR LA VENTANA (Bien visible, con texto e icono) */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#ede5dc] active:scale-95 text-[#4d4035] border border-[#d8ccc0] text-xs font-bold shadow-2xs transition cursor-pointer shrink-0"
              title="Cerrar esta ventana (Esc)"
            >
              <X className="w-4 h-4 text-[#736457]" />
              <span className="hidden sm:inline">Cerrar</span>
            </button>
          )}
        </div>

        {/* Buscador + Acciones rápidas en cabecera */}
        <div className="space-y-2 pt-0.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8a796b] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tema o ley (ej: CE, 39/2015, TREBEP, Excel)..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#d8ccc0] focus:border-[#8a796b] rounded-xl text-xs sm:text-sm text-[#3e342b] placeholder-[#9a897b] focus:outline-none transition"
              disabled={disabled}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-[#8a796b] hover:text-[#3e342b]"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Botones de acción rápida y accesos a bloques */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={selectAllTopics}
                disabled={disabled}
                className="px-2.5 py-1 rounded-lg bg-[#eae1d5] hover:bg-[#ded2c4] text-[#4d4035] font-semibold text-[11px] transition flex items-center gap-1 cursor-pointer"
              >
                <CheckSquare className="w-3 h-3 text-[#54463a]" />
                <span>Marcar los 45 temas</span>
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={disabled || selectedTopicIds.length === 0}
                className="px-2.5 py-1 rounded-lg bg-[#f0e8de] hover:bg-[#e4d8cb] text-[#736457] text-[11px] transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Deseleccionar</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#7d6e61]">
              <button 
                type="button" 
                onClick={expandAll} 
                className="hover:underline hover:text-[#3e342b]"
              >
                Desplegar todos
              </button>
              <span>•</span>
              <button 
                type="button" 
                onClick={collapseAll} 
                className="hover:underline hover:text-[#3e342b]"
              >
                Plegar todos
              </button>
            </div>
          </div>

          {/* Píldoras de Bloques I al VI */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
            <span className="text-[10px] font-bold text-[#8a796b] uppercase shrink-0">Bloques:</span>
            {BLOQUES_TEMARIO.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => selectPreset(b.id)}
                disabled={disabled}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider shrink-0 bg-white hover:bg-[#eae1d5] text-[#524438] border border-[#d8ccc0] transition cursor-pointer"
              >
                {b.numeroRomano} ({b.temas.length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. CUERPO SCROLLABLE (Solo la lista de bloques y temas tiene scroll interior) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-2 custom-scrollbar">
        {bloquesFiltrados.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#8a796b] bg-white/60 rounded-2xl border border-dashed border-[#d8ccc0]">
            No se han encontrado bloques ni temas que coincidan con la búsqueda "{searchQuery}".
          </div>
        ) : (
          bloquesFiltrados.map((bloque) => {
            const topicIdsInBlock = bloque.temas.map((t) => t.id);
            const selectedInBlock = topicIdsInBlock.filter((id) => selectedTopicIds.includes(id));
            const isAllSelected = topicIdsInBlock.length > 0 && selectedInBlock.length === topicIdsInBlock.length;
            const isPartiallySelected = selectedInBlock.length > 0 && !isAllSelected;
            const isOpen = Boolean(openBlocks[bloque.id]);

            return (
              <div
                key={bloque.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  selectedInBlock.length > 0
                    ? 'bg-white border-[#9a897b] shadow-2xs'
                    : 'bg-white/85 border-[#d8ccc0] hover:bg-white'
                }`}
              >
                {/* Cabecera del Bloque: Checkbox + Título + Flecha desplegable */}
                <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleEntireBlock(bloque)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition cursor-pointer ${
                        isAllSelected
                          ? 'bg-[#3e342b] border-[#3e342b] text-white'
                          : isPartiallySelected
                          ? 'bg-[#8a796b] border-[#8a796b] text-white'
                          : 'bg-white border-[#c8bcaf] hover:border-[#8a796b]'
                      }`}
                      title={isAllSelected ? 'Deseleccionar bloque' : 'Seleccionar bloque entero'}
                    >
                      {isAllSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      {isPartiallySelected && <Minus className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div 
                      onClick={() => toggleBlockOpen(bloque.id)} 
                      className="cursor-pointer min-w-0 flex-1 select-none"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#eae1d5] text-[#554639] border border-[#d8ccc0]">
                          {bloque.numeroRomano}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-[#342a22] truncate">
                          {bloque.nombre}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#736457]">
                        <span>{bloque.temas.length} temas</span>
                        <span>•</span>
                        <span className={selectedInBlock.length > 0 ? 'font-semibold text-[#3e342b]' : ''}>
                          {selectedInBlock.length} seleccionados
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleBlockOpen(bloque.id)}
                    className="p-1 rounded-lg hover:bg-[#eee6dc] text-[#8a796b] hover:text-[#3e342b] transition cursor-pointer shrink-0"
                    title={isOpen ? 'Ocultar temas' : 'Mostrar temas'}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Desplegable de Temas del Bloque */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="border-t border-[#ded3c7] bg-[#fbf9f5] px-3 py-1.5 space-y-1.5"
                    >
                      {bloque.temas.map((tema) => {
                        const isTopicSelected = selectedTopicIds.includes(tema.id);
                        return (
                          <div
                            key={tema.id}
                            onClick={() => toggleTopic(tema.id)}
                            className={`p-2 rounded-xl border flex items-start gap-2.5 transition cursor-pointer text-left select-none ${
                              isTopicSelected
                                ? 'bg-[#ede5da] border-[#a59485] text-[#2c231c]'
                                : 'bg-white/80 border-[#e5dcd1] hover:bg-white text-[#4f4236]'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 mt-0.5 rounded-md border flex items-center justify-center shrink-0 transition ${
                                isTopicSelected
                                  ? 'bg-[#3e342b] border-[#3e342b] text-white'
                                  : 'bg-white border-[#cfc3b7]'
                              }`}
                            >
                              {isTopicSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#ded3c7] text-[#4d4035] shrink-0">
                                  Tema {tema.numero}
                                </span>
                                <span className="text-xs font-medium text-[#2d241d] leading-snug">
                                  {tema.titulo}
                                </span>
                              </div>
                              {tema.leyes && (
                                <p className="text-[10.5px] text-[#806f61] italic line-clamp-1">
                                  ⚖️ {tema.leyes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* 3. PIE DE PÁGINA FIJO INFERIOR (100% visible siempre sin salirse de la pantalla) */}
      <div className="shrink-0 p-3 sm:p-4 border-t border-[#ded3c7] bg-[#f3ede4] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-[#342a22]">
            {totalTemasSeleccionados} de {totalTemasDisponibles} temas seleccionados
          </span>
          {totalTemasSeleccionados > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3e342b] text-white">
              {Math.round((totalTemasSeleccionados / totalTemasDisponibles) * 100)}%
            </span>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#eae1d5] text-[#554639] border border-[#d8ccc0] font-semibold text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            disabled={disabled || totalTemasSeleccionados === 0}
            onClick={onProceedToConfig}
            className="px-5 py-2.5 rounded-xl bg-[#3e342b] hover:bg-[#2a221b] active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-[#e0d6cb]" />
            <span>Configurar Test ({totalTemasSeleccionados})</span>
          </button>
        </div>
      </div>

    </div>
  );
};
