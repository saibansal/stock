import mongoose from 'mongoose';

const bankSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  openingBalance: { type: String },
  accountNumber: { type: String },
  id: { type: Number, required: true, unique: true } // Keep integer ID for compatibility
});

export default mongoose.model('Bank', bankSchema);
