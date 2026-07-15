from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from database import get_session
from models import ConfiguracionFiscal
import csv
import io

router = APIRouter(prefix="/api/ventas", tags=["ventas"])

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
