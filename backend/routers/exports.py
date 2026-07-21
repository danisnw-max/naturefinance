from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from sqlmodel import Session, select
from database import get_session, get_quarter_dates
from models import Gasto, ConfiguracionFiscal
from routers.reports import get_fiscal_summary
from typing import Optional
import zipfile
import io
import os
import xml.etree.ElementTree as ET
import sqlite3
from fpdf import FPDF
from datetime import datetime

router = APIRouter(prefix="/api/exports", tags=["exports"])

UPLOAD_DIR = "uploads/justificantes"
TIENDA_DB_PATH = "C:/Users/Daniel/Documents/ATERPE/SOFTWARE TIENDA/backend/database.db"

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

    q_start, q_end = get_quarter_dates(year, quarter)
    gastos = [g for g in gastos if q_start <= g.fecha <= q_end]

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

    # Fetch sales details from store DB if available to include as CSV
    ventas_csv_content = "Ticket_ID,Fecha,Subtotal,IVA,Total\n"
    if os.path.exists(TIENDA_DB_PATH):
        try:
            conn = sqlite3.connect(TIENDA_DB_PATH)
            cursor = conn.cursor()
            start_date, end_date = get_quarter_dates(year, quarter)
            cursor.execute("SELECT id, date, subtotal, total_iva, total FROM venta WHERE date >= ? AND date <= ?", (start_date, f"{end_date}T23:59:59"))
            
            rows = cursor.fetchall()
            conn.close()
            for r in rows:
                ventas_csv_content += f"{r[0]},{r[1]},{r[2]:.2f},{r[3]:.2f},{r[4]:.2f}\n"
        except Exception as e:
            print(f"Error querying sales for CSV: {e}")

    # Create ZIP in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        # Write the text summary first
        zip_file.writestr("resumen_periodo.txt", resumen_text)
        
        # Write the sales detailed CSV
        zip_file.writestr("ventas_detalle.csv", ventas_csv_content)
        
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

    # Build XML conforming to BATUZ LROE Modelo 140 schema
    root = ET.Element("lroe:LroePeticion140", {
        "xmlns:lroe": "https://www.batuz.eus/fitxategiak/batuz/LROE/esquemas/LROE_140_Peticion.xsd"
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

    # --- CAPÍTULO 1: INGRESOS Y FACTURAS EMITIDAS (VENTAS NATURAERP) ---
    ingresos_el = ET.SubElement(declarado, "Ingresos")
    if os.path.exists(TIENDA_DB_PATH):
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
                cursor.execute("SELECT id, date, subtotal, total_iva, total, cliente_nombre FROM venta WHERE date >= ? AND date <= ?", (start_date, end_date))
            else:
                cursor.execute("SELECT id, date, subtotal, total_iva, total, cliente_nombre FROM venta WHERE date >= ? AND date <= ?", (f"{year}-01-01", f"{year}-12-31T23:59:59"))
            
            ventas_rows = cursor.fetchall()
            conn.close()

            for v in ventas_rows:
                v_id, v_date, v_subtotal, v_iva, v_total, v_cliente = v
                ingreso_item = ET.SubElement(ingresos_el, "Ingreso")
                epig = ET.SubElement(ingreso_item, "Epigrafe")
                epig.text = (config.epigrafe or "652.4").split(" - ")[0]
                
                fra_emitida = ET.SubElement(ingreso_item, "FacturaEmitida")
                num_fra = ET.SubElement(fra_emitida, "NumFactura")
                num_fra.text = str(v_id)
                fecha_exp = ET.SubElement(fra_emitida, "FechaExpedicion")
                fecha_exp.text = str(v_date)[:10]

                desglose = ET.SubElement(fra_emitida, "DesgloseFactura")
                detalle = ET.SubElement(desglose, "DetalleDesglose")
                bi = ET.SubElement(detalle, "BaseImponible")
                bi.text = f"{v_subtotal:.2f}"
                tipo_iva = ET.SubElement(detalle, "TipoIVA")
                tipo_iva.text = "10"
                cuota_iva = ET.SubElement(detalle, "CuotaIVARepercutida")
                cuota_iva.text = f"{v_iva:.2f}"
        except Exception as e:
            print(f"Error querying sales for XML: {e}")

    # --- CAPÍTULO 2: GASTOS Y FACTURAS RECIBIDAS ---
    gastos_con_factura = ET.SubElement(declarado, "GastosConFacturaRecibida")
    gastos_sin_factura = ET.SubElement(declarado, "GastosSinFactura")

    for g in gastos:
        if g.importe <= 0:
            continue

        # Si es nómina o personal sin factura mercantil directa -> Capítulo 2.2 (Gastos Sin Factura)
        if g.categoria == "Nóminas y Personal" or g.categoria == "S.S. Autónomo":
            gasto_sf = ET.SubElement(gastos_sin_factura, "GastoSinFactura")
            epig = ET.SubElement(gasto_sf, "Epigrafe")
            epig.text = (config.epigrafe or "652.4").split(" - ")[0]
            
            concepto = ET.SubElement(gasto_sf, "ConceptoGastos")
            concepto.text = "Gastos de personal / Seguridad Social"
            fecha_g = ET.SubElement(gasto_sf, "FechaGasto")
            fecha_g.text = g.fecha
            importe_g = ET.SubElement(gasto_sf, "ImporteGasto")
            importe_g.text = f"{g.importe:.2f}"
        else:
            # Capítulo 2.1 (Gastos Con Factura Recibida)
            gasto_el = ET.SubElement(gastos_con_factura, "GastoConFacturaRecibida")
            epig = ET.SubElement(gasto_el, "Epigrafe")
            epig.text = (config.epigrafe or "652.4").split(" - ")[0]
            
            fra = ET.SubElement(gasto_el, "FacturaRecibida")
            fecha_exp = ET.SubElement(fra, "FechaExpedicion")
            fecha_exp.text = g.fecha
            
            concepto = ET.SubElement(fra, "ConceptoContable")
            concepto.text = "Gasto corriente deducible" if g.categoria != "Alquiler" else "Arrendamiento de local"

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

@router.get("/modelo-111-pdf")
def download_modelo_111_pdf(
    quarter: Optional[int] = None,
    year: int = 2026,
    session: Session = Depends(get_session)
):
    config = session.exec(select(ConfiguracionFiscal).where(ConfiguracionFiscal.id == 1)).first()
    summary = get_fiscal_summary(quarter=quarter, year=year, session=session)

    pct = summary.get('pctRetencionNominas', 2)
    base = summary.get('baseNominas', 0.0)
    cuota = summary.get('retencionesNominas', 0.0)
    num_perceptores = summary.get('numPerceptoresNominas', 0)
    periodo = f"{quarter}o Trimestre {year}" if quarter else f"Anual {year}"

    pdf = FiscalPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_text_color(51, 65, 85)

    # Aviso borrador
    pdf.set_fill_color(254, 243, 199)
    pdf.set_font("Helvetica", "I", 9)
    pdf.cell(0, 8, "BORRADOR DE REFERENCIA - Presentacion oficial en bizkaia.eus (sede electronica)", ln=True, align="C", fill=True)
    pdf.ln(6)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "1. DATOS DEL DECLARANTE / RETENEDOR", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Razon Social / Nombre: {config.titular if config else 'N/A'}", ln=True)
    pdf.cell(0, 6, f"NIF del Retenedor: {config.nif if config else 'N/A'}", ln=True)
    pdf.cell(0, 6, f"Domicilio Fiscal: {config.direccion if config else 'N/A'}", ln=True)
    pdf.cell(0, 6, f"Periodo de Liquidacion: {periodo}", ln=True)
    pdf.ln(8)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "2. RENDIMIENTOS DEL TRABAJO Y ACTIVIDADES (MODELO 111)", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.ln(4)

    # Cabecera tabla
    pdf.set_fill_color(241, 245, 249)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(80, 8, "Concepto", border=1, fill=True)
    pdf.cell(40, 8, "Importe", border=1, fill=True, align="R")
    pdf.ln()

    pdf.set_font("Helvetica", "", 10)
    pdf.cell(80, 8, f"Num. perceptores (registros nomina)", border=1)
    pdf.cell(40, 8, f"{num_perceptores}", border=1, align="R")
    pdf.ln()
    pdf.cell(80, 8, "Base de retenciones (salarios netos)", border=1)
    pdf.cell(40, 8, f"{base:.2f} EUR", border=1, align="R")
    pdf.ln()
    pdf.cell(80, 8, f"% Retencion IRPF aplicado", border=1)
    pdf.cell(40, 8, f"{pct}%", border=1, align="R")
    pdf.ln()
    pdf.cell(80, 8, "Cuota de retencion calculada", border=1)
    pdf.cell(40, 8, f"{cuota:.2f} EUR", border=1, align="R")
    pdf.ln(12)

    # Resultado
    pdf.set_fill_color(241, 245, 249)
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(80, 12, "TOTAL A INGRESAR:", fill=True)
    pdf.cell(40, 12, f"{cuota:.2f} EUR", fill=True, align="R")
    pdf.ln(12)

    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(128, 128, 128)
    pdf.multi_cell(0, 5, f"Base calculada = suma de las bases imponibles de todos los gastos de categoria 'Nominas y Personal' del periodo. Cuota = Base x {pct}% (% configurado en Ajustes del sistema).")

    pdf_buffer = io.BytesIO()
    pdf.output(pdf_buffer)
    pdf_buffer.seek(0)
    filename = f"borrador_modelo_111_{year}_T{quarter if quarter else 'Anual'}.pdf"
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})

@router.get("/modelo-115-pdf")
def download_modelo_115_pdf(
    quarter: Optional[int] = None,
    year: int = 2026,
    session: Session = Depends(get_session)
):
    config = session.exec(select(ConfiguracionFiscal).where(ConfiguracionFiscal.id == 1)).first()
    summary = get_fiscal_summary(quarter=quarter, year=year, session=session)

    pct = summary.get('pctRetencionAlquiler', 19)
    base = summary.get('baseAlquiler', 0.0)
    cuota = summary.get('retencionesAlquiler', 0.0)
    periodo = f"{quarter}o Trimestre {year}" if quarter else f"Anual {year}"

    pdf = FiscalPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_text_color(51, 65, 85)

    # Aviso borrador
    pdf.set_fill_color(254, 243, 199)
    pdf.set_font("Helvetica", "I", 9)
    pdf.cell(0, 8, "BORRADOR DE REFERENCIA - Presentacion oficial en bizkaia.eus (sede electronica)", ln=True, align="C", fill=True)
    pdf.ln(6)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "1. DATOS DEL DECLARANTE / RETENEDOR", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Razon Social / Nombre: {config.titular if config else 'N/A'}", ln=True)
    pdf.cell(0, 6, f"NIF del Retenedor: {config.nif if config else 'N/A'}", ln=True)
    pdf.cell(0, 6, f"Domicilio Fiscal: {config.direccion if config else 'N/A'}", ln=True)
    pdf.cell(0, 6, f"Periodo de Liquidacion: {periodo}", ln=True)
    pdf.ln(8)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "2. RENDIMIENTOS DE CAPITAL INMOBILIARIO (ARRENDAMIENTO LOCAL)", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.ln(4)

    # Tabla desglose
    pdf.set_fill_color(241, 245, 249)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(80, 8, "Concepto", border=1, fill=True)
    pdf.cell(40, 8, "Importe", border=1, fill=True, align="R")
    pdf.ln()

    pdf.set_font("Helvetica", "", 10)
    pdf.cell(80, 8, "Base retenciones (cuotas alquiler sin IVA)", border=1)
    pdf.cell(40, 8, f"{base:.2f} EUR", border=1, align="R")
    pdf.ln()
    pdf.cell(80, 8, "% Retencion IRPF sobre alquiler", border=1)
    pdf.cell(40, 8, f"{pct}%", border=1, align="R")
    pdf.ln()
    pdf.cell(80, 8, "Cuota de retencion calculada", border=1)
    pdf.cell(40, 8, f"{cuota:.2f} EUR", border=1, align="R")
    pdf.ln(12)

    # Resultado
    pdf.set_fill_color(241, 245, 249)
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(80, 12, "TOTAL A INGRESAR:", fill=True)
    pdf.cell(40, 12, f"{cuota:.2f} EUR", fill=True, align="R")
    pdf.ln(12)

    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(128, 128, 128)
    pdf.multi_cell(0, 5, f"Base calculada = suma de las bases imponibles de todos los gastos de categoria 'Alquiler' del periodo. Cuota = Base x {pct}% (% configurado en Ajustes del sistema). El arrendador debera recibir certificado anual de retenciones.")

    pdf_buffer = io.BytesIO()
    pdf.output(pdf_buffer)
    pdf_buffer.seek(0)
    filename = f"borrador_modelo_115_{year}_T{quarter if quarter else 'Anual'}.pdf"
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})

@router.get("/modelo-390-pdf")
def download_modelo_390_pdf(
    year: int = 2026,
    session: Session = Depends(get_session)
):
    config = session.exec(select(ConfiguracionFiscal).where(ConfiguracionFiscal.id == 1)).first()
    summary = get_fiscal_summary(quarter=None, year=year, session=session)

    pdf = FiscalPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_text_color(51, 65, 85)

    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 8, "MODELO 390 - RESUMEN ANUAL IVA (HACIENDA BIZKAIA)", ln=True)
    
    # Aviso borrador
    pdf.set_fill_color(254, 243, 199)
    pdf.set_font("Helvetica", "I", 9)
    pdf.cell(0, 8, "BORRADOR DE REFERENCIA - Presentacion oficial en bizkaia.eus (sede electronica)", ln=True, align="C", fill=True)
    pdf.ln(6)

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "DATOS DEL DECLARANTE Y ACTIVIDAD", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 5, f"Titular: {config.titular if config else 'N/A'} | NIF: {config.nif if config else 'N/A'}", ln=True)
    pdf.cell(0, 5, f"Ejercicio Fiscal: {year} | Epigrafe IAE: {config.epigrafe if config else 'N/A'}", ln=True)
    pdf.ln(6)

    # I. IVA DEVENGADO (OPERACIONES INTERIORES)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "I. IVA DEVENGADO (VENTAS/INGRESOS ACUMULADOS)", ln=True)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(90, 6, "Concepto", border=1)
    pdf.cell(35, 6, "Base Imponible", border=1, align="R")
    pdf.cell(20, 6, "Tipo %", border=1, align="C")
    pdf.cell(35, 6, "Cuota IVA", border=1, align="R", ln=True)

    pdf.set_font("Helvetica", "", 9)
    pdf.cell(90, 6, "Régimen General / Comercio (10%)", border=1)
    pdf.cell(35, 6, f"{summary['ventasBase']:.2f} EUR", border=1, align="R")
    pdf.cell(20, 6, "10%", border=1, align="C")
    pdf.cell(35, 6, f"{summary['ventasIva']:.2f} EUR", border=1, align="R", ln=True)
    
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(145, 6, "TOTAL IVA DEVENGADO ANUAL:", border=1)
    pdf.cell(35, 6, f"{summary['ventasIva']:.2f} EUR", border=1, align="R", ln=True)
    pdf.ln(6)

    # II. IVA DEDUCIBLE (GASTOS ACUMULADOS)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "II. IVA DEDUCIBLE (COMPRAS Y GASTOS ACUMULADOS)", ln=True)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(90, 6, "Concepto", border=1)
    pdf.cell(35, 6, "Base Imponible", border=1, align="R")
    pdf.cell(55, 6, "Cuota Deducible", border=1, align="R", ln=True)

    pdf.set_font("Helvetica", "", 9)
    pdf.cell(90, 6, "Operaciones Interiores Corrientes", border=1)
    pdf.cell(35, 6, f"{summary['baseGastosDeducible']:.2f} EUR", border=1, align="R")
    pdf.cell(55, 6, f"{summary['ivaGastosDeducible']:.2f} EUR", border=1, align="R", ln=True)

    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(125, 6, "TOTAL IVA DEDUCIBLE ANUAL:", border=1)
    pdf.cell(55, 6, f"{summary['ivaGastosDeducible']:.2f} EUR", border=1, align="R", ln=True)
    pdf.ln(6)

    # RESULTADO LIQUIDACION ANUAL
    pdf.set_font("Helvetica", "B", 11)
    res_text = "RESULTADO DE LA LIQUIDACIÓN ANUAL (A INGRESAR / DEVOLVER):"
    res_val = summary['balanceIVA']
    pdf.cell(125, 8, res_text, border=1)
    pdf.cell(55, 8, f"{res_val:.2f} EUR", border=1, align="R", ln=True)

    pdf_buffer = io.BytesIO()
    pdf.output(pdf_buffer)
    pdf_buffer.seek(0)
    filename = f"borrador_modelo_390_{year}_Anual.pdf"
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})


@router.get("/modelo-190-pdf")
def download_modelo_190_pdf(
    year: int = 2026,
    session: Session = Depends(get_session)
):
    config = session.exec(select(ConfiguracionFiscal).where(ConfiguracionFiscal.id == 1)).first()
    summary = get_fiscal_summary(quarter=None, year=year, session=session)

    pdf = FiscalPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_text_color(51, 65, 85)

    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 8, "MODELO 190 - RESUMEN ANUAL RETENCIONES PERSONAL (BIZKAIA)", ln=True)
    
    # Aviso borrador
    pdf.set_fill_color(254, 243, 199)
    pdf.set_font("Helvetica", "I", 9)
    pdf.cell(0, 8, "BORRADOR DE REFERENCIA - Presentacion oficial en bizkaia.eus (sede electronica)", ln=True, align="C", fill=True)
    pdf.ln(6)

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "DATOS DEL DECLARANTE Y EJERCICIO", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 5, f"Titular: {config.titular if config else 'N/A'} | NIF: {config.nif if config else 'N/A'}", ln=True)
    pdf.cell(0, 5, f"Ejercicio Fiscal: {year}", ln=True)
    pdf.ln(6)

    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(80, 6, "Concepto Retención", border=1)
    pdf.cell(30, 6, "Nº Perceptores", border=1, align="C")
    pdf.cell(35, 6, "Base Percepciones", border=1, align="R")
    pdf.cell(35, 6, "Total Retenciones", border=1, align="R", ln=True)

    pdf.set_font("Helvetica", "", 9)
    pdf.cell(80, 6, "Clave A - Rendimientos del Trabajo (Nóminas)", border=1)
    pdf.cell(30, 6, str(summary['numPerceptoresNominas']), border=1, align="C")
    pdf.cell(35, 6, f"{summary['baseNominas']:.2f} EUR", border=1, align="R")
    pdf.cell(35, 6, f"{summary['retencionesNominas']:.2f} EUR", border=1, align="R", ln=True)

    pdf_buffer = io.BytesIO()
    pdf.output(pdf_buffer)
    pdf_buffer.seek(0)
    filename = f"resumen_anual_modelo_190_{year}.pdf"
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})

@router.get("/modelo-180-pdf")
def download_modelo_180_pdf(
    year: int = 2026,
    session: Session = Depends(get_session)
):
    config = session.exec(select(ConfiguracionFiscal).where(ConfiguracionFiscal.id == 1)).first()
    summary = get_fiscal_summary(quarter=None, year=year, session=session)

    pdf = FiscalPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_text_color(51, 65, 85)

    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 8, "MODELO 180 - RESUMEN ANUAL RETENCIONES ALQUILER (BIZKAIA)", ln=True)
    
    # Aviso borrador
    pdf.set_fill_color(254, 243, 199)
    pdf.set_font("Helvetica", "I", 9)
    pdf.cell(0, 8, "BORRADOR DE REFERENCIA - Presentacion oficial en bizkaia.eus (sede electronica)", ln=True, align="C", fill=True)
    pdf.ln(6)

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "DATOS DEL DECLARANTE Y EJERCICIO", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 5, f"Titular: {config.titular if config else 'N/A'} | NIF: {config.nif if config else 'N/A'}", ln=True)
    pdf.cell(0, 5, f"Ejercicio Fiscal: {year}", ln=True)
    pdf.ln(6)

    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(110, 6, "Concepto", border=1)
    pdf.cell(35, 6, "Base Imponible", border=1, align="R")
    pdf.cell(35, 6, "Total Retenido (19%)", border=1, align="R", ln=True)

    pdf.set_font("Helvetica", "", 9)
    pdf.cell(110, 6, "Rendimientos del Arrendamiento de Inmuebles Urbanos", border=1)
    pdf.cell(35, 6, f"{summary['baseAlquiler']:.2f} EUR", border=1, align="R")
    pdf.cell(35, 6, f"{summary['retencionesAlquiler']:.2f} EUR", border=1, align="R", ln=True)

    pdf_buffer = io.BytesIO()
    pdf.output(pdf_buffer)
    pdf_buffer.seek(0)
    filename = f"resumen_anual_modelo_180_{year}.pdf"
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})

