import React from 'react';
import { 
  X, Plus, Receipt, RefreshCcw, Zap, 
  Edit3, Trash2, Upload
} from 'lucide-react';

export default function GastosTab({ 
  gastos, 
  onSaveGasto, 
  onDeleteGasto, 
  onEditGasto,
  categories,
  showForm,
  setShowForm,
  nuevoGasto,
  setNuevoGasto,
  editingId,
  resetForm,
  page,
  pages,
  total,
  setPage,
  proveedores,
  onDirectDocUpload,
  filterYear,
  setFilterYear,
  filterQuarter,
  setFilterQuarter,
  filterMonth,
  setFilterMonth,
  filterSinJustificante,
  setFilterSinJustificante,
  summary,
  onGenerateRecurring
}) {

  const MONTHS = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  // Filter months to show based on selected quarter
  const filteredMonths = React.useMemo(() => {
    if (filterQuarter === 'all') return MONTHS;
    const q = parseInt(filterQuarter);
    return MONTHS.slice((q - 1) * 3, q * 3);
  }, [filterQuarter]);

  // Group visible items by month
  const groupedGastos = React.useMemo(() => {
    const groups = {};
    gastos.forEach(g => {
      const dateParts = g.fecha.split('-');
      const year = dateParts[0];
      const monthNum = parseInt(dateParts[1]);
      const monthObj = MONTHS.find(m => m.value === monthNum);
      const groupKey = `${year}-${monthNum}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          label: `${monthObj ? monthObj.label : 'Mes'} ${year}`,
          items: [],
          totalImporte: 0,
          totalIva: 0
        };
      }
      
      groups[groupKey].items.push(g);
      groups[groupKey].totalImporte += g.importe;
      
      const base = g.importe / (1 + (g.iva / 100));
      const cuota = g.importe - base;
      const pctIva = (g.deducibleIva ?? 100) / 100;
      groups[groupKey].totalIva += cuota * pctIva;
    });

    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
  }, [gastos]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevoGasto(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveGasto(e);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Header and Toggle form */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black italic uppercase tracking-widest text-slate-800">
          Historial de Gastos
        </h3>
        <button 
          onClick={() => { if(showForm) resetForm(); setShowForm(!showForm); }} 
          className="bg-slate-900 text-white px-8 py-4 rounded-[24px] shadow-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          {showForm ? <X size={20} className="text-rose-400" /> : <Plus size={20} className="text-emerald-400" />}
          <span className="font-bold text-sm uppercase tracking-widest">{showForm ? 'Cancelar' : 'Añadir Gasto'}</span>
        </button>
      </div>

      {/* Period Selection Bar & Sin Justificante Switch */}
      <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100/50 flex flex-col lg:flex-row gap-6 justify-between items-stretch lg:items-center">
        
        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-6">
          
          {/* Year Select */}
          <div className="flex flex-col">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Año</label>
            <select
              value={filterYear}
              onChange={(e) => {
                setFilterYear(parseInt(e.target.value));
                setFilterMonth('all');
              }}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Quarter buttons */}
          <div className="flex flex-col">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Trimestre</label>
            <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
              {['all', '1', '2', '3', '4'].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setFilterQuarter(q);
                    setFilterMonth('all');
                  }}
                  className={`px-3.5 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    filterQuarter === q
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {q === 'all' ? 'Todos' : `T${q}`}
                </button>
              ))}
            </div>
          </div>

          {/* Month Select */}
          <div className="flex flex-col">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Mes</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
            >
              <option value="all">Todos los meses</option>
              {filteredMonths.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {filterMonth !== 'all' && (
            <div className="flex flex-col">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Gastos Fijos</label>
              <button
                type="button"
                onClick={() => onGenerateRecurring(filterYear, filterMonth)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer h-10"
                title="Generar gastos fijos para este mes"
              >
                <RefreshCcw size={12} /> Autogenerar Fijos
              </button>
            </div>
          )}

        </div>

        {/* Sin Justificante Switch */}
        <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Filtro de Auditoría</p>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Buscar facturas pendientes</span>
          </div>
          <button
            type="button"
            onClick={() => setFilterSinJustificante(!filterSinJustificante)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
              filterSinJustificante 
                ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-md shadow-rose-50' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            ⚠️ Sin Justificante
          </button>
        </div>

      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Expenses */}
        <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col justify-between h-40">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Gastos ({filterQuarter !== 'all' ? `T${filterQuarter}` : 'Periodo'})</p>
          <div className="mt-4">
            <h4 className="text-3xl font-black tracking-tight text-rose-400 leading-none">
              -{summary.total_importe.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </h4>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 block">Importe bruto total acumulado</span>
          </div>
        </div>

        {/* VAT Deducible */}
        <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col justify-between h-40">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">IVA Soportado Deducible</p>
          <div className="mt-4">
            <h4 className="text-3xl font-black tracking-tight text-emerald-400 leading-none">
              +{summary.total_iva_deducible.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </h4>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 block">Deducción estimada del periodo</span>
          </div>
        </div>

        {/* Justification Coverage */}
        <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col justify-between h-40">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cobertura Justificantes</p>
            <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
              {summary.count_total > 0 ? Math.round((summary.count_justificantes / summary.count_total) * 100) : 100}%
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-black tracking-tight text-indigo-300 leading-none">
              {summary.count_justificantes} / {summary.count_total}
            </h4>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-indigo-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${summary.count_total > 0 ? (summary.count_justificantes / summary.count_total) * 100 : 100}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white grid grid-cols-1 md:grid-cols-12 gap-6 items-end relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          
          {/* SELECTOR DE ABONO / RECTIFICATIVA */}
          <div className="col-span-1 md:col-span-12 p-6 bg-indigo-900/40 border border-indigo-500/50 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 relative z-10">
            <div className="flex gap-4 items-center">
               <RefreshCcw size={24} className="text-indigo-400 shrink-0" />
               <div>
                  <p className="font-black uppercase tracking-widest text-[10px] text-indigo-300 mb-1">Tipo de Documento</p>
                  <p className="text-sm font-bold text-white">¿Es una Factura Rectificativa o Abono de Proveedor?</p>
               </div>
            </div>
            <button 
              type="button" 
              onClick={() => setNuevoGasto(prev => ({...prev, esAbono: !prev.esAbono}))} 
              className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0 cursor-pointer ${nuevoGasto.esAbono ? 'bg-rose-500 text-white shadow-lg' : 'bg-white/10 text-indigo-300'}`}
            >
               {nuevoGasto.esAbono ? 'SÍ, ES UN ABONO (Resta)' : 'NO, ES UN GASTO (Suma)'}
            </button>
          </div>

          <div className="col-span-1 md:col-span-2 z-10">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-3 block tracking-widest">Fecha</label>
            <input 
              type="date" 
              required 
              name="fecha"
              value={nuevoGasto.fecha} 
              onChange={handleInputChange} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>

          <div className="col-span-1 md:col-span-2 z-10">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-3 block tracking-widest">Día Cargo</label>
            <input 
              type="number" 
              min="1" 
              max="31" 
              required 
              name="diaCobro"
              value={nuevoGasto.diaCobro} 
              onChange={handleInputChange} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>

          <div className="col-span-1 md:col-span-3 z-10">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-3 block tracking-widest">Categoría</label>
            <select 
              name="categoria"
              value={nuevoGasto.categoria} 
              onChange={handleInputChange} 
              className="w-full bg-slate-800 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="col-span-1 md:col-span-5 z-10">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-3 block tracking-widest">Proveedor / Concepto</label>
            <input 
              type="text" 
              required 
              list="proveedores-datalist"
              name="concepto"
              placeholder="Escribe o selecciona de la Tienda" 
              value={nuevoGasto.concepto} 
              onChange={handleInputChange} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500" 
            />
            <datalist id="proveedores-datalist">
              {proveedores.map(p => (
                <option key={p.id} value={p.nombre}>{p.cif ? `${p.nombre} (${p.cif})` : p.nombre}</option>
              ))}
            </datalist>
          </div>

          <div className="col-span-1 md:col-span-3 z-10">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-3 block tracking-widest">Importe Bruto (€)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0" 
              required 
              name="importe"
              placeholder="0.00" 
              value={nuevoGasto.importe} 
              onChange={handleInputChange} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 text-xl font-bold" 
            />
          </div>

          <div className="col-span-1 md:col-span-3 z-10">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-3 block tracking-widest">% IVA</label>
            <select 
              name="iva"
              value={nuevoGasto.iva} 
              onChange={handleInputChange} 
              className="w-full bg-slate-800 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
            >
              <option value="0">0%</option>
              <option value="4">4%</option>
              <option value="10">10%</option>
              <option value="21">21%</option>
            </select>
          </div>

          <div className="col-span-1 md:col-span-3 z-10">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-3 block tracking-widest">% IVA Deducible</label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              name="deducibleIva"
              value={nuevoGasto.deducibleIva} 
              onChange={handleInputChange} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>

          <div className="col-span-1 md:col-span-3 z-10">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-3 block tracking-widest">% IRPF Deducible</label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              name="deducibleIrpf"
              value={nuevoGasto.deducibleIrpf} 
              onChange={handleInputChange} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>

          {/* CONTROL IA: CONTROL DE BIENES DE INVERSIÓN */}
          <div className="col-span-1 md:col-span-12 p-6 bg-emerald-950/40 border border-emerald-500/30 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2 z-10">
            <div className="flex gap-4 items-center">
              <Zap size={24} className="text-emerald-400 shrink-0" />
              <div>
                <p className="font-black uppercase tracking-widest text-[10px] text-emerald-300 mb-1">Enrutamiento de Activos</p>
                <p className="text-sm font-bold text-white">¿Este gasto es una compra de bien duradero &gt; 300€ (Inversión)?</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {nuevoGasto.esInversion && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Años Vida Útil:</span>
                  <input 
                    type="number" 
                    min="1" 
                    max="50" 
                    name="vidaUtil"
                    value={nuevoGasto.vidaUtil} 
                    onChange={handleInputChange} 
                    className="w-16 bg-white/5 border border-white/10 rounded-xl p-2 text-white font-bold outline-none focus:border-emerald-500" 
                  />
                </div>
              )}
              <button 
                type="button" 
                onClick={() => setNuevoGasto(prev => ({...prev, esInversion: !prev.esInversion}))} 
                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${nuevoGasto.esInversion ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'bg-white/10 text-emerald-400'}`}
              >
                {nuevoGasto.esInversion ? 'SÍ, CREAR COMO INVERSIÓN' : 'NO, ES UN GASTO CORRIENTE'}
              </button>
            </div>
          </div>

          {/* GASTO RECURRENTE CONTROL */}
          <div className="col-span-1 md:col-span-12 p-6 bg-slate-800 border border-slate-700 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2 z-10">
            <div className="flex gap-4 items-center">
              <RefreshCcw size={24} className="text-indigo-400 shrink-0" />
              <div>
                <p className="font-black uppercase tracking-widest text-[10px] text-indigo-300 mb-1">Periodicidad Contable</p>
                <p className="text-sm font-bold text-white">¿Este gasto es un costo fijo mensual (recurrente)?</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setNuevoGasto(prev => ({...prev, es_recurrente: !prev.es_recurrente}))} 
              className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${nuevoGasto.es_recurrente ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/10 text-slate-400'}`}
            >
              {nuevoGasto.es_recurrente ? 'SÍ, MARCAR COMO RECURRENTE' : 'NO, ES UN GASTO PUNTUAL'}
            </button>
          </div>

          <div className="col-span-1 md:col-span-12 flex justify-end gap-4 mt-4 z-10 font-black uppercase italic">
            <button 
              type="button" 
              onClick={() => { resetForm(); setShowForm(false); }} 
              className="bg-white/5 border border-white/10 px-8 py-4 rounded-[20px] text-xs hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="bg-emerald-500 text-slate-900 px-10 py-4 rounded-[20px] text-xs hover:bg-emerald-400 shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
            >
              {editingId ? 'Guardar Cambios' : 'Añadir Registro'}
            </button>
          </div>
        </form>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100/50 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h4 className="font-black uppercase italic text-slate-800">
              Registros en el Periodo
            </h4>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">
              Mostrando página {page} de {pages} (Total: {total} operaciones)
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50">
                <th className="py-6 px-10">Operación / Concepto</th>
                <th className="py-6 px-10 text-center">Fecha y Cargo</th>
                <th className="py-6 px-10 text-center">Justificante</th>
                <th className="py-6 px-10 text-center">Deducibilidad</th>
                <th className="py-6 px-10 text-right">Importe</th>
                <th className="py-6 px-10 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {groupedGastos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                    No se encontraron gastos en este periodo.
                  </td>
                </tr>
              ) : (
                groupedGastos.map(group => (
                  <React.Fragment key={group.key}>
                    
                    {/* Month subheader banner */}
                    <tr className="bg-slate-50/80 text-slate-700 font-black text-xs uppercase tracking-widest border-y border-slate-100">
                      <td colSpan="6" className="py-4 px-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <span className="flex items-center gap-2 text-slate-900 italic font-black">
                            📅 {group.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold tracking-wider leading-none normal-case">
                            Gastado este mes: <strong className="text-rose-500 font-black">-{Math.abs(group.totalImporte).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</strong> 
                            {group.totalIva > 0 && <span className="ml-3 text-slate-400"> | IVA Deducible: <strong className="text-emerald-600 font-black">+{group.totalIva.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</strong></span>}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Month items */}
                    {group.items.map(g => {
                      const isAbono = g.importe < 0;
                      return (
                        <tr key={g.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="py-8 px-10">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-2xl ${isAbono ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                                <Receipt size={20} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-black text-slate-900 uppercase italic leading-none">{g.concepto}</p>
                                  {g.es_recurrente && (
                                    <span className="bg-indigo-500/10 text-indigo-600 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-indigo-500/20" title="Gasto Fijo Mensual">
                                      Fijo
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">
                                  {g.categoria}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-8 px-10 text-center">
                            <p className="text-sm font-bold text-slate-700 leading-none">{g.fecha}</p>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 block">
                              Día cobro: {g.diaCobro}
                            </span>
                          </td>
                          <td className="py-8 px-10 text-center">
                            {g.justificante_filename ? (
                              <div className="flex items-center justify-center gap-2">
                                <a 
                                  href={`http://localhost:8001/uploads/justificantes/${g.justificante_filename}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-500 hover:text-emerald-700 font-black text-[10px] uppercase bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1 rounded-xl border border-emerald-500/20 hover:border-emerald-500/45 transition-all cursor-pointer flex items-center gap-1 shadow-sm hover:scale-105 active:scale-95"
                                  title="Ver documento adjunto"
                                
                                >
                                  Ver Doc
                                </a>
                                <label className="cursor-pointer text-slate-400 hover:text-indigo-600 transition-colors" title="Cambiar documento">
                                  <Upload size={14} />
                                  <input 
                                    type="file" 
                                    accept="application/pdf,image/*"
                                    className="hidden" 
                                    onChange={(e) => onDirectDocUpload(g.id, e.target.files[0])} 
                                  />
                                </label>
                              </div>
                            ) : (
                              <label className="cursor-pointer text-indigo-500 hover:text-indigo-700 font-black text-[10px] uppercase bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-all flex items-center justify-center gap-1 w-fit mx-auto">
                                <Upload size={12} /> Subir PDF
                                <input 
                                  type="file" 
                                  accept="application/pdf,image/*"
                                  className="hidden" 
                                  onChange={(e) => onDirectDocUpload(g.id, e.target.files[0])} 
                                />
                              </label>
                            )}
                          </td>
                          <td className="py-8 px-10 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="bg-slate-100 px-3 py-1 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                                IVA {g.iva}%
                              </span>
                              <div className="flex gap-2">
                                <span className={`text-[8px] font-black uppercase tracking-widest border border-current px-1.5 py-0.5 rounded ${g.deducibleIva === 100 ? 'text-emerald-500' : g.deducibleIva > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                                  IVA: {g.deducibleIva}%
                                </span>
                                <span className={`text-[8px] font-black uppercase tracking-widest border border-current px-1.5 py-0.5 rounded ${g.deducibleIrpf === 100 ? 'text-indigo-500' : g.deducibleIrpf > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                                  IRPF: {g.deducibleIrpf}%
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-8 px-10 text-right">
                            <span className={`text-2xl font-black tracking-tighter leading-none ${isAbono ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {isAbono ? '+' : '-'}{Math.abs(g.importe).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                            </span>
                          </td>
                          <td className="py-8 px-10 text-center">
                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => onEditGasto(g)} 
                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                                title="Editar"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                onClick={() => onDeleteGasto(g.id)} 
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="p-8 border-t border-slate-100 flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
          <span>Página {page} de {pages}</span>
          <div className="flex gap-4">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-white hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Anterior
            </button>
            <button 
              disabled={page === pages} 
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-white hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
