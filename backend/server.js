require('dotenv').config();
const app =
  require('./src/app');

const {
  connectDatabase
} =
  require('./src/config/database');

const PORT =
  process.env.PORT || 3001;

/**
 * Starts Dash only after MongoDB is available.
 *
 * This prevents the API from accepting requests
 * while persistence is unavailable.
 */
async function startServer() {
  try {
    await connectDatabase();

    app.listen(
      PORT,
      () => {
        console.log(
          `Dash Around Universe backend running on http://localhost:${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      'Failed to start Dash backend:',
      error
    );

    process.exit(1);
  }
}

startServer();