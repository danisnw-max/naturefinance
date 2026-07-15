import React from 'react';
import { Gauge, Lightbulb, Target, TrendingUp, Zap, Wallet } from 'lucide-react';

export default function EstrategiaTab({
  simExtraCost,
  setSimExtraCost,
  simPriceChange,
  setSimPriceChange,
  simSueldo,
  setSimSueldo,
  fiscalData
}) {
  const excedente = fiscalData.beneficioReal - simSueldo;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 italic">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 font-black uppercase">
        
        {/* Sliders Card */}
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-emerald-500 p-3 rounded-2xl text-white">
              <Gauge size={24} />
            </div>
            <h3 className="text-2xl font-black tracking-tighter">Simulador de Escenarios</h3>
          </div>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between text-xs font-black uppercase mb-4">
                <label>Coste Estructural Extra</label>
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
                <label>Ajuste de Precios de Venta</label>
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
                <label>Tu Sueldo Objetivo (Retirada)</label>
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
                Dinero retirado mensualmente para tus finanzas personales. No afecta al cálculo fiscal de la empresa.
              </p>
            </div>
          </div>

          <div className="mt-10 p-8 bg-slate-900 rounded-[32px] text-white">
            <label className="text-[10px] text-emerald-400 block mb-2 font-black uppercase tracking-wider">
              Excedente Libre (Tras Impuestos y tu Sueldo)
            </label>
            <div className="flex items-baseline gap-4">
              <p className={`text-5xl font-black tracking-tighter ${excedente >= 0 ? 'text-white' : 'text-rose-400'}`}>
                {excedente.toLocaleString('es-ES')} €
              </p>
              <span className="text-xs text-slate-400">/ Trimestre</span>
            </div>
            
            <div className="mt-6 pt-5 border-t border-white/10 flex justify-between items-center text-[9px] uppercase font-black tracking-widest text-slate-400">
              <span>Benef. Empresa: {(fiscalData.beneficioReal || 0).toLocaleString('es-ES')} €</span>
              <span className="text-indigo-400">Tu Nómina Est.: {(simSueldo * 3).toLocaleString('es-ES')} €</span>
            </div>
          </div>
        </div>

        {/* Consulting Card */}
        <div className="bg-emerald-900 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/10 p-3 rounded-2xl text-emerald-400">
                <Lightbulb size={24} />
              </div>
              <h3 className="text-2xl font-black tracking-tighter">Recomendaciones de Consultoría</h3>
            </div>
            <div className="space-y-6">
              <InsightCard 
                icon={Target} 
                title="Objetivo de Rentabilidad" 
                msg={excedente >= 0 
                  ? "¡Felicidades! La tienda genera suficiente para cubrir tu sueldo objetivo y aún queda margen para reinvertir en stock." 
                  : `Actualmente te faltan ${Math.abs(excedente).toLocaleString('es-ES')}€ para poder cobrar tu sueldo objetivo sin descapitalizar el negocio.`
                } 
              />
              <InsightCard 
                icon={TrendingUp} 
                title="Oportunidad de Precios" 
                msg="Un aumento del 5% en precios compensa la contratación de una persona a 10h sin reducir tu beneficio neto actual." 
              />
              <InsightCard 
                icon={Zap} 
                title="Eficiencia Fiscal" 
                msg={`Estás aprovechando ${(fiscalData.gastoDificilJustificacion || 0).toFixed(0)}€ en deducciones automáticas por 'Gasto de Difícil Justificación' (10% en Bizkaia).`} 
              />
            </div>
          </div>
          
          <div className="relative z-10 bg-black/20 p-6 rounded-[28px] border border-white/5 mt-8">
            <h4 className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider mb-2">Consejo Estratégico</h4>
            <p className="text-xs font-semibold text-white/80 leading-relaxed italic normal-case">
              {simPriceChange < 0 
                ? "Bajar los precios disminuye la recaudación de IVA repercutido, pero reduce fuertemente tu margen operativo neto. Vigila el umbral de rentabilidad." 
                : "Aumentar un 2% los precios generales tiene un impacto imperceptible para el cliente final y aumenta tu beneficio neto en más de un 15%."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, title, msg }) {
  return (
    <div className="flex gap-4 group">
      <div className="bg-white/10 p-2 h-fit rounded-lg text-emerald-400 group-hover:bg-emerald-400 group-hover:text-slate-900 transition-all">
        <Icon size={20} />
      </div>
      <div className="uppercase">
        <h5 className="font-black text-white text-xs tracking-widest mb-1 leading-none">{title}</h5>
        <p className="text-xs font-medium text-emerald-100/60 leading-relaxed normal-case">{msg}</p>
      </div>
    </div>
  );
}
