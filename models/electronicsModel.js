import mongoose from "mongoose";

const electronicSchema  = new mongoose.Schema({
    name: {type: String, required: true},
    Wattage: {type: String, required: true},
}, {
    timestamps: true
})


const Electronic = mongoose.model('Electronic', electronicSchema)

export default Electronic;