import { verifyToken } from '../utils/jwt.js';

/**
 * Middleware to protect routes by verifying JWT token
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token is invalid or expired'
    });
  }

  // Attach user identity data to the request object
  req.user = {
    id: decoded.id,
    phone: decoded.phone,
    username: decoded.username,
    role: decoded.role
  };

  next();
};

/**
 * Middleware to restrict route access to specific roles
 * @param {...string} roles - List of allowed roles (e.g. 'customer', 'mlt', 'admin')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'anonymous'}) is not authorized to access this resource`
      });
    }
    next();
  };
};
