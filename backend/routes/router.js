import express from 'express';
import Usuario from '../models/usuario.js';

const router = express.Router();

// Ruta de prueba
router.get('/', (req, res) => {
    res.send('<h1>Estoy funcionando!</h1>');
});

// ========== RUTAS DE USUARIOS ==========

// Obtener todos los usuarios
router.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await Usuario.find()
            .populate('pacienteAsociado', 'nombre email')
            .populate('cuidadores', 'nombre email')
            .populate('pacientesAsignados', 'nombre email');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener usuario por ID
router.get('/usuarios/:id', async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id)
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

// Crear nuevo usuario
router.post('/usuarios', async (req, res) => {
    try {
        const nuevoUsuario = new Usuario(req.body);
        await nuevoUsuario.save();
        
        // Si es un cuidador/familiar, actualizar el paciente asociado
        if (nuevoUsuario.rol === 'cuidador/familiar' && nuevoUsuario.pacienteAsociado) {
            await Usuario.findByIdAndUpdate(
                nuevoUsuario.pacienteAsociado,
                { $push: { cuidadores: nuevoUsuario._id } }
            );
        }
        
        res.status(201).json(nuevoUsuario);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Actualizar usuario
router.put('/usuarios/:id', async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Eliminar usuario
router.delete('/usuarios/:id', async (req, res) => {
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
router.post('/usuarios/:pacienteId/cuidadores/:cuidadorId', async (req, res) => {
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
router.get('/usuarios/:pacienteId/cuidadores', async (req, res) => {
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
router.post('/usuarios/:medicoId/pacientes/:pacienteId', async (req, res) => {
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
router.get('/usuarios/:medicoId/pacientes', async (req, res) => {
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
router.get('/usuarios/rol/:rol', async (req, res) => {
    try {
        const { rol } = req.params;
        const usuarios = await Usuario.find({ rol })
            .populate('pacienteAsociado', 'nombre email')
            .populate('cuidadores', 'nombre email')
            .populate('pacientesAsignados', 'nombre email');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;