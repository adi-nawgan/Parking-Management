import mongoose, { Document, Model, Types } from 'mongoose';

export interface IVisitorDetails {
  name?: string;
  flatVisited?: string;
  purpose?: string;
}

export interface ICurrentlyParked extends Document {
  plate: string;
  residentId?: Types.ObjectId;
  visitorDetails?: IVisitorDetails;
  type: 'resident' | 'tenant' | 'visitor';
  flatNumber: string;
  buildingNumber: number;
  entryTime: Date;
  overstayAlertSent: boolean;
}

const currentlyParkedSchema = new mongoose.Schema<ICurrentlyParked>(
  {
    plate: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
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
      default: Date.now,
    },
    overstayAlertSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

currentlyParkedSchema.index({ flatNumber: 1 });

const CurrentlyParked: Model<ICurrentlyParked> = mongoose.model<ICurrentlyParked>('CurrentlyParked', currentlyParkedSchema);
export default CurrentlyParked;
