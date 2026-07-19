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
    year: Optional[int] = None,
    quarter: Optional[int] = None,
    month: Optional[int] = None,
    sin_justificante: Optional[bool] = None,
    session: Session = Depends(get_session)
):
    query = select(Gasto)
    
    # Apply filters
    if categoria:
        query = query.where(Gasto.categoria == categoria)
    if concepto:
        query = query.where(Gasto.concepto == concepto)
        
    if year:
        if month:
            query = query.where(Gasto.fecha.like(f"{year}-{month:02d}-%"))
        elif quarter:
            if quarter == 1:
                start_date, end_date = f"{year}-01-01", f"{year}-03-31"
            elif quarter == 2:
                start_date, end_date = f"{year}-04-01", f"{year}-06-30"
            elif quarter == 3:
                start_date, end_date = f"{year}-07-01", f"{year}-09-30"
            else:
                start_date, end_date = f"{year}-10-01", f"{year}-12-31"
            query = query.where(Gasto.fecha >= start_date).where(Gasto.fecha <= end_date)
        else:
            start_date, end_date = f"{year}-01-01", f"{year}-12-31"
            query = query.where(Gasto.fecha >= start_date).where(Gasto.fecha <= end_date)

    if sin_justificante:
        query = query.where((Gasto.justificante_filename == None) | (Gasto.justificante_filename == ""))

    # First, calculate summary statistics for the ENTIRE filtered query (pre-pagination)
    all_matching = session.exec(query).all()
    total = len(all_matching)
    
    total_importe = sum(g.importe for g in all_matching)
    total_iva_deducible = 0.0
    count_justificantes = 0
    
    for g in all_matching:
        base = g.importe / (1 + (g.iva / 100))
        cuota = g.importe - base
        pctIva = (g.deducibleIva if g.deducibleIva is not None else 100) / 100
        total_iva_deducible += cuota * pctIva
        if g.justificante_filename:
            count_justificantes += 1
            
    summary = {
        "total_importe": round(total_importe, 2),
        "total_iva_deducible": round(total_iva_deducible, 2),
        "count_justificantes": count_justificantes,
        "count_total": total
    }

    # Apply limit and offset for pagination on the query
    offset = (page - 1) * limit
    # We re-run query with order and pagination
    paginated_query = query.order_by(Gasto.fecha.desc()).offset(offset).limit(limit)
    items = session.exec(paginated_query).all()
    
    pages = (total + limit - 1) // limit if limit > 0 else 1
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages,
        "summary": summary
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
