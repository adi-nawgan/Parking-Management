import mongoose, { Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  memberId?: mongoose.Types.ObjectId;
  memberName?: string;
  memberFlat?: string;
  actionType: string; // 'plate-lookup' | 'failed-login' | 'logout' etc.
  plateSearched?: string;
  ipAddress: string;
  suspiciousActivity: boolean;
  timestamp: Date;
}

const auditLogSchema = new mongoose.Schema<IAuditLog>(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
    },
    memberName: {
      type: String,
      trim: true,
    },
    memberFlat: {
      type: String,
      trim: true,
    },
    actionType: {
      type: String,
      required: true,
      trim: true,
    },
    plateSearched: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true,
    },
    suspiciousActivity: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
