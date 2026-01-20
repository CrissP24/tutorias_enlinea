import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';
import { createUser, encryptPassword, getUserByEmail, getUserByCedula, isValidEmail, isValidCedula, getUsers, createNotificationByCarrera, getUserMetrics } from '@/lib/storage';
import { createUserTemplate } from '@/lib/excelTemplate';
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

const ExcelUploadCoordinador: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  if (!user) {
    return null;
  }

  const validRoles: UserRole[] = ['estudiante']; // Coordinador solo puede cargar estudiantes
  const validStatuses: UserStatus[] = ['activo', 'inactivo'];
  const userCarrera = user.carrera || '';

  const validateRow = (row: ExcelUserRow, rowIndex: number): string | null => {
    if (!row.cedula) return `Fila ${rowIndex}: Cédula es requerida`;
    if (!isValidCedula(row.cedula.toString())) return `Fila ${rowIndex}: Cédula inválida (debe tener 10 dígitos)`;
    if (!row.nombres) return `Fila ${rowIndex}: Nombres es requerido`;
    if (!row.correo) return `Fila ${rowIndex}: Correo es requerido`;
    if (!isValidEmail(row.correo)) return `Fila ${rowIndex}: Correo inválido`;
    if (!row.rol) return `Fila ${rowIndex}: Rol es requerido`;
    if (!validRoles.includes(row.rol.toLowerCase() as UserRole)) {
      return `Fila ${rowIndex}: Solo se pueden cargar estudiantes`;
    }
    if (row.carrera && row.carrera.toLowerCase() !== userCarrera.toLowerCase()) {
      return `Fila ${rowIndex}: La carrera debe ser ${userCarrera}`;
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
      
      const sheetName = workbook.SheetNames.includes('usuarios') 
        ? 'usuarios' 
        : workbook.SheetNames[0];
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ExcelUserRow>(worksheet, {
        header: ['cedula', 'nombres', 'correo', 'rol', 'carrera', 'nivel', 'estado'],
        range: 1,
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
        const rowNumber = i + 2;

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

        // Parse nombres and apellidos
        const nombreCompleto = (row.nombres || '').trim().split(' ').filter(Boolean);
        const nombres = nombreCompleto.slice(0, -1).join(' ') || nombreCompleto[0] || '';
        const apellidos = nombreCompleto.length > 1 ? nombreCompleto[nombreCompleto.length - 1] : '';

        // Create user - siempre con la carrera del coordinador
        const result = createUser({
          cedula,
          nombres: nombres || 'Estudiante',
          apellidos: apellidos || 'Sin Apellido',
          email: (row.correo || '').trim().toLowerCase(),
          password: encryptPassword(cedula),
          rol: 'estudiante',
          carrera: userCarrera, // Siempre la carrera del coordinador
          semestre: (row.nivel || '').trim() || '',
          telefono: '',
          estado: (row.estado?.toLowerCase() as UserStatus) || 'activo',
          forcePasswordChange: true,
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

      // Crear notificación para estudiantes de la carrera sobre nuevos usuarios
      if (successCount > 0) {
        createNotificationByCarrera(
          userCarrera,
          `Se cargaron ${successCount} nuevos estudiantes en ${userCarrera}`,
          'usuarios'
        );
      }

      // Obtener métricas actualizadas
      const metrics = getUserMetrics();

      toast({
        title: 'Procesamiento completado',
        description: `${successCount} estudiantes creados, ${errorCount} errores. Total estudiantes en ${userCarrera}: ${metrics.porCarrera[userCarrera] || 0}`,
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
      createUserTemplate(true, userCarrera);
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
          Carga Masiva de Estudiantes - {userCarrera}
        </CardTitle>
        <CardDescription>
          Sube un archivo Excel con los datos de los estudiantes de tu carrera
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
                Subir Archivo Excel
              </>
            )}
          </Button>
        </div>

        <div className="rounded-lg bg-muted/50 p-4 text-sm">
          <h4 className="font-medium mb-2">Formato requerido:</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><strong>cedula:</strong> 10 dígitos numéricos</li>
            <li><strong>nombres:</strong> Nombre completo (se separará en nombres y apellidos)</li>
            <li><strong>correo:</strong> Email válido</li>
            <li><strong>rol:</strong> estudiante (solo estudiantes)</li>
            <li><strong>carrera:</strong> {userCarrera} (debe coincidir con tu carrera)</li>
            <li><strong>nivel:</strong> Semestre o nivel</li>
            <li><strong>estado:</strong> activo | inactivo</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            La contraseña inicial será la cédula del usuario. Se forzará el cambio en el primer inicio de sesión.
          </p>
        </div>

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

export default ExcelUploadCoordinador;

