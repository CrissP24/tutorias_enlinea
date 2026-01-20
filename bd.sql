-- BASE DE DATOS PARA SISTEMA DE TUTORÍAS UNIVERSITARIAS

CREATE DATABASE IF NOT EXISTS tutoria_universitaria DEFAULT CHARACTER SET utf8mb4;
USE tutoria_universitaria;

-- =========================
-- TABLA ROLES
-- =========================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(32) UNIQUE NOT NULL -- ejemplos: 'admin', 'coordinador', 'docente', 'estudiante'
);

-- =========================
-- TABLA CARRERAS
-- =========================
CREATE TABLE carreras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) UNIQUE NOT NULL
);

-- =========================
-- TABLA MATERIAS
-- =========================
CREATE TABLE materias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    carrera_id INT,
    FOREIGN KEY (carrera_id) REFERENCES carreras(id)
        ON DELETE SET NULL
);

-- =========================
-- TABLA USUARIOS
-- =========================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cedula VARCHAR(15) UNIQUE NOT NULL,
    nombres VARCHAR(80) NOT NULL,
    apellidos VARCHAR(80) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,
    carrera_id INT DEFAULT NULL,
    semestre VARCHAR(32),
    estado ENUM('activo','inactivo') DEFAULT 'activo',
    force_password_change BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id),
    FOREIGN KEY (carrera_id) REFERENCES carreras(id)
);

-- =========================
-- TABLA TUTORÍAS
-- =========================
CREATE TABLE tutorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    docente_id INT NOT NULL,
    materia_id INT DEFAULT NULL,
    tema VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado ENUM('pendiente','aceptada','rechazada','finalizada') NOT NULL,
    comentario TEXT,
    calificacion INT, -- 1 a 5 estrellas
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (estudiante_id) REFERENCES usuarios(id),
    FOREIGN KEY (docente_id) REFERENCES usuarios(id),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
);

-- =========================
-- TABLA HISTORIAL DE CAMBIOS EN TUTORÍAS (Opcional)
-- =========================
CREATE TABLE historial_tutorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tutoria_id INT NOT NULL,
    usuario_id INT NOT NULL,
    accion VARCHAR(100) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacion TEXT,
    FOREIGN KEY (tutoria_id) REFERENCES tutorias(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- =========================
-- TABLA NOTIFICACIONES (Opcional)
-- =========================
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- =========================
-- DATOS DE EJEMPLO BÁSICO
-- =========================
INSERT INTO roles (nombre) VALUES
    ('admin'), ('coordinador'), ('docente'), ('estudiante');

INSERT INTO carreras (nombre) VALUES
    ('Ingeniería de Software'), ('Ciencias de la Computación'), ('Ingeniería de Sistemas');

INSERT INTO materias (nombre, carrera_id) VALUES
    ('Programación I', 1),
    ('Bases de Datos', 1),
    ('Álgebra', 2);

-- User ejemplo (contraseña: cifrar con bcrypt en app)
INSERT INTO usuarios (cedula, nombres, apellidos, email, password, rol_id, carrera_id, semestre, estado)
VALUES
    ('1234567890', 'Ana', 'Pérez', 'ana.perez@universidad.edu', 'contraseña_cifrada', 1, NULL, NULL, 'activo'),
    ('1112223334', 'Miguel', 'Sánchez', 'miguel.sanchez@universidad.edu', 'contraseña_cifrada', 4, 1, '2do', 'activo'),
    ('4445556667', 'Laura', 'García', 'laura.garcia@universidad.edu', 'contraseña_cifrada', 3, 1, NULL, 'activo');

-- Solicitud de tutoría ejemplo
INSERT INTO tutorias (estudiante_id, docente_id, materia_id, tema, fecha, hora, estado)
VALUES (2, 3, 1, 'Resolver ejercicios de recursividad', '2024-07-13', '10:00:00', 'pendiente');
