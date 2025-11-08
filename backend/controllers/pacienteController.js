import Foto from '../models/foto.js';
import Grabacion from '../models/grabacion.js';
import Configuracion from '../models/configuracion.js';
import Usuario from '../models/usuario.js';
import bcrypt from 'bcryptjs';
import { uploadAudioToR2 } from '../services/uploadService.js';

// Obtener fotos del paciente
export const getPatientPhotos = async (req, res) => {
    try {
        const pacienteId = req.usuario._id;
        
        const fotos = await Foto.find({ pacienteId })
            .populate('cuidadorId', 'nombre email')
            .sort({ createdAt: -1 });
        
        res.json(fotos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Subir grabación de audio
export const uploadRecording = async (req, res) => {
    try {
        const pacienteId = req.usuario._id;
        const { photoId, duration, note } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó archivo de audio' });
        }
        
        // Verificar que la foto pertenece al paciente
        const foto = await Foto.findOne({ _id: photoId, pacienteId });
        if (!foto) {
            return res.status(404).json({ error: 'Foto no encontrada' });
        }

        // Subir audio a R2
        const audioUrl = await uploadAudioToR2(
            req.file.buffer, 
            req.file.mimetype, 
            req.file.originalname
        );
        
        // Crear grabación
        const grabacion = new Grabacion({
            photoId,
            pacienteId,
            fotoUrl: foto.url_contenido,
            audioUrl,
            duracion: parseInt(duration),
            nota: note || '',
            fecha: new Date()
        });
        
        await grabacion.save();
        
        // Actualizar estadísticas
        await Configuracion.findOneAndUpdate(
            { usuarioId: pacienteId },
            { 
                $inc: { 'estadisticas.sesionesCompletadas': 1 },
                $set: { 'estadisticas.ultimaGrabacion': new Date() }
            }
        );
        
        res.status(201).json(grabacion);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener grabaciones del paciente
export const getPatientRecordings = async (req, res) => {
    try {
        const pacienteId = req.usuario._id;
        
        const grabaciones = await Grabacion.find({ pacienteId })
            .populate('photoId', 'etiqueta')
            .sort({ fecha: -1 });
        
        res.json(grabaciones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener configuración del paciente
export const getPatientSettings = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        
        let configuracion = await Configuracion.findOne({ usuarioId });
        
        // Si no existe, crear una por defecto
        if (!configuracion) {
            configuracion = await Configuracion.create({ usuarioId });
        }
        
        // Retornar en el formato esperado por el frontend
        res.json({
            enabled: configuracion.recordatorios.enabled,
            hour: configuracion.recordatorios.hour,
            frequency: configuracion.recordatorios.frequency,
            motivationalMessage: configuracion.recordatorios.motivationalMessage,
            nextSession: configuracion.recordatorios.nextSession
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar configuración de recordatorios
export const updatePatientSettings = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { enabled, hour, frequency, motivationalMessage } = req.body;
        
        // Calcular próxima sesión
        let nextSession = null;
        if (enabled) {
            nextSession = calculateNextSession(hour, frequency);
        }
        
        const configuracion = await Configuracion.findOneAndUpdate(
            { usuarioId },
            {
                'recordatorios.enabled': enabled,
                'recordatorios.hour': hour,
                'recordatorios.frequency': frequency,
                'recordatorios.motivationalMessage': motivationalMessage,
                'recordatorios.nextSession': nextSession
            },
            { new: true, upsert: true }
        );
        
        res.json({
            enabled: configuracion.recordatorios.enabled,
            hour: configuracion.recordatorios.hour,
            frequency: configuracion.recordatorios.frequency,
            motivationalMessage: configuracion.recordatorios.motivationalMessage,
            nextSession: configuracion.recordatorios.nextSession
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar perfil del paciente
export const updatePatientProfile = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { nombre, email, telefono } = req.body;
        
        // Actualizar usuario
        const usuario = await Usuario.findByIdAndUpdate(
            usuarioId,
            { nombre, email },
            { new: true }
        ).select('-password');
        
        // Actualizar teléfono en configuración
        if (telefono !== undefined) {
            await Configuracion.findOneAndUpdate(
                { usuarioId },
                { 'perfil.telefono': telefono },
                { upsert: true }
            );
        }
        
        res.json({ nombre: usuario.nombre, email: usuario.email, telefono });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cambiar contraseña
export const updatePatientPassword = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { currentPassword, newPassword } = req.body;
        
        // Verificar contraseña actual
        const usuario = await Usuario.findById(usuarioId);
        const passwordMatch = await bcrypt.compare(currentPassword, usuario.password);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }
        
        // Hashear nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Actualizar contraseña
        usuario.password = hashedPassword;
        await usuario.save();
        
        res.json({ msg: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Función auxiliar para calcular próxima sesión
const calculateNextSession = (hour, frequency) => {
    const now = new Date();
    const [hours, minutes] = hour.split(':');
    const nextSession = new Date();
    nextSession.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Si ya pasó la hora de hoy, empezar desde mañana
    if (nextSession <= now) {
        nextSession.setDate(nextSession.getDate() + 1);
    }
    
    // Ajustar según frecuencia
    switch (frequency) {
        case 'cada_2_dias':
            nextSession.setDate(nextSession.getDate() + 1);
            break;
        case 'semanal':
            nextSession.setDate(nextSession.getDate() + 6);
            break;
        // 'diario' no necesita ajuste adicional
    }
    
    return nextSession;
};
