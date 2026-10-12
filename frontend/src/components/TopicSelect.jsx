import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Check, 
  Minus, 
  Search, 
  BookOpen, 
  Layers, 
  CheckSquare, 
  RotateCcw,
  Sliders,
  Sparkles
} from 'lucide-react';
import { BLOQUES_TEMARIO } from '../services/temarioData';

export const TopicSelect = ({ 
  selectedTopicIds = [], 
  selectedEpigrafeIds = [],
  onSelectionChange, 
  onOpenConfigModal,
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBlocks, setExpandedBlocks] = useState({ 'bloque-1': true });
  const [expandedTopics, setExpandedTopics] = useState({});
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

  // Alternar apertura de los temas de un bloque específico
  const toggleBlockAccordion = (bloqueId, e) => {
    if (e) e.stopPropagation();
    setExpandedBlocks((prev) => ({
      ...prev,
      [bloqueId]: !prev[bloqueId],
    }));
  };

  // Alternar apertura de los apartados de un tema específico
  const toggleTopicAccordion = (topicId, e) => {
    if (e) e.stopPropagation();
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  // Checkbox a nivel de bloque entero (selecciona o deselecciona todos los temas y epígrafes del bloque)
  const handleToggleBlockCheck = (bloque, e) => {
    if (e) e.stopPropagation();
    if (disabled) return;

    const topicIdsInBlock = bloque.temas.map((t) => t.id);
    const epigrafesInBlock = bloque.temas.flatMap((t) => t.epigrafes?.map((item) => item.id) || []);
    const allSelected = topicIdsInBlock.every((id) => selectedTopicIds.includes(id));

    let newTopicIds;
    let newEpigrafeIds;

    if (allSelected) {
      newTopicIds = selectedTopicIds.filter((id) => !topicIdsInBlock.includes(id));
      newEpigrafeIds = selectedEpigrafeIds.filter((id) => !epigrafesInBlock.includes(id));
    } else {
      newTopicIds = Array.from(new Set([...selectedTopicIds, ...topicIdsInBlock]));
      newEpigrafeIds = Array.from(new Set([...selectedEpigrafeIds, ...epigrafesInBlock]));
    }

    onSelectionChange(newTopicIds, newEpigrafeIds);
  };

  // Checkbox de un tema individual (selecciona o deselecciona todos sus epígrafes)
  const handleToggleTopic = (tema, e) => {
    if (e) e.stopPropagation();
    if (disabled) return;

    const isTopicSelected = selectedTopicIds.includes(tema.id);
    const epigrafesTemaIds = tema.epigrafes?.map((item) => item.id) || [];

    let newTopicIds;
    let newEpigrafeIds;

    if (isTopicSelected) {
      newTopicIds = selectedTopicIds.filter((id) => id !== tema.id);
      newEpigrafeIds = selectedEpigrafeIds.filter((id) => !epigrafesTemaIds.includes(id));
    } else {
      newTopicIds = [...selectedTopicIds, tema.id];
      newEpigrafeIds = Array.from(new Set([...selectedEpigrafeIds, ...epigrafesTemaIds]));
    }

    onSelectionChange(newTopicIds, newEpigrafeIds);
  };

  // Checkbox de un epígrafe / bloque específico individual
  const handleToggleEpigrafe = (tema, epigrafeId, e) => {
    if (e) e.stopPropagation();
    if (disabled) return;

    let newEpigrafeIds;
    if (selectedEpigrafeIds.includes(epigrafeId)) {
      newEpigrafeIds = selectedEpigrafeIds.filter((id) => id !== epigrafeId);
    } else {
      newEpigrafeIds = [...selectedEpigrafeIds, epigrafeId];
    }

    const epigrafesTemaIds = tema.epigrafes?.map((item) => item.id) || [];
    const hasAnyInTema = epigrafesTemaIds.some((id) => newEpigrafeIds.includes(id));

    let newTopicIds = [...selectedTopicIds];
    if (hasAnyInTema && !newTopicIds.includes(tema.id)) {
      newTopicIds.push(tema.id);
    } else if (!hasAnyInTema && newTopicIds.includes(tema.id)) {
      newTopicIds = newTopicIds.filter((id) => id !== tema.id);
    }

    onSelectionChange(newTopicIds, newEpigrafeIds);
  };

  // Seleccionar todo el temario (los 45 temas y todos los epígrafes)
  const handleSelectAll = (e) => {
    if (e) e.stopPropagation();
    const allTopicIds = BLOQUES_TEMARIO.flatMap((b) => b.temas.map((t) => t.id));
    const allEpigrafeIds = BLOQUES_TEMARIO.flatMap((b) => b.temas.flatMap((t) => t.epigrafes?.map((item) => item.id) || []));
    onSelectionChange(allTopicIds, allEpigrafeIds);
  };

  // Deseleccionar todo
  const handleClearAll = (e) => {
    if (e) e.stopPropagation();
    onSelectionChange([], []);
  };

  // Filtrado de bloques y temas con el buscador
  const bloquesFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return BLOQUES_TEMARIO;

    const q = searchTerm.toLowerCase().trim();
    return BLOQUES_TEMARIO.map((bloque) => {
      const matchBloque = bloque.nombre.toLowerCase().includes(q) || bloque.numeroRomano.toLowerCase().includes(q);
      const temasMatch = bloque.temas.filter((t) =>
        t.titulo.toLowerCase().includes(q) ||
        `tema ${t.numero}`.toLowerCase().includes(q) ||
        (t.leyes && t.leyes.toLowerCase().includes(q)) ||
        t.epigrafes?.some((e) => e.nombre.toLowerCase().includes(q))
      );

      if (matchBloque) return bloque;
      if (temasMatch.length > 0) {
        return {
          ...bloque,
          temas: temasMatch,
        };
      }
      return null;
    }).filter(Boolean);
  }, [searchTerm]);

  // Texto resumen para el botón disparador del desplegable
  const triggerSummary = useMemo(() => {
    if (!selectedTopicIds || selectedTopicIds.length === 0) {
      return {
        badge: 'Temario C1',
        titulo: 'Seleccionar bloques o temas...',
        subtitulo: 'Ningún tema seleccionado',
      };
    }

    if (selectedTopicIds.length === 45) {
      return {
        badge: 'Todo C1',
        titulo: 'Los 6 Bloques Oficiales (45 temas)',
        subtitulo: 'Temario estatal completo seleccionado',
      };
    }

    // Comprobar si hay bloques completos seleccionados
    const bloquesCompletos = BLOQUES_TEMARIO.filter((b) =>
      b.temas.every((t) => selectedTopicIds.includes(t.id))
    );

    if (bloquesCompletos.length === 1 && selectedTopicIds.length === bloquesCompletos[0].temas.length) {
      const b = bloquesCompletos[0];
      return {
        badge: b.numeroRomano,
        titulo: `${b.numeroRomano}: ${b.nombre}`,
        subtitulo: `Bloque entero (${b.temas.length} temas)`,
      };
    }

    if (selectedTopicIds.length === 1) {
      const topicId = selectedTopicIds[0];
      let found = null;
      for (const b of BLOQUES_TEMARIO) {
        const t = b.temas.find((item) => item.id === topicId);
        if (t) {
          found = { bloque: b.numeroRomano, tema: t };
          break;
        }
      }
      if (found) {
        const epCount = found.tema.epigrafes?.filter((e) => selectedEpigrafeIds.includes(e.id)).length || 0;
        const totalEp = found.tema.epigrafes?.length || 0;
        const epSub = epCount === totalEp || epCount === 0 
          ? 'Tema completo' 
          : `${epCount} de ${totalEp} apartados seleccionados`;

        return {
          badge: `${found.bloque} • T${found.tema.numero}`,
          titulo: `Tema ${found.tema.numero}: ${found.tema.titulo}`,
          subtitulo: epSub,
        };
      }
    }

    return {
      badge: `${selectedTopicIds.length} temas`,
      titulo: `${selectedTopicIds.length} temas seleccionados`,
      subtitulo: `${selectedEpigrafeIds.length} apartados específicos seleccionados`,
    };
  }, [selectedTopicIds, selectedEpigrafeIds]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      
      {/* Botón Disparador del Desplegable */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/90 hover:bg-white border border-[#d8ccc0] hover:border-[#9a897b] text-[#3e342b] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shadow-2xs transition-all active:scale-[0.99] text-left disabled:opacity-50 cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="shrink-0 text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-[#ebe3d8] text-[#54463a] border border-[#d8ccc0] tracking-wider uppercase">
            {triggerSummary.badge}
          </span>

          <div className="min-w-0 flex-1">
            <span className="text-xs sm:text-sm font-semibold text-[#372d25] truncate block">
              {triggerSummary.titulo}
            </span>
            <span className="text-[10px] text-[#7d6f62] truncate block">
              {triggerSummary.subtitulo}
            </span>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[#8a796b] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Menú Desplegable Flotante Jerárquico: Bloques -> Temas -> Apartados */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 top-full mt-2 z-50 warm-cream-card rounded-2xl p-2.5 sm:p-3 shadow-2xl border border-[#d8ccc0] bg-[#f9f6f0] text-[#3e342b] w-full max-w-full sm:min-w-[440px]"
          >
            {/* Buscador Rápido de Temas y Leyes */}
            <div className="pb-2 border-b border-[#ded3c7] space-y-1.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8a796b] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar bloque, tema, apartado o ley (ej: CE, Word, 39/2015)..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white/95 border border-[#d8ccc0] text-[#3e342b] rounded-xl text-xs placeholder-[#9a897b] focus:outline-none focus:border-[#8a796b] transition"
                  autoFocus
                />
              </div>

              {/* Botones de selección rápida en el desplegable */}
              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[#4f4236] hover:text-[#2c221a] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>Marcar los 45 temas</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[#8a796b] hover:text-[#3e342b] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Deseleccionar</span>
                </button>
              </div>
            </div>

            {/* LISTA DE BLOQUES */}
            <div className="max-h-72 overflow-y-auto py-1.5 space-y-1.5 pr-1 custom-scrollbar">
              {bloquesFiltrados.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#8a796b]">
                  No se encontraron bloques ni temas que coincidan con la búsqueda.
                </div>
              ) : (
                bloquesFiltrados.map((bloque) => {
                  const topicIdsInBlock = bloque.temas.map((t) => t.id);
                  const selectedInBlock = topicIdsInBlock.filter((id) => selectedTopicIds.includes(id));
                  const isAllSelected = topicIdsInBlock.length > 0 && selectedInBlock.length === topicIdsInBlock.length;
                  const isPartiallySelected = selectedInBlock.length > 0 && !isAllSelected;
                  const isExpanded = Boolean(expandedBlocks[bloque.id]);

                  return (
                    <div
                      key={bloque.id}
                      className="rounded-xl border border-[#ded3c7] bg-white/90 overflow-hidden transition-all shadow-2xs"
                    >
                      {/* Cabecera del Bloque */}
                      <div
                        onClick={(e) => toggleBlockAccordion(bloque.id, e)}
                        className={`p-2.5 flex items-center justify-between gap-2 cursor-pointer select-none transition ${
                          selectedInBlock.length > 0 ? 'bg-[#ede5da]' : 'hover:bg-[#f5ede3]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={(e) => handleToggleBlockCheck(bloque, e)}
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition cursor-pointer ${
                              isAllSelected
                                ? 'bg-[#3e342b] border-[#3e342b] text-white'
                                : isPartiallySelected
                                ? 'bg-[#8a796b] border-[#8a796b] text-white'
                                : 'bg-white border-[#cfc3b7] hover:border-[#8a796b]'
                            }`}
                            title={isAllSelected ? 'Deseleccionar bloque' : 'Seleccionar bloque entero'}
                          >
                            {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            {isPartiallySelected && <Minus className="w-3 h-3 stroke-[3]" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#ded3c7] text-[#4d4035]">
                                {bloque.numeroRomano}
                              </span>
                              <span className="text-xs font-bold text-[#342a22] truncate">
                                {bloque.nombre}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#7a6b5e]">
                              {selectedInBlock.length}/{bloque.temas.length} seleccionados
                            </div>
                          </div>
                        </div>

                        <div className="p-1 text-[#8a796b]">
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* TEMAS DENTRO DEL BLOQUE */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="border-t border-[#ded3c7] bg-[#fdfbf7] p-1.5 space-y-1"
                          >
                            {bloque.temas.map((tema) => {
                              const isTopicSelected = selectedTopicIds.includes(tema.id);
                              const epigrafesIds = tema.epigrafes?.map((e) => e.id) || [];
                              const selectedEpigrafesCount = epigrafesIds.filter((id) => selectedEpigrafeIds.includes(id)).length;
                              const isAllEpigrafesSelected = epigrafesIds.length > 0 && selectedEpigrafesCount === epigrafesIds.length;
                              const isPartiallyEpigrafes = selectedEpigrafesCount > 0 && !isAllEpigrafesSelected;
                              const isTopicOpen = Boolean(expandedTopics[tema.id]);

                              return (
                                <div
                                  key={tema.id}
                                  className={`rounded-lg border text-left transition select-none overflow-hidden ${
                                    isTopicSelected
                                      ? 'bg-[#eae0d4] border-[#b5a392]'
                                      : 'bg-white/80 border-[#eee5dc] hover:bg-white'
                                  }`}
                                >
                                  <div 
                                    onClick={(e) => handleToggleTopic(tema, e)}
                                    className="p-2 flex items-start gap-2 cursor-pointer"
                                  >
                                    <div
                                      className={`w-3.5 h-3.5 mt-0.5 rounded border flex items-center justify-center shrink-0 transition ${
                                        isAllEpigrafesSelected || (isTopicSelected && epigrafesIds.length === 0)
                                          ? 'bg-[#3e342b] border-[#3e342b] text-white'
                                          : isPartiallyEpigrafes
                                          ? 'bg-[#8a796b] border-[#8a796b] text-white'
                                          : 'bg-white border-[#d0c4b9]'
                                      }`}
                                    >
                                      {(isAllEpigrafesSelected || (isTopicSelected && epigrafesIds.length === 0)) && (
                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                      )}
                                      {isPartiallyEpigrafes && (
                                        <Minus className="w-2.5 h-2.5 stroke-[3]" />
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="text-[9.5px] font-bold px-1 py-0.2 rounded bg-[#ded3c7] text-[#4d4035] shrink-0">
                                            Tema {tema.numero}
                                          </span>
                                          <span className="text-[11.5px] font-medium leading-tight truncate">
                                            {tema.titulo}
                                          </span>
                                        </div>

                                        {tema.epigrafes && tema.epigrafes.length > 0 && (
                                          <button
                                            type="button"
                                            onClick={(e) => toggleTopicAccordion(tema.id, e)}
                                            className="text-[9.5px] font-bold text-[#705e4f] hover:text-[#3e342b] px-1 py-0.5 rounded bg-white/70 border border-[#d8ccc0] shrink-0 flex items-center gap-0.5"
                                          >
                                            <span>{tema.epigrafes.length} ap.</span>
                                            <ChevronDown
                                              className={`w-3 h-3 transition-transform ${
                                                isTopicOpen ? 'rotate-180' : ''
                                              }`}
                                            />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Desplegable de epígrafes específicos dentro de TopicSelect */}
                                  <AnimatePresence>
                                    {isTopicOpen && tema.epigrafes && tema.epigrafes.length > 0 && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.12 }}
                                        className="border-t border-[#ded3c7] bg-[#f5ede4] p-2 space-y-1"
                                      >
                                        {tema.epigrafes.map((epigrafe) => {
                                          const isEpigrafeSelected = selectedEpigrafeIds.includes(epigrafe.id);
                                          return (
                                            <div
                                              key={epigrafe.id}
                                              onClick={(e) => handleToggleEpigrafe(tema, epigrafe.id, e)}
                                              className={`p-1 px-2 rounded-md border text-[10.5px] flex items-center gap-2 cursor-pointer transition ${
                                                isEpigrafeSelected
                                                  ? 'bg-white border-[#3e342b] font-medium text-[#2d2218]'
                                                  : 'bg-white/60 border-[#e3d7cb] text-[#554639] hover:bg-white'
                                              }`}
                                            >
                                              <div
                                                className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${
                                                  isEpigrafeSelected
                                                    ? 'bg-[#3e342b] border-[#3e342b] text-white'
                                                    : 'bg-white border-[#c8bcaf]'
                                                }`}
                                              >
                                                {isEpigrafeSelected && <Check className="w-2 h-2 stroke-[3]" />}
                                              </div>
                                              <span className="truncate">
                                                <strong>{epigrafe.numero}.</strong> {epigrafe.nombre}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
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

            {/* Barra inferior */}
            <div className="pt-2 border-t border-[#ded3c7] flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-[#554639]">
                {selectedTopicIds.length} temas ({selectedEpigrafeIds.length} ap.)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#eee5dc] hover:bg-[#e2d7cc] text-[#4d4035] text-xs font-semibold transition cursor-pointer"
                >
                  Cerrar
                </button>
                {onOpenConfigModal && (
                  <button
                    type="button"
                    disabled={selectedTopicIds.length === 0}
                    onClick={() => {
                      setIsOpen(false);
                      onOpenConfigModal();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#3e342b] hover:bg-[#282019] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Configurar Test</span>
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
