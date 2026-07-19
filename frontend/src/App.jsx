import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Receipt, BrainCircuit, CalendarDays, 
  Settings, PieChart, FolderLock, Wallet 
} from 'lucide-react';
import { api } from './services/api';

// Components
import DashboardTab from './components/DashboardTab';
import GastosTab from './components/GastosTab';
import EstrategiaTab from './components/EstrategiaTab';
import CalendarioTab from './components/CalendarioTab';
import InversionTab from './components/InversionTab';
import GestoriaTab from './components/GestoriaTab';
import FiscalTab from './components/FiscalTab';

const CATEGORIES = [
  'Alquiler', 'S.S. Autónomo', 'Suministros', 'Gestoría', 'Marketing', 'Reposición', 'Nóminas y Personal', 'Dietas/Desplazamientos', 'Otros'
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [gastos, setGastos] = useState([]);
  const [inversiones, setInversiones] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [configFiscal, setConfigFiscal] = useState({
    comercio: '',
    titular: '',
    nif: '',
    direccion: '',
    epigrafe: '',
    regimenIva: 'General',
    regimenIrpf: 'Estimación Directa Simplificada',
    irpfProyectado: 20,
    dificilJustificacion: 10,
    retencionAlquiler: 19,
    retencionNominas: 2,
    inventarioInicial: 14000.0,
    inventarioFinal: 12000.0,
    ingresosTotales: 11700.0
  });

  // Pagination states for expenses
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const limit = 5; // Set to 5 so user can immediately see pagination with the 6 seeded expenses!

  // Server-side calculated fiscal report
  const [fiscalData, setFiscalData] = useState({
    adjustedIngresos: 11700,
    ventasBase: 10636.36,
    ivaVentas: 1063.64,
    totalGastosBrutos: 0,
    totalGastos: 0,
    ivaGastos: 0,
    baseGastosDeducible: 0,
    retencionesAlquiler: 0,
    retencionesNominas: 0,
    balanceIVA: 0,
    variacionExistencias: 2000,
    rendimientoNetoPrevio: 0,
    gastoDificilJustificacion: 0,
    rendimientoNeto: 0,
    provisionIRPF: 0,
    beneficioReal: 0,
    cargaFiscalTotal: 0
  });

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [isReportGenerated, setIsReportGenerated] = useState(false);
  const [showAnnualReport, setShowAnnualReport] = useState(false);
  const [gestoriaFiles, setGestoriaFiles] = useState({ ventas: null, ticketbai: null });

  const currentQuarterNumber = useMemo(() => {
    const month = new Date().getMonth() + 1;
    return month <= 3 ? 1 : month <= 6 ? 2 : month <= 9 ? 3 : 4;
  }, []);

  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarterNumber);

  // Strategic sliders
  const [simExtraCost, setSimExtraCost] = useState(0); 
  const [simPriceChange, setSimPriceChange] = useState(0); 
  const [simSueldo, setSimSueldo] = useState(1500); 

  const [nuevoGasto, setNuevoGasto] = useState({
    fecha: new Date().toISOString().split('T')[0],
    diaCobro: new Date().getDate(),
    categoria: CATEGORIES[0],
    concepto: '',
    importe: '',
    iva: '21',
    deducibleIva: 100,
    deducibleIrpf: 100,
    esInversion: false, 
    esAbono: false, 
    es_recurrente: false,
    vidaUtil: 4
  });

  // Filters for Expenses Book
  const [filterYear, setFilterYear] = useState(2026);
  const [filterQuarter, setFilterQuarter] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterSinJustificante, setFilterSinJustificante] = useState(false);
  const [gastosSummary, setGastosSummary] = useState({
    total_importe: 0,
    total_iva_deducible: 0,
    count_justificantes: 0,
    count_total: 0
  });

  // Fetch paginated expenses
  const fetchGastos = async (currentPage) => {
    try {
      const queryParams = [
        `page=${currentPage}`,
        `limit=${limit}`,
        `year=${filterYear}`
      ];
      if (filterQuarter !== 'all') {
        queryParams.push(`quarter=${filterQuarter}`);
      }
      if (filterMonth !== 'all') {
        queryParams.push(`month=${filterMonth}`);
      }
      if (filterSinJustificante) {
        queryParams.push(`sin_justificante=true`);
      }

      const res = await api.get(`/gastos?${queryParams.join('&')}`);
      setGastos(res.items);
      setPages(res.pages);
      setTotalExpenses(res.total);
      if (res.summary) {
        setGastosSummary(res.summary);
      }
    } catch (err) {
      console.error("Error loading expenses:", err);
    }
  };

  const handleGenerateRecurring = async (year, month) => {
    try {
      const res = await api.post(`/gastos/generate-recurring?year=${year}&month=${month}`);
      alert(`Se han autogenerado ${res.generated_count} gastos fijos del historico.`);
      await fetchGastos(page);
    } catch (err) {
      console.error("Error generating recurring expenses:", err);
      alert("Error al generar gastos recurrentes.");
    }
  };

  // Fetch all initial data
  const loadData = async () => {
    try {
      // Auto-sync sales with store DB silently on app load
      try {
        await api.post('/ventas/sync-tienda');
      } catch (e) {
        console.warn("Silent sync failed:", e);
      }

      const cfg = await api.get('/config');
      setConfigFiscal(cfg);
      
      const invs = await api.get('/inversiones');
      setInversiones(invs);

      const provs = await api.get('/proveedores/tienda');
      setProveedores(provs);
      
      await fetchGastos(page);
    } catch (err) {
      console.error("Error loading data from API:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reload expenses when filters or page changes
  useEffect(() => {
    fetchGastos(page);
  }, [page, filterYear, filterQuarter, filterMonth, filterSinJustificante]);

  // When filters change, reset page to 1
  useEffect(() => {
    setPage(1);
  }, [filterYear, filterQuarter, filterMonth, filterSinJustificante]);

  // Reactive effect to load server calculated fiscal reports when inputs change
  useEffect(() => {
    const fetchFiscalSummary = async () => {
      try {
        const queryParams = [
          `simExtraCost=${simExtraCost}`,
          `simPriceChange=${simPriceChange}`
        ];
        if (selectedQuarter !== null) {
          queryParams.push(`quarter=${selectedQuarter}`);
        }
        const summary = await api.get(`/reports/fiscal-summary?${queryParams.join('&')}`);
        setFiscalData(summary);
      } catch (err) {
        console.error("Error fetching fiscal summary:", err);
      }
    };
    fetchFiscalSummary();
  }, [simExtraCost, simPriceChange, selectedQuarter, gastos, configFiscal]);

  const amortizaciones = useMemo(() => {
    const anual = inversiones.reduce((acc, inv) => inv.vidaUtil > 0 ? acc + (inv.importe / inv.vidaUtil) : acc, 0);
    return { anual: anual || 0, mensual: (anual || 0) / 12 };
  }, [inversiones]);

  const inversionStats = useMemo(() => {
    const totalInversion = inversiones.reduce((acc, curr) => acc + (curr.importe || 0), 0);
    const mesesROI = fiscalData.beneficioReal > 0 ? (totalInversion / (fiscalData.beneficioReal / 3)) : 0; 
    const totalDeducibleAnual = amortizaciones.anual;
    return { totalInversion, mesesROI, totalDeducibleAnual };
  }, [inversiones, fiscalData.beneficioReal, amortizaciones]);

  const gastosAgrupados = useMemo(() => {
    const grupos = {};
    // Aggregate over all expenses (we fetch all from backend for reporting list)
    // For simplicity, we can aggregate over the visible list, or fetch all.
    // Let's do it on the current page list or keep it simple.
    gastos.forEach(g => {
      if (!grupos[g.concepto]) {
        grupos[g.concepto] = { proveedor: g.concepto, categoria: g.categoria, cantidadFacturas: 0, importeTotal: 0 };
      }
      grupos[g.concepto].cantidadFacturas += 1;
      grupos[g.concepto].importeTotal += g.importe;
    });
    return Object.values(grupos);
  }, [gastos]);

  const uploadedDocs = useMemo(() => {
    const docs = {};
    gastos.forEach(g => {
      if (g.justificante_filename) {
        docs[g.concepto] = g.justificante_filename;
      }
    });
    return docs;
  }, [gastos]);

  const fiscalCalendar = useMemo(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    let nextDeadline = month <= 3 ? "25 de Abril" : month <= 6 ? "25 de Julio" : month <= 9 ? "25 de Octubre" : "25 de Enero";
    let quarter = month <= 3 ? "1er Trimestre" : month <= 6 ? "2º Trimestre" : month <= 9 ? "3er Trimestre" : "4º Trimestre";
    return { nextDeadline, quarter };
  }, []);

  const allDocsUploaded = useMemo(() => gastosAgrupados.length > 0 && gastosAgrupados.every(grupo => uploadedDocs[grupo.proveedor]), [gastosAgrupados, uploadedDocs]);
  const canGeneratePackage = true; // Sincronización directa y automatizada activa

  // Handlers
  const resetForm = () => {
    setNuevoGasto({ 
      fecha: new Date().toISOString().split('T')[0], 
      nameConcepto: '', // name of provider
      diaCobro: new Date().getDate(), 
      categoria: CATEGORIES[0], 
      concepto: '', 
      importe: '', 
      iva: '21', 
      deducibleIva: 100, 
      deducibleIrpf: 100, 
      esInversion: false, 
      esAbono: false,
      es_recurrente: false,
      vidaUtil: 4 
    });
    setEditingId(null);
  };

  const handleSaveGasto = async (e) => {
    e.preventDefault();
    if (!nuevoGasto.concepto || !nuevoGasto.importe) return;
    
    let importeNum = Math.abs(parseFloat(nuevoGasto.importe));
    if (nuevoGasto.esAbono) {
      importeNum = -importeNum;
    }

    // Direct routing for investments
    if (nuevoGasto.esInversion && !nuevoGasto.esAbono && !editingId) {
      const invData = {
        concepto: nuevoGasto.concepto,
        categoria: 'Equipamiento',
        importe: importeNum,
        vidaUtil: nuevoGasto.vidaUtil || 4,
        fecha: nuevoGasto.fecha
      };
      
      try {
        await api.post('/inversiones', invData);
        await loadData();
        setShowForm(false);
        resetForm();
        setActiveTab('inversion');
      } catch (err) {
        console.error("Error creating investment:", err);
      }
      return;
    }

    // Normal Expense Flow
    const expData = { 
      fecha: nuevoGasto.fecha,
      diaCobro: parseInt(nuevoGasto.diaCobro) || 1,
      categoria: nuevoGasto.categoria,
      concepto: nuevoGasto.concepto,
      importe: importeNum, 
      iva: parseInt(nuevoGasto.iva), 
      deducibleIva: parseInt(nuevoGasto.deducibleIva) || 0, 
      deducibleIrpf: parseInt(nuevoGasto.deducibleIrpf) || 0,
      es_recurrente: nuevoGasto.es_recurrente
    };

    try {
      if (editingId) {
        await api.put(`/gastos/${editingId}`, expData);
      } else {
        await api.post('/gastos', expData);
      }
      // Force page back to 1 on new entry, or reload current page
      if (!editingId) setPage(1);
      await fetchGastos(page);
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Error saving expense:", err);
    }
  };

  const handleEditGasto = (gasto) => {
    setNuevoGasto({ 
      fecha: gasto.fecha,
      diaCobro: gasto.diaCobro,
      categoria: gasto.categoria,
      concepto: gasto.concepto,
      iva: (gasto.iva || 21).toString(), 
      deducibleIva: gasto.deducibleIva ?? 100, 
      deducibleIrpf: gasto.deducibleIrpf ?? 100, 
      esInversion: false, 
      esAbono: gasto.importe < 0,
      es_recurrente: gasto.es_recurrente ?? false,
      vidaUtil: 4,
      importe: Math.abs(gasto.importe)
    });
    setEditingId(gasto.id);
    setShowForm(true);
  };

  const handleDeleteGasto = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este gasto?")) return;
    try {
      await api.delete(`/gastos/${id}`);
      await fetchGastos(page);
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

  const handleSaveInversion = async (invData) => {
    try {
      await api.post('/inversiones', invData);
      await loadData();
    } catch (err) {
      console.error("Error saving investment:", err);
    }
  };

  const handleDeleteInversion = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta inversión?")) return;
    try {
      await api.delete(`/inversiones/${id}`);
      await loadData();
    } catch (err) {
      console.error("Error deleting investment:", err);
    }
  };

  const handleSaveConfig = async (cfgData) => {
    try {
      const updated = await api.put('/config', cfgData);
      setConfigFiscal(updated);
    } catch (err) {
      console.error("Error updating configuration:", err);
      throw err;
    }
  };

  const handleSyncTiendaVentas = async () => {
    try {
      const query = selectedQuarter ? `?quarter=${selectedQuarter}` : '';
      const res = await api.post(`/ventas/sync-tienda${query}`);
      // Reload reports
      const queryParams = [
        `simExtraCost=${simExtraCost}`,
        `simPriceChange=${simPriceChange}`
      ];
      if (selectedQuarter !== null) {
        queryParams.push(`quarter=${selectedQuarter}`);
      }
      const summary = await api.get(`/reports/fiscal-summary?${queryParams.join('&')}`);
      setFiscalData(summary);
      setGestoriaFiles(prev => ({ ...prev, ventas: `Sincronizado de Tienda (${selectedQuarter ? `${selectedQuarter}T` : 'Anual'})` }));
      setIsReportGenerated(false);
      setShowAnnualReport(false);
      alert("¡Ventas sincronizadas exitosamente con la base de datos de la tienda!");
    } catch (err) {
      console.error("Error syncing sales from store:", err);
      alert("Error al sincronizar con la base de datos de la tienda.");
    }
  };

  const handleGestoriaUpload = async (type, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'ventas') {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await api.post('/ventas/upload-csv', formData);
        setGestoriaFiles(prev => ({ ...prev, ventas: file.name }));
        setIsReportGenerated(false);
        setShowAnnualReport(false);
        await loadData();
      } catch (err) {
        console.error("Error uploading sales CSV:", err);
        alert("Error al procesar el archivo CSV.");
      }
    } else {
      setGestoriaFiles(prev => ({ ...prev, [type]: file.name }));
      setIsReportGenerated(false);
      setShowAnnualReport(false);
    }
  };

  const handleDocUpload = async (proveedor, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const targetGasto = gastos.find(g => g.concepto === proveedor && !g.justificante_filename);
    if (!targetGasto) {
      alert("No se encontró ningún gasto pendiente de justificante para este proveedor en esta página.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post(`/gastos/${targetGasto.id}/upload`, formData);
      await fetchGastos(page);
      setIsReportGenerated(false);
      setShowAnnualReport(false);
    } catch (err) {
      console.error("Error uploading justification:", err);
      alert("Error al subir el archivo justificante.");
    }
  };

  const handleDirectDocUpload = async (gastoId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post(`/gastos/${gastoId}/upload`, formData);
      await fetchGastos(page);
    } catch (err) {
      console.error("Error uploading direct justification:", err);
      alert("Error al subir el archivo justificante.");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-24 lg:w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 shrink-0 overflow-y-auto">
        <div className="h-32 flex items-center justify-center lg:justify-start lg:px-10 border-b border-white/5 shrink-0">
          <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/30">
            <Wallet size={24} className="text-white" />
          </div>
          <div className="hidden lg:block ml-4 leading-tight">
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">NaturaFinance</h1>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Strategic Intelligence</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 font-black uppercase italic">
          <SidebarButton tab="dashboard" icon={LayoutDashboard} label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarButton tab="gastos" icon={Receipt} label="Libro Gastos" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarButton tab="estrategia" icon={BrainCircuit} label="Cerebro Estratégico" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarButton tab="calendario" icon={CalendarDays} label="Calendario Fiscal" activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="h-px bg-white/5 my-6 mx-4" />
          <SidebarButton tab="fiscal" icon={Settings} label="Datos Fiscales" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarButton tab="inversion" icon={PieChart} label="Amortización" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarButton tab="gestoria" icon={FolderLock} label="Portal Gestoría" activeTab={activeTab} setActiveTab={setActiveTab} highlight />
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <div className="p-8 lg:p-14 max-w-7xl mx-auto w-full space-y-10 pb-24">
          
          <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 uppercase font-black italic">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block tracking-[0.3em]">Accounting Intelligence</label>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mt-1 leading-none">
                {activeTab === 'dashboard' ? 'Control de Negocio' : activeTab === 'gastos' ? 'Libro de Gastos' : activeTab === 'estrategia' ? 'Análisis Predictivo' : activeTab === 'gestoria' ? 'Cierre y Gestión' : activeTab === 'inversion' ? 'Recuperación de ROI' : activeTab === 'calendario' ? 'Calendario de Impuestos' : 'Perfil y Fiscalidad'}
              </h2>
            </div>
          </header>

          {/* Tab Renderers */}
          {activeTab === 'dashboard' && (
            <DashboardTab 
              configFiscal={configFiscal} 
              gastos={gastos} 
              fiscalData={fiscalData} 
            />
          )}

          {activeTab === 'gastos' && (
            <GastosTab 
              gastos={gastos} 
              onSaveGasto={handleSaveGasto} 
              onDeleteGasto={handleDeleteGasto} 
              onEditGasto={handleEditGasto}
              categories={CATEGORIES}
              showForm={showForm}
              setShowForm={setShowForm}
              nuevoGasto={nuevoGasto}
              setNuevoGasto={setNuevoGasto}
              editingId={editingId}
              resetForm={resetForm}
              page={page}
              pages={pages}
              total={totalExpenses}
              setPage={setPage}
              proveedores={proveedores}
              onDirectDocUpload={handleDirectDocUpload}
              filterYear={filterYear}
              setFilterYear={setFilterYear}
              filterQuarter={filterQuarter}
              setFilterQuarter={setFilterQuarter}
              filterMonth={filterMonth}
              setFilterMonth={setFilterMonth}
              filterSinJustificante={filterSinJustificante}
              setFilterSinJustificante={setFilterSinJustificante}
              summary={gastosSummary}
              onGenerateRecurring={handleGenerateRecurring}
            />
          )}

          {activeTab === 'estrategia' && (
            <EstrategiaTab 
              simExtraCost={simExtraCost}
              setSimExtraCost={setSimExtraCost}
              simPriceChange={simPriceChange}
              setSimPriceChange={setSimPriceChange}
              simSueldo={simSueldo}
              setSimSueldo={setSimSueldo}
              fiscalData={fiscalData}
            />
          )}

          {activeTab === 'calendario' && (
            <CalendarioTab 
              fiscalCalendar={fiscalCalendar}
              fiscalData={fiscalData}
            />
          )}

          {activeTab === 'inversion' && (
            <InversionTab 
              inversiones={inversiones}
              onSaveInversion={handleSaveInversion}
              onDeleteInversion={handleDeleteInversion}
              amortizaciones={amortizaciones}
              inversionStats={inversionStats}
            />
          )}

          {activeTab === 'gestoria' && (
            <GestoriaTab 
              gastos={gastos}
              gastosAgrupados={gastosAgrupados}
              uploadedDocs={uploadedDocs}
              onDocUpload={handleDocUpload}
              gestoriaFiles={gestoriaFiles}
              onGestoriaUpload={handleGestoriaUpload}
              isReportGenerated={isReportGenerated}
              setIsReportGenerated={setIsReportGenerated}
              showAnnualReport={showAnnualReport}
              setShowAnnualReport={setShowAnnualReport}
              fiscalData={fiscalData}
              amortizaciones={amortizaciones}
              canGeneratePackage={canGeneratePackage}
              onSyncTiendaVentas={handleSyncTiendaVentas}
              selectedQuarter={selectedQuarter}
              setSelectedQuarter={setSelectedQuarter}
            />
          )}

          {activeTab === 'fiscal' && (
            <FiscalTab 
              configFiscal={configFiscal}
              onSaveConfig={handleSaveConfig}
            />
          )}

        </div>
      </main>
    </div>
  );
}

function SidebarButton({ tab, icon: Icon, label, activeTab, setActiveTab, highlight }) {
  const isActive = activeTab === tab;
  return (
    <button 
      onClick={() => setActiveTab(tab)} 
      className={`w-full flex items-center gap-4 p-5 rounded-[24px] transition-all cursor-pointer ${isActive ? 'bg-white/10 text-white shadow-xl translate-x-1 border-r-4 border-emerald-500' : 'text-slate-500 hover:text-white font-bold'} ${highlight && !isActive ? 'text-emerald-400/80 hover:text-emerald-400' : ''}`}
    >
      <Icon size={20} className={isActive ? 'text-emerald-400' : ''} />
      <span className="hidden lg:block text-sm tracking-tight text-left leading-none uppercase font-black">{label}</span>
    </button>
  );
}
