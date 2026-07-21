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

@router.post("/generate-recurring")
def generate_recurring(
    year: int,
    month: int,
    session: Session = Depends(get_session)
):
    import calendar
    
    # Check if we already have expenses for this month to avoid duplicates
    existing = session.exec(
        select(Gasto).where(Gasto.fecha.like(f"{year}-{month:02d}-%"))
    ).all()
    
    existing_keys = {(g.concepto, g.categoria) for g in existing}

    # Find all recurring template expenses from the database history
    recurring_templates = session.exec(
        select(Gasto)
        .where(Gasto.es_recurrente == True)
        .order_by(Gasto.fecha.desc())
    ).all()
    
    if not recurring_templates:
        raise HTTPException(status_code=400, detail="No hay gastos recurrentes registrados como plantilla.")
        
    # Get unique templates based on concept and category
    templates = {}
    for g in recurring_templates:
        key = (g.concepto, g.categoria)
        if key not in templates:
            templates[key] = g
            
    # Insert missing templates into the target month
    added_count = 0
    max_days = calendar.monthrange(year, month)[1]
    
    import re
    for key, template in templates.items():
        if key not in existing_keys:
            day = min(template.diaCobro, max_days)
            new_date = f"{year}-{month:02d}-{day:02d}"
            
            # Automatically update strings like "6/2026" or "06/2026" to "7/2026" in the concept
            nuevo_concepto = re.sub(r'\b\d{1,2}/\d{4}\b', f"{month}/{year}", template.concepto)
            
            new_gasto = Gasto(
                fecha=new_date,
                diaCobro=day,
                categoria=template.categoria,
                concepto=nuevo_concepto,
                importe=template.importe,
                iva=template.iva,
                deducibleIva=template.deducibleIva,
                deducibleIrpf=template.deducibleIrpf,
                es_recurrente=True,
                justificante_filename=None # reset document since it's a new month
            )
            session.add(new_gasto)
            added_count += 1
            
    session.commit()
    return {"status": "ok", "generated_count": added_count}

from pydantic import BaseModel

class SendEmailPayload(BaseModel):
    email: str
    nombre_empleado: Optional[str] = None

TIENDA_DB_PATH = "C:/Users/Daniel/Documents/ATERPE/SOFTWARE TIENDA/backend/database.db"

@router.post("/{gasto_id}/send-email")
def send_payroll_email(
    gasto_id: int,
    payload: SendEmailPayload,
    session: Session = Depends(get_session)
):
    import sqlite3
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.application import MIMEApplication

    gasto = session.get(Gasto, gasto_id)
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
        
    if not gasto.justificante_filename:
        raise HTTPException(status_code=400, detail="Este registro de nómina no tiene adjunto ningún documento justificante en PDF.")

    file_path = os.path.join(UPLOAD_DIR, gasto.justificante_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="El archivo adjunto no existe en el servidor.")

    # Fetch SMTP configuration from TIENDA database if available
    smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")
    email_remitente = os.environ.get("EMAIL_REMITENTE", "")

    if os.path.exists(TIENDA_DB_PATH):
        try:
            conn = sqlite3.connect(TIENDA_DB_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT smtp_server, smtp_port, smtp_user, smtp_password, email_remitente FROM smtpconfig LIMIT 1")
            row = cursor.fetchone()
            conn.close()
            if row:
                smtp_server = row[0] or smtp_server
                smtp_port = row[1] or smtp_port
                smtp_user = row[2] or smtp_user
                smtp_password = row[3] or smtp_password
                email_remitente = row[4] or email_remitente
        except Exception as e:
            print("Notice: Could not load SMTP config from store DB:", e)

    if not smtp_user or not smtp_password:
        raise HTTPException(status_code=400, detail="Configuración SMTP no encontrada. Configure las credenciales de correo en la tienda o en variables de entorno.")

    remitente = email_remitente or smtp_user
    nombre_emp = payload.nombre_empleado or "Empleado"

    msg = MIMEMultipart()
    msg['From'] = remitente
    msg['To'] = payload.email
    msg['Subject'] = f"Nómina de {gasto.concepto} - {gasto.fecha}"

    body = f"Hola {nombre_emp},\n\nAdjunto encontrarás el justificante de la nómina correspondiente al periodo {gasto.fecha}.\n\nUn saludo,\nAterpe Herboristería / Contabilidad"
    msg.attach(MIMEText(body, 'plain'))

    try:
        with open(file_path, "rb") as f:
            part = MIMEApplication(f.read(), Name=os.path.basename(file_path))
            part['Content-Disposition'] = f'attachment; filename="{gasto.justificante_filename}"'
            msg.attach(part)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error leyendo el archivo adjunto: {str(e)}")

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(remitente, payload.email, msg.as_string())
        server.quit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al enviar el correo SMTP: {str(e)}")

    return {"status": "ok", "message": f"Nómina enviada correctamente a {payload.email}"}
