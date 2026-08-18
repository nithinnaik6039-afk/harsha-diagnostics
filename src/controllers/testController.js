import Test from '../models/Test.js';
import ChatbotFAQ from '../models/ChatbotFAQ.js';

/**
 * Retrieve diagnostic tests catalog
 * GET /api/tests
 */
export const getTests = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { isActive: true };

    // Apply category filter
    if (category) {
      query.category = category;
    }

    // Apply search query (fuzzy matching on name or description)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tests = await Test.find(query);

    return res.status(200).json({
      success: true,
      count: tests.length,
      data: tests
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Retrieve chatbot FAQs
 * GET /api/chatbot-faqs
 */
export const getChatbotFAQs = async (req, res) => {
  try {
    const faqs = await ChatbotFAQ.find({ isActive: true }).sort({ order: 1 });

    return res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new diagnostic test
 * POST /api/tests
 */
export const createTest = async (req, res) => {
  try {
    const { name, category, price, sampleType, fastingRequirement, turnaroundTime, description } = req.body;
    
    if (!name || !category || price === undefined || !sampleType) {
      return res.status(400).json({ success: false, message: 'Name, category, price, and sampleType are required' });
    }

    const test = await Test.create({
      name,
      category,
      price,
      sampleType,
      fastingRequirement: fastingRequirement || 'No Fasting',
      turnaroundTime: turnaroundTime || '24 Hours',
      description,
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Test created successfully',
      data: test
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update an existing diagnostic test
 * PUT /api/tests/:id
 */
export const updateTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Test updated successfully',
      data: test
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete (or deactivate) a diagnostic test
 * DELETE /api/tests/:id
 */
export const deleteTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
