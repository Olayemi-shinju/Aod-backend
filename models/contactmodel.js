import mongoose from "mongoose";

const schema = mongoose.Schema

 const contactSchema = new schema({
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subject: { type: String, required: true },
    message: {type: String, required: true},
    isRead: {type: Boolean, default: false},
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model("Contact", contactSchema);
