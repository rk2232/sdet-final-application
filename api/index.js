// Vercel serverless function entry point
// This file allows Vercel to run the Express app as serverless functions

const app = require('../server');

// Export the Express app as a serverless function
module.exports = (req, res) => {
  // Handle the request
  app(req, res);
};
