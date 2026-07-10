import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  buyPrice: { type: Number, required: true },
  buyDate: { type: String, required: true },
  platformId: { type: String, required: true },
  id: { type: Number, required: true, unique: true }, // Keep integer ID for compatibility
  sellPrice: { type: Number },
  sellDate: { type: String },
  status: { type: String }
});

export default mongoose.model('Trade', tradeSchema);
