from fastapi import APIRouter, HTTPException
import sqlite3
import os
from typing import List, Dict

router = APIRouter(prefix="/api/proveedores", tags=["proveedores"])

TIENDA_DB_PATH = "C:/Users/Daniel/Documents/ATERPE/SOFTWARE TIENDA/backend/database.db"

@router.get("/tienda", response_model=List[Dict])
def get_tienda_proveedores():
    if not os.path.exists(TIENDA_DB_PATH):
        # Return fallback list if database is not found
        return [
            {"id": "prov1", "nombre": "Iberdrola", "cif": "A1234567B"},
            {"id": "prov2", "nombre": "Vodafone", "cif": "B87654321"},
            {"id": "prov3", "nombre": "Alquiler Local", "cif": "12345678X"},
            {"id": "prov4", "nombre": "Gestoría Bizkaia", "cif": "A5555555C"}
        ]
    
    try:
        conn = sqlite3.connect(TIENDA_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, cif FROM proveedor WHERE estado='Activo' ORDER BY nombre ASC")
        rows = cursor.fetchall()
        conn.close()
        
        proveedores = []
        for row in rows:
            proveedores.append({
                "id": row[0],
                "nombre": row[1],
                "cif": row[2]
            })
        return proveedores
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener proveedores de la tienda: {str(e)}")
