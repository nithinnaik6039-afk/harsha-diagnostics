import mongoose from 'mongoose';

const testSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true
  },
  tests: {
    type: [String],
    default: []
  },
  price: {
    type: Number,
    required: true
  },
  sampleType: {
    type: String,
    required: true
  },
  fastingRequirement: {
    type: String
  },
  turnaroundTime: {
    type: String
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Test = mongoose.model('Test', testSchema);
export default Test;
