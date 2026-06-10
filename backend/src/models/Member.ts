import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IMember extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  buildingNumber: number;
  flatNumber: string;
  loginAttempts: number;
  lockUntil?: Date;
  status: 'active' | 'deactivated';
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
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
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
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'deactivated'],
      default: 'active',
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
