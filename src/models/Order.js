import mongoose from 'mongoose';
import crypto from 'crypto';

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patient: {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true }
  },
  tests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  }],
  address: {
    addressLine: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  slot: {
    date: { type: Date, required: true },
    time: { type: String, required: true }
  },
  assignedMLT: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MLT'
  },
  // New assignment for Delivery Partner
  assignedPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner'
  },
  declinedMLTs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MLT'
  }],
  status: {
    type: String,
    enum: ['Booked', 'Assigned', 'OnTheWay', 'Arrived', 'Collected', 'Submitted', 'ReportReady', 'Cancelled'],
    default: 'Booked'
  },
  payment: {
    method: { type: String, enum: ['UPI', 'Card', 'CashOnCollection'], required: true },
    status: { type: String, enum: ['Pending', 'Paid', 'Refunded'], default: 'Pending' },
    amount: { type: Number, required: true },
    transactionId: { type: String },
    razorpayOrderId: { type: String },     // Razorpay Order ID (order_xxx)
    razorpayPaymentId: { type: String }    // Razorpay Payment ID (pay_xxx) after success
  },
  safetyPin: {
    type: String,
    required: true
  },
  distanceFromCenter: {
    type: Number
  },
  collectionCharge: {
    type: Number,
    default: 0
  },
  qrToken: {
    type: String,
    required: true,
    default: () => crypto.randomUUID()
  },
  reports: {
    type: [String],
    default: []
  },
  statusTimeline: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Pre-save hook to push initial status to timeline if timeline is empty
orderSchema.pre('save', function() {
  if (this.statusTimeline.length === 0) {
    this.statusTimeline.push({
      status: this.status,
      timestamp: new Date()
    });
  }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
