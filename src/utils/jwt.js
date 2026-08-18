import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'harsha_diagnostics_secret_key_2026';

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
