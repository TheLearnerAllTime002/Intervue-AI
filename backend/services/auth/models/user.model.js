import mongoose from "mongoose";

const userschema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    interviewCoin: {
        type: Number,
        default: 250
    }
},{timestamps:true})

const User = mongoose.model("User", userschema);

export default User;