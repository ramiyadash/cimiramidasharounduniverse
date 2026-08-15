const {
    OAuth2Client
  } =
    require('google-auth-library');
  
  const jwt =
    require('jsonwebtoken');
  
  const User =
    require('../models/user.model');
  
  const SESSION_COOKIE =
    'dash_session';
  
  const SESSION_DURATION =
    7 * 24 * 60 * 60 * 1000;
  
  const googleClient =
    new OAuth2Client(
      process.env.GOOGLE_WEB_CLIENT_ID
    );
  
  function getCookieOptions() {
    const isProduction =
      process.env.NODE_ENV ===
      'production';
  
    return {
      httpOnly: true,
  
      /**
       * secure must be true when the application
       * is served over HTTPS in production.
       */
      secure: isProduction,
  
      /**
       * Helps prevent cross-site request forgery.
       */
      sameSite: 'lax',
  
      maxAge: SESSION_DURATION,
  
      path: '/'
    };
  }
  
  function createSessionToken(user) {
    return jwt.sign(
      {
        sub:
          user._id.toString()
      },
  
      process.env.JWT_SECRET,
  
      {
        expiresIn: '7d',
  
        issuer:
          'dash-around-universe',
  
        audience:
          'dash-around-universe-client'
      }
    );
  }
  
  /**
   * POST /api/auth/google
   *
   * Receives a Google ID token from Angular,
   * verifies it with Google and creates or updates
   * the corresponding Dash user.
   */
  exports.googleLogin =
    async function googleLogin(
      req,
      res,
      next
    ) {
      try {
        const {
          credential
        } = req.body;
  
        if (!credential) {
          return res.status(400).json({
            message:
              'Google credential is required.'
          });
        }
  
        const ticket =
          await googleClient.verifyIdToken({
            idToken:
              credential,
  
            audience:
              process.env
                .GOOGLE_WEB_CLIENT_ID
          });
  
        const payload =
          ticket.getPayload();
  
        if (
          !payload ||
          !payload.sub ||
          !payload.email ||
          payload.email_verified !== true
        ) {
          return res.status(401).json({
            message:
              'Google could not verify this account.'
          });
        }
  
        /**
         * First look for Google's stable subject.
         * Email matching allows an existing seeded
         * account to be linked on its first login.
         */
        let user =
          await User.findOne({
            $or: [
              {
                googleSubject:
                  payload.sub
              },
              {
                email:
                  payload.email.toLowerCase()
              }
            ]
          });
  
        if (user?.status === 'inactive') {
          return res.status(403).json({
            message:
              'This account is inactive.'
          });
        }
  
        if (!user) {
          user =
            new User({
              googleSubject:
                payload.sub,
  
              authProvider:
                'google',
  
              displayName:
                payload.name ||
                payload.email,
  
              email:
                payload.email,
  
              avatarUrl:
                payload.picture ||
                null,
  
              lastLoginAt:
                new Date()
            });
        } else {
          /**
           * Link an existing development user to
           * their verified Google identity.
           */
          user.googleSubject =
            payload.sub;
  
          user.authProvider =
            'google';
  
          user.displayName =
            payload.name ||
            user.displayName;
  
          user.avatarUrl =
            payload.picture ||
            user.avatarUrl;
  
          user.lastLoginAt =
            new Date();
        }
  
        await user.save();
  
        const sessionToken =
          createSessionToken(user);
  
        res.cookie(
          SESSION_COOKIE,
          sessionToken,
          getCookieOptions()
        );
  
        return res.status(200).json({
          user: {
            id:
              user._id.toString(),
  
            displayName:
              user.displayName,
  
            email:
              user.email,
  
            avatarUrl:
              user.avatarUrl
          }
        });
      } catch (error) {
        /**
         * Invalid or expired Google credentials
         * should not become generic server errors.
         */
        if (
          error.message?.includes(
            'Wrong recipient'
          ) ||
          error.message?.includes(
            'Invalid token'
          ) ||
          error.message?.includes(
            'Token used too late'
          )
        ) {
          return res.status(401).json({
            message:
              'Google authentication failed.'
          });
        }
  
        return next(error);
      }
    };
  
  /**
   * Returns the currently authenticated user.
   */
  exports.getCurrentUser =
    function getCurrentUser(
      req,
      res
    ) {
      return res.status(200).json({
        user: {
          id:
            req.user._id.toString(),
  
          displayName:
            req.user.displayName,
  
          email:
            req.user.email,
  
          avatarUrl:
            req.user.avatarUrl
        }
      });
    };
  
  /**
   * Removes the application's session cookie.
   */
  exports.logout =
    function logout(
      req,
      res
    ) {
      res.clearCookie(
        SESSION_COOKIE,
        {
          ...getCookieOptions(),
  
          maxAge:
            undefined
        }
      );
  
      return res.status(200).json({
        message:
          'Signed out successfully.'
      });
    };