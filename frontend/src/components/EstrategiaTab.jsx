import React from 'react';
import { 
  Gauge, Lightbulb, Target, TrendingUp, Zap, Wallet, 
  ShieldCheck, AlertTriangle, ArrowUpRight, Scale, DollarSign, PiggyBank 
} from 'lucide-react';

export default function EstrategiaTab({
  simExtraCost,
  setSimExtraCost,
  simPriceChange,
  setSimPriceChange,
  simSueldo,
  setSimSueldo,
  fiscalData
}) {
  const excedente = (fiscalData.beneficioReal || 0) - (simSueldo * 3);
  const breakEvenDiario = fiscalData.breakEvenDiario || 0;
  const retiradaSegura = fiscalData.retiradaSeguraMensual || 0;
  const dificilJustifDisponible = fiscalData.margenDificilJustifDisponible || 0;
  const balanceIva = fiscalData.balanceIVA || 0;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 italic">
      
      {/* HEADER RADAR INVERSOR */}
      <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-400" size={32} />
              <h2 className="text-3xl font-black italic tracking-tight uppercase leading-none">Consultor Inversor & Defensor Fiscal</h2>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 normal-case italic">
              Inteligencia estratégica continua: Defensa tributaria Bizkaia, control de margen y asesoría de inversión en tiempo real.
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-5 py-3 rounded-2xl flex items-center gap-3">
            <Scale size={18} className="text-emerald-400" />
            <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">Escudo Fiscal Bizkaia Activo</span>
          </div>
        </div>

        {/* 4 RADAR CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          
          {/* Card 1: Break Even Diario */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Punto Equilibrio Diario</span>
              <Target size={18} className="text-indigo-400" />
            </div>
            <p className="text-3xl font-black text-white tracking-tighter leading-none">
              {breakEvenDiario.toLocaleString('es-ES', { maximumFractionDigits: 0 })} € / día
            </p>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 block normal-case">
              Ventas diarias laborables mínimas para cubrir costes + impuestos
            </span>
          </div>

          {/* Card 2: Retirada Mensual Segura */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sueldo / Retirada Segura</span>
              <PiggyBank size={18} className="text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-emerald-400 tracking-tighter leading-none">
              {retiradaSegura.toLocaleString('es-ES', { maximumFractionDigits: 0 })} € / mes
            </p>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 block normal-case">
              Máxima retirada personal garantizando reserva de impuestos
            </span>
          </div>

          {/* Card 3: Escudo IVA Deducible */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Balance IVA Trimestral</span>
              <Scale size={18} className={balanceIva > 0 ? 'text-amber-400' : 'text-emerald-400'} />
            </div>
            <p className={`text-3xl font-black tracking-tighter leading-none ${balanceIva > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {balanceIva > 0 ? `+${balanceIva.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €` : `${balanceIva.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €`}
            </p>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 block normal-case">
              {balanceIva > 0 ? 'Liquidación estimada a ingresar a Hacienda' : 'IVA compensable o a devolver'}
            </span>
          </div>

          {/* Card 4: Margen Difícil Justificación Bizkaia */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">10% Difícil Justif. Bizkaia</span>
              <Zap size={18} className="text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-white tracking-tighter leading-none">
              {(fiscalData.gastoDificilJustificacion || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })} €
            </p>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 block normal-case">
              {dificilJustifDisponible > 0 ? `Disponible tope legal: +${dificilJustifDisponible.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€` : 'Tope máximo anual alcanzado (4.000€)'}
            </span>
          </div>

        </div>
      </div>

      {/* SIMULADOR TÁCTICO & DIAGNÓSTICO CONSULTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 font-black uppercase">
        
        {/* Sliders Card */}
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-emerald-500 p-3 rounded-2xl text-white">
              <Gauge size={24} />
            </div>
            <h3 className="text-2xl font-black tracking-tighter">Simulador Táctico de Estrategia</h3>
          </div>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between text-xs font-black uppercase mb-4">
                <label>Coste Estructural Extra (Contrataciones / Inversiones)</label>
                <span className="text-emerald-600">+{simExtraCost.toLocaleString('es-ES')}€ / mes</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="5000" 
                step="100" 
                value={simExtraCost} 
                onChange={(e) => setSimExtraCost(parseInt(e.target.value) || 0)} 
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
              />
            </div>
            
            <div>
              <div className="flex justify-between text-xs font-black uppercase mb-4">
                <label>Ajuste Global de Precios en Tienda</label>
                <span className={simPriceChange >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                  {simPriceChange >= 0 ? '+' : ''}{simPriceChange}%
                </span>
              </div>
              <input 
                type="range" 
                min="-20" 
                max="20" 
                step="1" 
                value={simPriceChange} 
                onChange={(e) => setSimPriceChange(parseInt(e.target.value) || 0)} 
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between text-xs font-black uppercase mb-4">
                <label>Sueldo Objetivo Personal (Retirada)</label>
                <span className="text-indigo-600">-{simSueldo.toLocaleString('es-ES')}€ / mes</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="4000" 
                step="100" 
                value={simSueldo} 
                onChange={(e) => setSimSueldo(parseInt(e.target.value) || 0)} 
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
              />
              <p className="text-[10px] text-slate-400 mt-3 normal-case tracking-normal">
                Retirada sugerida en base a la caja limpia libre de reserva tributaria.
              </p>
            </div>
          </div>

          <div className="mt-10 p-8 bg-slate-900 rounded-[32px] text-white">
            <label className="text-[10px] text-emerald-400 block mb-2 font-black uppercase tracking-wider">
              Excedente Neto Libre (Tras Sueldo e Impuestos)
            </label>
            <div className="flex items-baseline gap-4">
              <p className={`text-5xl font-black tracking-tighter ${excedente >= 0 ? 'text-white' : 'text-rose-400'}`}>
                {excedente.toLocaleString('es-ES')} €
              </p>
              <span className="text-xs text-slate-400">/ Trimestre</span>
            </div>
            
            <div className="mt-6 pt-5 border-t border-white/10 flex justify-between items-center text-[9px] uppercase font-black tracking-widest text-slate-400">
              <span>Beneficio Empresa: {(fiscalData.beneficioReal || 0).toLocaleString('es-ES')} €</span>
              <span className="text-indigo-400">Retirada Total: {(simSueldo * 3).toLocaleString('es-ES')} €</span>
            </div>
          </div>
        </div>

        {/* Consulting & Chivato Card */}
        <div className="bg-emerald-950 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden flex flex-col justify-between border border-emerald-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-emerald-500/20 border border-emerald-500/30 p-3 rounded-2xl text-emerald-400">
                <Lightbulb size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tighter">Diagnóstico del Consultor Inversor</h3>
                <span className="text-[9px] text-emerald-400/80 font-bold uppercase tracking-widest">Recomendaciones automatizadas según tus números reales</span>
              </div>
            </div>

            <div className="space-y-6">
              
              {/* Alerta de Retirada */}
              <InsightCard 
                icon={simSueldo > retiradaSegura ? AlertTriangle : Target} 
                title="Evaluación de Retirada Personal" 
                msg={simSueldo <= retiradaSegura 
                  ? `Tu sueldo fijado (${simSueldo.toLocaleString('es-ES')}€/mes) está dentro del margen seguro recomendado (${retiradaSegura.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€/mes), protegiendo la liquidación de impuestos.` 
                  : `Precaución: Tu sueldo fijado (${simSueldo.toLocaleString('es-ES')}€/mes) supera la retirada segura mensual (${retiradaSegura.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€/mes). Podrías comprometer la reserva de impuestos del trimestre.`
                } 
                highlight={simSueldo > retiradaSegura}
              />

              {/* Escudo IVA / Compras */}
              <InsightCard 
                icon={TrendingUp} 
                title="Optimización de Compras / IVA" 
                msg={balanceIva > 500
                  ? `Tienes un saldo a ingresar de IVA de ${balanceIva.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€. Invertir en reposición de stock antes del cierre deducirá IVA e impulsará las ventas del próximo trimestre.`
                  : `Excelente balance de IVA deducible. Tu volumen de gastos con IVA mantiene la liquidación controlada.`
                } 
              />

              {/* Eficiencia Fiscal 10% Bizkaia */}
              <InsightCard 
                icon={Zap} 
                title="Escudo Fiscal 10% Bizkaia" 
                msg={`Estás deduciendo ${(fiscalData.gastoDificilJustificacion || 0).toFixed(0)}€ directamente de tu rendimiento neto sin necesidad de presentar facturas adicionales bajo la norma foral.`} 
              />

            </div>
          </div>
          
          <div className="relative z-10 bg-black/40 p-6 rounded-[28px] border border-white/10 mt-8">
            <h4 className="text-[10px] text-emerald-400 font-black uppercase tracking-wider mb-2">Dictamen de Inversión</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed normal-case italic">
              {simPriceChange < 0 
                ? "Una reducción en el PVP general castiga directamente el rendimiento neto y el margen de seguridad. Te aconsejamos ajustar ofertas por producto en lugar de descuentos generales." 
                : simPriceChange > 0 
                ? `Un incremento del ${simPriceChange}% en precios genera un excedente adicional limpio de impuestos, aumentando la capacidad de reinversión en catálogo.`
                : `Tu estructura actual requiere ventas medias de ${breakEvenDiario.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€/día para mantener la rentabilidad plena sin tensiones de caja.`
              }
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, title, msg, highlight }) {
  return (
    <div className="flex gap-4 group">
      <div className={`p-2.5 h-fit rounded-xl shrink-0 transition-all ${highlight ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/10 text-emerald-400 group-hover:bg-emerald-400 group-hover:text-slate-900'}`}>
        <Icon size={20} />
      </div>
      <div className="uppercase">
        <h5 className="font-black text-white text-xs tracking-widest mb-1 leading-none">{title}</h5>
        <p className="text-xs font-medium text-slate-300 leading-relaxed normal-case italic">{msg}</p>
      </div>
    </div>
  );
}
