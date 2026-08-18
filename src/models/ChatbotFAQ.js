import mongoose from 'mongoose';

const chatbotFAQSchema = new mongoose.Schema({
  question_en: {
    type: String,
    required: true
  },
  question_te: {
    type: String,
    required: true
  },
  answer_en: {
    type: String,
    required: true
  },
  answer_te: {
    type: String,
    required: true
  },
  keywords: {
    type: [String],
    default: []
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const ChatbotFAQ = mongoose.model('ChatbotFAQ', chatbotFAQSchema);
export default ChatbotFAQ;
