export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`Role (${req.user.role}) is not authorized to access this resource`));
    }

    next();
  };
};
