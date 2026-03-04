export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) { res.status(403); throw new Error(`Role '${req.user.role}' not allowed`); }
  next();
};
