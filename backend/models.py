from typing import Optional
from sqlmodel import SQLModel, Field

class ConfiguracionFiscal(SQLModel, table=True):
    __tablename__ = "configuracion_fiscal"
    id: Optional[int] = Field(default=1, primary_key=True)
    comercio: str = Field(default="Aterpe Herboristería")
    titular: str = Field(default="Tu Nombre Apellidos")
    nif: str = Field(default="12345678Z")
    direccion: str = Field(default="Calle Principal 1, Bizkaia")
    epigrafe: str = Field(default="652.4 - Comercio plantas y hierbas")
    regimenIva: str = Field(default="General")
    regimenIrpf: str = Field(default="Estimación Directa Simplificada")
    irpfProyectado: int = Field(default=20)
    dificilJustificacion: int = Field(default=10)
    retencionAlquiler: int = Field(default=19)
    retencionNominas: int = Field(default=2)
    inventarioInicial: float = Field(default=14000.0)
    inventarioFinal: float = Field(default=12000.0)
    ingresosTotales: float = Field(default=11700.0)

class Gasto(SQLModel, table=True):
    __tablename__ = "gasto"
    id: Optional[int] = Field(default=None, primary_key=True)
    fecha: str = Field(index=True)  # YYYY-MM-DD
    diaCobro: int
    categoria: str = Field(index=True)
    concepto: str = Field(index=True)
    importe: float
    iva: int  # 0, 4, 10, 21
    deducibleIva: int  # 0-100
    deducibleIrpf: int  # 0-100
    justificante_filename: Optional[str] = None  # PDF/image filename uploaded
    es_recurrente: bool = Field(default=False)

class Inversion(SQLModel, table=True):
    __tablename__ = "inversion"
    id: Optional[int] = Field(default=None, primary_key=True)
    categoria: str
    concepto: str
    importe: float
    vidaUtil: int  # in years (e.g. 10, 8, 4...)
    fecha: str  # YYYY-MM-DD
