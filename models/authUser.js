import mongoose from "mongoose";
import bcrypt from "bcryptjs"

const authUserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true }, 
  lastName: { type: String, required: true }, 
  email: { type: String, required: true, unique: true }, 
  password: { type: String, required: true }, 
  role: { type: String, enum: ["owner", "tenant"], default: "tenant" }, 
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }], 


  },
  { timestamps: true }
);

authUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  console.log(" Hashar lösenord innan sparning:", this.password);
  this.password = await bcrypt.hash(this.password, 10);
  console.log(" Hashat lösenord:", this.password);
  next();
});


const AuthUser = mongoose.model("AuthUser", authUserSchema);
export default AuthUser;


