import mongoose from "mongoose";
import { SALT_ROUNDS } from "../config/bcrypt.js";
import bcrypt from "bcrypt";
import { DEFAULT_AVATAR } from "../constants/constant.js";

export type AuthProvider = "local" | "google";

export interface IUser {
  fullName: string;
  email: string;
  password: string | null;
  avatar: string;
  googleId?: string | null;
  authProviders: AuthProvider[];
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
        /^[\p{L}\p{M}'.-]+(?: [\p{L}\p{M}'.-]+)*$/u,
        "Only letters, spaces, hyphens, dots and apostrophes are allowed",
      ],
    },

    // Auth Providers
    authProviders: {
      type: [String],
      enum: ["local", "google"],
      required: [true, "Authentication provider is required"],
      validator: (providers: string[]) =>
        providers.length > 0 && new Set(providers).size === providers.length,
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
      // required: [true, "Password is required"],
      required: [
        function (this: IUser) {
          return this.authProviders.includes("local");
        },
        "Password is required for email authentication",
      ],
      default: null,
      minlength: [8, "Password must be at least 8 characters"],
      maxlength: [128, "Password must be at most 128 characters"],
      validate: {
        validator: function (value: string | null) {
          if (value === null) return true;
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
      default: DEFAULT_AVATAR,
    },

    // Stable Google account id (sub claim) — identity link independent of
    // the user's email, so local ↔ google merges never collide.
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
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
      default: function (this: IUser) {
        return this.authProviders.includes("google");
      },
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser, UserModel>("User", userSchema);

export default User;
