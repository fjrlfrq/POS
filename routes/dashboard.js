const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const helpers = require('../helpers/util')
const saltRounds = 10;

module.exports = function (db) {

  router.get('/', helpers.isLoggedIn, function (req, res, next) {
    res.render('Dashboard/index', { user: req.session.user, currentPage: 'POS - Dashboard' });
  });

  
  return router;
}
