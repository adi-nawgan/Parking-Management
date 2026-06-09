import mongoose, { Document, Model } from 'mongoose';

export interface IVehicle {
  _id?: mongoose.Types.ObjectId;
  plate: string;
  vehicleType: string;
  color: string;
}

export interface IResident extends Document {
  buildingNumber: number;
  flatNumber: string;
  ownerName: string;
  phone: string;
  type: 'resident' | 'tenant';
  vehicles: IVehicle[];
}

const vehicleSchema = new mongoose.Schema<IVehicle>({
  plate: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  vehicleType: {
    type: String,
    required: true,
    default: 'Car',
  },
  color: {
    type: String,
    required: true,
    default: 'Unknown',
  },
});

const residentSchema = new mongoose.Schema<IResident>(
  {
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
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['resident', 'tenant'],
      required: true,
      default: 'resident',
    },
    vehicles: {
      type: [vehicleSchema],
      validate: [(v: IVehicle[]) => v.length <= 3, 'A resident can have at most 3 vehicles'],
    },
  },
  { timestamps: true }
);

residentSchema.index({ flatNumber: 'text', ownerName: 'text', 'vehicles.plate': 'text' });
residentSchema.index({ 'vehicles.plate': 1 });

const Resident: Model<IResident> = mongoose.model<IResident>('Resident', residentSchema);
export default Resident;
