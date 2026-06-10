import mongoose, { Document, Model, Types } from 'mongoose';

export type ReportType = 'wrongly_parked' | 'took_extra_space' | 'vehicle_damage';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ILocation {
  buildingNumber: number;
  description?: string;
}

export interface IParkingReport extends Document {
  reportedBy: Types.ObjectId;
  plate?: string;
  reportType: ReportType;
  description: string;
  photoUrl?: string;
  location: ILocation;
  status: ReportStatus;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
}

const locationSchema = new mongoose.Schema<ILocation>({
  buildingNumber: {
    type: Number,
    required: true,
    min: 28,
    max: 37,
  },
  description: {
    type: String,
    trim: true,
  },
});

const parkingReportSchema = new mongoose.Schema<IParkingReport>(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    plate: {
      type: String,
      uppercase: true,
      trim: true,
    },
    reportType: {
      type: String,
      enum: ['wrongly_parked', 'took_extra_space', 'vehicle_damage'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    photoUrl: {
      type: String,
    },
    location: {
      type: locationSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  { timestamps: true }
);

parkingReportSchema.index({ status: 1 });
parkingReportSchema.index({ reportedBy: 1 });

const ParkingReport: Model<IParkingReport> = mongoose.model<IParkingReport>('ParkingReport', parkingReportSchema);
export default ParkingReport;
