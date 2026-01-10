import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { createUser, encryptPassword, getUserByEmail, getUserByCedula, isValidEmail, isValidCedula } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, Upload, CheckCircle, XCircle, Download, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ExcelUserRow, UserRole, UserStatus } from '@/types';

interface UploadResult {
  success: boolean;
  cedula: string;
  nombre: string;
  error?: string;
}

const ExcelUpload: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const validRoles: UserRole[] = ['admin', 'coordinador', 'docente', 'estudiante'];
  const validStatuses: UserStatus[] = ['activo', 'inactivo'];

  const validateRow = (row: ExcelUserRow, rowIndex: number): string | null => {
    if (!row.cedula) return `Fila ${rowIndex}: Cédula es requerida`;
    if (!isValidCedula(row.cedula.toString())) return `Fila ${rowIndex}: Cédula inválida (debe tener 10 dígitos)`;
    if (!row.nombres) return `Fila ${rowIndex}: Nombres es requerido`;
    if (!row.correo) return `Fila ${rowIndex}: Correo es requerido`;
    if (!isValidEmail(row.correo)) return `Fila ${rowIndex}: Correo inválido`;
    if (!row.rol) return `Fila ${rowIndex}: Rol es requerido`;
    if (!validRoles.includes(row.rol.toLowerCase() as UserRole)) {
      return `Fila ${rowIndex}: Rol inválido (debe ser admin, docente o estudiante)`;
    }
    if (row.estado && !validStatuses.includes(row.estado.toLowerCase() as UserStatus)) {
      return `Fila ${rowIndex}: Estado inválido (debe ser activo o inactivo)`;
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
      
      // Look for "usuarios" sheet or use first sheet
      const sheetName = workbook.SheetNames.includes('usuarios') 
        ? 'usuarios' 
        : workbook.SheetNames[0];
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ExcelUserRow>(worksheet, {
        header: ['cedula', 'nombres', 'correo', 'rol', 'carrera', 'nivel', 'estado'],
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

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 2; // Account for header row and 0-index

        // Validate row
        const validationError = validateRow(row, rowNumber);
        if (validationError) {
          uploadResults.push({
            success: false,
            cedula: row.cedula?.toString() || 'N/A',
            nombre: row.nombres || 'N/A',
            error: validationError,
          });
          continue;
        }

        // Check for duplicates
        const cedula = row.cedula.toString();
        if (getUserByCedula(cedula)) {
          uploadResults.push({
            success: false,
            cedula,
            nombre: row.nombres,
            error: 'Cédula ya registrada',
          });
          continue;
        }

        if (getUserByEmail(row.correo)) {
          uploadResults.push({
            success: false,
            cedula,
            nombre: row.nombres,
            error: 'Correo ya registrado',
          });
          continue;
        }

        // Parse nombres and apellidos from row.nombres (assuming format: "Nombres Apellidos")
        const nombreCompleto = row.nombres.trim().split(' ');
        const nombres = nombreCompleto.slice(0, -1).join(' ') || nombreCompleto[0] || '';
        const apellidos = nombreCompleto.length > 1 ? nombreCompleto[nombreCompleto.length - 1] : '';

        // Create user with cedula as initial password
        const result = createUser({
          cedula,
          nombres: nombres,
          apellidos: apellidos,
          email: row.correo.trim().toLowerCase(),
          password: encryptPassword(cedula), // Password = cedula
          rol: row.rol.toLowerCase() as UserRole,
          carrera: row.carrera?.trim() || '',
          semestre: row.nivel?.trim() || '',
          telefono: '',
          estado: (row.estado?.toLowerCase() as UserStatus) || 'activo',
          forcePasswordChange: true, // Force password change on first login
        });

        if (result) {
          uploadResults.push({
            success: true,
            cedula,
            nombre: row.nombres,
          });
        } else {
          uploadResults.push({
            success: false,
            cedula,
            nombre: row.nombres,
            error: 'Error al crear usuario',
          });
        }
      }

      setResults(uploadResults);
      setShowResults(true);

      const successCount = uploadResults.filter(r => r.success).length;
      const errorCount = uploadResults.filter(r => !r.success).length;

      toast({
        title: 'Procesamiento completado',
        description: `${successCount} usuarios creados, ${errorCount} errores.`,
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
    const template = [
      ['cedula', 'nombres', 'correo', 'rol', 'carrera', 'nivel', 'estado'],
      ['1234567890', 'Juan Pérez García', 'juan.perez@institucion.edu', 'estudiante', 'Ingeniería de Software', '5to Semestre', 'activo'],
      ['0987654321', 'María López Silva', 'maria.lopez@institucion.edu', 'docente', 'Ciencias de la Computación', 'N/A', 'activo'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'usuarios');
    XLSX.writeFile(wb, 'plantilla_usuarios.xlsx');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Carga Masiva de Usuarios
        </CardTitle>
        <CardDescription>
          Sube un archivo Excel con los datos de los usuarios a registrar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template download */}
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

        {/* File upload */}
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
                Subir Archivo Excel
              </>
            )}
          </Button>
        </div>

        {/* Format info */}
        <div className="rounded-lg bg-muted/50 p-4 text-sm">
          <h4 className="font-medium mb-2">Formato requerido:</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><strong>cedula:</strong> 10 dígitos numéricos</li>
            <li><strong>nombres:</strong> Nombre completo</li>
            <li><strong>correo:</strong> Email válido</li>
            <li><strong>rol:</strong> admin | docente | estudiante</li>
            <li><strong>carrera:</strong> Nombre de la carrera</li>
            <li><strong>nivel:</strong> Semestre o nivel</li>
            <li><strong>estado:</strong> activo | inactivo</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            La contraseña inicial será la cédula del usuario. Se forzará el cambio en el primer inicio de sesión en caso que se requiera.
          </p>
        </div>

        {/* Results */}
        {showResults && results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Resultados del procesamiento:</h4>
            <ScrollArea className="h-[200px] rounded-lg border border-border">
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
                      {result.cedula} - {result.nombre}
                      {result.error && (
                        <span className="text-destructive ml-2">({result.error})</span>
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

export default ExcelUpload;
