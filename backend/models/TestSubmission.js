import mongoose from "mongoose";

const testSubmissionSchema = new mongoose.Schema(
    {
        asignacionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TestAssigment",
            required: true
        },
        pacienteId: {
            type:mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            required: true
        },
        doctorId: {
            type:mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            required: true
        },
        plantillaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TestTemplate",
            required: true
        },
        notas: {
            type: String,
        }

    }
)

testSubmissionSchema.index({pacienteId: 1, createAt: -1});
testSubmissionSchema.index({ doctorId: 1, createdAt: -1 });
testSubmissionSchema.index({ asignacionId: 1, createdAt: -1 });

const TestSubmission = mongoose.model("TestSubmission", testSubmissionSchema);