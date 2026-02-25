import mongoose from "mongoose";
const analisisIASchema = mongoose.Schema({
    estado: {
        type: String,
        enum: ["pendiente", "completado", "fallido", "omitido"],
        default: "omitido"
    },
    provedor: {
        type: String
    },
    modelo: {
        type: String
    },
    generadoEn: {
        type: Date
    },
    resultadoJson: { type: mongoose.Schema.Types.Mixed },
    resultadoTexto: { type: String }, 
    error: { type: String }
}, {_id: false})


const testSubmissionSchema = new mongoose.Schema(
  {
    asignacionId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestAssignment",
        required: true 
    },
    pacienteId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Usuario", 
        required: true 
    },
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Usuario", 
        required: true 
    },
    plantillaId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "TestTemplate", 
        required: true 
    },
    assetUrl: { 
        type: String, 
        required: true 
    },
    mimeType: { 
        type: String, 
        required: true 
    },
    nombreOriginal: { 
        type: String,  
    },
    tamaño: { 
        type: Number, default: 0 
    },
    subidoPor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Usuario", 
        required: true 
    },
    notas: { 
        type: String, 
    },
    analisisIA: {
        type: analisisIASchema,
        default: () => ({estado:"omitido"})
    },
    geminiAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

testSubmissionSchema.index({ pacienteId: 1, createdAt: -1 });
testSubmissionSchema.index({ doctorId: 1, createdAt: -1 });
testSubmissionSchema.index({ asignacionId: 1, createdAt: -1 });

const TestSubmission = mongoose.model("TestSubmission", testSubmissionSchema);

export default TestSubmission;