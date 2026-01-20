import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPDFs, getCarreras } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const EstudiantePDFs: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pdfs, setPDFs] = useState(getPDFs());
  const [carreras] = useState(getCarreras());
  const [searchTerm, setSearchTerm] = useState('');

  if (!user) {
    return null;
  }

  // Estudiante solo ve PDFs de su carrera
  const userCarrera = user.carrera || '';
  const carreraObj = carreras.find(c => c.id === userCarrera || c.nombre.toLowerCase() === userCarrera.toLowerCase());
  const carreraId = carreraObj?.id || userCarrera;

  // Filtrar PDFs solo de la carrera del estudiante
  const myPDFs = useMemo(() => {
    return pdfs.filter(
      pdf => 
        (pdf.carrera === carreraId || pdf.carrera.toLowerCase() === userCarrera.toLowerCase()) &&
        pdf.activo
    );
  }, [pdfs, carreraId, userCarrera]);

  const filteredPDFs = useMemo(() => {
    return myPDFs.filter(pdf => {
      return pdf.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (pdf.descripcion && pdf.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    });
  }, [myPDFs, searchTerm]);

  const handleDownload = (pdf: typeof myPDFs[0]) => {
    // Simular descarga - en producción esto descargaría el archivo real
    toast({
      title: 'Descarga simulada',
      description: `Descargando ${pdf.nombre}... Nota: En producción esto descargaría el archivo PDF real.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos PDF</h1>
          <p className="text-muted-foreground">
            Documentos PDF disponibles para {carreraObj?.nombre || userCarrera}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>PDFs Disponibles</CardTitle>
            <CardDescription>
              Lista de documentos PDF de tu carrera
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {filteredPDFs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No hay PDFs disponibles</p>
                <p className="text-sm">
                  {searchTerm 
                    ? 'No se encontraron PDFs con ese criterio de búsqueda.'
                    : 'No hay documentos PDF disponibles para tu carrera en este momento.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPDFs.map((pdf) => (
                  <Card key={pdf.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 truncate">{pdf.nombre}</h3>
                          {pdf.descripcion && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {pdf.descripcion}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <div className="text-xs text-muted-foreground">
                              <p>Subido: {new Date(pdf.fecha).toLocaleDateString('es-ES')}</p>
                              {pdf.tamaño && (
                                <p>Tamaño: {(pdf.tamaño / 1024).toFixed(2)} KB</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(pdf)}
                              className="ml-2"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Descargar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredPDFs.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground text-center">
                Mostrando {filteredPDFs.length} de {myPDFs.length} PDF{myPDFs.length !== 1 ? 's' : ''}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EstudiantePDFs;

