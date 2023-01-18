const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const helpers = require('../helpers/util')
const saltRounds = 10;

module.exports = function (db) {

  router.get('/index', helpers.isLoggedIn, function (req, res, next) {
    res.render('index', { user: req.session.user });
  });

  
  return router;
}
