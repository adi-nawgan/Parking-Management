import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IMember extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  buildingNumber: number;
  flatNumber: string;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const memberSchema = new mongoose.Schema<IMember>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    buildingNumber: {
      type: Number,
      required: true,
      min: 28,
      max: 37,
    },
    flatNumber: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

memberSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password as string);
};

memberSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Member: Model<IMember> = mongoose.model<IMember>('Member', memberSchema);
export default Member;
