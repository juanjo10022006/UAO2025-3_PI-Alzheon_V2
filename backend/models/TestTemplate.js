import mongoose from "mongoose";

const testTemplateSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true
        },
        tipo: {
            type: String,
            enum: ["firma", "dibujo"],
            required: true
        },
        instruciones: {
            type: String
        },
        assetUrl: {
            type: String,
            required: true
        },
        version: {
            type: Number,
            default: 1
        },
        isActivo: {
            type: Boolean,
            default: true
        }
    }
);

const TestTemplate = mongoose.model("TestTemplate", testTemplateSchema);

export default TestTemplate;