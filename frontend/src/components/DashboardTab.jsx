import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Receipt, TrendingUp } from 'lucide-react';

export default function DashboardTab({ configFiscal, gastos, fiscalData }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 italic font-black">
        <KpiCard 
          title="Ingresos Brutos" 
          value={fiscalData.adjustedIngresos} 
          icon={ArrowUpRight} 
          color="bg-emerald-50 text-emerald-600" 
          desc="Ventas brutas registradas"
        />
        
        <KpiCard 
          title="Gastos Totales" 
          value={fiscalData.totalGastos} 
          icon={ArrowDownRight} 
          color="bg-rose-50 text-rose-500" 
          desc="Gastos estructurales + simulación"
        />
        
        <div className="p-8 rounded-[40px] shadow-2xl border border-slate-100 flex flex-col justify-between min-h-[220px] bg-slate-900 text-white shadow-slate-900/10">
          <div className="flex justify-between items-start">
            <label className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em]">Beneficio Neto (Bolsillo)</label>
            <div className="bg-white/10 p-3 rounded-2xl">
              <Wallet size={24} className="text-emerald-400" />
            </div>
          </div>
          <div>
            <p className="text-5xl font-black tracking-tighter leading-none">
              {(fiscalData.beneficioReal || 0).toLocaleString('es-ES')} €
            </p>
            <p className="text-[10px] text-emerald-500 font-bold mt-3 uppercase tracking-widest opacity-80">
              Dinero limpio tras impuestos (IVA + IRPF)
            </p>
          </div>
        </div>
      </div>

      {/* Summary metrics / Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100/50 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Receipt className="text-emerald-500" size={20} />
            <h3 className="font-black uppercase italic tracking-widest text-slate-800 text-sm">Resumen Fiscal Trimestral</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-wider">Previsión IVA (Modelo 303):</span>
              <span className={`px-3 py-1.5 rounded-xl font-black text-xs ${fiscalData.balanceIVA > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {fiscalData.balanceIVA.toLocaleString('es-ES')} €
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-wider">Previsión IRPF (Modelo 130):</span>
              <span className="bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl font-black text-xs">
                {fiscalData.provisionIRPF.toLocaleString('es-ES')} €
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-wider">Retenciones Alquiler (Modelo 115):</span>
              <span className="bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl font-black text-xs">
                {fiscalData.retencionesAlquiler.toLocaleString('es-ES')} €
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-wider">Retenciones Nóminas (Modelo 111):</span>
              <span className="bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl font-black text-xs">
                {fiscalData.retencionesNominas.toLocaleString('es-ES')} €
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100/50 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <TrendingUp className="text-emerald-500" size={20} />
            <h3 className="font-black uppercase italic tracking-widest text-slate-800 text-sm">Rendimiento Operativo</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-wider">Ingreso Imponible (Base Ventas):</span>
              <span className="text-slate-800 font-bold">
                {fiscalData.ventasBase.toLocaleString('es-ES')} €
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-wider">Gasto Deducible (Base Gastos):</span>
              <span className="text-slate-800 font-bold">
                {fiscalData.baseGastosDeducible.toLocaleString('es-ES')} €
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-wider">Variación de Existencias (Stock):</span>
              <span className={`font-bold ${fiscalData.variacionExistencias > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {fiscalData.variacionExistencias > 0 ? '+' : ''}{fiscalData.variacionExistencias.toLocaleString('es-ES')} €
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-wider">Rendimiento Neto Previo:</span>
              <span className="text-slate-800 font-black">
                {fiscalData.rendimientoNetoPrevio.toLocaleString('es-ES')} €
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, desc }) {
  return (
    <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 flex flex-col justify-between min-h-[220px] shadow-slate-200/60 shadow-lg">
      <div className="flex justify-between items-start">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{title}</label>
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon size={24} />
        </div>
      </div>
      <div>
        <p className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
          {value.toLocaleString('es-ES')} €
        </p>
        <p className="text-[9px] text-slate-400 font-bold mt-3 uppercase tracking-widest leading-none">
          {desc}
        </p>
      </div>
    </div>
  );
}
