import mongoose from 'mongoose';

const grabacionSchema = new mongoose.Schema({
    photoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Foto',
        required: true
    },
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    fotoUrl: {
        type: String,
        required: true
    },
    audioUrl: {
        type: String,
        required: true
    },
    duracion: {
        type: Number,
        required: true // En segundos
    },
    nota: {
        type: String
    },
    fecha: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Índices para mejorar búsquedas
grabacionSchema.index({ pacienteId: 1, fecha: -1 });
grabacionSchema.index({ photoId: 1 });

export default mongoose.model('Grabacion', grabacionSchema);
