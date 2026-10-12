import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight,
  Check, 
  Minus, 
  Search, 
  CheckSquare, 
  Sliders, 
  RotateCcw,
  Sparkles,
  BookOpen,
  X,
  Layers
} from 'lucide-react';
import { BLOQUES_TEMARIO } from '../services/temarioData';

export const BloqueTemaSelector = ({ 
  selectedTopicIds = [], 
  selectedEpigrafeIds = [],
  onSelectionChange,
  onProceedToConfig,
  onStartAITest,
  onClose,
  disabled = false 
}) => {
  // Estado de qué bloques están desplegados (abiertos)
  const [openBlocks, setOpenBlocks] = useState({ 'bloque-1': true });
  // Estado de qué temas tienen desplegados sus apartados específicos
  const [openTopics, setOpenTopics] = useState({ 'b1-t1': true });
  const [searchQuery, setSearchQuery] = useState('');

  // Alternar apertura de un bloque
  const toggleBlockOpen = (bloqueId) => {
    setOpenBlocks((prev) => ({
      ...prev,
      [bloqueId]: !prev[bloqueId],
    }));
  };

  // Alternar apertura de apartados específicos de un tema
  const toggleTopicOpen = (topicId, e) => {
    if (e) e.stopPropagation();
    setOpenTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  // Abrir todos o cerrar todos los bloques
  const expandAll = () => {
    const allB = {};
    const allT = {};
    BLOQUES_TEMARIO.forEach((b) => { 
      allB[b.id] = true;
      b.temas.forEach((t) => { allT[t.id] = true; });
    });
    setOpenBlocks(allB);
    setOpenTopics(allT);
  };

  const collapseAll = () => {
    setOpenBlocks({});
    setOpenTopics({});
  };

  // Filtrado de bloques, temas y epígrafes según el buscador
  const bloquesFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return BLOQUES_TEMARIO;

    const q = searchQuery.toLowerCase().trim();
    return BLOQUES_TEMARIO.map((bloque) => {
      const matchBloque = bloque.nombre.toLowerCase().includes(q) || bloque.numeroRomano.toLowerCase().includes(q);
      const temasCoincidentes = bloque.temas.filter((t) => {
        const matchTitulo = t.titulo.toLowerCase().includes(q) || `tema ${t.numero}`.toLowerCase().includes(q);
        const matchLeyes = t.leyes && t.leyes.toLowerCase().includes(q);
        const matchEpigrafe = t.epigrafes?.some((e) => e.nombre.toLowerCase().includes(q));
        return matchTitulo || matchLeyes || matchEpigrafe;
      });

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

  // Manejar selección de un tema individual y sincronizar sus epígrafes
  const handleToggleTopic = (tema) => {
    if (disabled) return;
    const isTopicSelected = selectedTopicIds.includes(tema.id);
    const epigrafesTemaIds = tema.epigrafes?.map((e) => e.id) || [];

    let newTopicIds;
    let newEpigrafeIds;

    if (isTopicSelected) {
      // Deseleccionar tema y todos sus epígrafes
      newTopicIds = selectedTopicIds.filter((id) => id !== tema.id);
      newEpigrafeIds = selectedEpigrafeIds.filter((id) => !epigrafesTemaIds.includes(id));
    } else {
      // Seleccionar tema y todos sus epígrafes
      newTopicIds = [...selectedTopicIds, tema.id];
      newEpigrafeIds = Array.from(new Set([...selectedEpigrafeIds, ...epigrafesTemaIds]));
    }

    onSelectionChange(newTopicIds, newEpigrafeIds);
  };

  // Manejar selección de un bloque específico / epígrafe dentro de un tema
  const handleToggleEpigrafe = (tema, epigrafeId, e) => {
    if (e) e.stopPropagation();
    if (disabled) return;

    let newEpigrafeIds;
    if (selectedEpigrafeIds.includes(epigrafeId)) {
      newEpigrafeIds = selectedEpigrafeIds.filter((id) => id !== epigrafeId);
    } else {
      newEpigrafeIds = [...selectedEpigrafeIds, epigrafeId];
    }

    const epigrafesTemaIds = tema.epigrafes?.map((e) => e.id) || [];
    const hasAnyInTema = epigrafesTemaIds.some((id) => newEpigrafeIds.includes(id));

    let newTopicIds = [...selectedTopicIds];
    if (hasAnyInTema && !newTopicIds.includes(tema.id)) {
      newTopicIds.push(tema.id);
    } else if (!hasAnyInTema && newTopicIds.includes(tema.id)) {
      newTopicIds = newTopicIds.filter((id) => id !== tema.id);
    }

    onSelectionChange(newTopicIds, newEpigrafeIds);
  };

  // Seleccionar o deseleccionar todos los epígrafes de un tema
  const selectAllEpigrafesOfTopic = (tema, e) => {
    if (e) e.stopPropagation();
    if (disabled) return;
    const epigrafesTemaIds = tema.epigrafes?.map((e) => e.id) || [];
    const newTopicIds = selectedTopicIds.includes(tema.id) 
      ? selectedTopicIds 
      : [...selectedTopicIds, tema.id];
    const newEpigrafeIds = Array.from(new Set([...selectedEpigrafeIds, ...epigrafesTemaIds]));
    onSelectionChange(newTopicIds, newEpigrafeIds);
  };

  // Manejar selección de un bloque entero (selecciona todos los temas y todos sus epígrafes)
  const toggleEntireBlock = (bloque) => {
    if (disabled) return;
    const topicIdsInBlock = bloque.temas.map((t) => t.id);
    const epigrafesInBlock = bloque.temas.flatMap((t) => t.epigrafes?.map((e) => e.id) || []);
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

  // Seleccionar todos los 45 temas y todos sus 185 epígrafes
  const selectAllTopics = () => {
    if (disabled) return;
    const allTopicIds = BLOQUES_TEMARIO.flatMap((b) => b.temas.map((t) => t.id));
    const allEpigrafeIds = BLOQUES_TEMARIO.flatMap((b) => b.temas.flatMap((t) => t.epigrafes?.map((e) => e.id) || []));
    onSelectionChange(allTopicIds, allEpigrafeIds);
  };

  // Deseleccionar todo
  const clearSelection = () => {
    if (disabled) return;
    onSelectionChange([], []);
  };

  // Presets rápidos por bloque
  const selectPreset = (bloqueId) => {
    const b = BLOQUES_TEMARIO.find((item) => item.id === bloqueId);
    if (!b) return;
    const topicIds = b.temas.map((t) => t.id);
    const epigrafeIds = b.temas.flatMap((t) => t.epigrafes?.map((e) => e.id) || []);
    onSelectionChange(topicIds, epigrafeIds);
    setOpenBlocks({ [bloqueId]: true });
  };

  // Estadísticas de selección actual
  const totalTemasSeleccionados = selectedTopicIds.length;
  const totalTemasDisponibles = BLOQUES_TEMARIO.reduce((acc, b) => acc + b.temas.length, 0);
  const totalEpigrafesSeleccionados = selectedEpigrafeIds.length;

  return (
    <div className="flex flex-col h-[88vh] max-h-[700px] w-full text-[#3e342b] overflow-hidden bg-[#fbf9f5]">
      
      {/* 1. CABECERA FIJA SUPERIOR */}
      <div className="shrink-0 p-4 sm:p-5 border-b border-[#ded3c7] bg-[#f7f2ea] space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#3e342b] text-white uppercase tracking-wider">
                Paso 1 de 2
              </span>
              <span className="text-xs font-semibold text-[#8a796b] tracking-wider uppercase flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#8a796b]" /> Temario Oficial C1 AGE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-light text-[#342a22] truncate">
              Selección de Bloques, Temas y Apartados
            </h2>
            <p className="text-[11px] sm:text-xs text-[#736457] line-clamp-1">
              Despliega cualquier tema para seleccionar sus <strong>bloques específicos</strong> para un estudio más concreto y personalizado.
            </p>
          </div>

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
              placeholder="Buscar bloque, tema, apartado específico o ley (ej: Tribunal Constitucional, TREBEP, Excel)..."
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

      {/* 2. CUERPO SCROLLABLE JERÁRQUICO (Bloques -> Temas -> Bloques Específicos/Epígrafes) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar">
        {bloquesFiltrados.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#8a796b] bg-white/60 rounded-2xl border border-dashed border-[#d8ccc0]">
            No se han encontrado bloques, temas ni apartados que coincidan con "{searchQuery}".
          </div>
        ) : (
          bloquesFiltrados.map((bloque) => {
            const topicIdsInBlock = bloque.temas.map((t) => t.id);
            const selectedInBlock = topicIdsInBlock.filter((id) => selectedTopicIds.includes(id));
            const isAllSelected = topicIdsInBlock.length > 0 && selectedInBlock.length === topicIdsInBlock.length;
            const isPartiallySelected = selectedInBlock.length > 0 && !isAllSelected;
            const isBlockOpen = Boolean(openBlocks[bloque.id]);

            return (
              <div
                key={bloque.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  selectedInBlock.length > 0
                    ? 'bg-white border-[#9a897b] shadow-2xs'
                    : 'bg-white/85 border-[#d8ccc0] hover:bg-white'
                }`}
              >
                {/* Cabecera del Bloque Principal */}
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
                      title={isAllSelected ? 'Deseleccionar bloque entero' : 'Seleccionar bloque entero con todos sus apartados'}
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
                    title={isBlockOpen ? 'Ocultar temas' : 'Mostrar temas'}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isBlockOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Desplegable de Temas del Bloque */}
                <AnimatePresence>
                  {isBlockOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="border-t border-[#ded3c7] bg-[#fbf9f5] px-3 py-2 space-y-2"
                    >
                      {bloque.temas.map((tema) => {
                        const isTopicSelected = selectedTopicIds.includes(tema.id);
                        const epigrafesIds = tema.epigrafes?.map((e) => e.id) || [];
                        const selectedEpigrafesCount = epigrafesIds.filter((id) => selectedEpigrafeIds.includes(id)).length;
                        const isAllEpigrafesSelected = epigrafesIds.length > 0 && selectedEpigrafesCount === epigrafesIds.length;
                        const isPartiallyEpigrafes = selectedEpigrafesCount > 0 && !isAllEpigrafesSelected;
                        const isTopicOpen = Boolean(openTopics[tema.id]);

                        return (
                          <div
                            key={tema.id}
                            className={`rounded-xl border transition overflow-hidden ${
                              isTopicSelected
                                ? 'bg-white border-[#b5a392] shadow-2xs'
                                : 'bg-white/80 border-[#e5dcd1] hover:bg-white'
                            }`}
                          >
                            {/* Fila del Tema: Checkbox + Título + Botón de despliegue de apartados específicos */}
                            <div className="p-2.5 flex items-start justify-between gap-2 select-none">
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <button
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => handleToggleTopic(tema)}
                                  className={`w-4 h-4 mt-0.5 rounded-md border flex items-center justify-center shrink-0 transition cursor-pointer ${
                                    isAllEpigrafesSelected || (isTopicSelected && epigrafesIds.length === 0)
                                      ? 'bg-[#3e342b] border-[#3e342b] text-white'
                                      : isPartiallyEpigrafes
                                      ? 'bg-[#8a796b] border-[#8a796b] text-white'
                                      : 'bg-white border-[#cfc3b7] hover:border-[#8a796b]'
                                  }`}
                                  title={isTopicSelected ? 'Deseleccionar tema' : 'Seleccionar tema completo'}
                                >
                                  {(isAllEpigrafesSelected || (isTopicSelected && epigrafesIds.length === 0)) && (
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  )}
                                  {isPartiallyEpigrafes && (
                                    <Minus className="w-3 h-3 stroke-[3]" />
                                  )}
                                </button>

                                <div 
                                  onClick={(e) => toggleTopicOpen(tema.id, e)}
                                  className="min-w-0 flex-1 cursor-pointer"
                                >
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#ded3c7] text-[#4d4035] shrink-0">
                                      Tema {tema.numero}
                                    </span>
                                    <span className="text-xs font-semibold text-[#2d241d] leading-snug">
                                      {tema.titulo}
                                    </span>
                                  </div>
                                  {tema.leyes && (
                                    <p className="text-[10px] text-[#806f61] italic mt-0.5 line-clamp-1">
                                      ⚖️ {tema.leyes}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[#8a796b]">
                                    <span className="font-medium text-[#5e4f42]">
                                      {tema.epigrafes?.length || 0} apartados específicos
                                    </span>
                                    <span>•</span>
                                    <span className={selectedEpigrafesCount > 0 ? 'font-bold text-[#3e342b]' : ''}>
                                      {selectedEpigrafesCount} marcados
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {/* Botón para desplegar los apartados específicos del tema */}
                                <button
                                  type="button"
                                  onClick={(e) => toggleTopicOpen(tema.id, e)}
                                  className="px-2 py-1 rounded-lg bg-[#ede4d8] hover:bg-[#e2d6c8] text-[#4f4236] text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                  title={isTopicOpen ? 'Ocultar apartados específicos' : 'Ver apartados específicos de este tema'}
                                >
                                  <span>Apartados ({tema.epigrafes?.length || 0})</span>
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                      isTopicOpen ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>

                            {/* 3er NIVEL: LISTA DE BLOQUES ESPECÍFICOS / APARTADOS DE CADA TEMA */}
                            <AnimatePresence>
                              {isTopicOpen && tema.epigrafes && tema.epigrafes.length > 0 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.14 }}
                                  className="border-t border-[#e2d7cb] bg-[#f9f6f0] p-2.5 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-[#806f61] pb-1 px-1">
                                    <span className="font-bold uppercase tracking-wider">
                                      Bloques específicos del Tema {tema.numero}:
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => selectAllEpigrafesOfTopic(tema, e)}
                                      className="text-[#3e342b] hover:underline font-semibold cursor-pointer"
                                    >
                                      Marcar todos los apartados
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 gap-1">
                                    {tema.epigrafes.map((epigrafe) => {
                                      const isEpigrafeSelected = selectedEpigrafeIds.includes(epigrafe.id);
                                      return (
                                        <div
                                          key={epigrafe.id}
                                          onClick={(e) => handleToggleEpigrafe(tema, epigrafe.id, e)}
                                          className={`p-1.5 px-2.5 rounded-lg border flex items-center justify-between gap-2 transition cursor-pointer select-none text-left ${
                                            isEpigrafeSelected
                                              ? 'bg-[#eae0d4] border-[#a59485] text-[#2c221a]'
                                              : 'bg-white/90 border-[#e8dfd5] hover:bg-white text-[#524438]'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div
                                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition ${
                                                isEpigrafeSelected
                                                  ? 'bg-[#3e342b] border-[#3e342b] text-white'
                                                  : 'bg-white border-[#cfc3b7]'
                                              }`}
                                            >
                                              {isEpigrafeSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                              <span className="text-[11px] font-medium leading-snug truncate block">
                                                <strong className="text-[#3e342b] mr-1">{epigrafe.numero}.</strong>
                                                {epigrafe.nombre}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Acción directa de IA para este apartado específico */}
                                          {onStartAITest && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onStartAITest({
                                                  tema: tema.titulo,
                                                  bloque: bloque.nombre,
                                                  epigrafes: [epigrafe.nombre],
                                                });
                                              }}
                                              className="px-2 py-0.5 rounded-md bg-white hover:bg-[#ded3c7] text-[#4d4035] border border-[#d8ccc0] text-[9.5px] font-bold shrink-0 transition flex items-center gap-1 cursor-pointer"
                                              title={`Generar test con IA solo de: ${epigrafe.nombre}`}
                                            >
                                              <Sparkles className="w-2.5 h-2.5 text-[#8a796b]" />
                                              <span>Test IA</span>
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
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

      {/* 3. PIE DE PÁGINA FIJO INFERIOR */}
      <div className="shrink-0 p-3 sm:p-4 border-t border-[#ded3c7] bg-[#f3ede4] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-[#342a22]">
            {totalTemasSeleccionados} temas • {totalEpigrafesSeleccionados} apartados específicos marcados
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
            <span>Configurar Test ({totalTemasSeleccionados} temas)</span>
          </button>
        </div>
      </div>

    </div>
  );
};
