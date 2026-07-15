import React from 'react';
import { CalendarDays, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function CalendarioTab({ fiscalCalendar, fiscalData }) {
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
            <div className="bg-black/20 border border-white/10 p-8 rounded-[32px] hover:border-emerald-500/50 transition-all uppercase font-black italic">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-black text-xl text-emerald-400">Modelo 303</h4>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">Liquidación de IVA</span>
                </div>
                <CheckCircle2 className="text-emerald-500" size={24} />
              </div>
              <p className="text-3xl font-black mb-2">{Math.max(0, fiscalData.balanceIVA).toLocaleString('es-ES')} €</p>
              <p className="text-xs text-slate-400 italic normal-case font-medium">Generado a partir de ventas y compras.</p>
            </div>

            {/* MODELO 130 */}
            <div className="bg-black/20 border border-white/10 p-8 rounded-[32px] hover:border-emerald-500/50 transition-all uppercase font-black italic">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-black text-xl text-emerald-400">Modelo 130</h4>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">Pago Fraccionado IRPF</span>
                </div>
                <CheckCircle2 className="text-emerald-500" size={24} />
              </div>
              <p className="text-3xl font-black mb-2">{fiscalData.provisionIRPF.toLocaleString('es-ES')} €</p>
              <p className="text-xs text-slate-400 italic normal-case font-medium">20% sobre tu rendimiento neto trimestral.</p>
            </div>

            {/* MODELO 111 */}
            <div className={`p-8 rounded-[32px] border transition-all uppercase font-black italic ${fiscalData.retencionesNominas > 0 ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-black/20 border-white/10 opacity-50'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className={`font-black text-xl ${fiscalData.retencionesNominas > 0 ? 'text-indigo-400' : 'text-slate-400'}`}>Modelo 111</h4>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">Retenciones Trabajadores y Profesionales</span>
                </div>
                {fiscalData.retencionesNominas > 0 ? <AlertTriangle className="text-amber-400" size={24} /> : <CheckCircle2 className="text-slate-600" size={24} />}
              </div>
              <p className="text-3xl font-black mb-2">{fiscalData.retencionesNominas.toLocaleString('es-ES')} €</p>
              <p className="text-xs text-slate-400 italic normal-case font-medium">
                {fiscalData.retencionesNominas > 0 ? 'Obligatorio por tener nóminas o facturas con retención.' : 'No tienes nóminas registradas este trimestre.'}
              </p>
            </div>

            {/* MODELO 115 */}
            <div className={`p-8 rounded-[32px] border transition-all uppercase font-black italic ${fiscalData.retencionesAlquiler > 0 ? 'bg-rose-900/30 border-rose-500/50' : 'bg-black/20 border-white/10 opacity-50'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className={`font-black text-xl ${fiscalData.retencionesAlquiler > 0 ? 'text-rose-400' : 'text-slate-400'}`}>Modelo 115</h4>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">Retenciones Alquiler Local</span>
                </div>
                {fiscalData.retencionesAlquiler > 0 ? <AlertTriangle className="text-amber-400" size={24} /> : <CheckCircle2 className="text-slate-600" size={24} />}
              </div>
              <p className="text-3xl font-black mb-2">{fiscalData.retencionesAlquiler.toLocaleString('es-ES')} €</p>
              <p className="text-xs text-slate-400 italic normal-case font-medium">
                {fiscalData.retencionesAlquiler > 0 ? 'Obligatorio por tener alquiler comercial activo.' : 'No hay gastos de alquiler registrados.'}
              </p>
            </div>
          </div>

          {/* Resumen Informativos Anuales */}
          <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 uppercase font-black italic">
            <h4 className="font-black uppercase tracking-widest text-xs text-slate-400 mb-6">Modelos Informativos Anuales (Enero)</h4>
            <div className="flex flex-wrap gap-4">
              <span className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">390 (Resumen IVA)</span>
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${fiscalData.retencionesNominas > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-800/50 text-slate-500'}`}>190 (Resumen Nóminas)</span>
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${fiscalData.retencionesAlquiler > 0 ? 'bg-rose-600 text-white' : 'bg-slate-800/50 text-slate-500'}`}>180 (Resumen Alquileres)</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
