from fastapi import APIRouter, HTTPException
import sqlite3
import os
from typing import List, Dict

router = APIRouter(prefix="/api/empleados", tags=["empleados"])

TIENDA_DB_PATH = "C:/Users/Daniel/Documents/ATERPE/SOFTWARE TIENDA/backend/database.db"

@router.get("", response_model=List[Dict])
def get_empleados():
    if not os.path.exists(TIENDA_DB_PATH):
        return [
            {"id": "emp1", "nombre": "Dependienta Principal", "email": "dependienta@aterpe.com", "puesto": "Dependienta"},
            {"id": "emp2", "nombre": "Asesor Naturista", "email": "asesor@aterpe.com", "puesto": "Asesor"}
        ]
    
    try:
        conn = sqlite3.connect(TIENDA_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, email, puesto FROM empleado WHERE estado='Activo' ORDER BY nombre ASC")
        rows = cursor.fetchall()
        conn.close()
        
        empleados = []
        for row in rows:
            empleados.append({
                "id": str(row[0]),
                "nombre": row[1],
                "email": row[2] or "",
                "puesto": row[3] or ""
            })
        return empleados
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener empleados de la tienda: {str(e)}")
