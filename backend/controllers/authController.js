import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to generate token and send cookie / response
const sendTokenResponse = (user, statusCode, res) => {
  // Generate token
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'super_secret_iitgn_wiki_token_key_12938472',
    { expiresIn: '30d' }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  // Remove password from response
  const userObj = user.toObject();
  delete userObj.password;

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: userObj,
    });
};

// @desc    Register user (Disabled for Google Auth)
// @route   POST /auth/register
// @access  Public
export const register = async (req, res, next) => {
  res.status(400);
  return next(new Error('Manual registration is disabled. Please sign in using Google.'));
};

// @desc    Login user (Disabled for Google Auth)
// @route   POST /auth/login
// @access  Public
export const login = async (req, res, next) => {
  res.status(400);
  return next(new Error('Manual login is disabled. Please sign in using Google.'));
};

// @desc    Google OAuth Login / Register
// @route   POST /auth/google
// @access  Public
export const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400);
      return next(new Error('Google credential token is required'));
    }

    // Development Bypass for testing without client ID configuration
    const isMockBypass =
      (credential === 'mock-google-token-admin' || 
       credential === 'mock-google-token-student' || 
       credential === 'mock-google-token-moderator') &&
      (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.startsWith('your_google_'));

    let email, name, picture;

    if (isMockBypass) {
      if (credential === 'mock-google-token-admin') {
        email = 'admin@iitgn.ac.in';
        name = 'Admin User';
        picture = '';
      } else if (credential === 'mock-google-token-moderator') {
        email = 'neeldhara.m@iitgn.ac.in';
        name = 'Prof. Neeldhara Misra';
        picture = '';
      } else {
        email = 'student@iitgn.ac.in';
        name = 'Student User';
        picture = '';
      }
    } else {
      // Verify token with Google API Client
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;

      if (!payload.email_verified) {
        res.status(400);
        return next(new Error('Google email is not verified'));
      }
    }

    // Check if user exists in database
    let user = await User.findOne({ email });

    // If user does not exist, create new account
    if (!user) {
      const isFirstUser = (await User.countDocuments({})) === 0;
      const role = isFirstUser ? 'Admin' : 'Student';

      user = await User.create({
        name,
        email,
        avatar: picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        role,
        badges: isFirstUser ? ['Founder', 'Admin'] : ['Novice'],
        bio: 'IITGN Wiki member.',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401);
    return next(new Error('Invalid Google credential token'));
  }
};

// @desc    Logout user / clear cookie
// @route   POST /auth/logout
// @access  Public
export const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // 10 seconds
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
