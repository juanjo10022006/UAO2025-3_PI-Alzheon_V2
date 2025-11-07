import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/usuario.js';
import Configuracion from '../models/configuracion.js';

export const register = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;
        
        // Validar que el usuario no exista
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        
        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Crear usuario
        const nuevoUsuario = new Usuario({
            nombre,
            email,
            password: hashedPassword,
            rol: rol || 'paciente'
        });
        
        await nuevoUsuario.save();
        
        // Si es un cuidador/familiar, actualizar el paciente asociado
        if (nuevoUsuario.rol === 'cuidador/familiar' && req.body.pacienteAsociado) {
            nuevoUsuario.pacienteAsociado = req.body.pacienteAsociado;
            await nuevoUsuario.save();
            
            await Usuario.findByIdAndUpdate(
                req.body.pacienteAsociado,
                { $push: { cuidadores: nuevoUsuario._id } }
            );
        }
        
        // Crear configuración por defecto para el usuario
        if (nuevoUsuario.rol === 'paciente') {
            await Configuracion.create({
                usuarioId: nuevoUsuario._id
            });
        }
        
        // Retornar usuario sin contraseña
        const usuarioSinPassword = await Usuario.findById(nuevoUsuario._id).select('-password');
        res.status(201).json(usuarioSinPassword);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Buscar usuario por email
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(401).json({ msg: 'El usuario o la contraseña son incorrectas' });
        }
        
        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, usuario.password);
        if (!passwordMatch) {
            return res.status(401).json({ msg: 'El usuario o la contraseña son incorrectas' });
        }
        
        // Crear JWT token
        const token = jwt.sign(
            { id: usuario._id, email: usuario.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );
        
        // Configurar cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        });
        
        res.json({ msg: 'Login exitoso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ msg: 'Logout exitoso' });
};

export const verify = async (req, res) => {
    try {
        const token = req.cookies?.token;
        
        if (!token) {
            return res.status(401).json({ msg: 'No autenticado' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const usuario = await Usuario.findById(decoded.id).select('-password');
        
        if (!usuario) {
            return res.status(401).json({ msg: 'Usuario no encontrado' });
        }
        
        res.json({ user: usuario });
    } catch (error) {
        res.status(401).json({ msg: 'Token inválido' });
    }
};

export const getUserInfo = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario._id)
            .select('-password')
            .populate('pacienteAsociado', 'nombre email')
            .populate('cuidadores', 'nombre email')
            .populate('pacientesAsignados', 'nombre email');
        
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
