const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  license: { type: String, required: true },
  targetVolume: { type: String },
  email: { type: String, required: true },
  tier: { type: String, default: 'silver' },
  status: { type: String, default: 'pending' },
}, { timestamps: true });

// module.exports = mongoose.model('Company', companySchema);
module.exports = {}; // Export empty object for now, using mock array in controller
