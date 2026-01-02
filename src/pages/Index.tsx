import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Star, 
  ArrowRight,
  CheckCircle2,
  Calendar,
  MessageSquare
} from 'lucide-react';

const Index: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: <Calendar className="h-6 w-6" />,
      title: 'Agenda Flexible',
      description: 'Programa tutorías en los horarios que mejor te convengan.',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Docentes Calificados',
      description: 'Conecta con profesionales expertos en diversas áreas.',
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: 'Sistema de Calificación',
      description: 'Evalúa las sesiones y ayuda a mejorar la calidad.',
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: 'Temas Personalizados',
      description: 'Define los temas específicos que necesitas reforzar.',
    },
  ];

  const stats = [
    { value: '500+', label: 'Tutorías Realizadas' },
    { value: '50+', label: 'Docentes Activos' },
    { value: '4.8', label: 'Calificación Promedio' },
    { value: '1000+', label: 'Estudiantes Registrados' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Tutorías Académicas</span>
          </Link>

          <nav className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <Button asChild>
                <Link to={`/${user.rol}`}>
                  Ir al Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Registrarse</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>

        <div className="container relative mx-auto px-4 text-center">
          <div className="animate-slide-up">
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              Plataforma de Tutorías Virtuales
            </span>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Aprende con los
              <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                mejores docentes
              </span>
            </h1>
            
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Conectamos estudiantes con docentes calificados para sesiones de tutoría 
              personalizadas. Mejora tu rendimiento académico con ayuda profesional.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="xl" variant="hero" asChild>
                <Link to="/register">
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="hero-outline" asChild>
                <Link to="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              ¿Por qué elegirnos?
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Nuestra plataforma ofrece las herramientas necesarias para una experiencia 
              de aprendizaje efectiva y personalizada.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              ¿Cómo funciona?
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              En solo tres pasos podrás comenzar a recibir tutorías personalizadas.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Regístrate',
                description: 'Crea tu cuenta como estudiante y accede a la plataforma.',
              },
              {
                step: '02',
                title: 'Solicita una tutoría',
                description: 'Selecciona un docente, el tema y el horario que prefieras.',
              },
              {
                step: '03',
                title: 'Aprende y califica',
                description: 'Recibe la tutoría y evalúa la sesión para mejorar la calidad.',
              },
            ].map((item, index) => (
              <div key={index} className="relative animate-slide-up" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                  <span className="mb-4 inline-block text-5xl font-bold text-primary/20">
                    {item.step}
                  </span>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl gradient-hero p-8 text-center md:p-16">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
              ¿Listo para mejorar tu rendimiento?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
              Únete a nuestra comunidad de estudiantes y docentes. 
              Comienza tu camino hacia el éxito académico hoy.
            </p>
            <Button size="xl" variant="accent" asChild>
              <Link to="/register">
                Crear cuenta gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Tutorías Académicas</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Tutorías Académicas. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
