import React, { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function CalendarioTab({ fiscalCalendar, fiscalData }) {
  // Estado para gestionar si los modelos están completados manualmente
  const [modelStatus, setModelStatus] = useState({
    mod303: false,
    mod130: false,
    mod111: false,
    mod115: false,
    mod390: false,
    mod190: false,
    mod180: false,
  });

  // Cargar estado desde localStorage al montar o al cambiar de trimestre
  useEffect(() => {
    const savedStatus = localStorage.getItem(`fiscal_status_${fiscalCalendar.quarter}`);
    if (savedStatus) {
      setModelStatus(JSON.parse(savedStatus));
    } else {
      // Estado inicial por defecto
      setModelStatus({
        mod303: false,
        mod130: false,
        mod111: false,
        mod115: false,
        mod390: false,
        mod190: false,
        mod180: false,
      });
    }
  }, [fiscalCalendar.quarter]);

  // Función para alternar el estado y guardarlo
  const toggleStatus = (model) => {
    const newStatus = { ...modelStatus, [model]: !modelStatus[model] };
    setModelStatus(newStatus);
    localStorage.setItem(`fiscal_status_${fiscalCalendar.quarter}`, JSON.stringify(newStatus));
  };

  // Helper para renderizar el icono interactivo
  const renderStatusIcon = (model, isRequired) => {
    const isCompleted = modelStatus[model];
    
    if (isCompleted) {
      return (
        <button onClick={() => toggleStatus(model)} className="cursor-pointer transition-transform hover:scale-110" title="Marcar como pendiente">
          <CheckCircle2 className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" size={28} />
        </button>
      );
    }
    
    if (isRequired) {
      return (
        <button onClick={() => toggleStatus(model)} className="cursor-pointer transition-transform hover:scale-110" title="Marcar como presentado">
          <AlertTriangle className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] animate-pulse" size={28} />
        </button>
      );
    }

    return (
      <div title="No requerido este trimestre">
        <CheckCircle2 className="text-slate-600" size={28} />
      </div>
    );
  };
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-slate-900 p-12 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-500 p-4 rounded-3xl shadow-lg">
                <CalendarDays size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tighter uppercase italic">Ecosistema de Modelos</h3>
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-1">Cierre en Curso: {fiscalCalendar.quarter}</p>
              </div>
            </div>
            <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 block mb-1">Fecha Límite Hacienda Foral</span>
              <span className="font-black text-white">{fiscalCalendar.nextDeadline}</span>
            </div>
          </div>

          <p className="text-slate-400 mb-10 text-sm italic">
            El sistema ha detectado automáticamente tus obligaciones tributarias para este periodo basándose en tu actividad comercial, nóminas y alquileres.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* MODELO 303 */}
            <div className={`p-8 rounded-[32px] border transition-all uppercase font-black italic ${modelStatus.mod303 ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-black/20 border-white/10 hover:border-amber-500/30'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className={`font-black text-xl ${modelStatus.mod303 ? 'text-emerald-400' : 'text-amber-400'}`}>Modelo 303</h4>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">Liquidación de IVA</span>
                </div>
                {renderStatusIcon('mod303', true)}
              </div>
              <p className="text-3xl font-black mb-2">{Math.max(0, fiscalData.balanceIVA).toLocaleString('es-ES')} €</p>
              <p className="text-xs text-slate-400 italic normal-case font-medium">
                {modelStatus.mod303 ? 'Presentado correctamente.' : 'Pendiente de presentación (generado a partir de ventas y compras).'}
              </p>
            </div>

            {/* MODELO 130 */}
            <div className={`p-8 rounded-[32px] border transition-all uppercase font-black italic ${modelStatus.mod130 ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-black/20 border-white/10 hover:border-amber-500/30'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className={`font-black text-xl ${modelStatus.mod130 ? 'text-emerald-400' : 'text-amber-400'}`}>Modelo 130</h4>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">Pago Fraccionado IRPF</span>
                </div>
                {renderStatusIcon('mod130', true)}
              </div>
              <p className="text-3xl font-black mb-2">{fiscalData.provisionIRPF.toLocaleString('es-ES')} €</p>
              <p className="text-xs text-slate-400 italic normal-case font-medium">
                {modelStatus.mod130 ? 'Presentado correctamente.' : 'Pendiente (20% sobre tu rendimiento neto trimestral).'}
              </p>
            </div>

            {/* MODELO 111 */}
            <div className={`p-8 rounded-[32px] border transition-all uppercase font-black italic ${modelStatus.mod111 ? 'bg-emerald-900/20 border-emerald-500/50' : fiscalData.retencionesNominas > 0 ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-black/20 border-white/10 opacity-50'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className={`font-black text-xl ${modelStatus.mod111 ? 'text-emerald-400' : fiscalData.retencionesNominas > 0 ? 'text-indigo-400' : 'text-slate-400'}`}>Modelo 111</h4>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">Retenciones Trabajadores y Profesionales</span>
                </div>
                {renderStatusIcon('mod111', fiscalData.retencionesNominas > 0)}
              </div>
              <p className="text-3xl font-black mb-2">{fiscalData.retencionesNominas.toLocaleString('es-ES')} €</p>
              <p className="text-xs text-slate-400 italic normal-case font-medium">
                {modelStatus.mod111 ? 'Presentado correctamente.' : fiscalData.retencionesNominas > 0 ? 'Obligatorio por tener nóminas o facturas con retención.' : 'No tienes nóminas registradas este trimestre.'}
              </p>
            </div>

            {/* MODELO 115 */}
            <div className={`p-8 rounded-[32px] border transition-all uppercase font-black italic ${modelStatus.mod115 ? 'bg-emerald-900/20 border-emerald-500/50' : fiscalData.retencionesAlquiler > 0 ? 'bg-rose-900/30 border-rose-500/50' : 'bg-black/20 border-white/10 opacity-50'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className={`font-black text-xl ${modelStatus.mod115 ? 'text-emerald-400' : fiscalData.retencionesAlquiler > 0 ? 'text-rose-400' : 'text-slate-400'}`}>Modelo 115</h4>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">Retenciones Alquiler Local</span>
                </div>
                {renderStatusIcon('mod115', fiscalData.retencionesAlquiler > 0)}
              </div>
              <p className="text-3xl font-black mb-2">{fiscalData.retencionesAlquiler.toLocaleString('es-ES')} €</p>
              <p className="text-xs text-slate-400 italic normal-case font-medium">
                {modelStatus.mod115 ? 'Presentado correctamente.' : fiscalData.retencionesAlquiler > 0 ? 'Obligatorio por tener alquiler comercial activo.' : 'No hay gastos de alquiler registrados.'}
              </p>
            </div>
          </div>

          {/* Resumen Informativos Anuales */}
          <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 uppercase font-black italic">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-black uppercase tracking-widest text-xs text-slate-400">Modelos Informativos Anuales (Vencimiento Enero)</h4>
              <span className="text-[10px] text-slate-500 font-bold normal-case italic">Haz clic en cada modelo para marcar como presentado</span>
            </div>
            <div className="flex flex-wrap gap-4">
              {/* Modelo 390 */}
              <button
                onClick={() => toggleStatus('mod390')}
                className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all cursor-pointer ${
                  modelStatus.mod390 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                {modelStatus.mod390 ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Clock size={14} className="text-slate-400" />}
                390 (Resumen IVA) - {modelStatus.mod390 ? 'Presentado' : 'Pendiente'}
              </button>

              {/* Modelo 190 */}
              <button
                onClick={() => toggleStatus('mod190')}
                className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all cursor-pointer ${
                  modelStatus.mod190 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                    : fiscalData.retencionesNominas > 0 
                      ? 'bg-indigo-900/40 text-indigo-300 border-indigo-500/40 hover:border-indigo-400' 
                      : 'bg-slate-800/50 text-slate-500 border-slate-800'
                }`}
              >
                {modelStatus.mod190 ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Clock size={14} className="text-indigo-400" />}
                190 (Resumen Nóminas) - {modelStatus.mod190 ? 'Presentado' : 'Pendiente'}
              </button>

              {/* Modelo 180 */}
              <button
                onClick={() => toggleStatus('mod180')}
                className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all cursor-pointer ${
                  modelStatus.mod180 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                    : fiscalData.retencionesAlquiler > 0 
                      ? 'bg-rose-900/40 text-rose-300 border-rose-500/40 hover:border-rose-400' 
                      : 'bg-slate-800/50 text-slate-500 border-slate-800'
                }`}
              >
                {modelStatus.mod180 ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Clock size={14} className="text-rose-400" />}
                180 (Resumen Alquileres) - {modelStatus.mod180 ? 'Presentado' : 'Pendiente'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
