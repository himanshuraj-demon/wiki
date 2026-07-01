import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Revision from '../models/Revision.js';
import Article from '../models/Article.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get all users
// @route   GET /users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ joinedDate: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PATCH /users/:id
// @access  Private
export const updateUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    // Check ownership or admin
    const isOwner = req.user._id.toString() === user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      res.status(403);
      return next(new Error('Not authorized to update this profile'));
    }

    // If updating role or badges, must be Admin
    if ((req.body.role || req.body.badges) && !isAdmin) {
      res.status(403);
      return next(new Error('Only Admins can update roles or badges'));
    }

    // Capture old role for notification
    const oldRole = user.role;

    // Fields that user is allowed to update
    const allowedUserFields = ['name', 'avatar', 'bio', 'department', 'batch', 'interests'];
    
    if (isOwner) {
      allowedUserFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          if (field === 'interests' && typeof req.body.interests === 'string') {
            user.interests = req.body.interests.split(',').map((i) => i.trim());
          } else {
            user[field] = req.body[field];
          }
        }
      });
    }

    // Fields that admin is allowed to update
    if (isAdmin) {
      if (req.body.role) user.role = req.body.role;
      if (req.body.badges) {
        user.badges = Array.isArray(req.body.badges) 
          ? req.body.badges 
          : req.body.badges.split(',').map((b) => b.trim());
      }
    }

    await user.save();

    // If role changed, create notification
    if (req.body.role && req.body.role !== oldRole) {
      await Notification.create({
        recipient: user._id,
        type: 'RoleChanged',
        message: `Your account role has been updated to ${req.body.role} by an Administrator.`,
        link: '/dashboard',
        sender: req.user._id,
      });

      await AuditLog.create({
        action: 'CHANGE_ROLE',
        performedBy: req.user._id,
        targetType: 'User',
        targetId: user._id,
        details: `Updated role of "${user.name}" (${user.email}) from ${oldRole} to ${req.body.role}`,
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    // Check if trying to delete self
    if (req.user._id.toString() === user._id.toString()) {
      res.status(400);
      return next(new Error('Admins cannot delete their own account from user list'));
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile by email (Public)
// @route   GET /users/profile/:email
// @access  Public
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select('-password');
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    // Fetch articles count by this user
    const articlesCount = await Article.countDocuments({ author: user._id, status: 'Approved' });
    const editsCount = await Revision.countDocuments({ editor: user._id });

    res.status(200).json({
      success: true,
      user,
      stats: {
        articlesCount,
        editsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

