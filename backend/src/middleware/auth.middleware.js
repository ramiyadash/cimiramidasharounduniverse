const jwt =
  require('jsonwebtoken');

const User =
  require('../models/user.model');

const SESSION_COOKIE =
  'dash_session';

/**
 * Protects endpoints that require a signed-in user.
 */
module.exports =
  async function requireAuth(
    req,
    res,
    next
  ) {
    try {
      const token =
        req.cookies?.[
          SESSION_COOKIE
        ];

      if (!token) {
        return res.status(401).json({
          message:
            'Authentication is required.'
        });
      }

      const payload =
        jwt.verify(
          token,

          process.env.JWT_SECRET,

          {
            issuer:
              'dash-around-universe',

            audience:
              'dash-around-universe-client'
          }
        );

      const user =
        await User.findOne({
          _id:
            payload.sub,

          status:
            'active'
        });

      if (!user) {
        return res.status(401).json({
          message:
            'The authenticated user was not found.'
        });
      }

      req.user =
        user;

      return next();
    } catch (error) {
      return res.status(401).json({
        message:
          'Your session is invalid or expired.'
      });
    }
  };