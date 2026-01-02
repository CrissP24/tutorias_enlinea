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
import { Plus, Search, Edit, Trash2, Users, GraduationCap, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, UserRole } from '@/types';

const AdminUsuarios: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: '' as UserRole | '',
  });

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.rol === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  const refreshUsers = () => {
    setUsers(getUsers());
  };

  const openCreateDialog = () => {
    setSelectedUser(null);
    setFormData({ nombre: '', email: '', password: '', rol: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      nombre: user.nombre,
      email: user.email,
      password: '',
      rol: user.rol,
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
      toast({
        title: 'Error',
        description: 'Por favor selecciona un rol',
        variant: 'destructive',
      });
      return;
    }

    if (selectedUser) {
      // Update user
      const updates: Partial<User> = {
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol as UserRole,
      };
      
      if (formData.password) {
        updates.password = encryptPassword(formData.password);
      }

      const result = updateUser(selectedUser.id, updates);
      
      if (result) {
        toast({
          title: 'Usuario actualizado',
          description: 'Los datos del usuario han sido actualizados.',
        });
        refreshUsers();
        setIsDialogOpen(false);
      } else {
        toast({
          title: 'Error',
          description: 'El email ya está en uso.',
          variant: 'destructive',
        });
      }
    } else {
      // Create user
      if (formData.password.length < 6) {
        toast({
          title: 'Error',
          description: 'La contraseña debe tener al menos 6 caracteres.',
          variant: 'destructive',
        });
        return;
      }

      const result = createUser({
        nombre: formData.nombre,
        email: formData.email,
        password: encryptPassword(formData.password),
        rol: formData.rol as UserRole,
      });

      if (result) {
        toast({
          title: 'Usuario creado',
          description: 'El nuevo usuario ha sido registrado.',
        });
        refreshUsers();
        setIsDialogOpen(false);
      } else {
        toast({
          title: 'Error',
          description: 'El email ya está registrado.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDelete = () => {
    if (!selectedUser) return;

    const result = deleteUser(selectedUser.id);
    
    if (result) {
      toast({
        title: 'Usuario eliminado',
        description: 'El usuario ha sido eliminado del sistema.',
      });
      refreshUsers();
    } else {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el usuario.',
        variant: 'destructive',
      });
    }

    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const getRoleIcon = (rol: UserRole) => {
    switch (rol) {
      case 'admin':
        return <Users className="h-4 w-4" />;
      case 'docente':
        return <UserCheck className="h-4 w-4" />;
      case 'estudiante':
        return <GraduationCap className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (rol: UserRole) => {
    switch (rol) {
      case 'admin':
        return 'bg-destructive/10 text-destructive';
      case 'docente':
        return 'bg-success/10 text-success';
      case 'estudiante':
        return 'bg-primary/10 text-primary';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              Administra los usuarios del sistema
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterRole} onValueChange={(value) => setFilterRole(value as UserRole | 'all')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="docente">Docente</SelectItem>
                <SelectItem value="estudiante">Estudiante</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios Registrados</CardTitle>
            <CardDescription>
              {filteredUsers.length} usuario(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No se encontraron usuarios.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Nombre</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Email</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Rol</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Fecha Registro</th>
                      <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                              {user.nombre.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground">{user.nombre}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getRoleBadgeColor(user.rol)}`}>
                            {getRoleIcon(user.rol)}
                            {user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {new Date(user.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </DialogTitle>
              <DialogDescription>
                {selectedUser
                  ? 'Modifica los datos del usuario seleccionado.'
                  : 'Completa el formulario para registrar un nuevo usuario.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    minLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    {selectedUser ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    {...(!selectedUser && { required: true, minLength: 6 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rol">Rol</Label>
                  <Select
                    value={formData.rol}
                    onValueChange={(value: UserRole) => setFormData({ ...formData, rol: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="docente">Docente</SelectItem>
                      <SelectItem value="estudiante">Estudiante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {selectedUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará el usuario{' '}
                <strong>{selectedUser?.nombre}</strong> y todas sus tutorías asociadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsuarios;
