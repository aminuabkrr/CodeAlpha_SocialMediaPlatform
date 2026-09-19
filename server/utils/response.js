const success = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data, message });
};

const failure = (res, message = 'Something went wrong', statusCode = 400, errors = []) => {
  return res.status(statusCode).json({ success: false, message, errors });
};

module.exports = { success, failure };
