import mongoose from 'mongoose';

const CertificateSchema = new mongoose.Schema({
  mlt: { type: mongoose.Schema.Types.ObjectId, ref: 'MLT', required: true },
  title: { type: String, required: true },
  imageUrl: { type: String, required: true }, // stored URL or base64
  issuedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Certificate', CertificateSchema);
