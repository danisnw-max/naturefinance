import React, { useState, useEffect } from 'react';
import { User, Boxes, Percent, CheckCircle2 } from 'lucide-react';

export default function FiscalTab({ configFiscal, onSaveConfig }) {
  const [formData, setFormData] = useState({ ...configFiscal });
  const [saveStatus, setSaveStatus] = useState(null);

  // Sync state if configFiscal changes from parent (e.g., initial load)
  useEffect(() => {
    setFormData({ ...configFiscal });
  }, [configFiscal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isFloat = name.includes('inventario') || 
                    name.includes('ingresos') || 
                    name.includes('retencion') || 
                    name.includes('irpf') ||
                    name.includes('Pct') ||
                    name.includes('precio');
    setFormData(prev => ({
      ...prev,
      [name]: isFloat ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      await onSaveConfig(formData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('error');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-slate-900 p-12 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 max-w-4xl">
          
          <div className="flex items-center gap-4 mb-8 leading-none">
            <div className="bg-emerald-50 text-slate-900 p-3 rounded-2xl">
              <User size={32} />
            </div>
            <h3 className="text-4xl font-black tracking-tighter uppercase italic tracking-widest">Datos de Empresa</h3>
          </div>
          
          <p className="text-slate-400 mb-10 text-sm italic">
            Configuración de los parámetros fiscales y datos de la actividad para los modelos oficiales de la Hacienda Foral de Bizkaia.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Identificación */}
              <div className="space-y-6">
                <h4 className="text-emerald-400 font-black uppercase tracking-widest text-xs border-b border-white/10 pb-3 italic">Identificación</h4>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-black mb-2 block">Nombre Comercial</label>
                  <input 
                    type="text" 
                    name="comercio"
                    value={formData.comercio || ''} 
                    onChange={handleChange} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-medium outline-none focus:border-emerald-500 transition-colors" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-black mb-2 block">Titular (Nombre y Apellidos)</label>
                  <input 
                    type="text" 
                    name="titular"
                    value={formData.titular || ''} 
                    onChange={handleChange} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-medium outline-none focus:border-emerald-500 transition-colors" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-black mb-2 block">Dirección Fiscal</label>
                  <input 
                    type="text" 
                    name="direccion"
                    value={formData.direccion || ''} 
                    onChange={handleChange} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-medium outline-none focus:border-emerald-500 transition-colors" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-black mb-2 block">NIF / CIF</label>
                    <input 
                      type="text" 
                      name="nif"
                      value={formData.nif || ''} 
                      onChange={handleChange} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-medium outline-none focus:border-emerald-500 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-black mb-2 block">Territorio</label>
                    <input 
                      type="text" 
                      disabled 
                      value="Bizkaia" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-400 font-medium outline-none cursor-not-allowed" 
                    />
                  </div>
                </div>
              </div>

              {/* Régimen Tributario */}
              <div className="space-y-6">
                <h4 className="text-emerald-400 font-black uppercase tracking-widest text-xs border-b border-white/10 pb-3 italic">Régimen Tributario</h4>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-black mb-2 block">Epígrafe IAE</label>
                  <input 
                    type="text" 
                    name="epigrafe"
                    value={formData.epigrafe || ''} 
                    onChange={handleChange} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-medium outline-none focus:border-emerald-500 transition-colors" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-black mb-2 block">Régimen de IVA</label>
                  <select 
                    name="regimenIva"
                    value={formData.regimenIva || 'General'} 
                    onChange={handleChange} 
                    className="w-full bg-slate-800 border border-white/10 rounded-2xl p-4 text-white font-medium outline-none focus:border-emerald-500 appearance-none transition-colors"
                  >
                    <option className="bg-slate-900" value="General">General</option>
                    <option className="bg-slate-900" value="Recargo de Equivalencia">Recargo de Equivalencia</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-black mb-2 block">Régimen de IRPF</label>
                  <select 
                    name="regimenIrpf"
                    value={formData.regimenIrpf || 'Estimación Directa Simplificada'} 
                    onChange={handleChange} 
                    className="w-full bg-slate-800 border border-white/10 rounded-2xl p-4 text-white font-medium outline-none focus:border-emerald-500 appearance-none transition-colors"
                  >
                    <option className="bg-slate-900" value="Estimación Directa Simplificada">Estimación Directa Simplificada</option>
                    <option className="bg-slate-900" value="Estimación Directa Normal">Estimación Directa Normal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Existencias (COGS) */}
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
              <div className="flex items-center gap-3 mb-6">
                <Boxes className="text-emerald-400" size={24} />
                <h4 className="text-lg font-black uppercase tracking-widest leading-none text-emerald-400 italic">Declaración de Existencias (COGS)</h4>
              </div>
              <p className="text-slate-400 mb-8 text-xs font-medium normal-case">
                Hacienda exige ajustar tus compras según el stock real. No puedes deducirte la mercancía que has comprado pero que sigue en el almacén sin venderse.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] uppercase text-emerald-100/70 font-black mb-2 block">Inventario Inicial (1 Enero)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="inventarioInicial"
                      value={formData.inventarioInicial} 
                      onChange={handleChange} 
                      className="w-full bg-black/20 border border-emerald-500/30 rounded-2xl p-4 text-white font-black text-2xl outline-none focus:border-emerald-500 transition-colors" 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-xl">€</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-emerald-100/70 font-black mb-2 block">Inventario Final (31 Dic / Actual)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="inventarioFinal"
                      value={formData.inventarioFinal} 
                      onChange={handleChange} 
                      className="w-full bg-black/20 border border-emerald-500/30 rounded-2xl p-4 text-white font-black text-2xl outline-none focus:border-emerald-500 transition-colors" 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-xl">€</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Automatizaciones IRPF */}
            <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-[32px] p-8">
              <div className="flex items-center gap-3 mb-6">
                <Percent className="text-emerald-400" size={24} />
                <h4 className="text-lg font-black uppercase tracking-widest leading-none text-emerald-400 italic">Retenciones y Deducciones</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] uppercase text-emerald-100/70 font-black mb-2 block">% Retención Proyectada (Modelo 130)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="irpfProyectado"
                      value={formData.irpfProyectado} 
                      onChange={handleChange} 
                      className="w-full bg-black/20 border border-emerald-500/30 rounded-2xl p-4 text-white font-black text-2xl outline-none focus:border-emerald-500 transition-colors" 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-xl">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-emerald-100/70 font-black mb-2 block">% Gasto de Difícil Justificación (Bizkaia)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      disabled 
                      value={formData.dificilJustificacion} 
                      className="w-full bg-black/20 border border-emerald-500/30 rounded-2xl p-4 text-slate-400 font-black text-2xl outline-none cursor-not-allowed" 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-xl">%</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-emerald-500/20">
                  <label className="text-[10px] uppercase text-emerald-100/70 font-black mb-2 block">% Retención Nóminas (Modelo 111)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.1" 
                      name="retencionNominas"
                      value={formData.retencionNominas} 
                      onChange={handleChange} 
                      className="w-full bg-black/20 border border-indigo-500/30 rounded-2xl p-4 text-white font-black text-xl outline-none focus:border-indigo-500 transition-colors" 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-400 font-black text-xl">%</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-emerald-500/20">
                  <label className="text-[10px] uppercase text-emerald-100/70 font-black mb-2 block">% Retención Alquiler (Modelo 115)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="retencionAlquiler"
                      value={formData.retencionAlquiler} 
                      onChange={handleChange} 
                      className="w-full bg-black/20 border border-rose-500/30 rounded-2xl p-4 text-white font-black text-xl outline-none focus:border-rose-500 transition-colors" 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-rose-400 font-black text-xl">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parámetros del Convenio de Nóminas */}
            <div className="bg-slate-950/40 border border-white/5 rounded-[32px] p-8">
              <div className="flex items-center gap-3 mb-6">
                <Percent className="text-indigo-400" size={24} />
                <h4 className="text-lg font-black uppercase tracking-widest leading-none text-indigo-400 italic">Convenio y Nóminas (Bizkaia)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] uppercase text-emerald-100/70 font-black mb-2 block">% Contingencias Comunes</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      name="contingenciasComunesPct"
                      value={formData.contingenciasComunesPct || 4.70} 
                      onChange={handleChange} 
                      className="w-full bg-black/20 border border-slate-500/30 rounded-2xl p-4 text-white font-black text-xl outline-none focus:border-indigo-500 transition-colors" 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-emerald-100/70 font-black mb-2 block">% Desempleo</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      name="desempleoPct"
                      value={formData.desempleoPct || 1.55} 
                      onChange={handleChange} 
                      className="w-full bg-black/20 border border-slate-500/30 rounded-2xl p-4 text-white font-black text-xl outline-none focus:border-indigo-500 transition-colors" 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-emerald-100/70 font-black mb-2 block">% Formación Profesional</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      name="formacionProfesionalPct"
                      value={formData.formacionProfesionalPct || 0.10} 
                      onChange={handleChange} 
                      className="w-full bg-black/20 border border-slate-500/30 rounded-2xl p-4 text-white font-black text-xl outline-none focus:border-indigo-500 transition-colors" 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-emerald-100/70 font-black mb-2 block">Precio Hora Extra (€)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.5"
                      name="precioHoraExtra"
                      value={formData.precioHoraExtra || 15.00} 
                      onChange={handleChange} 
                      className="w-full bg-black/20 border border-slate-500/30 rounded-2xl p-4 text-white font-black text-xl outline-none focus:border-indigo-500 transition-colors" 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-xl">€</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 uppercase font-black italic">
              <button 
                type="submit" 
                disabled={saveStatus === 'saving'}
                className="bg-emerald-500 text-slate-900 px-10 py-5 rounded-[24px] hover:bg-emerald-400 shadow-xl transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
              >
                {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'success' ? '¡Configuración Guardada!' : 'Guardar Configuración'}
                {saveStatus === 'success' && <CheckCircle2 size={16} />}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
