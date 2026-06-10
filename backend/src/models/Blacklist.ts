import mongoose, { Document, Model } from 'mongoose';

export interface IBlacklist extends Document {
  token: string;
  createdAt: Date;
}

const blacklistSchema = new mongoose.Schema<IBlacklist>({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '1d', // Automatically deletes the token after 1 day
  },
});

const Blacklist: Model<IBlacklist> = mongoose.model<IBlacklist>('Blacklist', blacklistSchema);
export default Blacklist;
