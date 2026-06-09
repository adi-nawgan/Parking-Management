import mongoose, { Document, Model } from 'mongoose';

export interface IOverflowLog extends Document {
  timestamp: Date;
  count: number;
  state: 'overflow' | 'full';
}

const overflowLogSchema = new mongoose.Schema<IOverflowLog>({
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  count: {
    type: Number,
    required: true,
  },
  state: {
    type: String,
    enum: ['overflow', 'full'],
    required: true,
  },
});

const OverflowLog: Model<IOverflowLog> = mongoose.model<IOverflowLog>('OverflowLog', overflowLogSchema);
export default OverflowLog;
