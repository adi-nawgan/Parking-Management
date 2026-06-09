import mongoose, { Document, Model, Types } from 'mongoose';

import { IVisitorDetails } from './CurrentlyParked';

export interface ILog extends Document {
  plate: string;
  type: 'resident' | 'tenant' | 'visitor';
  flatNumber: string;
  buildingNumber: number;
  entryTime: Date;
  exitTime: Date;
  duration: number;
  residentId?: Types.ObjectId;
  visitorDetails?: IVisitorDetails;
}

const logSchema = new mongoose.Schema<ILog>(
  {
    plate: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['resident', 'tenant', 'visitor'],
      required: true,
    },
    flatNumber: {
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
    entryTime: {
      type: Date,
      required: true,
    },
    exitTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    duration: {
      type: Number,
      required: true,
    },
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident',
      default: null,
    },
    visitorDetails: {
      name: { type: String, trim: true },
      flatVisited: { type: String, trim: true },
      purpose: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

logSchema.index({ plate: 1 });
logSchema.index({ flatNumber: 1 });
logSchema.index({ entryTime: 1 });
logSchema.index({ exitTime: 1 });

const Log: Model<ILog> = mongoose.model<ILog>('Log', logSchema);
export default Log;
