import Usuario from '../models/usuario.js';
import Foto from '../models/foto.js';
import Grabacion from '../models/grabacion.js';
import Configuracion from '../models/configuracion.js';

// Obtener todos los pacientes asignados al médico con estadísticas
export const getAssignedPatients = async (req, res) => {
    try {
        const medico = await Usuario.findById(req.usuario._id)
            .populate({
                path: 'pacientesAsignados',
                select: 'nombre email createdAt',
                populate: {
                    path: 'cuidadores',
                    select: 'nombre email'
                }
            });
        
        if (!medico || medico.rol !== 'medico') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // Calcular inicio de semana
        const now = new Date();
        const firstDay = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        firstDay.setDate(diff);
        firstDay.setHours(0, 0, 0, 0);

        // Agregar estadísticas a cada paciente
        const patientsWithStats = await Promise.all(
            medico.pacientesAsignados.map(async (paciente) => {
                const totalFotos = await Foto.countDocuments({ pacienteId: paciente._id });
                const totalGrabaciones = await Grabacion.countDocuments({ pacienteId: paciente._id });
                const grabacionesEstaSemana = await Grabacion.countDocuments({
                    pacienteId: paciente._id,
                    createdAt: { $gte: firstDay }
                });
                
                const configuracion = await Configuracion.findOne({ usuarioId: paciente._id });
                
                return {
                    ...paciente.toObject(),
                    estadisticas: {
                        totalFotos,
                        totalGrabaciones,
                        grabacionesEstaSemana,
                        metaSemanal: configuracion?.estadisticas?.metaSemanal || 7
                    }
                };
            })
        );

        res.json(patientsWithStats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener detalles de un paciente específico
export const getPatientDetails = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const medico = await Usuario.findById(req.usuario._id);
        
        if (!medico || medico.rol !== 'medico') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // Verificar que el paciente esté asignado al médico
        if (!medico.pacientesAsignados.includes(pacienteId)) {
            return res.status(403).json({ error: 'No tienes acceso a este paciente' });
        }

        const paciente = await Usuario.findById(pacienteId)
            .select('-password')
            .populate('cuidadores', 'nombre email');
        
        if (!paciente || paciente.rol !== 'paciente') {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        // Obtener estadísticas completas del paciente
        const totalFotos = await Foto.countDocuments({ pacienteId });
        const totalGrabaciones = await Grabacion.countDocuments({ pacienteId });
        
        // Grabaciones esta semana
        const now = new Date();
        const firstDay = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        firstDay.setDate(diff);
        firstDay.setHours(0, 0, 0, 0);
        
        const grabacionesEstaSemana = await Grabacion.countDocuments({
            pacienteId,
            createdAt: { $gte: firstDay }
        });

        // Última grabación
        const ultimaGrabacion = await Grabacion.findOne({ 
            pacienteId 
        }).sort({ createdAt: -1 });

        // Obtener configuración del paciente
        const configuracion = await Configuracion.findOne({ usuarioId: pacienteId });

        res.json({
            ...paciente.toObject(),
            estadisticas: {
                totalFotos,
                totalGrabaciones,
                grabacionesEstaSemana,
                metaSemanal: configuracion?.estadisticas?.metaSemanal || 7,
                sesionesCompletadas: configuracion?.estadisticas?.sesionesCompletadas || 0,
                ultimaGrabacion: ultimaGrabacion ? {
                    fecha: ultimaGrabacion.createdAt,
                    duracion: ultimaGrabacion.duracion
                } : null
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener fotos de un paciente
export const getPatientPhotos = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const medico = await Usuario.findById(req.usuario._id);
        
        if (!medico || medico.rol !== 'medico') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (!medico.pacientesAsignados.includes(pacienteId)) {
            return res.status(403).json({ error: 'No tienes acceso a este paciente' });
        }

        const fotos = await Foto.find({ pacienteId })
            .populate('cuidadorId', 'nombre email')
            .sort({ createdAt: -1 });

        res.json(fotos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener grabaciones de un paciente
export const getPatientRecordings = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const medico = await Usuario.findById(req.usuario._id);
        
        if (!medico || medico.rol !== 'medico') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (!medico.pacientesAsignados.includes(pacienteId)) {
            return res.status(403).json({ error: 'No tienes acceso a este paciente' });
        }

        const grabaciones = await Grabacion.find({ pacienteId })
            .populate('photoId', 'etiqueta url_contenido')
            .sort({ createdAt: -1 });

        const grabacionesFormateadas = grabaciones.map(grabacion => ({
            _id: grabacion._id,
            photoId: grabacion.photoId?._id,
            fotoUrl: grabacion.photoId?.url_contenido || '',
            fecha: grabacion.createdAt,
            duracion: grabacion.duracion,
            audioUrl: grabacion.audioUrl,
            nota: grabacion.nota,
            descripcionTexto: grabacion.descripcionTexto,
            transcripcion: grabacion.transcripcion,
            tipoContenido: grabacion.tipoContenido
        }));

        res.json(grabacionesFormateadas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Asignar paciente al médico
export const assignPatient = async (req, res) => {
    try {
        const { pacienteId } = req.body;
        const medico = await Usuario.findById(req.usuario._id);
        
        if (!medico || medico.rol !== 'medico') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const paciente = await Usuario.findById(pacienteId);
        
        if (!paciente || paciente.rol !== 'paciente') {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        if (!medico.pacientesAsignados.includes(pacienteId)) {
            medico.pacientesAsignados.push(pacienteId);
            await medico.save();
        }

        res.json({ message: 'Paciente asignado correctamente', paciente });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Desasignar paciente del médico
export const unassignPatient = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const medico = await Usuario.findById(req.usuario._id);
        
        if (!medico || medico.rol !== 'medico') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        medico.pacientesAsignados = medico.pacientesAsignados.filter(
            id => id.toString() !== pacienteId
        );
        await medico.save();

        res.json({ message: 'Paciente desasignado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Asignar cuidador a un paciente (médico asigna)
export const assignCaregiverToPatient = async (req, res) => {
    try {
        const { pacienteId, cuidadorId } = req.body;
        const medico = await Usuario.findById(req.usuario._id);
        
        if (!medico || medico.rol !== 'medico') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (!medico.pacientesAsignados.includes(pacienteId)) {
            return res.status(403).json({ error: 'No tienes acceso a este paciente' });
        }

        const paciente = await Usuario.findById(pacienteId);
        const cuidador = await Usuario.findById(cuidadorId);

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
};

// Actualizar información de un paciente
export const updatePatientInfo = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const { nombre, email } = req.body;
        const medico = await Usuario.findById(req.usuario._id);
        
        if (!medico || medico.rol !== 'medico') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (!medico.pacientesAsignados.includes(pacienteId)) {
            return res.status(403).json({ error: 'No tienes acceso a este paciente' });
        }

        const paciente = await Usuario.findByIdAndUpdate(
            pacienteId,
            { nombre, email },
            { new: true, runValidators: true }
        ).select('-password');

        if (!paciente) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        res.json(paciente);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Obtener todos los cuidadores disponibles
export const getAvailableCaregivers = async (req, res) => {
    try {
        const medico = await Usuario.findById(req.usuario._id);
        
        if (!medico || medico.rol !== 'medico') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const cuidadores = await Usuario.find({ rol: 'cuidador/familiar' })
            .select('nombre email pacienteAsociado')
            .populate('pacienteAsociado', 'nombre');

        res.json(cuidadores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener todos los pacientes (para asignar)
export const getAllPatients = async (req, res) => {
    try {
        const medico = await Usuario.findById(req.usuario._id);
        
        if (!medico || medico.rol !== 'medico') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const pacientes = await Usuario.find({ rol: 'paciente' })
            .select('nombre email createdAt')
            .populate('cuidadores', 'nombre email');

        res.json(pacientes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener estadísticas generales del médico
export const getDoctorStats = async (req, res) => {
    try {
        const medico = await Usuario.findById(req.usuario._id)
            .populate('pacientesAsignados');
        
        if (!medico || medico.rol !== 'medico') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const totalPacientes = medico.pacientesAsignados.length;
        
        // Contar fotos totales de todos los pacientes
        const totalFotos = await Foto.countDocuments({
            pacienteId: { $in: medico.pacientesAsignados }
        });

        // Contar grabaciones totales
        const totalGrabaciones = await Grabacion.countDocuments({
            pacienteId: { $in: medico.pacientesAsignados }
        });

        // Grabaciones de esta semana
        const inicioSemana = new Date();
        inicioSemana.setDate(inicioSemana.getDate() - 7);
        
        const grabacionesEstaSemana = await Grabacion.countDocuments({
            pacienteId: { $in: medico.pacientesAsignados },
            createdAt: { $gte: inicioSemana }
        });

        res.json({
            totalPacientes,
            totalFotos,
            totalGrabaciones,
            grabacionesEstaSemana
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
