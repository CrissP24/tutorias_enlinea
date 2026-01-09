import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUser, encryptPassword, verifyPassword, isValidPassword } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Save, Loader2 } from 'lucide-react';
import type { ProfileFormData, PasswordChangeFormData } from '@/types';

const UserProfile: React.FC = () => {
  const { user, updateCurrentUser, logout } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profileData, setProfileData] = useState<ProfileFormData>({
    nombres: user?.nombres || '',
    apellidos: user?.apellidos || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    carrera: user?.carrera || '',
    semestre: user?.semestre || '',
  });

  const [passwordData, setPasswordData] = useState<PasswordChangeFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);

    try {
      const result = updateUser(user.id, {
        nombres: profileData.nombres,
        apellidos: profileData.apellidos,
        email: profileData.email,
        telefono: profileData.telefono,
        carrera: profileData.carrera,
        semestre: profileData.semestre,
      });

      if (result) {
        updateCurrentUser(result);
        toast({
          title: 'Perfil actualizado',
          description: 'Tus datos han sido actualizados correctamente.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'El email ya está en uso por otro usuario.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil.',
        variant: 'destructive',
      });
    }

    setIsUpdating(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validations
    if (!verifyPassword(passwordData.currentPassword, user.password)) {
      toast({
        title: 'Error',
        description: 'La contraseña actual es incorrecta.',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidPassword(passwordData.newPassword)) {
      toast({
        title: 'Error',
        description: 'La nueva contraseña debe tener al menos 8 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const encryptedPassword = encryptPassword(passwordData.newPassword);
      const result = updateUser(user.id, { 
        password: encryptedPassword,
        forcePasswordChange: false 
      });

      if (result) {
        toast({
          title: 'Contraseña actualizada',
          description: 'Tu contraseña ha sido cambiada. Por seguridad, debes iniciar sesión nuevamente.',
        });
        
        // Logout after password change
        setTimeout(() => {
          logout();
        }, 2000);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar la contraseña.',
        variant: 'destructive',
      });
    }

    setIsChangingPassword(false);
  };

  const getRoleName = (rol: string) => {
    switch (rol) {
      case 'admin': return 'Administrador';
      case 'coordinador': return 'Coordinador';
      case 'docente': return 'Docente';
      case 'estudiante': return 'Estudiante';
      default: return rol;
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <CardDescription>
            Visualiza y edita tu información personal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cedula">Cédula</Label>
                <Input
                  id="cedula"
                  value={user.cedula}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">La cédula no puede ser modificada</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rol">Rol</Label>
                <Input
                  id="rol"
                  value={getRoleName(user.rol)}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">El rol no puede ser modificado</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres</Label>
              <Input
                id="nombres"
                value={profileData.nombres}
                onChange={(e) => setProfileData({ ...profileData, nombres: e.target.value })}
                required
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input
                id="apellidos"
                value={profileData.apellidos}
                onChange={(e) => setProfileData({ ...profileData, apellidos: e.target.value })}
                required
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Institucional</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={profileData.telefono}
                onChange={(e) => setProfileData({ ...profileData, telefono: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="carrera">Carrera</Label>
                <Input
                  id="carrera"
                  value={profileData.carrera}
                  onChange={(e) => setProfileData({ ...profileData, carrera: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semestre">Semestre</Label>
                <Input
                  id="semestre"
                  value={profileData.semestre}
                  onChange={(e) => setProfileData({ ...profileData, semestre: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha de Registro</Label>
                <Input
                  value={new Date(user.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>
            Actualiza tu contraseña de acceso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                minLength={8}
              />
            </div>

            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Cambiar Contraseña
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
