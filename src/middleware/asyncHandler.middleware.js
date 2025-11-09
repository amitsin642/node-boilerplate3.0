export const asyncHandler = (fn) => {
  return function asyncUtilWrapper(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
