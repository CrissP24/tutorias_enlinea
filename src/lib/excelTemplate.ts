import * as XLSX from 'xlsx';
// @ts-ignore - xlsx-js-style no tiene tipos oficiales
import * as XLSXStyle from 'xlsx-js-style';

/**
 * Crea una plantilla Excel profesional con formato, colores y bordes usando xlsx-js-style
 */
export const createStyledExcelTemplate = (
  headers: string[],
  data: any[][],
  sheetName: string = 'Datos',
  filename: string = 'plantilla.xlsx'
) => {
  // Crear workbook
  const wb = XLSXStyle.utils.book_new();

  // Crear datos con encabezados
  const worksheetData = [headers, ...data];

  // Crear worksheet
  const ws = XLSXStyle.utils.aoa_to_sheet(worksheetData);

  // Configurar anchos de columnas
  const colWidths = headers.map((_, index) => {
    let maxWidth = headers[index].length;
    data.forEach(row => {
      if (row[index]) {
        const cellLength = String(row[index]).length;
        if (cellLength > maxWidth) maxWidth = cellLength;
      }
    });
    return { wch: Math.min(Math.max(maxWidth + 3, 15), 50) };
  });
  ws['!cols'] = colWidths;

  // Configurar rango
  const range = XLSXStyle.utils.decode_range(ws['!ref'] || 'A1');
  
  // Estilo para encabezados (fila 1)
  const headerStyle = {
    fill: {
      fgColor: { rgb: '4472C4' }, // Azul profesional
    },
    font: {
      bold: true,
      color: { rgb: 'FFFFFF' }, // Texto blanco
      sz: 11,
    },
    alignment: {
      horizontal: 'center',
      vertical: 'center',
      wrapText: true,
    },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  };

  // Estilo para datos (filas 2+)
  const dataStyle = {
    fill: {
      fgColor: { rgb: 'FFFFFF' }, // Fondo blanco
    },
    font: {
      sz: 10,
    },
    alignment: {
      vertical: 'center',
      wrapText: true,
    },
    border: {
      top: { style: 'thin', color: { rgb: 'D3D3D3' } },
      bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
      left: { style: 'thin', color: { rgb: 'D3D3D3' } },
      right: { style: 'thin', color: { rgb: 'D3D3D3' } },
    },
  };

  // Aplicar estilos a todas las celdas
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSXStyle.utils.encode_cell({ c: C, r: R });
      
      if (!ws[cellAddress]) {
        ws[cellAddress] = { v: '', t: 's' };
      }

      if (R === 0) {
        // Aplicar estilo de encabezado
        ws[cellAddress].s = headerStyle;
      } else {
        // Aplicar estilo de datos con alternancia de colores
        const rowStyle = {
          ...dataStyle,
          fill: {
            fgColor: { rgb: R % 2 === 0 ? 'F2F2F2' : 'FFFFFF' }, // Filas alternadas
          },
        };
        ws[cellAddress].s = rowStyle;
      }
    }
  }

  // Configurar altura de fila de encabezado
  ws['!rows'] = [{ hpt: 25 }];

  // Agregar filtros automáticos
  ws['!autofilter'] = { ref: XLSXStyle.utils.encode_range(range) };

  // Agregar el worksheet al workbook
  XLSXStyle.utils.book_append_sheet(wb, ws, sheetName);

  // Descargar el archivo
  XLSXStyle.writeFile(wb, filename);
};

/**
 * Helper para crear plantilla de usuarios con formato profesional
 */
export const createUserTemplate = (isCoordinador: boolean = false, carrera?: string) => {
  const headers = ['cedula', 'nombres', 'correo', 'rol', 'carrera', 'nivel', 'estado'];
  
  const exampleData = isCoordinador
    ? [
        ['1234567890', 'Juan Pérez García', 'juan.perez@institucion.edu', 'estudiante', carrera || 'Ingeniería de Software', '5to Semestre', 'activo'],
        ['0987654321', 'María López Silva', 'maria.lopez@institucion.edu', 'estudiante', carrera || 'Ingeniería de Software', '3er Semestre', 'activo'],
      ]
    : [
        ['1234567890', 'Juan Pérez García', 'juan.perez@institucion.edu', 'estudiante', 'Ingeniería de Software', '5to Semestre', 'activo'],
        ['0987654321', 'María López Silva', 'maria.lopez@institucion.edu', 'docente', 'Ciencias de la Computación', 'N/A', 'activo'],
        ['1122334455', 'Carlos Rodríguez', 'carlos.rodriguez@institucion.edu', 'coordinador', 'Ingeniería de Software', 'N/A', 'activo'],
        ['2233445566', 'Ana Martínez', 'ana.martinez@institucion.edu', 'coordinador,docente', 'Ingeniería de Software', 'N/A', 'activo'],
      ];

  const filename = isCoordinador 
    ? `plantilla-estudiantes-${carrera || 'carrera'}.xlsx`
    : 'plantilla_usuarios.xlsx';

  createStyledExcelTemplate(headers, exampleData, 'usuarios', filename);
};

/**
 * Helper para crear plantilla de malla curricular con formato profesional
 */
export const createMallaTemplate = () => {
  const headers = ['Carrera', 'Unidad', 'Semestre', 'Código Asignatura', 'Nombre Asignatura', 'Créditos', 'Horas', 'Prerequisitos'];
  
  const exampleData = [
    ['Ingeniería de Software', 'Básica', 'Primer', 'SDS01', 'Programación I', '6', '96', ''],
    ['Ingeniería de Software', 'Básica', 'Segundo', 'SDS02', 'Programación II', '6', '96', 'SDS01'],
    ['Ingeniería de Software', 'Profesional', 'Tercer', 'SDS10', 'Bases de Datos', '4', '64', 'SDS01,SDS02'],
    ['Ingeniería de Software', 'Titulación', 'Final', 'SDS99', 'Proyecto de Titulación', '8', '128', ''],
  ];

  createStyledExcelTemplate(headers, exampleData, 'Malla', 'plantilla_malla_curricular.xlsx');
};

