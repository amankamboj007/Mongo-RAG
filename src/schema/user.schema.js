import mongoose from "mongoose";

const userModel = new mongoose.Schema(
  {
    email:{
        type:String,
        unique:true,
        index:true,
        requried:true
    },
    name: {
        type: String,
    },
    password:{
        type:String,
        requried:true
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "Users",
    versionKey: false,
  }
);


const user = mongoose.model("Users", userModel);

export default user