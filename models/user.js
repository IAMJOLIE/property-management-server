import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String, required: true

    },

    password: {
        type: String, required: true
    },
    role: {type: String, enum: ["admin", "tenant", "owner"], defult: "tenant"}
}

)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });

const UserInLognin = mongoose.model("User", userSchema);
export default UserInLognin;