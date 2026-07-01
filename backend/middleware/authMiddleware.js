import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  let authHeaderToken = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    authHeaderToken = req.headers.authorization.split(' ')[1];
  }

  // Retrieve token from cookie or Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;

    // CSRF Protection: For state-changing methods, if using cookie-based auth,
    // verify that the request includes the matching Authorization header.
    // Attacking pages cannot set custom request headers for cross-origin fetches.
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      if (!authHeaderToken || authHeaderToken !== token) {
        res.status(403);
        return next(new Error('CSRF Warning: State-changing request blocked due to missing or mismatched authorization header.'));
      }
    }
  } else if (authHeaderToken) {
    token = authHeaderToken;
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_iitgn_wiki_token_key_12938472');
    
    // Find user and select password = false
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized, user not found'));
    }
    
    next();
  } catch (error) {
    console.error(error);
    res.status(401);
    return next(new Error('Not authorized, token verification failed'));
  }
};
