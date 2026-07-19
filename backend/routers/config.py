from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import ConfiguracionFiscal

router = APIRouter(prefix="/api/config", tags=["config"])

@router.get("", response_model=ConfiguracionFiscal)
def get_config(session: Session = Depends(get_session)):
    config = session.exec(select(ConfiguracionFiscal).where(ConfiguracionFiscal.id == 1)).first()
    if not config:
        # Seed default configuration
        config = ConfiguracionFiscal(id=1)
        session.add(config)
        session.commit()
        session.refresh(config)
    return config

@router.put("", response_model=ConfiguracionFiscal)
def update_config(config_data: ConfiguracionFiscal, session: Session = Depends(get_session)):
    config = session.exec(select(ConfiguracionFiscal).where(ConfiguracionFiscal.id == 1)).first()
    if not config:
        config = ConfiguracionFiscal(id=1)
        session.add(config)
    
    # Update fields
    config.comercio = config_data.comercio
    config.titular = config_data.titular
    config.nif = config_data.nif
    config.direccion = config_data.direccion
    config.epigrafe = config_data.epigrafe
    config.regimenIva = config_data.regimenIva
    config.regimenIrpf = config_data.regimenIrpf
    config.irpfProyectado = config_data.irpfProyectado
    config.dificilJustificacion = config_data.dificilJustificacion
    config.retencionAlquiler = config_data.retencionAlquiler
    config.retencionNominas = config_data.retencionNominas
    config.contingenciasComunesPct = config_data.contingenciasComunesPct
    config.desempleoPct = config_data.desempleoPct
    config.formacionProfesionalPct = config_data.formacionProfesionalPct
    config.precioHoraExtra = config_data.precioHoraExtra
    config.inventarioInicial = config_data.inventarioInicial
    config.inventarioFinal = config_data.inventarioFinal
    config.ingresosTotales = config_data.ingresosTotales
    
    session.add(config)
    session.commit()
    session.refresh(config)
    return config
