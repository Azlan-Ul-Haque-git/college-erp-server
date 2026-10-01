import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "faculty", "student"],
      default: "student",
    },

    avatar: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    /* ═════ STUDENT FIELDS ═════ */

    rollNumber: {
      type: String,
      default: "",
    },

    branch: {
      type: String,
      default: "",
    },

    year: {
      type: Number,
      default: 1,
    },

    semester: {
      type: Number,
      default: 1,
    },

    section: {
      type: String,
      default: "A",
    },

    admissionNo: {
      type: String,
      default: "",
    },

    parentName: {
      type: String,
      default: "",
    },

    parentPhone: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["regular", "backlog", "ba", "ba_scheme", "passout"],
      default: "regular",
    },

    backlogCount: {
      type: Number,
      default: 0,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    /* ═════ STUDENT FIELDS END ═════ */

    resetOTP: String,
    resetOTPExpire: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {

  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(
    this.password,
    salt
  );

  next();
});

userSchema.methods.matchPassword = async function (
  enteredPassword
) {
  return await bcrypt.compare(
    enteredPassword,
    this.password
  );
};

const User = mongoose.model("User", userSchema);

export default User;