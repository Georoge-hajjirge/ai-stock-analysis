import mongoose from "mongoose";

const positiveSnapshotSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true },
        data: { type: mongoose.Schema.Types.Mixed, required: true },
    },
    { timestamps: true }
);

export const PositiveSnapshot: mongoose.Model<any> =
    mongoose.models.PositiveSnapshot ||
    mongoose.model("PositiveSnapshot", positiveSnapshotSchema);