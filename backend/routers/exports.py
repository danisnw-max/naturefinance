from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from sqlmodel import Session, select
from database import get_session
from models import Gasto, ConfiguracionFiscal
from routers.reports import get_fiscal_summary
from typing import Optional
import zipfile
import io
import os
import xml.etree.ElementTree as ET
from fpdf import FPDF
from datetime import datetime

router = APIRouter(prefix="/api/exports", tags=["exports"])

UPLOAD_DIR = "uploads/justificantes"

class FiscalPDF(FPDF):
    def header(self):
        self.set_fill_color(15, 23, 42)  # Slate-900
        self.rect(0, 0, 210, 40, 'F')
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 16)
        self.cell(0, 10, "NATURAFINANCE - REPORTE FISCAL OFICIAL", ln=True, align="C")
        self.set_font("Helvetica", "I", 10)
        self.cell(0, 5, f"Generado el {datetime.now().strftime('%d/%m/%Y a las %H:%M:%S')}", ln=True, align="C")
        self.ln(15)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Pagina {self.page_no()}/{{nb}} - NaturaFinance Accounting Intelligence", align="C")

@router.get("/justificantes-zip")
def download_justificantes_zip(
    quarter: Optional[int] = None,
    year: int = 2026,
    session: Session = Depends(get_session)
):
    # Filter expenses by quarter
    query = select(Gasto)
    gastos = session.exec(query).all()

    if quarter is not None:
        if quarter == 1:
            q_start, q_end = f"{year}-01-01", f"{year}-03-31"
        elif quarter == 2:
            q_start, q_end = f"{year}-04-01", f"{year}-06-30"
        elif quarter == 3:
            q_start, q_end = f"{year}-07-01", f"{year}-09-30"
        else:
            q_start, q_end = f"{year}-10-01", f"{year}-12-31"
        gastos = [g for g in gastos if q_start <= g.fecha <= q_end]
    else:
        gastos = [g for g in gastos if f"{year}-01-01" <= g.fecha <= f"{year}-12-31"]

    # Filter only files that exist
    files_to_zip = []
    for g in gastos:
        if g.justificante_filename:
            file_path = os.path.join(UPLOAD_DIR, g.justificante_filename)
            if os.path.exists(file_path):
                files_to_zip.append((file_path, g.justificante_filename))

    # Fetch fiscal summary to put in the text file
    summary = get_fiscal_summary(quarter=quarter, year=year, session=session)
    
    # Create the text summary content
    resumen_text = f"RESUMEN DE FACTURACION Y CONTABILIDAD - {year}\n"
    resumen_text += f"Periodo: {f'{quarter} Trimestre' if quarter else 'Anual'}\n"
    resumen_text += "="*50 + "\n\n"
    resumen_text += f"1. INGRESOS (VENTAS NATURAERP):\n"
    resumen_text += f"   Total Ingresos Brutos: {summary['adjustedIngresos']:.2f} EUR\n"
    resumen_text += f"   Base Imponible: {summary['ventasBase']:.2f} EUR\n"
    resumen_text += f"   IVA Devengado (10%): {summary['ivaVentas']:.2f} EUR\n\n"
    
    resumen_text += f"2. GASTOS Y COMPRAS:\n"
    resumen_text += f"   Total Gastos Brutos: {summary['totalGastos']:.2f} EUR\n"
    resumen_text += f"   Base Imponible Deducible: {summary['baseGastosDeducible']:.2f} EUR\n"
    resumen_text += f"   IVA Soportado Deducible: {summary['ivaGastos']:.2f} EUR\n\n"
    
    resumen_text += f"3. LIQUIDACION ESTIMADA:\n"
    resumen_text += f"   Resultado IVA (Modelo 303): {summary['balanceIVA']:.2f} EUR\n"
    resumen_text += f"   Provision IRPF (Modelo 130): {summary['provisionIRPF']:.2f} EUR\n"
    resumen_text += f"   Rendimiento Neto: {summary['rendimientoNeto']:.2f} EUR\n"
    resumen_text += f"   Beneficio Real Estimado: {summary['beneficioReal']:.2f} EUR\n\n"
    
    resumen_text += f"4. DETALLE DE GASTOS REGISTRADOS:\n"
    for g in gastos:
        resumen_text += f"   - [{g.fecha}] {g.concepto} ({g.categoria}): {g.importe:.2f} EUR (IVA: {g.iva}%) "
        resumen_text += f"[Justificante: {g.justificante_filename or 'No adjunto'}]\n"

    # Create ZIP in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        # Write the text summary first
        zip_file.writestr("resumen_periodo.txt", resumen_text)
        
        # Write any uploaded justification PDFs
        for file_path, arcname in files_to_zip:
            zip_file.write(file_path, arcname)

    zip_buffer.seek(0)
    
    filename = f"justificantes_{year}_T{quarter if quarter else 'Anual'}.zip"
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/modelo-303-pdf")
def download_modelo_303_pdf(
    quarter: Optional[int] = None,
    year: int = 2026,
    session: Session = Depends(get_session)
):
    # Fetch data
    config = session.exec(select(ConfiguracionFiscal).where(ConfiguracionFiscal.id == 1)).first()
    summary = get_fiscal_summary(quarter=quarter, year=year, session=session)

    # Generate PDF
    pdf = FiscalPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_text_color(51, 65, 85)

    # Business details
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "1. DATOS DEL DECLARANTE", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Titular: {config.titular if config else 'N/A'}", ln=True)
    pdf.cell(0, 6, f"NIF: {config.nif if config else 'N/A'}", ln=True)
    pdf.cell(0, 6, f"Direccion Fiscal: {config.direccion if config else 'N/A'}", ln=True)
    pdf.cell(0, 6, f"Periodo: {quarter}o Trimestre {year}" if quarter else f"Periodo: Anual {year}", ln=True)
    pdf.ln(10)

    # IVA Repercutido
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "2. IVA REPERCUTIDO (INGRESOS)", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(100, 8, "Base Imponible de Ventas:", border="B")
    pdf.cell(0, 8, f"{summary['ventasBase']:.2f} EUR", border="B", ln=True, align="R")
    pdf.cell(100, 8, "Cuota de IVA Devengado (10%):", border="B")
    pdf.cell(0, 8, f"{summary['ivaVentas']:.2f} EUR", border="B", ln=True, align="R")
    pdf.ln(8)

    # IVA Soportado
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "3. IVA SOPORTADO (GASTOS)", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(100, 8, "Base Imponible Gastos Deducibles:", border="B")
    pdf.cell(0, 8, f"{summary['baseGastosDeducible']:.2f} EUR", border="B", ln=True, align="R")
    pdf.cell(100, 8, "Cuota de IVA Soportado Deducible:", border="B")
    pdf.cell(0, 8, f"{summary['ivaGastos']:.2f} EUR", border="B", ln=True, align="R")
    pdf.ln(8)

    # Result
    pdf.ln(5)
    pdf.set_fill_color(241, 245, 249)
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(100, 12, "RESULTADO DE LA LIQUIDACION:", fill=True)
    
    balance = summary['balanceIVA']
    if balance > 0:
        pdf.set_text_color(180, 83, 9)  # Amber
        result_text = f"A ingresar: {balance:.2f} EUR"
    else:
        pdf.set_text_color(4, 120, 87)  # Emerald
        result_text = f"A compensar: {abs(balance):.2f} EUR"

    pdf.cell(0, 12, result_text, fill=True, ln=True, align="R")

    # Output to buffer
    pdf_buffer = io.BytesIO()
    pdf.output(pdf_buffer)
    pdf_buffer.seek(0)

    filename = f"borrador_modelo_303_{year}_T{quarter if quarter else 'Anual'}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/modelo-130-pdf")
def download_modelo_130_pdf(
    quarter: Optional[int] = None,
    year: int = 2026,
    session: Session = Depends(get_session)
):
    # Fetch data
    config = session.exec(select(ConfiguracionFiscal).where(ConfiguracionFiscal.id == 1)).first()
    summary = get_fiscal_summary(quarter=quarter, year=year, session=session)

    # Generate PDF
    pdf = FiscalPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_text_color(51, 65, 85)

    # Business details
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "1. DATOS DEL DECLARANTE", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Titular: {config.titular if config else 'N/A'}", ln=True)
    pdf.cell(0, 6, f"NIF: {config.nif if config else 'N/A'}", ln=True)
    pdf.cell(0, 6, f"Actividad: {config.epigrafe if config else 'N/A'}", ln=True)
    pdf.cell(0, 6, f"Periodo: {quarter}o Trimestre {year}" if quarter else f"Periodo: Anual {year}", ln=True)
    pdf.ln(10)

    # IRPF calculations
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "2. COMPUTO DEL RENDIMIENTO NETO (IRPF BIZKAIA)", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(100, 8, "(+) Ingresos Computables (Ventas base):", border="B")
    pdf.cell(0, 8, f"{summary['ventasBase']:.2f} EUR", border="B", ln=True, align="R")
    pdf.cell(100, 8, "(-) Gastos Computables (Gastos base):", border="B")
    pdf.cell(0, 8, f"{summary['baseGastosDeducible']:.2f} EUR", border="B", ln=True, align="R")
    pdf.cell(100, 8, "(-) Variacion de Existencias (Stock COGS):", border="B")
    pdf.cell(0, 8, f"{summary['variacionExistencias']:.2f} EUR", border="B", ln=True, align="R")
    pdf.cell(100, 8, "(=) Rendimiento Neto Previo:", border="B")
    pdf.cell(0, 8, f"{summary['rendimientoNetoPrevio']:.2f} EUR", border="B", ln=True, align="R")
    pdf.cell(100, 8, "(-) 10% Gastos Dificil Justificacion:", border="B")
    pdf.cell(0, 8, f"-{summary['gastoDificilJustificacion']:.2f} EUR", border="B", ln=True, align="R")
    
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(100, 10, "(=) RENDIMIENTO NETO FINAL DEL PERIODO:", border="B")
    pdf.cell(0, 10, f"{summary['rendimientoNeto']:.2f} EUR", border="B", ln=True, align="R")
    pdf.ln(8)

    # Liquidacion Modelo 130
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "3. LIQUIDACION - MODELO 130", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(100, 8, "Pago Fraccionado Proyectado (20%):", border="B")
    pdf.cell(0, 8, f"{summary['provisionIRPF']:.2f} EUR", border="B", ln=True, align="R")

    pdf.ln(5)
    pdf.set_fill_color(241, 245, 249)
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(100, 12, "PAGO A CUENTA TRIMESTRAL (IRPF):", fill=True)
    pdf.cell(0, 12, f"{summary['provisionIRPF']:.2f} EUR", fill=True, ln=True, align="R")

    # Output to buffer
    pdf_buffer = io.BytesIO()
    pdf.output(pdf_buffer)
    pdf_buffer.seek(0)

    filename = f"borrador_modelo_130_{year}_T{quarter if quarter else 'Anual'}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/lroe-xml")
def download_lroe_xml(
    quarter: Optional[int] = None,
    year: int = 2026,
    session: Session = Depends(get_session)
):
    # Fetch data
    config = session.exec(select(ConfiguracionFiscal).where(ConfiguracionFiscal.id == 1)).first()
    query = select(Gasto)
    gastos = session.exec(query).all()

    # Filter expenses by quarter
    if quarter is not None:
        if quarter == 1:
            q_start, q_end = f"{year}-01-01", f"{year}-03-31"
        elif quarter == 2:
            q_start, q_end = f"{year}-04-01", f"{year}-06-30"
        elif quarter == 3:
            q_start, q_end = f"{year}-07-01", f"{year}-09-30"
        else:
            q_start, q_end = f"{year}-10-01", f"{year}-12-31"
        gastos = [g for g in gastos if q_start <= g.fecha <= q_end]
    else:
        gastos = [g for g in gastos if f"{year}-01-01" <= g.fecha <= f"{year}-12-31"]

    # Build XML conforming to BATUZ LROE schema
    root = ET.Element("lroe:LroePeticion", {
        "xmlns:lroe": "https://www.batuz.eus/fitxategiak/batuz/LROE/esquemas/LROE_Peticion.xsd"
    })
    
    cabecera = ET.SubElement(root, "Cabecera")
    obligado = ET.SubElement(cabecera, "ObligadoTributario")
    nif = ET.SubElement(obligado, "NIF")
    nif.text = config.nif if config else "12345678Z"
    nombre = ET.SubElement(obligado, "ApellidosNombre")
    nombre.text = config.titular if config else "Tu Nombre"
    
    ejercicio = ET.SubElement(cabecera, "Ejercicio")
    ejercicio.text = str(year)
    
    declarado = ET.SubElement(root, "Declarado")
    gastos_con_factura = ET.SubElement(declarado, "GastosConFacturaRecibida")

    for g in gastos:
        # Avoid including negative credits as normal invoices (they have separate XML tags in Batuz, but we'll structure this for normal ones)
        if g.importe <= 0:
            continue
            
        gasto_el = ET.SubElement(gastos_con_factura, "GastoConFacturaRecibida")
        
        # Epigrafe IAE
        epig = ET.SubElement(gasto_el, "Epigrafe")
        epig.text = (config.epigrafe or "652.4").split(" - ")[0]
        
        # Invoice details
        fra = ET.SubElement(gasto_el, "FacturaRecibida")
        fecha_exp = ET.SubElement(fra, "FechaExpedicion")
        fecha_exp.text = g.fecha
        
        concepto = ET.SubElement(fra, "ConceptoContable")
        concepto.text = "Gasto corriente deducible" if g.categoria != "Alquiler" else "Arrendamiento de local"

        # Totals
        base = g.importe / (1 + (g.iva / 100))
        cuota = g.importe - base
        
        desglose = ET.SubElement(fra, "DesgloseFactura")
        detalle = ET.SubElement(desglose, "DetalleDesglose")
        
        bi = ET.SubElement(detalle, "BaseImponible")
        bi.text = f"{base:.2f}"
        
        tipo = ET.SubElement(detalle, "TipoIVA")
        tipo.text = str(g.iva)
        
        cuota_el = ET.SubElement(detalle, "CuotaIVASoportada")
        cuota_el.text = f"{cuota:.2f}"

        pct_iva = (g.deducibleIva if g.deducibleIva is not None else 100) / 100
        cuota_deduc = ET.SubElement(detalle, "CuotaIVADeducible")
        cuota_deduc.text = f"{(cuota * pct_iva):.2f}"

    xml_str = ET.tostring(root, encoding="utf-8")
    
    filename = f"lroe_modelo_140_{year}_T{quarter if quarter else 'Anual'}.xml"
    return StreamingResponse(
        io.BytesIO(xml_str),
        media_type="application/xml",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
