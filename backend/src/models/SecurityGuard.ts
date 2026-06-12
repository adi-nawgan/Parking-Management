import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ISecurityGuard extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  status: 'active' | 'deactivated';
  loginAttempts: number;
  lockUntil?: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const securityGuardSchema = new mongoose.Schema<ISecurityGuard>(
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
    status: {
      type: String,
      enum: ['active', 'deactivated'],
      default: 'active',
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
  },
  { timestamps: true }
);

securityGuardSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password as string);
};

securityGuardSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const SecurityGuard: Model<ISecurityGuard> = mongoose.model<ISecurityGuard>('SecurityGuard', securityGuardSchema);
export default SecurityGuard;
