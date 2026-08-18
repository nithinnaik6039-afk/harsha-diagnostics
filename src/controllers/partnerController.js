// src/controllers/partnerController.js
import Partner from '../models/Partner.js';
import Order from '../models/Order.js';

// Register a new delivery partner
export const registerPartner = async (req, res) => {
  try {
    const { name, email, phone, location } = req.body;
    const existing = await Partner.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Partner with this email already exists' });
    }
    const partner = new Partner({ name, email, phone, location });
    await partner.save();
    res.status(201).json({ success: true, data: partner });
  } catch (err) {
    console.error('[Partner] register error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get partner's pending orders (orders not yet assigned to any MLT)
export const getPartnerOrders = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    const orders = await Order.find({ assignedMLT: null, status: { $in: ['Booked', 'Assigned'] } })
      .populate('customer', 'name email')
      .populate('tests');
    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    console.error('[Partner] get orders error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update partner earnings (called after successful payment)
export const updatePartnerEarnings = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { amount } = req.body;
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    partner.earnings += amount;
    await partner.save();
    res.status(200).json({ success: true, data: partner });
  } catch (err) {
    console.error('[Partner] earnings update error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
