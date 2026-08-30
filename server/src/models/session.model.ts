import mongoose from "mongoose";

export interface ISession {
  userId: mongoose.Types.ObjectId;
  device: string;
  browserVersion: string;
  operatingSystem: string;
  ip: string;
  countryCode: string;
  state: string;
  lastActiveAt: Date;
  createdAt: Date;
}

const sessionSchema = new mongoose.Schema<ISession>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      required: true,
    },
    device: {
      type: String,
      default: "unknown",
    },
    browserVersion: {
      type: String,
      default: "unknown",
    },
    operatingSystem: {
      type: String,
      default: "unknown",
    },
    ip: {
      type: String,
      required: true,
    },
    countryCode: {
      type: String,
      default: "unknown",
    },
    state: {
      type: String,
      default: "unknown",
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const Session = mongoose.model<ISession>("Session", sessionSchema);

export default Session;
