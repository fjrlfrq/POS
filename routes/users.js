const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const helpers = require('../helpers/util')
const saltRounds = 10;

/* GET home page. */
module.exports = function (db) {

  router.get('/user', helpers.isLoggedIn,function (req, res, next) {
    res.render('user');
  });

  return router;
}