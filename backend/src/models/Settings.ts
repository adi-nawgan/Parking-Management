import mongoose, { Document, Model } from 'mongoose';

export interface ISettings extends Document {
  totalCapacity: number;
  overflowLimit: number;
  overstayLimit: number;
  adminEmail: string;
}

const settingsSchema = new mongoose.Schema<ISettings>(
  {
    totalCapacity: {
      type: Number,
      required: true,
      default: 60,
    },
    overflowLimit: {
      type: Number,
      required: true,
      default: 68,
    },
    overstayLimit: {
      type: Number,
      required: true,
      default: 1440,
    },
    adminEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

const Settings: Model<ISettings> = mongoose.model<ISettings>('Settings', settingsSchema);
export default Settings;
