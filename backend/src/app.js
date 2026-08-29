const express =
  require('express');

const cors =
  require('cors');

const cookieParser =
  require('cookie-parser');

const healthRoutes =
  require('./routes/health.routes');

const chatRoutes =
  require('./routes/chat.routes');

const authRoutes =
  require('./routes/auth.routes');

const journeyRoutes =
  require('./routes/journey.routes');

const errorMiddleware =
  require('./middleware/error.middleware');

const journeyMediaRoutes =
  require('./routes/journey-media.routes');  

const discoverRoutes =
  require('./routes/discover.routes');  

const travelerProfileRoutes =
  require('./routes/traveler-profile.routes');  

const app =
  express();

const allowedOrigins =
  (
    process.env.CLIENT_ORIGINS ||
    'http://localhost:4200'
  )
    .split(',')
    .map(
      origin =>
        origin.trim()
    );

app.use(
  cors({
    credentials: true,

    origin(
      origin,
      callback
    ) {
      /**
       * Requests such as curl do not include
       * an Origin header.
       */
      if (
        !origin ||
        allowedOrigins.includes(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      return callback(
        new Error(
          `Origin ${origin} is not allowed.`
        )
      );
    }
  })
);

app.use(
  express.json()
);

app.use(
  cookieParser()
);

app.use(
  '/api/health',
  healthRoutes
);

app.use(
  '/api/chat',
  chatRoutes
);

app.use(
  '/api/auth',
  authRoutes
);

app.use(
    '/api/journeys',
    journeyRoutes
  );

app.use(
  errorMiddleware
);

app.use(
    '/api/journeys',
    journeyRoutes
  );
  
app.use(
    '/api/journeys',
    journeyMediaRoutes
  );

app.use(
    '/api/discover',
    discoverRoutes
  ); 

app.use(
    '/api/traveler-profile',
    travelerProfileRoutes
  );  
  
app.use(
    errorMiddleware
  );

module.exports =
  app;