import mongoose from "mongoose";

const testAssignmentSchema = mongoose.Schema(
    {
        pacienteId: {
            type: mongoose.Schema.Types.ObjectId, ref: "Usuario",
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
        frecuencia: {
            type: String,
            enum : ["semanal", "mensual", "trimestral"],
            default: "mensual",
            required: true
        },
        estado: {
            type: String,
            enum: ["activo","pausado"],
            default: "activo"
        },
        fechaInicio: {
            type: Date,
            default: Date.now
        },
        fechaEntrega: {
            type: Date
        }
    }

   
)
testAssignmentSchema.index({ pacienteId: 1, estado:1});

testAssignmentSchema.index({doctorId:1, estado:1});

testAssignmentSchema.index({doctorId:1}).index({plantillaId:1});

const TestAssignment = mongoose.model("TestAssignment", testAssignmentSchema);

export default TestAssignment;

