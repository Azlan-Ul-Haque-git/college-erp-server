export const notFound = (req, res, next) => { const err = new Error(`Route Not Found: ${req.originalUrl}`); res.status(404); next(err); };
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({ success:false, message: err.message, stack: process.env.NODE_ENV==="production"?null:err.stack });
};
