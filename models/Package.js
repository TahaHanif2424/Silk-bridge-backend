const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  region: { type: String },
  duration: { type: Number },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Challenging'] },
  retailPrice: { type: Number },
  baseNetCost: { type: Number },
  inventory: { type: Number },
  active: { type: Boolean, default: true },
  image: { type: String },
  itinerary: [{ type: String }],
}, { timestamps: true });

// module.exports = mongoose.model('Package', packageSchema);
module.exports = {}; // Export empty object for now
