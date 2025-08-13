const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  const token = event.queryStringParameters.token;
  if (!token) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Missing token' })
    };
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET_KEY);
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'Valid' })
    };
  } catch (e) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Invalid or expired token' })
    };
  }
};