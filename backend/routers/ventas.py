from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from database import get_session
from models import ConfiguracionFiscal
import csv
import io
import sqlite3
import os
from typing import Optional

router = APIRouter(prefix="/api/ventas", tags=["ventas"])

TIENDA_DB_PATH = "C:/Users/Daniel/Documents/ATERPE/SOFTWARE TIENDA/backend/database.db"

@router.post("/sync-tienda")
def sync_tienda_ventas(
    quarter: Optional[int] = None,
    year: int = 2026,
    session: Session = Depends(get_session)
):
    if not os.path.exists(TIENDA_DB_PATH):
        raise HTTPException(status_code=404, detail="Base de datos de la tienda no encontrada en la ruta especificada.")
    try:
        conn = sqlite3.connect(TIENDA_DB_PATH)
        cursor = conn.cursor()
        
        if quarter is not None:
            if quarter == 1:
                start_date, end_date = f"{year}-01-01", f"{year}-03-31T23:59:59"
            elif quarter == 2:
                start_date, end_date = f"{year}-04-01", f"{year}-06-30T23:59:59"
            elif quarter == 3:
                start_date, end_date = f"{year}-07-01", f"{year}-09-30T23:59:59"
            else:
                start_date, end_date = f"{year}-10-01", f"{year}-12-31T23:59:59"
            cursor.execute("SELECT SUM(total) FROM venta WHERE date >= ? AND date <= ? AND tipo_documento != 'Devolución'", (start_date, end_date))
        else:
            cursor.execute("SELECT SUM(total) FROM venta WHERE tipo_documento != 'Devolución'")
            
        row = cursor.fetchone()
        conn.close()
        
        total = row[0] if row[0] is not None else 0.0
        
        # Only update the global annual ingresosTotales if quarter is None (full sync)
        if quarter is None:
            config = session.exec(select(ConfiguracionFiscal).where(ConfiguracionFiscal.id == 1)).first()
            if not config:
                config = ConfiguracionFiscal(id=1)
                session.add(config)
            config.ingresosTotales = total
            session.add(config)
            session.commit()
            session.refresh(config)

        return {"status": "ok", "ingresosTotales": total, "quarter": quarter, "year": year}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al sincronizar con la base de datos de la tienda: {str(e)}")

@router.post("/upload-csv")
def upload_ventas_csv(file: UploadFile = File(...), session: Session = Depends(get_session)):
    contents = file.file.read()
    try:
        decoded = contents.decode("utf-8")
    except UnicodeDecodeError:
        try:
            decoded = contents.decode("latin-1")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"No se pudo decodificar el archivo: {str(e)}")

    lines = decoded.splitlines()
    if not lines:
        raise HTTPException(status_code=400, detail="El archivo está vacío")

    # Detect delimiter
    header = lines[0]
    delimiter = ";" if ";" in header else ","
    
    # Parse header
    reader = csv.reader(io.StringIO(header), delimiter=delimiter)
    try:
        header_cols = next(reader)
    except StopIteration:
        raise HTTPException(status_code=400, detail="Cabecera no válida")

    # Find total/importe column index (case-insensitive)
    total_idx = -1
    for idx, col in enumerate(header_cols):
        col_lower = col.lower()
        if "total" in col_lower or "importe" in col_lower or "monto" in col_lower:
            total_idx = idx
            break

    if total_idx == -1:
        raise HTTPException(status_code=400, detail="No se encontró una columna de 'total' o 'importe' en el CSV")

    # Parse rows
    suma = 0.0
    csv_reader = csv.reader(io.StringIO("\n".join(lines[1:])), delimiter=delimiter)
    for row in csv_reader:
        if not row or len(row) <= total_idx:
            continue
        val_str = row[total_idx].strip()
        # Clean formatting (e.g. replace comma with dot, remove currency symbols)
        val_str = val_str.replace(",", ".").replace("€", "").replace("$", "").strip()
        try:
            val = float(val_str)
            suma += val
        except ValueError:
            continue

    # Update config fiscal with the new total
    config = session.exec(select(ConfiguracionFiscal).where(ConfiguracionFiscal.id == 1)).first()
    if not config:
        config = ConfiguracionFiscal(id=1)
        session.add(config)
    
    config.ingresosTotales = suma
    session.add(config)
    session.commit()
    session.refresh(config)

    return {"status": "ok", "ingresosTotales": suma}
