import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/usuario.js';
import * as authController from '../controllers/authController.js';
import * as pacienteController from '../controllers/pacienteController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar multer para subir archivos de audio
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /audio\/(mpeg|mp3|wav|webm|ogg)/;
        if (allowedTypes.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo archivos de audio.'));
        }
    }
});

// ========== RUTA DE PRUEBA ==========
router.get('/', (req, res) => {
    res.send('<h1>API Alzheon funcionando correctamente!</h1>');
});

// ========== RUTAS DE AUTENTICACIÓN ==========
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/verify', authController.verify);
router.get('/user', authMiddleware, authController.getUserInfo);

// ========== RUTAS DE USUARIOS ==========

// Registrar nuevo usuario
router.post('/usuarios', authController.register);

// Obtener todos los usuarios
router.get('/usuarios', authMiddleware, async (req, res) => {
    try {
        const usuarios = await Usuario.find()
            .select('-password')
            .populate('pacienteAsociado', 'nombre email')
            .populate('cuidadores', 'nombre email')
            .populate('pacientesAsignados', 'nombre email');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener usuario por ID
router.get('/usuarios/:id', authMiddleware, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id)
            .select('-password')
            .populate('pacienteAsociado', 'nombre email')
            .populate('cuidadores', 'nombre email')
            .populate('pacientesAsignados', 'nombre email');
        
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar usuario
router.put('/usuarios/:id', authMiddleware, async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Eliminar usuario
router.delete('/usuarios/:id', authMiddleware, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Limpiar relaciones antes de eliminar
        if (usuario.rol === 'cuidador/familiar' && usuario.pacienteAsociado) {
            await Usuario.findByIdAndUpdate(
                usuario.pacienteAsociado,
                { $pull: { cuidadores: usuario._id } }
            );
        }
        
        if (usuario.rol === 'paciente') {
            // Eliminar referencia de cuidadores
            await Usuario.updateMany(
                { pacienteAsociado: usuario._id },
                { $unset: { pacienteAsociado: 1 } }
            );
        }
        
        await Usuario.findByIdAndDelete(req.params.id);
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== RUTAS ESPECÍFICAS DE RELACIONES ==========

// Asignar cuidador a paciente
router.post('/usuarios/:pacienteId/cuidadores/:cuidadorId', authMiddleware, async (req, res) => {
    try {
        const paciente = await Usuario.findById(req.params.pacienteId);
        const cuidador = await Usuario.findById(req.params.cuidadorId);
        
        if (!paciente || paciente.rol !== 'paciente') {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        if (!cuidador || cuidador.rol !== 'cuidador/familiar') {
            return res.status(404).json({ error: 'Cuidador no encontrado' });
        }
        
        // Actualizar cuidador
        cuidador.pacienteAsociado = paciente._id;
        await cuidador.save();
        
        // Actualizar paciente
        if (!paciente.cuidadores.includes(cuidador._id)) {
            paciente.cuidadores.push(cuidador._id);
            await paciente.save();
        }
        
        res.json({ message: 'Cuidador asignado correctamente', paciente, cuidador });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener cuidadores de un paciente
router.get('/usuarios/:pacienteId/cuidadores', authMiddleware, async (req, res) => {
    try {
        const paciente = await Usuario.findById(req.params.pacienteId)
            .populate('cuidadores', 'nombre email');
        
        if (!paciente || paciente.rol !== 'paciente') {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        res.json(paciente.cuidadores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Asignar paciente a médico
router.post('/usuarios/:medicoId/pacientes/:pacienteId', authMiddleware, async (req, res) => {
    try {
        const medico = await Usuario.findById(req.params.medicoId);
        const paciente = await Usuario.findById(req.params.pacienteId);
        
        if (!medico || medico.rol !== 'medico') {
            return res.status(404).json({ error: 'Médico no encontrado' });
        }
        
        if (!paciente || paciente.rol !== 'paciente') {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        if (!medico.pacientesAsignados.includes(paciente._id)) {
            medico.pacientesAsignados.push(paciente._id);
            await medico.save();
        }
        
        res.json({ message: 'Paciente asignado correctamente', medico });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener pacientes asignados a un médico
router.get('/usuarios/:medicoId/pacientes', authMiddleware, async (req, res) => {
    try {
        const medico = await Usuario.findById(req.params.medicoId)
            .populate('pacientesAsignados', 'nombre email');
        
        if (!medico || medico.rol !== 'medico') {
            return res.status(404).json({ error: 'Médico no encontrado' });
        }
        
        res.json(medico.pacientesAsignados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener usuarios por rol
router.get('/usuarios/rol/:rol', authMiddleware, async (req, res) => {
    try {
        const { rol } = req.params;
        const usuarios = await Usuario.find({ rol })
            .select('-password')
            .populate('pacienteAsociado', 'nombre email')
            .populate('cuidadores', 'nombre email')
            .populate('pacientesAsignados', 'nombre email');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== RUTAS DEL PACIENTE ==========

// Obtener fotos del paciente
router.get('/paciente/fotos', 
    authMiddleware, 
    requireRole('paciente'), 
    pacienteController.getPatientPhotos
);

// Subir grabación de audio
router.post('/paciente/grabar', 
    authMiddleware, 
    requireRole('paciente'),
    upload.single('audio'),
    pacienteController.uploadRecording
);

// Obtener grabaciones del paciente
router.get('/paciente/grabaciones', 
    authMiddleware, 
    requireRole('paciente'),
    pacienteController.getPatientRecordings
);

// Obtener configuración del paciente
router.get('/paciente/configuracion', 
    authMiddleware, 
    requireRole('paciente'),
    pacienteController.getPatientSettings
);

// Actualizar configuración de recordatorios
router.put('/paciente/configuracion', 
    authMiddleware, 
    requireRole('paciente'),
    pacienteController.updatePatientSettings
);

// Actualizar perfil del paciente
router.put('/paciente/perfil', 
    authMiddleware, 
    requireRole('paciente'),
    pacienteController.updatePatientProfile
);

// Cambiar contraseña del paciente
router.put('/paciente/perfil/password', 
    authMiddleware, 
    requireRole('paciente'),
    pacienteController.updatePatientPassword
);

export default router;