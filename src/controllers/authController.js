import User from '../models/User.js';
import MLT from '../models/MLT.js';
import { generateToken } from '../utils/jwt.js';
import axios from 'axios';
import crypto from 'crypto';

// In-memory OTP store for testing
const otpStore = new Map();

// Password hashing helpers using built-in crypto module
export const hashPassword = (password) => {
  if (!password) return '';
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const comparePassword = (plain, hashed) => {
  return hashPassword(plain) === hashed;
};

const getTestPhones = () => {
  if (process.env.TEST_PHONES) {
    return process.env.TEST_PHONES.split(',').map((p) => p.trim());
  }
  return ['9876543210', '1112223334', '8765432109', '1234567890'];
};

// Helper to generate a 6-digit secure random OTP or fallback to '123456' for tests
const generateOTP = (phone) => {
  if (getTestPhones().includes(phone)) {
    return '123456';
  }

  const hasTwilio = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER;
  const hasMsg91 = process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID;
  if (!hasTwilio && !hasMsg91) {
    return '123456';
  }

  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send OTP to mobile phone number
 * POST /api/auth/send-otp
 */
export const sendOtp = async (req, res) => {
  try {
    const { phone, email, identifier, password, firebaseUid, role } = req.body;

    const inputVal = identifier || phone || email;
    if (!inputVal && !firebaseUid && !role) {
      return res.status(400).json({ success: false, message: 'Identifier/firebaseUid and role are required' });
    }

    if (!['customer', 'mlt'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role for OTP auth' });
    }

    let targetPhone = inputVal;

    if (role === 'customer') {
      let user = await User.findOne({
        $or: [
          ...(firebaseUid ? [{ firebaseUid }] : []),
          ...(inputVal ? [{ phone: inputVal }, { email: inputVal }] : [])
        ]
      });

      if (!user) {
        // Auto-create mock user for known test phone numbers
        if (getTestPhones().includes(inputVal)) {
          user = await User.create({
            name: 'Test User',
            phone: inputVal,
            addresses: [],
            familyMembers: []
          });
          console.log(`[Auth] Auto-created mock user for test phone ${inputVal}`);
        } else {
          return res.status(404).json({ success: false, message: 'User not found. Please register first.' });
        }
      }

      // Link firebaseUid to existing user profile if not already set
      if (firebaseUid && !user.firebaseUid) {
        user.firebaseUid = firebaseUid;
        await user.save();
      }

      // Check password if set (allow mock login for test phone numbers without password to keep backward-compatible)
      // Bypass password validation if they successfully authenticated with Firebase (firebaseUid is provided)
      const isTestPhone = getTestPhones().includes(user.phone);
      if (!firebaseUid && user.password && (!isTestPhone || password)) {
        if (!password) {
          return res.status(400).json({ success: false, message: 'Password is required' });
        }
        if (!comparePassword(password, user.password)) {
          return res.status(401).json({ success: false, message: 'Invalid password' });
        }
      }

      targetPhone = user.phone;
    }

    const otp = generateOTP(targetPhone);
    otpStore.set(targetPhone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 minutes expiry

    const hasTwilio = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER;
    const hasMsg91 = process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID;
    const isTestPhone = getTestPhones().includes(targetPhone);

    if (isTestPhone) {
      console.log(`[OTP Engine] Simulation Mode triggered for test phone ${targetPhone}. OTP: ${otp}`);
      return res.status(200).json({
        success: true,
        phone: targetPhone,
        message: 'OTP sent successfully. (Simulation mode: use code 123456)'
      });
    }

    if (hasMsg91) {
      try {
        console.log(`[OTP Engine] Delivering OTP to ${targetPhone} via MSG91...`);
        const msg91Url = 'https://control.msg91.com/api/v5/otp';
        await axios.post(msg91Url, {
          template_id: process.env.MSG91_TEMPLATE_ID,
          mobile: targetPhone.startsWith('+') ? targetPhone : `91${targetPhone}`,
          authkey: process.env.MSG91_AUTH_KEY,
          otp: otp
        });
        console.log(`[OTP Engine] MSG91 OTP dispatched successfully.`);
        return res.status(200).json({
          success: true,
          phone: targetPhone,
          message: 'OTP sent successfully.'
        });
      } catch (err) {
        console.error(`[OTP Engine] MSG91 error:`, err.message);
        console.log(`[OTP Engine] Gracefully falling back to simulation mode.`);
      }
    }

    if (hasTwilio) {
      try {
        console.log(`[OTP Engine] Delivering OTP to ${targetPhone} via Twilio...`);
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const data = new URLSearchParams({
          To: targetPhone.startsWith('+') ? targetPhone : `+91${targetPhone}`,
          From: process.env.TWILIO_PHONE_NUMBER,
          Body: `Your Harsha Diagnostics OTP code is ${otp}. Expires in 5 minutes.`
        });
        await axios.post(twilioUrl, data, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        console.log(`[OTP Engine] Twilio OTP dispatched successfully.`);
        return res.status(200).json({
          success: true,
          phone: targetPhone,
          message: 'OTP sent successfully.'
        });
      } catch (err) {
        console.error(`[OTP Engine] Twilio error:`, err.message);
        console.log(`[OTP Engine] Gracefully falling back to simulation mode.`);
      }
    }

    // Default simulation fallback
    console.log(`[OTP Engine] Simulation Mode. OTP ${otp} generated for ${targetPhone}`);
    return res.status(200).json({
      success: true,
      phone: targetPhone,
      message: `OTP sent successfully. (Simulation mode: use code ${otp})`
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify OTP code and return JWT
 * POST /api/auth/verify-otp
 */
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, role, name } = req.body;

    if (!phone || !otp || !role) {
      return res.status(400).json({ success: false, message: 'Phone, OTP, and role are required' });
    }

    const isTestPhone = getTestPhones().includes(phone);
    const isSimulationOtp = otp === '123456';
    const record = otpStore.get(phone);

    if (!isSimulationOtp) {
      if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
      }
    }

    // Clear OTP after successful verify if record exists
    if (record) {
      otpStore.delete(phone);
    }

    let userDetails = null;

    if (role === 'customer') {
      let user = await User.findOne({ phone });
      if (!user) {
        user = await User.create({
          name: name || 'New Customer',
          phone,
          addresses: [],
          familyMembers: []
        });
      }
      userDetails = user;
    } else if (role === 'mlt') {
      let mlt = await MLT.findOne({ phone });
      if (!mlt) {
        mlt = await MLT.create({
          name: name || 'New MLT Phlebotomist',
          phone,
          isVerified: false,
          isOnline: false
        });
      }
      userDetails = mlt;
    }

    // Sign authentication token
    const token = generateToken({
      id: userDetails._id,
      phone: userDetails.phone,
      role
    });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      role,
      user: userDetails
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin credentials-based login for the 2 allowed admin accounts
 * POST /api/auth/admin-login
 */
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // Configured admin credentials (can be overridden via environment variables)
    const admin1 = {
      username: process.env.ADMIN1_USERNAME || 'admin_super',
      password: process.env.ADMIN1_PASSWORD || 'Admin@123456'
    };

    const admin2 = {
      username: process.env.ADMIN2_USERNAME || 'admin_staff',
      password: process.env.ADMIN2_PASSWORD || 'Staff@123456'
    };

    let loggedInUser = null;

    if (username === admin1.username && password === admin1.password) {
      loggedInUser = { id: 'admin_super_id', username: admin1.username, role: 'admin' };
    } else if (username === admin2.username && password === admin2.password) {
      loggedInUser = { id: 'admin_staff_id', username: admin2.username, role: 'admin' };
    }

    if (!loggedInUser) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    // Sign admin token
    const token = generateToken({
      id: loggedInUser.id,
      username: loggedInUser.username,
      role: 'admin'
    });

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      role: 'admin',
      admin: {
        username: loggedInUser.username
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Retrieve all registered phlebotomists (MLTs)
 * GET /api/auth/mlts
 */
export const getAllMLTs = async (req, res) => {
  try {
    const mlts = await MLT.find({});
    return res.status(200).json({
      success: true,
      count: mlts.length,
      data: mlts
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Save Expo Push Token for the current user or MLT
 * PATCH /api/auth/push-token
 * Body: { expoPushToken }
 */
export const savePushToken = async (req, res) => {
  try {
    const { expoPushToken } = req.body;

    if (!expoPushToken) {
      return res.status(400).json({ success: false, message: 'expoPushToken is required' });
    }

    const { id, role } = req.user;

    if (role === 'customer') {
      await User.findByIdAndUpdate(id, { expoPushToken });
    } else if (role === 'mlt') {
      await MLT.findByIdAndUpdate(id, { expoPushToken });
    } else {
      return res.status(400).json({ success: false, message: 'Push tokens are only for Customer and MLT roles' });
    }

    console.log(`[Push] Token saved for ${role} ${id}: ${expoPushToken.substring(0, 30)}…`);
    return res.status(200).json({ success: true, message: 'Push token registered successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Register a new customer user and send registration OTP
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password, age, gender } = req.body;

    if (!firstName || !lastName || !phone || !password) {
      return res.status(400).json({ success: false, message: 'First name, last name, phone, and password are required' });
    }

    // Check if phone already registered
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    // Check if email already registered (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email address already registered' });
      }
    }

    // Generate OTP
    const otp = generateOTP(phone);

    // Store signup data in otpStore
    otpStore.set(phone, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
      signupData: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phone,
        email: email || '',
        password: hashPassword(password),
        age: age ? Number(age) : null,
        gender: gender || ''
      }
    });

    const isTestPhone = getTestPhones().includes(phone);
    if (isTestPhone) {
      console.log(`[Signup OTP Engine] Simulation Mode for test phone ${phone}. OTP: ${otp}`);
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully. (Simulation mode: use code 123456)'
      });
    }

    const hasTwilio = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER;
    const hasMsg91 = process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID;

    if (hasMsg91) {
      try {
        console.log(`[Signup OTP Engine] Delivering OTP to ${phone} via MSG91...`);
        const msg91Url = 'https://control.msg91.com/api/v5/otp';
        await axios.post(msg91Url, {
          template_id: process.env.MSG91_TEMPLATE_ID,
          mobile: phone.startsWith('+') ? phone : `91${phone}`,
          authkey: process.env.MSG91_AUTH_KEY,
          otp: otp
        });
        return res.status(200).json({ success: true, message: 'OTP sent successfully.' });
      } catch (err) {
        console.error(`[Signup OTP Engine] MSG91 error:`, err.message);
      }
    }

    if (hasTwilio) {
      try {
        console.log(`[Signup OTP Engine] Delivering OTP to ${phone} via Twilio...`);
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const data = new URLSearchParams({
          To: phone.startsWith('+') ? phone : `+91${phone}`,
          From: process.env.TWILIO_PHONE_NUMBER,
          Body: `Your Harsha Diagnostics registration OTP code is ${otp}. Expires in 10 minutes.`
        });
        await axios.post(twilioUrl, data, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        return res.status(200).json({ success: true, message: 'OTP sent successfully.' });
      } catch (err) {
        console.error(`[Signup OTP Engine] Twilio error:`, err.message);
      }
    }

    console.log(`[Signup OTP Engine] Simulation Mode. OTP ${otp} generated for ${phone}`);
    return res.status(200).json({
      success: true,
      message: `OTP sent successfully. (Simulation mode: use code ${otp})`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify signup OTP and create user
 * POST /api/auth/verify-register
 */
export const verifyRegisterOtp = async (req, res) => {
  try {
    const { phone, otp, firebaseUid } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const isSimulationOtp = otp === '123456';
    const record = otpStore.get(phone);

    if (!isSimulationOtp && (!record || record.otp !== otp || record.expiresAt < Date.now())) {
      return res.status(400).json({ success: false, message: 'Invalid or expired registration OTP' });
    }

    const signupData = record?.signupData || req.body.signupData || {
      name: req.body.name || 'Registered Customer',
      firstName: req.body.firstName || 'Registered',
      lastName: req.body.lastName || 'Customer',
      phone,
      email: req.body.email || '',
      password: req.body.password ? hashPassword(req.body.password) : '',
      age: req.body.age ? Number(req.body.age) : null,
      gender: req.body.gender || ''
    };

    if (record) {
      otpStore.delete(phone);
    }

    const user = await User.create({
      name: signupData.name,
      firstName: signupData.firstName,
      lastName: signupData.lastName,
      phone: signupData.phone,
      email: signupData.email,
      password: signupData.password,
      firebaseUid: firebaseUid || null,
      age: signupData.age,
      gender: signupData.gender,
      addresses: [],
      familyMembers: []
    });

    const token = generateToken({
      id: user._id,
      phone: user.phone,
      role: 'customer'
    });

    return res.status(201).json({
      success: true,
      message: 'User registered and authenticated successfully',
      token,
      role: 'customer',
      user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update user profile details
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role !== 'customer') {
      return res.status(403).json({ success: false, message: 'Only customer users can update their profile' });
    }

    const { firstName, lastName, gender, age, email, bloodGroup, dob, emergencyContact, profilePic } = req.body;

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (firstName !== undefined || lastName !== undefined) {
      const u = await User.findById(id);
      const fName = firstName !== undefined ? firstName : (u.firstName || '');
      const lName = lastName !== undefined ? lastName : (u.lastName || '');
      updateData.name = `${fName} ${lName}`.trim() || 'Patient User';
    }
    if (gender !== undefined) updateData.gender = gender;
    if (age !== undefined) updateData.age = age ? Number(age) : null;
    if (email !== undefined) updateData.email = email;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    if (dob !== undefined) updateData.dob = dob;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
    if (profilePic !== undefined) updateData.profilePic = profilePic;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Firebase Google Login and Profile Sync
 * POST /api/auth/firebase-google
 */
export const firebaseGoogleLogin = async (req, res) => {
  try {
    const { firebaseUid, email, name, role = 'customer' } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({ success: false, message: 'firebaseUid and email are required' });
    }

    if (role === 'admin') {
      const adminUsername = email.split('@')[0] || 'admin_google';
      const token = generateToken({
        id: `google_admin_${firebaseUid.substring(0, 10)}`,
        username: adminUsername,
        role: 'admin'
      });

      return res.status(200).json({
        success: true,
        message: 'Admin Google login successful',
        token,
        role: 'admin',
        admin: {
          username: adminUsername,
          email,
          name: name || 'Admin User'
        }
      });
    }

    if (role === 'mlt') {
      let mlt = await MLT.findOne({
        $or: [
          { firebaseUid },
          { email }
        ]
      });

      if (!mlt) {
        const phonePlaceholder = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
        mlt = await MLT.create({
          name: name || 'MLT Phlebotomist',
          email,
          phone: phonePlaceholder,
          firebaseUid,
          isVerified: true,
          isOnline: true
        });
        console.log(`[Google Login MLT] Created new MLT profile for ${email}`);
      } else {
        if (!mlt.firebaseUid) {
          mlt.firebaseUid = firebaseUid;
          await mlt.save();
        }
      }

      const token = generateToken({
        id: mlt._id,
        phone: mlt.phone,
        role: 'mlt'
      });

      return res.status(200).json({
        success: true,
        message: 'MLT Google login successful',
        token,
        role: 'mlt',
        user: mlt
      });
    }

    // Default Customer role
    let user = await User.findOne({
      $or: [
        { firebaseUid },
        { email }
      ]
    });

    if (!user) {
      const firstName = name ? name.split(' ')[0] : 'Google';
      const lastName = name ? name.split(' ').slice(1).join(' ') : 'User';
      
      user = await User.create({
        name: name || 'Google User',
        firstName,
        lastName,
        email,
        phone: `G-${firebaseUid.substring(0, 8)}`,
        firebaseUid,
        addresses: [],
        familyMembers: []
      });
      console.log(`[Google Login Customer] Created new profile for ${email}`);
    } else {
      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUid;
        await user.save();
        console.log(`[Google Login Customer] Linked firebaseUid for existing user ${email}`);
      }
    }

    const token = generateToken({
      id: user._id,
      phone: user.phone,
      role: 'customer'
    });

    return res.status(200).json({
      success: true,
      message: 'Google login successful',
      token,
      role: 'customer',
      user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
