import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    project: {
      type: [String], // ✅ Change this to an array of strings
      required: true,
    },
    projectPublicId: {
      type: [String], // ✅ Change this to an array of strings
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // or "Admin" depending on your model
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("projects", projectSchema);
