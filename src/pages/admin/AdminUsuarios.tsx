import React, { useState, useMemo } from 'react';
import { getUsers, createUser, updateUser, deleteUser, encryptPassword } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, Users, GraduationCap, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, UserRole, UserStatus } from '@/types';
import ExcelUpload from '@/components/admin/ExcelUpload';

const AdminUsuarios: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [filterCarrera, setFilterCarrera] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    cedula: '',
    nombre: '',
    email: '',
    rol: '' as UserRole | '',
    carrera: '',
    nivel: '',
    estado: 'activo' as UserStatus,
  });

  const carreras = useMemo(() => {
    const uniqueCarreras = [...new Set(users.map(u => u.carrera).filter(Boolean))];
    return uniqueCarreras;
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.cedula.includes(searchTerm);
      const matchesRole = filterRole === 'all' || user.rol === filterRole;
      const matchesCarrera = filterCarrera === 'all' || user.carrera === filterCarrera;
      return matchesSearch && matchesRole && matchesCarrera;
    });
  }, [users, searchTerm, filterRole, filterCarrera]);

  const refreshUsers = () => setUsers(getUsers());

  const openCreateDialog = () => {
    setSelectedUser(null);
    setFormData({ cedula: '', nombre: '', email: '', rol: '', carrera: '', nivel: '', estado: 'activo' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      cedula: user.cedula,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      carrera: user.carrera,
      nivel: user.nivel,
      estado: user.estado,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.rol) {
      toast({ title: 'Error', description: 'Por favor selecciona un rol', variant: 'destructive' });
      return;
    }

    if (selectedUser) {
      const updates: Partial<User> = {
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol as UserRole,
        carrera: formData.carrera,
        nivel: formData.nivel,
        estado: formData.estado,
      };

      const result = updateUser(selectedUser.id, updates);
      
      if (result) {
        toast({ title: 'Usuario actualizado', description: 'Los datos del usuario han sido actualizados.' });
        refreshUsers();
        setIsDialogOpen(false);
      } else {
        toast({ title: 'Error', description: 'El email ya está en uso.', variant: 'destructive' });
      }
    } else {
      if (formData.cedula.length !== 10) {
        toast({ title: 'Error', description: 'La cédula debe tener 10 dígitos.', variant: 'destructive' });
        return;
      }

      // Password = cedula for new users
      const result = createUser({
        cedula: formData.cedula,
        nombre: formData.nombre,
        email: formData.email,
        password: encryptPassword(formData.cedula),
        rol: formData.rol as UserRole,
        carrera: formData.carrera,
        nivel: formData.nivel,
        estado: formData.estado,
        forcePasswordChange: true,
      });

      if (result) {
        toast({ title: 'Usuario creado', description: 'El usuario deberá cambiar su contraseña al iniciar sesión.' });
        refreshUsers();
        setIsDialogOpen(false);
      } else {
        toast({ title: 'Error', description: 'El email o cédula ya están registrados.', variant: 'destructive' });
      }
    }
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    const result = deleteUser(selectedUser.id);
    if (result) {
      toast({ title: 'Usuario eliminado', description: 'El usuario ha sido eliminado del sistema.' });
      refreshUsers();
    }
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const getRoleIcon = (rol: UserRole) => {
    switch (rol) {
      case 'admin': return <Users className="h-4 w-4" />;
      case 'docente': return <UserCheck className="h-4 w-4" />;
      case 'estudiante': return <GraduationCap className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (rol: UserRole) => {
    switch (rol) {
      case 'admin': return 'bg-destructive/10 text-destructive';
      case 'docente': return 'bg-success/10 text-success';
      case 'estudiante': return 'bg-primary/10 text-primary';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administra los usuarios del sistema</p>
          </div>
          <Button onClick={openCreateDialog}><Plus className="mr-2 h-4 w-4" />Nuevo Usuario</Button>
        </div>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">Lista de Usuarios</TabsTrigger>
            <TabsTrigger value="upload">Carga Masiva</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar por nombre, email o cédula..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Select value={filterRole} onValueChange={(value) => setFilterRole(value as UserRole | 'all')}>
                  <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Rol" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="docente">Docente</SelectItem>
                    <SelectItem value="estudiante">Estudiante</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCarrera} onValueChange={setFilterCarrera}>
                  <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Carrera" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las carreras</SelectItem>
                    {carreras.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Usuarios ({filteredUsers.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Cédula</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Nombre</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Email</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Rol</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Estado</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm">{user.cedula}</td>
                          <td className="py-3 px-4 font-medium">{user.nombre}</td>
                          <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getRoleBadgeColor(user.rol)}`}>
                              {getRoleIcon(user.rol)}{user.rol}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${user.estado === 'activo' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                              {user.estado}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(user)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => openDeleteDialog(user)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <ExcelUpload onComplete={refreshUsers} />
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
              <DialogDescription>{selectedUser ? 'Modifica los datos del usuario.' : 'La contraseña inicial será la cédula.'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Cédula</Label>
                  <Input value={formData.cedula} onChange={(e) => setFormData({...formData, cedula: e.target.value})} disabled={!!selectedUser} required maxLength={10} />
                </div>
                <div className="space-y-2">
                  <Label>Nombre completo</Label>
                  <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <Select value={formData.rol} onValueChange={(v: UserRole) => setFormData({...formData, rol: v})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="docente">Docente</SelectItem>
                        <SelectItem value="estudiante">Estudiante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={formData.estado} onValueChange={(v: UserStatus) => setFormData({...formData, estado: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Carrera</Label>
                    <Input value={formData.carrera} onChange={(e) => setFormData({...formData, carrera: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nivel</Label>
                    <Input value={formData.nivel} onChange={(e) => setFormData({...formData, nivel: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">{selectedUser ? 'Guardar' : 'Crear'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
              <AlertDialogDescription>Se eliminará <strong>{selectedUser?.nombre}</strong> y sus tutorías.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsuarios;
