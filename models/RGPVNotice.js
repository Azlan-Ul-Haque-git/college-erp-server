import mongoose from "mongoose";

const rgpvNoticeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        link: {
            type: String,
            default: "",
        },
        source: {
            type: String,
            default: "rgpvdiploma",
        },
    },
    { timestamps: true }
);

// Deduplication index
rgpvNoticeSchema.index({ message: 1 }, { unique: true });

export default mongoose.model("RGPVNotice", rgpvNoticeSchema);