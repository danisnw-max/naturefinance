from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import Inversion
from typing import List

router = APIRouter(prefix="/api/inversiones", tags=["inversiones"])

@router.get("", response_model=List[Inversion])
def list_inversiones(session: Session = Depends(get_session)):
    return session.exec(select(Inversion).order_by(Inversion.fecha.desc())).all()

@router.post("", response_model=Inversion)
def create_inversion(inversion: Inversion, session: Session = Depends(get_session)):
    inversion.id = None
    session.add(inversion)
    session.commit()
    session.refresh(inversion)
    return inversion

@router.put("/{inversion_id}", response_model=Inversion)
def update_inversion(inversion_id: int, inversion_data: Inversion, session: Session = Depends(get_session)):
    inversion = session.get(Inversion, inversion_id)
    if not inversion:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")
    
    inversion.categoria = inversion_data.categoria
    inversion.concepto = inversion_data.concepto
    inversion.importe = inversion_data.importe
    inversion.vidaUtil = inversion_data.vidaUtil
    inversion.fecha = inversion_data.fecha
    
    session.add(inversion)
    session.commit()
    session.refresh(inversion)
    return inversion

@router.delete("/{inversion_id}")
def delete_inversion(inversion_id: int, session: Session = Depends(get_session)):
    inversion = session.get(Inversion, inversion_id)
    if not inversion:
        raise HTTPException(status_code=404, detail="Inversión no encontrada")
        
    session.delete(inversion)
    session.commit()
    return {"status": "ok"}
