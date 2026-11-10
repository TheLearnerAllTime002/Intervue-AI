import mongoose from "mongoose";

const coinTransactionSchema = new mongoose.Schema({
   kind: { type: String, enum: ["usage", "purchase"], required: true },
   action: { type: String, required: true },
   coins: { type: Number, required: true },
   createdAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema =
new mongoose.Schema({

   firebaseUid:{
      type:String,
      required:true,
      unique:true
   },

   name:String,

   email:{
      type:String,
      required:true,
      unique:true
   },


   interviewCoin:{
      type:Number,
      default:150
   },
   processedBillingOrderIds: {
      type: [String],
      default: []
   },
   coinHistory: { type: [coinTransactionSchema], default: [] }

},{
   timestamps:true
});

 const User =
mongoose.model(
   "User",
   userSchema
);

export default User;
