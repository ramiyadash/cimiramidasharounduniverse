const mongoose = require('mongoose');

/**
 * Opens the MongoDB connection used by Dash.
 *
 * The connection URI must come from the backend environment.
 * It should never be hardcoded into frontend or Android code.
 */
exports.connectDatabase = async function () {
  const mongoUri =
    process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error(
      'MONGO_URI is not configured'
    );
  }

  await mongoose.connect(
    mongoUri
  );

  console.log(
    'MongoDB connected successfully'
  );
};