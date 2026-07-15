from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select, func
from database import get_session
from models import Gasto
from typing import List, Optional, Dict, Any
import os
import shutil

router = APIRouter(prefix="/api/gastos", tags=["gastos"])

# Directory to save justification documents
UPLOAD_DIR = "uploads/justificantes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("", response_model=Dict[str, Any])
def list_gastos(
    page: int = 1,
    limit: int = 50,
    categoria: Optional[str] = None,
    concepto: Optional[str] = None,
    session: Session = Depends(get_session)
):
    query = select(Gasto)
    if categoria:
        query = query.where(Gasto.categoria == categoria)
    if concepto:
        query = query.where(Gasto.concepto == concepto)
        
    # Count total matching records using a count select query
    total_query = select(func.count(Gasto.id))
    if categoria:
        total_query = total_query.where(Gasto.categoria == categoria)
    if concepto:
        total_query = total_query.where(Gasto.concepto == concepto)
        
    total = session.exec(total_query).one()
    
    # Apply limit and offset
    offset = (page - 1) * limit
    items = session.exec(query.order_by(Gasto.fecha.desc()).offset(offset).limit(limit)).all()
    
    pages = (total + limit - 1) // limit if limit > 0 else 1
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

@router.post("", response_model=Gasto)
def create_gasto(gasto: Gasto, session: Session = Depends(get_session)):
    # Reset ID to ensure auto-generation
    gasto.id = None
    session.add(gasto)
    session.commit()
    session.refresh(gasto)
    return gasto

@router.put("/{gasto_id}", response_model=Gasto)
def update_gasto(gasto_id: int, gasto_data: Gasto, session: Session = Depends(get_session)):
    gasto = session.get(Gasto, gasto_id)
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    gasto.fecha = gasto_data.fecha
    gasto.diaCobro = gasto_data.diaCobro
    gasto.categoria = gasto_data.categoria
    gasto.concepto = gasto_data.concepto
    gasto.importe = gasto_data.importe
    gasto.iva = gasto_data.iva
    gasto.deducibleIva = gasto_data.deducibleIva
    gasto.deducibleIrpf = gasto_data.deducibleIrpf
    # Keep the previous filename unless updated
    if gasto_data.justificante_filename is not None:
        gasto.justificante_filename = gasto_data.justificante_filename
        
    session.add(gasto)
    session.commit()
    session.refresh(gasto)
    return gasto

@router.delete("/{gasto_id}")
def delete_gasto(gasto_id: int, session: Session = Depends(get_session)):
    gasto = session.get(Gasto, gasto_id)
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    # Optional: Delete file from disk if it exists
    if gasto.justificante_filename:
        file_path = os.path.join(UPLOAD_DIR, gasto.justificante_filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass # Fail silently
                
    session.delete(gasto)
    session.commit()
    return {"status": "ok"}

@router.post("/{gasto_id}/upload", response_model=Gasto)
def upload_justificante(gasto_id: int, file: UploadFile = File(...), session: Session = Depends(get_session)):
    gasto = session.get(Gasto, gasto_id)
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
        
    # Generate a unique name for the file
    ext = os.path.splitext(file.filename)[1]
    filename = f"gasto_{gasto_id}_{int(os.path.getmtime(UPLOAD_DIR) if os.path.exists(UPLOAD_DIR) else 0)}{ext}"
    
    # Save the file
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    gasto.justificante_filename = filename
    session.add(gasto)
    session.commit()
    session.refresh(gasto)
    return gasto
