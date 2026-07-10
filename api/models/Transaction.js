import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  type: { type: String, required: true }, // ADD, WITHDRAW, BUY, SELL
  amount: { type: Number, required: true },
  description: { type: String },
  bankId: { type: String },
  platformId: { type: String },
  date: { type: String },
  status: { type: String },
  id: { type: Number, required: true, unique: true } // Keep integer ID for compatibility
});

export default mongoose.model('Transaction', transactionSchema);
