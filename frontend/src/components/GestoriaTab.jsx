import React from 'react';
import { 
  FolderLock, CheckCircle2, Upload, FileCheck2, Download, 
  Calculator, ShieldCheck, FileText, RefreshCcw 
} from 'lucide-react';

export default function GestoriaTab({
  gastos,
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
          
          {/* Document Manager */}
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <FileCheck2 className="text-emerald-400" size={28} />
                <div>
                  <h4 className="text-lg font-black italic uppercase tracking-widest leading-none">Gestor Documental</h4>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest normal-case font-bold">Estado de facturas justificantes por proveedor en esta página</span>
                </div>
              </div>
              <div className="bg-slate-950/50 text-emerald-400 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                {Object.keys(uploadedDocs).length} / {gastosAgrupados.length} Prov.
              </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {gastosAgrupados.map(grupo => {
                const docName = uploadedDocs[grupo.proveedor];
                return (
                  <div 
                    key={grupo.proveedor} 
                    className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${docName ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-black/20 border-white/5'}`}
                  >
                    <div className="leading-tight flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white text-sm font-black uppercase truncate">{grupo.proveedor}</p>
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest">
                          {grupo.categoria}
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                        {grupo.cantidadFacturas} Fra(s) • Total: {grupo.importeTotal.toLocaleString('es-ES')}€
                      </span>
                    </div>
                    <div>
                      {docName ? (
                        <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase bg-emerald-500/10 px-4 py-2.5 rounded-xl border border-emerald-500/20">
                          <CheckCircle2 size={14} /> {docName}
                        </div>
                      ) : (
                        <label className="cursor-pointer bg-emerald-500 text-slate-900 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 flex items-center gap-2 transition-all">
                          <Upload size={14} /> Subir PDF
                          <input 
                            type="file" 
                            accept="application/pdf,image/*"
                            className="hidden" 
                            onChange={(e) => onDocUpload(grupo.proveedor, e)} 
                          />
                        </label>
                      )}
                    </div>
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
            <div className="flex flex-col sm:flex-row gap-4 font-black tracking-wider text-[10px] uppercase">
              <a 
                href="#"
                onClick={(e) => { e.preventDefault(); alert("Descargando lote de justificantes en formato ZIP..."); }}
                className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black hover:bg-slate-800 shadow-xl transition-colors flex items-center gap-3"
              >
                <FileText size={16} /> Descargar justificantes (ZIP)
              </a>
              <a 
                href="#"
                onClick={(e) => { e.preventDefault(); alert("Generando Modelo 140 (XML de Bizkaia)..."); }}
                className="bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black hover:bg-indigo-500 shadow-xl transition-colors flex items-center gap-3"
              >
                <FileCheck2 size={16} /> Generar LROE XML (Mod. 140)
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
            <div className="flex flex-col sm:flex-row gap-4 font-black text-[10px] tracking-widest">
              <a 
                href="#"
                onClick={(e) => { e.preventDefault(); alert("Descargando lote anual XML y PDF..."); }}
                className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black hover:bg-slate-800 shadow-xl transition-colors flex items-center gap-3"
              >
                <FileText size={16} /> Descargar Lote Cierre
              </a>
              <a 
                href="#"
                onClick={(e) => { e.preventDefault(); alert("Generando Modelos 140 y 390 oficiales (XML)..."); }}
                className="bg-emerald-900 text-white px-8 py-5 rounded-2xl font-black hover:bg-emerald-800 transition-colors flex items-center gap-3"
              >
                <FileCheck2 size={16} /> Generar XML Hacienda Foral
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
