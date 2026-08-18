import Order from '../models/Order.js';
import Test from '../models/Test.js';
import ServiceZone from '../models/ServiceZone.js';
import MLT from '../models/MLT.js';
import User from '../models/User.js';
import { calculateDistance } from '../utils/distance.js';
import { sendPushNotification } from '../utils/pushNotification.js';

// Helper to generate a random 4-digit safety PIN
const generateSafetyPin = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Create a new blood sample collection booking
 * POST /api/orders
 */
export const createOrder = async (req, res) => {
  try {
    const { patient, tests, address, slot, paymentMethod } = req.body;
    const customerId = req.user.id; // From protect middleware

    // 1. Validation
    if (!patient || !patient.name || !patient.age || !patient.gender) {
      return res.status(400).json({ success: false, message: 'Patient details (name, age, gender) are required' });
    }
    if (!tests || !Array.isArray(tests) || tests.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one test or package must be selected' });
    }
    if (!address || !address.addressLine || !address.coordinates || address.coordinates.lat === undefined || address.coordinates.lng === undefined) {
      return res.status(400).json({ success: false, message: 'Full address and geo-coordinates are required' });
    }
    if (!slot || !slot.date || !slot.time) {
      return res.status(400).json({ success: false, message: 'Collection time slot (date and time window) is required' });
    }
    if (!paymentMethod || !['UPI', 'Card', 'CashOnCollection'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Valid payment method is required' });
    }

    // 2. Fetch service zone rules (fall back to defaults if not found in DB)
    let zone = await ServiceZone.findOne({ isActive: true });
    if (!zone) {
      zone = {
        centerCoordinates: { lat: 14.6819, lng: 77.6006 },
        radiusKm: 5.0,
        freeRadiusKm: 3.0,
        extraChargeAmount: 20.0
      };
    }

    // 3. Distance Check
    const distance = calculateDistance(
      zone.centerCoordinates.lat,
      zone.centerCoordinates.lng,
      address.coordinates.lat,
      address.coordinates.lng
    );

    if (distance > zone.radiusKm) {
      return res.status(400).json({
        success: false,
        outsideZone: true,
        message: `Your location is outside our home-collection zone (distance: ${distance} km from center, limit: ${zone.radiusKm} km). You can join our waitlist or visit the diagnostic center in-person.`
      });
    }

    // 4. Calculate collection charges
    let collectionCharge = 0;
    if (distance > zone.freeRadiusKm) {
      collectionCharge = zone.extraChargeAmount;
    }

    // 5. Calculate tests total amount
    const dbTests = await Test.find({ _id: { $in: tests } });
    if (dbTests.length !== tests.length) {
      return res.status(400).json({ success: false, message: 'One or more selected tests are invalid or inactive' });
    }

    const testsSubtotal = dbTests.reduce((sum, test) => sum + test.price, 0);
    const totalAmount = testsSubtotal + collectionCharge;

    // 6. Generate safety verification PIN
    const safetyPin = generateSafetyPin();

    // 7. Save Order
    const order = await Order.create({
      customer: customerId,
      patient,
      tests,
      address,
      slot,
      status: 'Booked',
      payment: {
        method: paymentMethod,
        status: 'Pending',
        amount: totalAmount
      },
      safetyPin,
      distanceFromCenter: distance,
      collectionCharge
    });

    // Start automated dispatch to closest online MLT
    const io = req.app.get('io');
    attemptDispatch(order._id, io);

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Retrieve specific booking details
 * GET /api/orders/:id
 */
export const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('tests', 'name price category sampleType fastingRequirement turnaroundTime')
      .populate('assignedMLT', 'name phone photoUrl rating');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization: User must be either the Customer who made the booking, the assigned MLT, or an Admin
    const customerIdStr = order.customer ? (order.customer._id ? order.customer._id.toString() : order.customer.toString()) : null;
    const isCustomer = customerIdStr === req.user.id;
    const isAssignedMLT = order.assignedMLT && (order.assignedMLT._id ? order.assignedMLT._id.toString() : order.assignedMLT.toString()) === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isAssignedMLT && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this booking' });
    }

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get bookings for the logged-in user (Customer personal, MLT assigned, or Admin all)
 * GET /api/orders
 */
export const getMyOrders = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      query = { customer: req.user.id };
    } else if (req.user.role === 'mlt') {
      query = { $or: [{ assignedMLT: req.user.id }, { status: 'Booked' }] };
    } else if (req.user.role === 'admin') {
      query = {}; // Admin retrieves all orders
    }

    const orders = await Order.find(query)
      .populate('customer', 'name phone email')
      .populate('assignedMLT', 'name phone rating photoUrl')
      .populate('tests', 'name price category sampleType')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update order status based on the state machine rules
 * PATCH /api/orders/:id/status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, safetyPin, mltId, reportUrl } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const currentStatus = order.status;
    const allowedTransitions = {
      'Booked': ['Assigned', 'Cancelled'],
      'Assigned': ['Assigned', 'OnTheWay', 'Cancelled'],
      'OnTheWay': ['Arrived', 'Cancelled'],
      'Arrived': ['Collected', 'Cancelled'],
      'Collected': ['Submitted'],
      'Submitted': ['ReportReady'],
      'ReportReady': [],
      'Cancelled': []
    };

    if (!allowedTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${status}`
      });
    }

    // Assigning MLT phlebotomist
    if (status === 'Assigned') {
      if (!mltId) {
        return res.status(400).json({ success: false, message: 'mltId is required to assign a phlebotomist' });
      }
      order.assignedMLT = mltId;
    }

    // Safety PIN verification on arrival
    if (status === 'Arrived') {
      if (!safetyPin) {
        return res.status(400).json({ success: false, message: 'Safety PIN is required for arrival verification' });
      }
      if (order.safetyPin !== safetyPin) {
        return res.status(400).json({ success: false, message: 'Incorrect safety PIN code' });
      }
    }

    // Attaching PDF lab reports
    if (status === 'ReportReady') {
      if (!reportUrl) {
        return res.status(400).json({ success: false, message: 'Report URL is required to complete the booking' });
      }
      order.reports.push(reportUrl);
      order.payment.status = 'Paid'; // Mark as paid once report is uploaded
    }

    order.status = status;
    order.statusTimeline.push({ status, timestamp: new Date() });
    await order.save();

    // === Send Push Notifications Asynchronously ===
    // Don't block the API response; run in background
    (async () => {
      try {
        const orderDoc = await Order.findById(order._id).populate('customer').populate('assignedMLT');
        if (!orderDoc) return;
        
        const customerToken = orderDoc.customer?.expoPushToken;
        const mltToken = orderDoc.assignedMLT?.expoPushToken;

        if (status === 'Assigned' && customerToken) {
          await sendPushNotification(
            customerToken,
            'Technician Assigned',
            `Phlebotomist ${orderDoc.assignedMLT?.name || 'your technician'} has been assigned to your booking.`,
            { screen: 'Track', orderId: order._id }
          );
        } else if (status === 'OnTheWay' && customerToken) {
          await sendPushNotification(
            customerToken,
            'Technician on the way! 🛵',
            `Your phlebotomist is en route to collect the sample.`,
            { screen: 'Track', orderId: order._id }
          );
        } else if (status === 'Arrived' && customerToken) {
          await sendPushNotification(
            customerToken,
            'Technician Arrived 📍',
            `Please share your safety PIN ${orderDoc.safetyPin} with the technician.`,
            { screen: 'Track', orderId: order._id }
          );
        } else if (status === 'ReportReady' && customerToken) {
          await sendPushNotification(
            customerToken,
            'Report is Ready 🎉',
            'Your diagnostic report is now available to view and download.',
            { screen: 'Track', orderId: order._id }
          );
        }
      } catch (err) {
        console.error('Failed to send push notification:', err.message);
      }
    })();

    return res.status(200).json({
      success: true,
      message: `Booking status transitioned successfully to ${status}`,
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Decline an incoming collection offer
 * POST /api/orders/:id/decline
 */
export const declineOrder = async (req, res) => {
  try {
    const { mltId } = req.body;
    const orderId = req.params.id;

    if (!mltId) {
      return res.status(400).json({ success: false, message: 'mltId is required to decline' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Add MLT to declined list
    const currentDeclined = (order.declinedMLTs || []).map(id => id.toString());
    if (!currentDeclined.includes(mltId.toString())) {
      order.declinedMLTs.push(mltId);
      await order.save();
    }

    console.log(`[Dispatcher] Phlebotomist ${mltId} declined order ${orderId}. Re-routing...`);

    // Re-route to the next closest MLT immediately
    const io = req.app.get('io');
    attemptDispatch(orderId, io);

    return res.status(200).json({
      success: true,
      message: 'Decline recorded, routing to next phlebotomist'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Proximity Dispatcher Engine
 */
export const attemptDispatch = async (orderId, io) => {
  try {
    const order = await Order.findById(orderId);
    if (!order || order.status !== 'Booked') {
      console.log(`[Dispatcher] Order ${orderId} is no longer Booked. Skipping dispatch.`);
      return;
    }

    // Find all online MLTs
    const onlineMlts = await MLT.find({ isOnline: true });
    
    // Filter out MLTs that have declined this order
    const declinedIds = (order.declinedMLTs || []).map(id => id.toString());
    const eligibleMlts = onlineMlts.filter(mlt => {
      return !declinedIds.includes(mlt._id.toString());
    });

    if (eligibleMlts.length === 0) {
      console.log(`[Dispatcher] No eligible online phlebotomists found for order ${orderId}`);
      if (io) {
        io.emit('order-unassigned', { orderId: order._id });
      }
      return;
    }

    // Calculate distance from each eligible MLT's coordinates to the order address
    const mltsWithDistance = eligibleMlts.map(mlt => {
      const mltCoords = mlt.location?.coordinates || [77.6006, 14.6819]; // Default [lng, lat]
      const dist = calculateDistance(
        order.address.coordinates.lat,
        order.address.coordinates.lng,
        mltCoords[1], // lat
        mltCoords[0]  // lng
      );
      return { mlt, dist };
    });

    // Sort by proximity (closest first)
    mltsWithDistance.sort((a, b) => a.dist - b.dist);
    const targetMlt = mltsWithDistance[0].mlt;

    console.log(`[Dispatcher] Offering order ${orderId} to nearest online MLT ${targetMlt.name} (${mltsWithDistance[0].dist.toFixed(2)} km)`);

    // Emit event via Socket.io
    if (io) {
      io.to(`mlt_${targetMlt._id}`).emit('incoming-order', {
        orderId: order._id,
        patient: order.patient,
        tests: order.tests,
        address: order.address,
        slot: order.slot,
        timeoutMs: 45000
      });
      // Emit general update
      io.emit('job-offered', { orderId: order._id, mltId: targetMlt._id });
    }

    // Send push notification to MLT
    if (targetMlt.expoPushToken) {
      sendPushNotification(
        targetMlt.expoPushToken,
        '🚨 New Collection Job',
        `New booking for ${order.patient?.name} at ${order.slot?.time}. Tap to accept!`,
        { screen: 'Jobs', orderId: order._id }
      );
    }

    // Start 45-second timeout
    setTimeout(async () => {
      try {
        const checkOrder = await Order.findById(orderId);
        // If order is still 'Booked' and not assigned to anyone, it timed out!
        if (checkOrder && checkOrder.status === 'Booked' && !checkOrder.assignedMLT) {
          console.log(`[Dispatcher] Order ${orderId} timed out for MLT ${targetMlt.name}. Re-routing...`);
          
          const currentTimeoutDeclined = (checkOrder.declinedMLTs || []).map(id => id.toString());
          if (!currentTimeoutDeclined.includes(targetMlt._id.toString())) {
            checkOrder.declinedMLTs.push(targetMlt._id);
            await checkOrder.save();
          }

          // Recursive call to attempt dispatching to next closest
          attemptDispatch(orderId, io);
        }
      } catch (err) {
        console.error('[Dispatcher] Error in timeout callback:', err.message);
      }
    }, 45000);

  } catch (err) {
    console.error('[Dispatcher] Error in attemptDispatch:', err.message);
  }
};
