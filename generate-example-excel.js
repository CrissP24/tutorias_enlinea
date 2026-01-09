const XLSX = require('xlsx');

// Datos de ejemplo realistas para carga masiva
const estudiantes = [
  ['cedula', 'nombres', 'correo', 'rol', 'carrera', 'nivel', 'estado'],
  ['1712345678', 'Ana María González Pérez', 'ana.gonzalez@institucion.edu', 'estudiante', 'Ingeniería de Software', '1er Semestre', 'activo'],
  ['1723456789', 'Carlos Andrés Martínez López', 'carlos.martinez@institucion.edu', 'estudiante', 'Ingeniería de Software', '2do Semestre', 'activo'],
  ['1734567890', 'María Fernanda Rodríguez Silva', 'maria.rodriguez@institucion.edu', 'estudiante', 'Ingeniería de Software', '3er Semestre', 'activo'],
  ['1745678901', 'Juan Pablo Sánchez Torres', 'juan.sanchez@institucion.edu', 'estudiante', 'Ingeniería de Software', '4to Semestre', 'activo'],
  ['1756789012', 'Laura Estefanía Morales Castro', 'laura.morales@institucion.edu', 'estudiante', 'Ingeniería de Software', '5to Semestre', 'activo'],
  ['1767890123', 'Diego Alejandro Herrera Vargas', 'diego.herrera@institucion.edu', 'estudiante', 'Ingeniería de Software', '6to Semestre', 'activo'],
  ['1778901234', 'Sofía Alejandra Jiménez Ruiz', 'sofia.jimenez@institucion.edu', 'estudiante', 'Ingeniería de Software', '7mo Semestre', 'activo'],
  ['1789012345', 'Andrés Felipe Cárdenas Moreno', 'andres.cardenas@institucion.edu', 'estudiante', 'Ingeniería de Software', '8vo Semestre', 'activo'],
  ['1790123456', 'Valentina Carolina Ramírez Díaz', 'valentina.ramirez@institucion.edu', 'estudiante', 'Ingeniería de Software', '9no Semestre', 'activo'],
  ['1701234567', 'Sebastián David Ospina Gutiérrez', 'sebastian.ospina@institucion.edu', 'estudiante', 'Ingeniería de Software', '10mo Semestre', 'activo'],
  ['1711123456', 'Isabella Camila Vargas Restrepo', 'isabella.vargas@institucion.edu', 'estudiante', 'Ingeniería de Software', '1er Semestre', 'activo'],
  ['1722234567', 'Nicolás Esteban Muñoz Agudelo', 'nicolas.munoz@institucion.edu', 'estudiante', 'Ingeniería de Software', '2do Semestre', 'activo'],
  ['1733345678', 'Mariana Alejandra Zapata Mejía', 'mariana.zapata@institucion.edu', 'estudiante', 'Ingeniería de Software', '3er Semestre', 'activo'],
  ['1744456789', 'Santiago Andrés Velásquez Arango', 'santiago.velasquez@institucion.edu', 'estudiante', 'Ingeniería de Software', '4to Semestre', 'activo'],
  ['1755567890', 'Daniela Paola Cardona Montoya', 'daniela.cardona@institucion.edu', 'estudiante', 'Ingeniería de Software', '5to Semestre', 'activo'],
  ['1766678901', 'Mateo Alejandro Osorio Zapata', 'mateo.osorio@institucion.edu', 'estudiante', 'Ingeniería de Software', '6to Semestre', 'activo'],
  ['1777789012', 'Camila Andrea Betancur Londoño', 'camila.betancur@institucion.edu', 'estudiante', 'Ingeniería de Software', '7mo Semestre', 'activo'],
  ['1788890123', 'Alejandro José Uribe Vélez', 'alejandro.uribe@institucion.edu', 'estudiante', 'Ingeniería de Software', '8vo Semestre', 'activo'],
  ['1799901234', 'Valeria Sofía Giraldo Henao', 'valeria.giraldo@institucion.edu', 'estudiante', 'Ingeniería de Software', '9no Semestre', 'activo'],
  ['1700012345', 'David Esteban Quintero Salazar', 'david.quintero@institucion.edu', 'estudiante', 'Ingeniería de Software', '10mo Semestre', 'activo'],
  ['1712345001', 'Sara Lucía Franco Bedoya', 'sara.franco@institucion.edu', 'estudiante', 'Ciencias de la Computación', '1er Semestre', 'activo'],
  ['1723456002', 'Jorge Luis Arango Patiño', 'jorge.arango@institucion.edu', 'estudiante', 'Ciencias de la Computación', '2do Semestre', 'activo'],
  ['1734567003', 'Paola Andrea Londoño Castaño', 'paola.londono@institucion.edu', 'estudiante', 'Ciencias de la Computación', '3er Semestre', 'activo'],
  ['1745678004', 'Ricardo Andrés Mejía Zapata', 'ricardo.mejia@institucion.edu', 'estudiante', 'Ciencias de la Computación', '4to Semestre', 'activo'],
  ['1756789005', 'Diana Carolina Henao Giraldo', 'diana.henao@institucion.edu', 'estudiante', 'Ciencias de la Computación', '5to Semestre', 'activo'],
  ['1767890006', 'Fernando José Vélez Uribe', 'fernando.velez@institucion.edu', 'estudiante', 'Ciencias de la Computación', '6to Semestre', 'activo'],
  ['1778901007', 'Natalia Marcela Salazar Quintero', 'natalia.salazar@institucion.edu', 'estudiante', 'Ciencias de la Computación', '7mo Semestre', 'activo'],
  ['1789012008', 'Cristian David Bedoya Franco', 'cristian.bedoya@institucion.edu', 'estudiante', 'Ciencias de la Computación', '8vo Semestre', 'activo'],
  ['1790123009', 'Andrea Milena Patiño Arango', 'andrea.patino@institucion.edu', 'estudiante', 'Ciencias de la Computación', '9no Semestre', 'activo'],
  ['1701234010', 'Jhonatan Esteban Castaño Londoño', 'jhonatan.castano@institucion.edu', 'estudiante', 'Ciencias de la Computación', '10mo Semestre', 'activo'],
];

// Crear workbook y worksheet
const ws = XLSX.utils.aoa_to_sheet(estudiantes);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'usuarios');

// Guardar archivo
XLSX.writeFile(wb, 'ejemplo_carga_masiva_estudiantes.xlsx');
console.log('Archivo Excel creado: ejemplo_carga_masiva_estudiantes.xlsx');

