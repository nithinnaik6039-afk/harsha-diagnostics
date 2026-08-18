// src/controllers/certificateController.js
import Certificate from '../models/Certificate.js';
import MLT from '../models/MLT.js';

// Get certificates for a given MLT
export const getCertificatesByMlt = async (req, res) => {
  try {
    const { mltId } = req.params;
    const mlt = await MLT.findById(mltId);
    if (!mlt) {
      return res.status(404).json({ success: false, message: 'MLT not found' });
    }
    const certificates = await Certificate.find({ mlt: mltId }).select('-__v');
    res.status(200).json({ success: true, data: certificates });
  } catch (err) {
    console.error('[Certificate] get error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
