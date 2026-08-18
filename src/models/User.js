import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Home'
  },
  addressLine: {
    type: String,
    required: true
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }
});

const familyMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  relation: {
    type: String,
    required: true
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  password: {
    type: String
  },
  firebaseUid: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: ''
  },
  age: {
    type: Number,
    default: null
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  dob: {
    type: String,
    default: ''
  },
  emergencyContact: {
    type: String,
    default: ''
  },
  profilePic: {
    type: String,
    default: null  // base64 data URI or remote URL
  },
  addresses: [addressSchema],
  familyMembers: [familyMemberSchema],
  expoPushToken: { type: String, default: null }  // Expo push token for notifications
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
export default User;
