from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
import os
from datetime import datetime

from database import engine, create_db_and_tables
from models import ConfiguracionFiscal, Gasto, Inversion
from routers.config import router as config_router
from routers.gastos import router as gastos_router
from routers.inversiones import router as inversiones_router
from routers.ventas import router as ventas_router
from routers.reports import router as reports_router
from routers.proveedores import router as proveedores_router
from routers.empleados import router as empleados_router
from routers.exports import router as exports_router

app = FastAPI(title="NaturaFinance API", version="1.0.0")

# Mount Uploads static files folder and ensure directory exists
os.makedirs("uploads/justificantes", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Enable CORS for multi-device local access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def seed_database(session: Session):
    # Seed Config
    if session.exec(select(ConfiguracionFiscal)).first() is None:
        config = ConfiguracionFiscal(
            id=1,
            comercio="Aterpe Herboristería",
            titular="Daniel Herbolario",
            nif="12345678Z",
            direccion="Calle Principal 1, Bizkaia",
            epigrafe="652.4 - Comercio plantas y hierbas",
            regimenIva="General",
            regimenIrpf="Estimación Directa Simplificada",
            irpfProyectado=20,
            dificilJustificacion=10,
            retencionAlquiler=19,
            retencionNominas=2,
            inventarioInicial=14000.0,
            inventarioFinal=12000.0,
            ingresosTotales=11700.0
        )
        session.add(config)
        session.commit()
        print("Configuracion fiscal successfully seeded!")

    # Seed Expenses (Gastos)
    if session.exec(select(Gasto)).first() is None:
        initial_expenses = []
        # Seed for months 1 to 12 of 2026
        for m in range(1, 13):
            initial_expenses.extend([
                Gasto(fecha=f"2026-{m:02d}-01", diaCobro=1, categoria="Alquiler", concepto="Alquiler Local", importe=1300.0, iva=21, deducibleIva=100, deducibleIrpf=100, es_recurrente=True),
                Gasto(fecha=f"2026-{m:02d}-28", diaCobro=28, categoria="S.S. Autónomo", concepto="Cuota Seguridad Social", importe=320.0, iva=0, deducibleIva=0, deducibleIrpf=100, es_recurrente=True),
                Gasto(fecha=f"2026-{m:02d}-15", diaCobro=15, categoria="Suministros", concepto="Luz y Agua (Iberdrola)", importe=250.0, iva=21, deducibleIva=100, deducibleIrpf=100, es_recurrente=True),
                Gasto(fecha=f"2026-{m:02d}-10", diaCobro=10, categoria="Gestoría", concepto="Mensualidad Contable", importe=120.0, iva=21, deducibleIva=100, deducibleIrpf=100, es_recurrente=True),
                Gasto(fecha=f"2026-{m:02d}-20", diaCobro=20, categoria="Suministros", concepto="Teléfono Móvil (Vodafone)", importe=60.0, iva=21, deducibleIva=50, deducibleIrpf=50, es_recurrente=True),
                Gasto(fecha=f"2026-{m:02d}-28", diaCobro=28, categoria="Nóminas y Personal", concepto="Nómina Dependienta", importe=650.0, iva=0, deducibleIva=0, deducibleIrpf=100, es_recurrente=True)
            ])
        for exp in initial_expenses:
            session.add(exp)
        session.commit()
        print("Initial expenses successfully seeded for all months of 2026!")

    # Seed Investments (Inversiones)
    if session.exec(select(Inversion)).first() is None:
        initial_investments = [
            Inversion(categoria="Local", concepto="Reforma y Adecuación", importe=18000.0, vidaUtil=10, fecha="2026-01-01"),
            Inversion(categoria="Local", concepto="Mobiliario y Rotulación", importe=9000.0, vidaUtil=8, fecha="2026-01-05"),
            Inversion(categoria="Stock", concepto="Stock Inicial", importe=14000.0, vidaUtil=0, fecha="2026-01-01"),
            Inversion(categoria="Otros", concepto="Fondo Maniobra", importe=15000.0, vidaUtil=0, fecha="2026-01-01")
        ]
        for inv in initial_investments:
            session.add(inv)
        session.commit()
        print("Initial investments successfully seeded!")

def migrate_database():
    import sqlite3
    db_path = "database.db"
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            # Check if es_recurrente column exists
            cursor.execute("PRAGMA table_info(gasto)")
            columns = [col[1] for col in cursor.fetchall()]
            if "es_recurrente" not in columns:
                cursor.execute("ALTER TABLE gasto ADD COLUMN es_recurrente BOOLEAN DEFAULT 0")
                conn.commit()
                print("Database migrated: Added es_recurrente column to gasto table.")
            conn.close()
        except Exception as e:
            print("Migration warning:", e)

@app.on_event("startup")
def on_startup():
    migrate_database()
    create_db_and_tables()
    with Session(engine) as session:
        seed_database(session)

@app.get("/api/status")
def get_status():
    return {
        "status": "ok",
        "service": "NaturaFinance API",
        "timestamp": datetime.now().isoformat()
    }

# Include Routers
app.include_router(config_router)
app.include_router(gastos_router)
app.include_router(inversiones_router)
app.include_router(ventas_router)
app.include_router(reports_router)
app.include_router(proveedores_router)
app.include_router(empleados_router)
app.include_router(exports_router)
