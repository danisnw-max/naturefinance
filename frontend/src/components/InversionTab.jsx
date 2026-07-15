import React, { useState } from 'react';
import { PieChart, Calculator, Trash2, Plus, Calendar } from 'lucide-react';

export default function InversionTab({ 
  inversiones, 
  onSaveInversion, 
  onDeleteInversion, 
  amortizaciones, 
  inversionStats 
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInv, setNewInv] = useState({
    concepto: '',
    categoria: 'Equipamiento',
    importe: '',
    vidaUtil: '4',
    fecha: new Date().toISOString().split('T')[0]
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInv(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newInv.concepto || !newInv.importe) return;
    
    onSaveInversion({
      concepto: newInv.concepto,
      categoria: newInv.categoria,
      importe: parseFloat(newInv.importe),
      vidaUtil: parseInt(newInv.vidaUtil) || 0,
      fecha: newInv.fecha
    });

    setNewInv({
      concepto: '',
      categoria: 'Equipamiento',
      importe: '',
      vidaUtil: '4',
      fecha: new Date().toISOString().split('T')[0]
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 italic font-black">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Inversión Acumulada</label>
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
              <PieChart size={24} />
            </div>
          </div>
          <div>
            <p className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
              {(inversionStats.totalInversion || 0).toLocaleString('es-ES')} €
            </p>
            <p className="text-[9px] text-slate-400 font-bold mt-3 uppercase tracking-widest leading-none">
              Activos y stock inicial
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Amortización Anual Deducible</label>
            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
              <Calculator size={24} />
            </div>
          </div>
          <div>
            <p className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
              {(inversionStats.totalDeducibleAnual || 0).toLocaleString('es-ES')} €
            </p>
            <p className="text-[9px] text-slate-400 font-bold mt-3 uppercase tracking-widest leading-none">
              Gasto deducible anualizado
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Retorno de la Inversión (ROI)</label>
            <div className="bg-slate-100 text-slate-700 p-3 rounded-2xl">
              <PieChart size={24} className="text-slate-600" />
            </div>
          </div>
          <div>
            <p className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
              {inversionStats.mesesROI > 0 ? inversionStats.mesesROI.toFixed(1) : '∞'}
            </p>
            <p className="text-[9px] text-slate-400 font-bold mt-3 uppercase tracking-widest leading-none">
              Meses de beneficio real para recuperar inversión
            </p>
          </div>
        </div>
      </div>

      {/* Add form toggle */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black italic uppercase tracking-widest text-slate-800">
          Activos de Inversión y Stock
        </h3>
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="bg-slate-900 text-white px-8 py-4 rounded-[24px] shadow-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"
        >
          {showAddForm ? 'Cancelar' : 'Añadir Inversión'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white grid grid-cols-1 md:grid-cols-12 gap-6 items-end relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <div className="col-span-1 md:col-span-3 z-10">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-3 block tracking-widest">Fecha</label>
            <input 
              type="date" 
              name="fecha" 
              value={newInv.fecha} 
              onChange={handleInputChange} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>

          <div className="col-span-1 md:col-span-3 z-10">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-3 block tracking-widest">Categoría</label>
            <select 
              name="categoria" 
              value={newInv.categoria} 
              onChange={handleInputChange} 
              className="w-full bg-slate-800 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
            >
              <option value="Equipamiento">Equipamiento</option>
              <option value="Local">Local/Reforma</option>
              <option value="Stock">Stock Inicial</option>
              <option value="Otros">Fondo Maniobra / Otros</option>
            </select>
          </div>

          <div className="col-span-1 md:col-span-4 z-10">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-3 block tracking-widest">Concepto / Activo</label>
            <input 
              type="text" 
              name="concepto" 
              required 
              placeholder="Ej. Ordenador, Reforma Local, Stock Inicial" 
              value={newInv.concepto} 
              onChange={handleInputChange} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>

          <div className="col-span-1 md:col-span-2 z-10">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-3 block tracking-widest">Importe (€)</label>
            <input 
              type="number" 
              name="importe" 
              required 
              placeholder="0.00" 
              value={newInv.importe} 
              onChange={handleInputChange} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 text-xl font-bold" 
            />
          </div>

          <div className="col-span-1 md:col-span-3 z-10">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-3 block tracking-widest">Vida Útil (Años)</label>
            <input 
              type="number" 
              name="vidaUtil" 
              min="0" 
              placeholder="0 = No amortizable" 
              value={newInv.vidaUtil} 
              onChange={handleInputChange} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500" 
            />
            <p className="text-[8px] text-slate-400 mt-2">Pon 0 para stock o bienes que no sufren depreciación lineal.</p>
          </div>

          <div className="col-span-1 md:col-span-9 flex justify-end gap-4 z-10 font-black uppercase italic">
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)} 
              className="bg-white/5 border border-white/10 px-8 py-4 rounded-[20px] text-xs hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="bg-emerald-500 text-slate-900 px-10 py-4 rounded-[20px] text-xs hover:bg-emerald-400 shadow-xl transition-all hover:scale-[1.02]"
            >
              Añadir Activo
            </button>
          </div>
        </form>
      )}

      {/* Table of investments */}
      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100/50 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50">
                <th className="py-6 px-10">Concepto / Activo</th>
                <th className="py-6 px-10 text-center">Fecha</th>
                <th className="py-6 px-10 text-center">Vida Útil</th>
                <th className="py-6 px-10 text-right">Amort. Anual</th>
                <th className="py-6 px-10 text-right">Amort. Mensual</th>
                <th className="py-6 px-10 text-right">Valor Original</th>
                <th className="py-6 px-10 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {inversiones.map(inv => {
                const anual = inv.vidaUtil > 0 ? (inv.importe / inv.vidaUtil) : 0;
                const mensual = anual / 12;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-8 px-10">
                      <p className="font-black text-slate-900 uppercase italic leading-none">{inv.concepto}</p>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">
                        {inv.categoria}
                      </span>
                    </td>
                    <td className="py-8 px-10 text-center text-sm font-bold text-slate-600">
                      {inv.fecha || '-'}
                    </td>
                    <td className="py-8 px-10 text-center font-black">
                      {inv.vidaUtil > 0 ? `${inv.vidaUtil} años` : 'No aplicable (Stock/Fondo)'}
                    </td>
                    <td className="py-8 px-10 text-right font-bold text-indigo-600">
                      {inv.vidaUtil > 0 ? `${anual.toLocaleString('es-ES')} €` : '-'}
                    </td>
                    <td className="py-8 px-10 text-right font-bold text-slate-600">
                      {inv.vidaUtil > 0 ? `${mensual.toLocaleString('es-ES')} €` : '-'}
                    </td>
                    <td className="py-8 px-10 text-right text-lg font-black text-slate-900">
                      {inv.importe.toLocaleString('es-ES')} €
                    </td>
                    <td className="py-8 px-10 text-center">
                      <button 
                        onClick={() => onDeleteInversion(inv.id)} 
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
