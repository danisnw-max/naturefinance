from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from database import get_session, get_quarter_dates
from models import Gasto, ConfiguracionFiscal, Inversion
from typing import Optional
import sqlite3
import os

router = APIRouter(prefix="/api/reports", tags=["reports"])

TIENDA_DB_PATH = "C:/Users/Daniel/Documents/ATERPE/SOFTWARE TIENDA/backend/database.db"

@router.get("/fiscal-summary")
def get_fiscal_summary(
    simExtraCost: float = 0.0,
    simPriceChange: float = 0.0,
    quarter: Optional[int] = None,
    year: int = 2026,
    session: Session = Depends(get_session)
):
    # Fetch config
    config = session.exec(select(ConfiguracionFiscal).where(ConfiguracionFiscal.id == 1)).first()
    if not config:
        config = ConfiguracionFiscal(id=1)
        session.add(config)
        session.commit()
        session.refresh(config)

    # Fetch expenses
    gastos = session.exec(select(Gasto)).all()
    
    # Filter expenses by quarter if specified
    q_start, q_end = get_quarter_dates(year, quarter)
    gastos = [g for g in gastos if q_start <= g.fecha <= q_end]

    # Calculate revenues directly from the store database if possible
    sales_total = 0.0
    db_connected = False
    if os.path.exists(TIENDA_DB_PATH):
        try:
            conn = sqlite3.connect(TIENDA_DB_PATH)
            cursor = conn.cursor()
            start_date, end_date = get_quarter_dates(year, quarter)
            cursor.execute("SELECT SUM(total) FROM venta WHERE date >= ? AND date <= ?", (start_date, f"{end_date}T23:59:59"))
            
            row = cursor.fetchone()
            conn.close()
            sales_total = row[0] if row[0] is not None else 0.0
            db_connected = True
        except Exception as e:
            print(f"Error querying store database: {e}")

    # Fallback to local configuration if store DB connection fails or is not available
    if not db_connected:
        if quarter is not None:
            # Simple division for estimation if we only have annual total in config
            sales_total = (config.ingresosTotales or 0.0) / 4.0
        else:
            sales_total = config.ingresosTotales or 0.0

    # Constants from business logic
    IVA_TIPO_VENTAS = 10
    DIFICIL_JUSTIFICACION_LIMITE = 4000

    # Calculate revenues
    adjustedIngresos = sales_total * (1 + (simPriceChange / 100))
    ventasBase = adjustedIngresos / (1 + (IVA_TIPO_VENTAS / 100))
    ivaVentas = adjustedIngresos - ventasBase

    totalGastosBrutos = 0.0
    ivaGastosDeducible = 0.0
    baseGastosDeducible = 0.0
    retencionesAlquiler = 0.0
    retencionesNominas = 0.0
    retencionesProfesionales = 0.0
    baseNominas = 0.0
    baseAlquiler = 0.0
    baseProfesionales = 0.0
    numPerceptoresNominas = 0
    numPerceptoresProfesionales = 0

    for g in gastos:
        importe = g.importe or 0.0
        base = importe / (1 + (g.iva / 100))
        cuota = importe - base
        pctIva = (g.deducibleIva if g.deducibleIva is not None else 100) / 100
        pctIrpf = (g.deducibleIrpf if g.deducibleIrpf is not None else 100) / 100

        totalGastosBrutos += importe
        ivaGastosDeducible += cuota * pctIva
        baseGastosDeducible += base * pctIrpf

        if g.categoria == 'Alquiler':
            baseAlquiler += base
            retencionesAlquiler += base * ((config.retencionAlquiler or 0) / 100)
        elif g.categoria == 'Nóminas y Personal':
            baseNominas += base
            numPerceptoresNominas += 1
            retencionesNominas += base * ((config.retencionNominas or 0) / 100)
        elif g.categoria == 'Servicios Profesionales / Autónomos':
            baseProfesionales += base
            numPerceptoresProfesionales += 1
            pct_prof = getattr(g, 'retencionIrpf', None)
            pct_prof = pct_prof if (pct_prof is not None and pct_prof > 0) else 15
            retencionesProfesionales += base * (pct_prof / 100)

    totalGastosFinal = totalGastosBrutos + simExtraCost
    balanceIVA = ivaVentas - ivaGastosDeducible

    # COGS / Variación de existencias
    # Only apply stock variance for full year report or scale it for quarter
    variacionExistencias = (config.inventarioInicial or 0.0) - (config.inventarioFinal or 0.0)
    if quarter is not None:
        variacionExistencias = variacionExistencias / 4.0

    rendimientoNetoPrevio = ventasBase - baseGastosDeducible - simExtraCost - variacionExistencias

    # Gasto de difícil justificación (Cap de Bizkaia)
    gastoDificilJustificacion = min(
        max(0.0, rendimientoNetoPrevio * ((config.dificilJustificacion or 0) / 100)), 
        DIFICIL_JUSTIFICACION_LIMITE
    )
    rendimientoNetoFinal = rendimientoNetoPrevio - gastoDificilJustificacion

    provisionIRPF = max(0.0, rendimientoNetoFinal * ((config.irpfProyectado or 0) / 100))
    beneficioReal = (adjustedIngresos - totalGastosFinal) - provisionIRPF - (balanceIVA if balanceIVA > 0 else 0)
    cargaFiscalTotal = provisionIRPF + (balanceIVA if balanceIVA > 0 else 0) + retencionesAlquiler + retencionesNominas + retencionesProfesionales

    # Métricas de Consultoría Financiera e Inversión
    diasPeriodo = 90 if quarter is not None else 365
    diasLaborables = 75 if quarter is not None else 300
    
    # Break-even daily revenue needed
    gastosMensualizados = (totalGastosFinal + provisionIRPF + (balanceIVA if balanceIVA > 0 else 0)) / (3 if quarter is not None else 12)
    breakEvenDiario = (totalGastosFinal + provisionIRPF + (balanceIVA if balanceIVA > 0 else 0)) / max(1, diasLaborables)

    # Margen comercial %
    margenOperativoPct = round(((adjustedIngresos - totalGastosFinal) / max(1.0, adjustedIngresos)) * 100, 1)

    # Margen disponible para aprovechamiento 10% Difícil Justificación
    margenDificilJustifDisponible = max(0.0, DIFICIL_JUSTIFICACION_LIMITE - gastoDificilJustificacion)

    # Retirada máxima de caja segura (Respetando reserva de impuestos Mod 303, 111, 115 e IRPF)
    retencionReservaImpuestos = (balanceIVA if balanceIVA > 0 else 0) + retencionesAlquiler + retencionesNominas + retencionesProfesionales + (provisionIRPF / 3 if quarter is not None else provisionIRPF / 12)
    retiradaSeguraMensual = max(0.0, (beneficioReal / (3 if quarter is not None else 12)))

    return {
        "adjustedIngresos": adjustedIngresos,
        "ventasBase": ventasBase,
        "ivaVentas": ivaVentas,
        "totalGastosBrutos": totalGastosBrutos,
        "totalGastos": totalGastosFinal,
        "ivaGastos": ivaGastosDeducible,
        "baseGastosDeducible": baseGastosDeducible,
        "baseNominas": baseNominas,
        "baseAlquiler": baseAlquiler,
        "baseProfesionales": baseProfesionales,
        "numPerceptoresNominas": numPerceptoresNominas,
        "numPerceptoresProfesionales": numPerceptoresProfesionales,
        "pctRetencionNominas": config.retencionNominas if config else 2,
        "pctRetencionAlquiler": config.retencionAlquiler if config else 19,
        "retencionesAlquiler": retencionesAlquiler,
        "retencionesNominas": retencionesNominas,
        "retencionesProfesionales": retencionesProfesionales,
        "retencionesTotales111": retencionesNominas + retencionesProfesionales,
        "balanceIVA": balanceIVA,
        "variacionExistencias": variacionExistencias,
        "rendimientoNetoPrevio": rendimientoNetoPrevio,
        "gastoDificilJustificacion": gastoDificilJustificacion,
        "margenDificilJustifDisponible": margenDificilJustifDisponible,
        "rendimientoNeto": rendimientoNetoFinal,
        "provisionIRPF": provisionIRPF,
        "beneficioReal": beneficioReal,
        "cargaFiscalTotal": cargaFiscalTotal,
        "breakEvenDiario": breakEvenDiario,
        "margenOperativoPct": margenOperativoPct,
        "retencionReservaImpuestos": retencionReservaImpuestos,
        "retiradaSeguraMensual": retiradaSeguraMensual
    }
