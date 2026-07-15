from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from database import get_session
from models import Gasto, ConfiguracionFiscal, Inversion
from typing import Optional

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/fiscal-summary")
def get_fiscal_summary(
    simExtraCost: float = 0.0,
    simPriceChange: float = 0.0,
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
    
    # Constants from business logic
    IVA_TIPO_VENTAS = 10
    DIFICIL_JUSTIFICACION_LIMITE = 4000

    # Calculate revenues
    adjustedIngresos = (config.ingresosTotales or 0.0) * (1 + (simPriceChange / 100))
    ventasBase = adjustedIngresos / (1 + (IVA_TIPO_VENTAS / 100))
    ivaVentas = adjustedIngresos - ventasBase

    totalGastosBrutos = 0.0
    ivaGastosDeducible = 0.0
    baseGastosDeducible = 0.0
    retencionesAlquiler = 0.0
    retencionesNominas = 0.0

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
            retencionesAlquiler += base * ((config.retencionAlquiler or 0) / 100)
        elif g.categoria == 'Nóminas y Personal':
            retencionesNominas += base * ((config.retencionNominas or 0) / 100)

    totalGastosFinal = totalGastosBrutos + simExtraCost
    balanceIVA = ivaVentas - ivaGastosDeducible

    # COGS / Variación de existencias
    variacionExistencias = (config.inventarioInicial or 0.0) - (config.inventarioFinal or 0.0)
    rendimientoNetoPrevio = ventasBase - baseGastosDeducible - simExtraCost - variacionExistencias

    # Gasto de difícil justificación (Cap de Bizkaia)
    gastoDificilJustificacion = min(
        max(0.0, rendimientoNetoPrevio * ((config.dificilJustificacion or 0) / 100)), 
        DIFICIL_JUSTIFICACION_LIMITE
    )
    rendimientoNetoFinal = rendimientoNetoPrevio - gastoDificilJustificacion

    provisionIRPF = max(0.0, rendimientoNetoFinal * ((config.irpfProyectado or 0) / 100))
    beneficioReal = (adjustedIngresos - totalGastosFinal) - provisionIRPF - (balanceIVA if balanceIVA > 0 else 0)

    return {
        "adjustedIngresos": adjustedIngresos,
        "ventasBase": ventasBase,
        "ivaVentas": ivaVentas,
        "totalGastosBrutos": totalGastosBrutos,
        "totalGastos": totalGastosFinal,
        "ivaGastos": ivaGastosDeducible,
        "baseGastosDeducible": baseGastosDeducible,
        "retencionesAlquiler": retencionesAlquiler,
        "retencionesNominas": retencionesNominas,
        "balanceIVA": balanceIVA,
        "variacionExistencias": variacionExistencias,
        "rendimientoNetoPrevio": rendimientoNetoPrevio,
        "gastoDificilJustificacion": gastoDificilJustificacion,
        "rendimientoNeto": rendimientoNetoFinal,
        "provisionIRPF": provisionIRPF,
        "beneficioReal": beneficioReal,
        "cargaFiscalTotal": provisionIRPF + (balanceIVA if balanceIVA > 0 else 0) + retencionesAlquiler + retencionesNominas
    }
