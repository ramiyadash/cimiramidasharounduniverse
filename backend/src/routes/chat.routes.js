const express =
  require('express');

const chatController =
  require(
    '../controllers/chat.controller'
  );

const requireAuth =
  require(
    '../middleware/auth.middleware'
  );

const router =
  express.Router();

router.post(
  '/',
  requireAuth,
  chatController.sendMessage
);

module.exports =
  router;