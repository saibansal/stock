import mongoose from 'mongoose';

const platformSchema = new mongoose.Schema({
  platformName: { type: String, required: true },
  url: { type: String },
  description: { type: String },
  id: { type: Number, required: true, unique: true }, // Keep integer ID for compatibility
  status: { type: String }
});

export default mongoose.model('Platform', platformSchema);
