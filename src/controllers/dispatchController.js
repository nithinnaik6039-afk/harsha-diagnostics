import Order from '../models/Order.js';
import Partner from '../models/Partner.js';
import MLT from '../models/MLT.js';
import { findNearbyPartners } from '../utils/geoHelper.js';
import { scorePartner } from '../utils/partnerScoring.js';

/**
 * Assign the best partner/MLT to an order.
 * POST /api/dispatch/assign
 * Body: { orderId }
 */
export const assignPartner = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Safely resolve order coordinates from address or pickupLocation
    let lng = 77.5946;
    let lat = 14.6819;

    if (order.address?.coordinates) {
      if (Array.isArray(order.address.coordinates)) {
        [lng, lat] = order.address.coordinates;
      } else if (order.address.coordinates.lng !== undefined && order.address.coordinates.lat !== undefined) {
        lng = Number(order.address.coordinates.lng);
        lat = Number(order.address.coordinates.lat);
      }
    } else if (order.pickupLocation?.coordinates) {
      [lng, lat] = order.pickupLocation.coordinates;
    }

    let assignedId = null;
    let assignedName = null;

    // 1. Try finding nearby partners
    const nearbyPartners = await findNearbyPartners(lng, lat, 50000); // 50km radius
    if (nearbyPartners && nearbyPartners.length > 0) {
      const scored = nearbyPartners.map((p) => ({
        partner: p,
        score: scorePartner(p, { lng, lat })
      }));
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0].partner;
      assignedId = best._id;
      assignedName = best.name;
      order.assignedPartnerId = best._id;
    } else {
      // 2. Fallback to available MLT
      const availableMLT = await MLT.findOne({ isOnline: true }) || await MLT.findOne();
      if (availableMLT) {
        assignedId = availableMLT._id;
        assignedName = availableMLT.name;
        order.assignedMLT = availableMLT._id;
      }
    }

    if (!assignedId) {
      return res.status(404).json({ success: false, message: 'No phlebotomists or partners available' });
    }

    // Update order status to match schema enum
    order.status = 'Assigned';
    order.statusTimeline.push({
      status: 'Assigned',
      timestamp: new Date()
    });
    await order.save();

    // Notify via Socket.io if configured
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`order_${orderId}`).emit('partner-assigned', { partnerId: assignedId, partnerName: assignedName });
      }
    } catch (socketErr) {
      console.warn('[Socket] Could not broadcast partner-assigned:', socketErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Partner assigned successfully`,
      partnerId: assignedId,
      partnerName: assignedName,
      status: order.status
    });
  } catch (err) {
    console.error('Dispatch assign error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
