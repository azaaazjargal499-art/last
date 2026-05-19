// smart-inventory/backend/src/middleware/validate.js
const { validationResult } = require('express-validator');

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map(v => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(422).json({
    error: 'Оролтын өгөгдөл буруу байна',
    details: errors.array().map(e => ({ field: e.path, message: e.msg })),
  });
};

module.exports = validate;
