import mongoose from 'mongoose';
import { createSmartModel } from './smartModel.js';

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

const ChatbotFAQMongoose = mongoose.models.ChatbotFAQ || mongoose.model('ChatbotFAQ', chatbotFAQSchema);
const ChatbotFAQ = createSmartModel('ChatbotFAQ', ChatbotFAQMongoose, 'chatbotFaqs');

export default ChatbotFAQ;
