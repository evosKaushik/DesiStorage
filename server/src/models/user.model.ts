import mongoose from "mongoose";
import { SALT_ROUNDS } from "../config/bcrypt.js";
import bcrypt from "bcrypt";

export interface IUser {
  fullName: string;
  email: string;
  password: string;
  avatar: string;
  storageLimit: number;
  storageUsed: number;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = mongoose.Model<IUser, {}, IUserMethods>;

const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
    // User fullname
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
      match: [
        /^[A-Za-z]+(?: [A-Za-z]+)*$/,
        "Only letters and spaces are allowed",
      ],
    },

    // User email
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },

    // User password
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      maxlength: [128, "Password must be at most 128 characters"],
      validate: {
        validator: function (value: string) {
          return (
            /[A-Z]/.test(value) &&
            /[a-z]/.test(value) &&
            /[0-9]/.test(value) &&
            /[!-/:-@[-`{-~]/.test(value)
          );
        },
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      },
      select: false,
    },

    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/dvhqwwpdl/image/upload/v1777532041/default-avatar_frnvfo.jpg",
    },

    // User total Storage
    storageLimit: {
      type: Number,
      default: 15 * 1024 * 1024 * 1024, // 15 GB
      min: [0, "Storage can't be less than 0"],
    },

    // User total Storage used
    storageUsed: {
      type: Number,
      default: 0,
      min: [0, "Size can't less than 0"],
    },

    // User is Verified
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser, UserModel>("User", userSchema);

export default User;
