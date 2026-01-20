import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';
import { 
  getCarreras, 
  getMaterias, 
  createMateria, 
  getMateriaByCodigo,
  getSemestres,
  createSemestre,
  getSemestreByNombre,
  getCarreraById,
  saveMaterias
} from '@/lib/storage';
import { createMallaTemplate } from '@/lib/excelTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, Upload, CheckCircle, XCircle, Download, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ExcelMallaRow, UnidadAcademica } from '@/types';

interface UploadResult {
  success: boolean;
  codigo: string;
  nombre: string;
  carrera: string;
  error?: string;
}

const ExcelUploadMalla: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const validUnidades: UnidadAcademica[] = ['Básica', 'Profesional', 'Titulación'];
  const carreras = getCarreras();

  // Función para normalizar nombre de semestre
  const normalizeSemestre = (semestreStr: string): string => {
    const normalized = semestreStr.trim().toLowerCase();
    const semestreMap: Record<string, string> = {
      'primer': '1er Semestre',
      'primero': '1er Semestre',
      'segundo': '2do Semestre',
      'tercer': '3er Semestre',
      'tercero': '3er Semestre',
      'cuarto': '4to Semestre',
      'quinto': '5to Semestre',
      'quinto': '5to Semestre',
      'sexto': '6to Semestre',
      'septimo': '7mo Semestre',
      'séptimo': '7mo Semestre',
      'octavo': '8vo Semestre',
      'noveno': '9no Semestre',
      'decimo': '10mo Semestre',
      'décimo': '10mo Semestre',
      'final': 'Final',
    };

    // Buscar coincidencia parcial
    for (const [key, value] of Object.entries(semestreMap)) {
      if (normalized.includes(key)) {
        return value;
      }
    }

    // Si es numérico directo
    if (/^\d+/.test(normalized)) {
      const num = parseInt(normalized.match(/^\d+/)![0]);
      if (num >= 1 && num <= 10) {
        return `${num}${num === 1 ? 'er' : num === 2 ? 'do' : num === 3 ? 'er' : num === 7 ? 'mo' : 'to'} Semestre`;
      }
    }

    return semestreStr.trim(); // Retornar original si no se puede normalizar
  };

  // Asegurar que existe un semestre (crear si no existe)
  const ensureSemestre = (nombre: string): string => {
    const normalized = normalizeSemestre(nombre);
    let semestre = getSemestreByNombre(normalized);
    
    if (!semestre) {
      // Determinar número para semestres numéricos
      let numero = 0;
      if (normalized === 'Final') {
        numero = 99; // Valor especial para Final
      } else {
        const match = normalized.match(/(\d+)/);
        if (match) {
          numero = parseInt(match[1]);
        }
      }

      semestre = createSemestre({
        nombre: normalized,
        numero,
        activo: true,
      });

      // Si createSemestre retorna null (ya existe), buscar de nuevo
      if (!semestre) {
        semestre = getSemestreByNombre(normalized);
      }
    }

    if (!semestre) {
      throw new Error(`No se pudo crear o encontrar el semestre: ${normalized}`);
    }

    return semestre.id;
  };

  // Procesar prerequisitos (separar por comas, guiones, espacios)
  const parsePrerequisitos = (prerequisitosStr: string): string[] => {
    if (!prerequisitosStr || !prerequisitosStr.trim()) return [];
    
    return prerequisitosStr
      .split(/[,;|-\s]+/)
      .map(p => p.trim().toUpperCase())
      .filter(p => p.length > 0);
  };

  const validateRow = (row: ExcelMallaRow, rowIndex: number): string | null => {
    if (!row.carrera) return `Fila ${rowIndex}: Carrera es requerida`;
    if (!row.codigoAsignatura) return `Fila ${rowIndex}: Código Asignatura es requerido`;
    if (!row.nombreAsignatura) return `Fila ${rowIndex}: Nombre Asignatura es requerido`;
    if (!row.semestre) return `Fila ${rowIndex}: Semestre es requerido`;
    
    // Validar unidad
    if (row.unidad && !validUnidades.includes(row.unidad as UnidadAcademica)) {
      return `Fila ${rowIndex}: Unidad inválida (debe ser: ${validUnidades.join(', ')})`;
    }

    // Validar que la carrera exista
    const carrera = carreras.find(c => 
      c.nombre.toLowerCase() === row.carrera.trim().toLowerCase() ||
      c.codigo.toLowerCase() === row.carrera.trim().toLowerCase()
    );
    if (!carrera) {
      return `Fila ${rowIndex}: Carrera "${row.carrera}" no existe en el sistema`;
    }

    // Validar créditos y horas (numéricos)
    const creditos = typeof row.creditos === 'string' ? parseFloat(row.creditos) : row.creditos;
    const horas = typeof row.horas === 'string' ? parseFloat(row.horas) : row.horas;
    
    if (row.creditos && (isNaN(creditos) || creditos < 0)) {
      return `Fila ${rowIndex}: Créditos debe ser un número válido`;
    }
    if (row.horas && (isNaN(horas) || horas < 0)) {
      return `Fila ${rowIndex}: Horas debe ser un número válido`;
    }

    return null;
  };

  const processExcel = async (file: File) => {
    setIsProcessing(true);
    setResults([]);
    setShowResults(false);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      const sheetName = workbook.SheetNames.includes('malla') || workbook.SheetNames.includes('Malla')
        ? (workbook.SheetNames.find(s => s.toLowerCase().includes('malla')) || workbook.SheetNames[0])
        : workbook.SheetNames[0];
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ExcelMallaRow>(worksheet, {
        header: ['carrera', 'unidad', 'semestre', 'codigoAsignatura', 'nombreAsignatura', 'creditos', 'horas', 'prerequisitos'],
        range: 1, // Skip header row
      });

      if (jsonData.length === 0) {
        toast({
          title: 'Error',
          description: 'El archivo Excel está vacío o no tiene el formato correcto.',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      const uploadResults: UploadResult[] = [];
      const materiasExistentes = getMaterias();
      const materiasACrear: any[] = [];
      const carrerasProcesadas = new Set<string>();

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 2; // Account for header row and 0-index

        const validationError = validateRow(row, rowNumber);
        if (validationError) {
          uploadResults.push({
            success: false,
            codigo: row.codigoAsignatura?.toString() || 'N/A',
            nombre: row.nombreAsignatura || 'N/A',
            carrera: row.carrera || 'N/A',
            error: validationError,
          });
          continue;
        }

        const codigo = row.codigoAsignatura.toString().trim().toUpperCase();
        const carrera = carreras.find(c => 
          c.nombre.toLowerCase() === row.carrera.trim().toLowerCase() ||
          c.codigo.toLowerCase() === row.carrera.trim().toLowerCase()
        )!;

        carrerasProcesadas.add(carrera.id);

        // Verificar si ya existe una materia con este código en esta carrera
        const materiaExistente = materiasExistentes.find(m => 
          m.codigo === codigo && m.carreraId === carrera.id
        );

        if (materiaExistente) {
          uploadResults.push({
            success: false,
            codigo,
            nombre: row.nombreAsignatura,
            carrera: carrera.nombre,
            error: 'Ya existe una materia con este código en esta carrera',
          });
          continue;
        }

        // Normalizar semestre y asegurar que existe
        const semestreNombre = normalizeSemestre(row.semestre.toString());
        const semestreId = ensureSemestre(semestreNombre);

        // Procesar prerequisitos
        const prerequisitos = row.prerequisitos ? parsePrerequisitos(row.prerequisitos.toString()) : [];

        // Preparar datos de la materia
        const creditos = row.creditos ? (typeof row.creditos === 'string' ? parseFloat(row.creditos) : row.creditos) : undefined;
        const horas = row.horas ? (typeof row.horas === 'string' ? parseFloat(row.horas) : row.horas) : undefined;

        materiasACrear.push({
          codigo,
          nombre: row.nombreAsignatura.trim(),
          carreraId: carrera.id,
          semestreId,
          creditos: creditos && creditos > 0 ? creditos : undefined,
          horas: horas && horas > 0 ? horas : undefined,
          unidad: row.unidad?.trim() as UnidadAcademica | undefined,
          prerequisitos: prerequisitos.length > 0 ? prerequisitos : undefined,
          estado: 'aprobada' as const, // Automáticamente aprobada al cargar desde Excel
          activa: true,
          createdAt: new Date().toISOString(),
        });

        uploadResults.push({
          success: true,
          codigo,
          nombre: row.nombreAsignatura,
          carrera: carrera.nombre,
        });
      }

      // Crear todas las materias
      let creadas = 0;
      for (const materiaData of materiasACrear) {
        try {
          const result = createMateria(materiaData);
          if (result) {
            creadas++;
          }
        } catch (error) {
          console.error('Error creando materia:', error);
        }
      }

      setResults(uploadResults);
      setShowResults(true);

      const successCount = uploadResults.filter(r => r.success).length;
      const errorCount = uploadResults.filter(r => !r.success).length;

      toast({
        title: 'Procesamiento completado',
        description: `${successCount} materias procesadas (${creadas} creadas), ${errorCount} errores. ${carrerasProcesadas.size} carrera(s) actualizada(s).`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error processing Excel:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar el archivo Excel.',
        variant: 'destructive',
      });
    }

    setIsProcessing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: 'Error',
          description: 'Por favor selecciona un archivo Excel (.xlsx o .xls)',
          variant: 'destructive',
        });
        return;
      }
      processExcel(file);
    }
  };

  const downloadTemplate = () => {
    try {
      createMallaTemplate();
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar la plantilla. Por favor intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Carga Masiva de Malla Curricular
        </CardTitle>
        <CardDescription>
          Sube un archivo Excel con la malla curricular completa de las carreras
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Descarga la plantilla Excel con el formato requerido
          </p>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Descargar Plantilla
          </Button>
        </div>

        <div className="space-y-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Subir Archivo Excel de Malla Curricular
              </>
            )}
          </Button>
        </div>

        <div className="rounded-lg bg-muted/50 p-4 text-sm">
          <h4 className="font-medium mb-2">Formato requerido:</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><strong>Carrera:</strong> Nombre o código de la carrera (debe existir en el sistema)</li>
            <li><strong>Unidad:</strong> Básica | Profesional | Titulación</li>
            <li><strong>Semestre:</strong> Primer, Segundo, Tercer, Cuarto, Final (o 1, 2, 3...)</li>
            <li><strong>Código Asignatura:</strong> Código oficial (ej: SDS01)</li>
            <li><strong>Nombre Asignatura:</strong> Nombre completo de la materia</li>
            <li><strong>Créditos:</strong> Número de créditos académicos</li>
            <li><strong>Horas:</strong> Horas totales de la materia</li>
            <li><strong>Prerequisitos:</strong> Códigos de materias previas separados por comas (opcional)</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Las materias se crearán automáticamente como aprobadas y activas. Si ya existe una materia con el mismo código en la misma carrera, se omitirá.
          </p>
        </div>

        {showResults && results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Resultados del procesamiento:</h4>
            <ScrollArea className="h-[300px] rounded-lg border border-border">
              <div className="p-2 space-y-1">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 rounded-md p-2 text-sm ${
                      result.success ? 'bg-success/10' : 'bg-destructive/10'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <span className="flex-1">
                      <strong>{result.codigo}</strong> - {result.nombre} ({result.carrera})
                      {result.error && (
                        <span className="text-destructive ml-2 block text-xs">({result.error})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2 text-sm">
              <span className="text-success">
                ✓ {results.filter(r => r.success).length} exitosos
              </span>
              <span className="text-destructive">
                ✗ {results.filter(r => !r.success).length} errores
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExcelUploadMalla;

