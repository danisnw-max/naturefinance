import React from 'react';
import { 
  FolderLock, CheckCircle2, Upload, FileCheck2, Download, 
  Calculator, ShieldCheck, FileText, RefreshCcw 
} from 'lucide-react';

export default function GestoriaTab({
  gastos,
  allGastos = [],
  gastosAgrupados,
  uploadedDocs,
  onDocUpload,
  gestoriaFiles,
  onGestoriaUpload,
  isReportGenerated,
  setIsReportGenerated,
  showAnnualReport,
  setShowAnnualReport,
  fiscalData,
  amortizaciones,
  canGeneratePackage,
  onSyncTiendaVentas,
  selectedQuarter,
  setSelectedQuarter
}) {
  const [docMonthFilter, setDocMonthFilter] = React.useState('all');

  const availableMonths = React.useMemo(() => {
    const allMonths = [
      { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
      { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
      { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
      { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
    ];
    if (!selectedQuarter) return allMonths;
    const q = parseInt(selectedQuarter);
    return allMonths.filter(m => m.value >= (q - 1) * 3 + 1 && m.value <= q * 3);
  }, [selectedQuarter]);

  const filteredItems = React.useMemo(() => {
    if (!Array.isArray(allGastos)) return [];
    if (docMonthFilter === 'all') return allGastos;
    return allGastos.filter(g => {
      const monthNum = parseInt(g.fecha?.split('-')[1], 10);
      return monthNum === docMonthFilter;
    });
  }, [allGastos, docMonthFilter]);

  const modelStats = React.useMemo(() => {
    const models = {
      '303': { name: 'Modelo 303 (IVA - Facturas Recibidas)', items: [], total: 0, uploaded: 0 },
      '111': { name: 'Modelo 111 (IRPF - Nóminas y Autónomos)', items: [], total: 0, uploaded: 0 },
      '115': { name: 'Modelo 115 (IRPF - Alquiler Local)', items: [], total: 0, uploaded: 0 }
    };

    filteredItems.forEach(g => {
      const modKey = g.modelo_asociado || (g.categoria === 'Alquiler' ? '115' : (g.categoria === 'Nóminas y Personal' || g.categoria === 'Servicios Profesionales / Autónomos') ? '111' : '303');
      if (models[modKey]) {
        models[modKey].items.push(g);
        models[modKey].total += 1;
        if (g.justificante_filename) {
          models[modKey].uploaded += 1;
        }
      }
    });

    return models;
  }, [filteredItems]);

  // Reset month filter when quarter changes
  React.useEffect(() => {
    setDocMonthFilter('all');
  }, [selectedQuarter]);

  const SummaryRow = ({ label, value, highlight }) => {
    const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    return (
      <div className="flex justify-between items-end py-2 uppercase font-black">
        <span className="text-[10px] font-black text-slate-500 tracking-widest leading-none">{label}</span>
        <span className={`font-black tracking-tighter leading-none ${highlight ? 'text-2xl text-slate-900' : 'text-lg text-slate-600'}`}>
          {safeValue.toLocaleString('es-ES')} €
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700 italic font-black uppercase">
      
      {/* Cierre Portal Card */}
      <div className="bg-slate-900 p-12 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 max-w-4xl">
          
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8 border-b border-white/5 pb-6">
            <div className="flex items-center gap-4 leading-none">
              <div className="bg-emerald-50 text-slate-900 p-3 rounded-2xl">
                <FolderLock size={32} />
              </div>
              <h3 className="text-4xl font-black tracking-tighter italic uppercase tracking-widest">Portal de Cierre</h3>
            </div>
            
            {/* Quarter Selector */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
              {[1, 2, 3, 4].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setSelectedQuarter(q);
                    setIsReportGenerated(false);
                    setShowAnnualReport(false);
                  }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer ${selectedQuarter === q ? 'bg-emerald-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  T{q}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSelectedQuarter(null);
                  setIsReportGenerated(false);
                  setShowAnnualReport(false);
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer ${selectedQuarter === null ? 'bg-emerald-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Anual
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="flex flex-col gap-4">
              <div className="p-8 rounded-[32px] border border-emerald-500/30 bg-emerald-950/40 shadow-lg uppercase relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
                <div className="flex justify-between items-start mb-4 leading-none relative z-10">
                  <h4 className="font-black italic text-xs tracking-widest text-slate-400">Ventas Natura ERP</h4>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black px-2.5 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest leading-none">
                    Conectado
                  </span>
                </div>
                <div className="text-4xl font-black text-white tracking-tighter mb-2 relative z-10 leading-none">
                  {fiscalData.adjustedIngresos.toLocaleString('es-ES')} €
                </div>
                <p className="text-[9px] text-slate-500 font-bold tracking-widest leading-none normal-case relative z-10">
                  Importado directamente para el {selectedQuarter ? `${selectedQuarter}º Trimestre 2026` : 'año 2026'}.
                </p>
              </div>
              <button 
                type="button" 
                onClick={onSyncTiendaVentas}
                className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-[24px] border border-white/5 font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCcw size={14} /> Forzar Sincronización
              </button>
            </div>
            <ImportBox 
              label="TicketBAI (LROE)" 
              status={gestoriaFiles.ticketbai} 
              onUpload={(e) => onGestoriaUpload('ticketbai', e)} 
              desc="Ficheros LROE XML / TicketBAI." 
            />
          </div>
          
          {/* Document Manager Organized by Fiscal Models */}
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <FileCheck2 className="text-emerald-400" size={28} />
                <div>
                  <h4 className="text-lg font-black italic uppercase tracking-widest leading-none">Gestor Documental por Modelos Tributarios</h4>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest normal-case font-bold">Verificación de justificantes requeridos para cada modelo oficial de Hacienda</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <select 
                  value={docMonthFilter}
                  onChange={(e) => setDocMonthFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="bg-slate-900 border border-emerald-500/30 text-emerald-400 text-[10px] font-black rounded-xl px-4 py-3 outline-none cursor-pointer uppercase tracking-widest transition-all focus:border-emerald-500"
                >
                  <option value="all">TODOS LOS MESES DEL TRIMESTRE</option>
                  {availableMonths.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fiscal Models Accordions / Blocks */}
            <div className="space-y-8">
              {['303', '111', '115'].map(modKey => {
                const mod = modelStats[modKey];
                const isComplete = mod.total > 0 && mod.uploaded === mod.total;
                const isEmpty = mod.total === 0;

                return (
                  <div key={modKey} className={`rounded-2xl border p-6 transition-all ${isEmpty ? 'bg-black/10 border-white/5 opacity-60' : isComplete ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-amber-950/20 border-amber-500/30'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
                      <div>
                        <div className="flex items-center gap-3">
                          <h5 className="text-white text-base font-black uppercase tracking-wider">{mod.name}</h5>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${isEmpty ? 'bg-slate-800 text-slate-400 border-slate-700' : isComplete ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                            {isEmpty ? 'Sin gastos' : isComplete ? '✓ 100% Completo' : '⚠️ Justificantes Pendientes'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">
                          {isEmpty ? 'No se han registrado operaciones para este modelo en el periodo' : `${mod.uploaded} de ${mod.total} documentos adjuntos`}
                        </p>
                      </div>
                    </div>

                    {!isEmpty && (
                      <div className="space-y-3">
                        {mod.items.map(item => (
                          <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${item.justificante_filename ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-black/30 border-white/5'}`}>
                            <div className="leading-tight">
                              <p className="text-white text-xs font-black uppercase">{item.concepto}</p>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                {item.fecha} • {item.categoria} • {item.importe.toLocaleString('es-ES')} €
                              </span>
                            </div>
                            <div>
                              {item.justificante_filename ? (
                                <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                                  <CheckCircle2 size={13} /> {item.justificante_filename}
                                </div>
                              ) : (
                                <label className="cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                                  <Upload size={13} /> Subir PDF
                                  <input 
                                    type="file" 
                                    accept="application/pdf,image/*"
                                    className="hidden" 
                                    onChange={(e) => onDocUpload(item.concepto, e)} 
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => { setIsReportGenerated(true); setShowAnnualReport(false); }} 
              disabled={!canGeneratePackage} 
              className={`p-8 rounded-[32px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 text-xs ${canGeneratePackage ? 'bg-emerald-500 text-slate-900 shadow-emerald-500/20 hover:scale-[1.02] cursor-pointer' : 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed'}`}
            >
              <Download size={20} /> Generar IVA Trimestral
            </button>
            <button 
              onClick={() => { setShowAnnualReport(true); setIsReportGenerated(false); }} 
              className="p-8 rounded-[32px] bg-slate-100 text-slate-900 font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 text-xs hover:bg-white hover:scale-[1.02] shadow-xl cursor-pointer"
            >
              <Calculator size={20} /> Cierre Anual 2026
            </button>
          </div>
        </div>
      </div>

      {/* QUARTERLY IVA REPORT (303) */}
      {isReportGenerated && (
        <div className="bg-white p-12 rounded-[40px] shadow-2xl border-4 border-emerald-500/10 animate-in zoom-in-95 duration-500 font-black">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <ShieldCheck size={48} className="text-emerald-500 shrink-0" />
              <div>
                <h4 className="text-3xl font-black tracking-tighter italic uppercase leading-none text-slate-900">Borrador Modelo 303 (IVA)</h4>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Listo para enviar a la Gestoría (Con {gastos?.length ?? 0} facturas vinculadas)</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 normal-case font-semibold text-slate-700">
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 border-b pb-4 leading-none italic">IVA Repercutido (Ventas)</h5>
              <SummaryRow label="Base Imponible Ventas" value={fiscalData?.ventasBase} />
              <SummaryRow label="Cuota IVA Devengado" value={fiscalData?.ivaVentas} highlight />
            </div>
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-rose-500 border-b pb-4 leading-none italic">IVA Soportado (Gastos)</h5>
              <SummaryRow label="Base Imponible Gastos" value={fiscalData?.baseGastosDeducible} />
              <SummaryRow label="Cuota IVA Deducible" value={fiscalData?.ivaGastos} highlight />
            </div>
          </div>
          
          <div className="mt-12 pt-12 border-t flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 leading-none">Resultado de Liquidación</p>
              <p className={`text-7xl font-black tracking-tighter leading-none ${(fiscalData?.balanceIVA ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {(fiscalData?.balanceIVA ?? 0).toLocaleString('es-ES')} €
              </p>
            </div>
            <div className="flex flex-wrap gap-4 font-black tracking-wider text-[10px] uppercase">
              <a 
                href={`http://localhost:8001/api/exports/justificantes-zip${selectedQuarter ? `?quarter=${selectedQuarter}` : ''}`}
                className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black hover:bg-slate-800 shadow-xl transition-colors flex items-center gap-2"
              >
                <FileText size={14} /> Justificantes (ZIP)
              </a>
              <a 
                href={`http://localhost:8001/api/exports/modelo-303-pdf${selectedQuarter ? `?quarter=${selectedQuarter}` : ''}`}
                className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-emerald-500 shadow-xl transition-colors flex items-center gap-2"
              >
                <FileText size={14} /> Mod 303 IVA (PDF)
              </a>
              <a 
                href={`http://localhost:8001/api/exports/modelo-111-pdf${selectedQuarter ? `?quarter=${selectedQuarter}` : ''}`}
                className="bg-amber-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-amber-500 shadow-xl transition-colors flex items-center gap-2"
              >
                <FileText size={14} /> Mod 111 Nóminas (PDF)
              </a>
              <a 
                href={`http://localhost:8001/api/exports/modelo-115-pdf${selectedQuarter ? `?quarter=${selectedQuarter}` : ''}`}
                className="bg-rose-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-rose-500 shadow-xl transition-colors flex items-center gap-2"
              >
                <FileText size={14} /> Mod 115 Alquiler (PDF)
              </a>
              <a 
                href={`http://localhost:8001/api/exports/lroe-xml${selectedQuarter ? `?quarter=${selectedQuarter}` : ''}`}
                className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-blue-500 shadow-xl transition-colors flex items-center gap-2"
              >
                <Download size={14} /> LROE Batuz (XML)
              </a>
            </div>
          </div>

          {/* SECCIÓN CIERRE ANUAL (INFORMATIVOS) */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <h5 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 italic">Cierre Anual Fiscal (Modelos Informativos Enero)</h5>
            <div className="flex flex-wrap gap-4 font-black tracking-wider text-[10px] uppercase">
              <a 
                href="http://localhost:8001/api/exports/modelo-390-pdf"
                className="bg-slate-800 text-emerald-400 border border-emerald-500/30 px-6 py-3.5 rounded-2xl font-black hover:bg-slate-900 shadow-lg transition-all flex items-center gap-2"
              >
                <FileText size={14} /> Mod 390 Resumen IVA (PDF)
              </a>
              <a 
                href="http://localhost:8001/api/exports/modelo-190-pdf"
                className="bg-slate-800 text-indigo-400 border border-indigo-500/30 px-6 py-3.5 rounded-2xl font-black hover:bg-slate-900 shadow-lg transition-all flex items-center gap-2"
              >
                <FileText size={14} /> Mod 190 Resumen Nóminas (PDF)
              </a>
              <a 
                href="http://localhost:8001/api/exports/modelo-180-pdf"
                className="bg-slate-800 text-rose-400 border border-rose-500/30 px-6 py-3.5 rounded-2xl font-black hover:bg-slate-900 shadow-lg transition-all flex items-center gap-2"
              >
                <FileText size={14} /> Mod 180 Resumen Alquiler (PDF)
              </a>
              <a 
                href="http://localhost:8001/api/exports/lroe-xml"
                className="bg-slate-800 text-blue-400 border border-blue-500/30 px-6 py-3.5 rounded-2xl font-black hover:bg-slate-900 shadow-lg transition-all flex items-center gap-2"
              >
                <Download size={14} /> LROE Anual Completo (XML)
              </a>
            </div>
          </div>

        </div>
      )}

      {/* ANNUAL REPORT */}
      {showAnnualReport && (
        <div className="bg-emerald-50 p-12 rounded-[40px] shadow-2xl border-4 border-emerald-900/10 animate-in zoom-in-95 duration-500">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <Calculator size={48} className="text-emerald-900" />
              <div>
                <h4 className="text-3xl font-black tracking-tighter italic uppercase leading-none text-emerald-950">Cierre Fiscal Anual 2026</h4>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-slate-700 normal-case font-medium">
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-900 border-b border-emerald-900/20 pb-4 leading-none italic">Resumen IRPF (Bizkaia)</h5>
              <SummaryRow label="Ingresos Anuales" value={fiscalData?.ventasBase} />
              <SummaryRow label="Gastos Deducibles (Fra.)" value={fiscalData?.baseGastosDeducible} />
              
              <div className="flex justify-between items-center py-2 uppercase font-black">
                <span className="text-[10px] font-black text-slate-500 tracking-widest leading-none">Ajuste Variación Stock (COGS)</span>
                <span className={`font-black tracking-tighter leading-none text-lg ${(fiscalData?.variacionExistencias ?? 0) > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {(fiscalData?.variacionExistencias ?? 0) > 0 ? '+' : ''}{(fiscalData?.variacionExistencias ?? 0).toLocaleString('es-ES')} €
                </span>
              </div>

              <SummaryRow label="Amortizaciones Obra y Activos" value={amortizaciones?.anual} />
              
              <div className="flex justify-between items-center py-3 bg-emerald-200/50 px-4 rounded-xl border border-emerald-300 mt-2 font-black uppercase">
                <div className="flex items-center gap-2">
                  <Calculator size={14} className="text-emerald-700" />
                  <span className="text-[10px] font-black tracking-widest text-emerald-800">10% Difícil Justif.</span>
                </div>
                <span className="font-black text-emerald-800 text-lg tracking-tighter">-{(fiscalData?.gastoDificilJustificacion ?? 0).toLocaleString('es-ES')} €</span>
              </div>
              
              <SummaryRow label="Rendimiento Neto Final" value={fiscalData?.rendimientoNeto} highlight />
            </div>
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-900 border-b border-emerald-900/20 pb-4 leading-none italic">Resumen IVA (390)</h5>
              <SummaryRow label="IVA Repercutido Total" value={fiscalData?.ivaVentas} />
              <SummaryRow label="IVA Soportado Total" value={fiscalData?.ivaGastos} />
              <SummaryRow label="Resultado Anual IVA" value={fiscalData?.balanceIVA} highlight />
            </div>
          </div>

          <div className="mt-12 pt-12 border-t border-emerald-900/10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 leading-none">Beneficio de Bolsillo Anual</p>
              <p className="text-7xl font-black tracking-tighter leading-none text-emerald-900">{(fiscalData?.beneficioReal ?? 0).toLocaleString('es-ES')} €</p>
            </div>
            <div className="flex flex-wrap gap-4 font-black text-[10px] tracking-widest">
              <a 
                href="http://localhost:8001/api/exports/justificantes-zip"
                className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black hover:bg-slate-800 shadow-xl transition-colors flex items-center gap-2"
              >
                <FileText size={14} /> Lote Cierre (ZIP)
              </a>
              <a 
                href="http://localhost:8001/api/exports/modelo-130-pdf"
                className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-emerald-500 shadow-xl transition-colors flex items-center gap-2"
              >
                <FileText size={14} /> Borrador 130 IRPF (PDF)
              </a>
              <a 
                href="http://localhost:8001/api/exports/modelo-190-pdf"
                className="bg-amber-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-amber-500 shadow-xl transition-colors flex items-center gap-2"
              >
                <FileText size={14} /> Mod 190 Anual Personal (PDF)
              </a>
              <a 
                href="http://localhost:8001/api/exports/modelo-180-pdf"
                className="bg-rose-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-rose-500 shadow-xl transition-colors flex items-center gap-2"
              >
                <FileText size={14} /> Mod 180 Anual Alquiler (PDF)
              </a>
              <a 
                href="http://localhost:8001/api/exports/lroe-xml"
                className="bg-indigo-900 text-white px-6 py-4 rounded-2xl font-black hover:bg-indigo-800 transition-colors flex items-center gap-2"
              >
                <FileCheck2 size={14} /> XML LROE Batuz
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ImportBox({ label, status, onUpload, desc }) {
  return (
    <label className={`cursor-pointer block p-8 rounded-[32px] border transition-all duration-300 shadow-lg uppercase ${status ? 'bg-emerald-900/40 border-emerald-500/50' : 'bg-white/5 border-white/5 hover:border-emerald-400/30'}`}>
      <input type="file" className="hidden" onChange={onUpload} />
      <div className="flex justify-between items-start mb-4 leading-none">
        <h4 className="font-black italic text-sm tracking-widest text-white">{label}</h4>
        {status ? <CheckCircle2 size={24} className="text-emerald-400 shadow-lg" /> : <Upload size={24} className="text-slate-600" />}
      </div>
      <p className="text-[10px] text-slate-500 font-bold tracking-widest truncate leading-none normal-case">
        {status ? `Fichero: ${status}` : desc}
      </p>
    </label>
  );
}
