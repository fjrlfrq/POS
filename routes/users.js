const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const helpers = require('../helpers/util')
const saltRounds = 10;

module.exports = function (db) {

  router.get('/', function (req, res, next) {
    res.render('user', { info: req.flash('info') });
  });

  router.get('/user', helpers.isLoggedIn, function (req, res, next) {
    db.query('Select * from users', (err, data) => {
      if(err) return console.log('gagal ambil data', err);
      res.render('Users/user', { daftar: data.rows, user: req.session.user })
    })
  });
  
  router.get('/add', helpers.isLoggedIn, function (req, res, next) {
    res.render('Users/add', { user: req.session.user });
  });

  router.get('/edit', helpers.isLoggedIn, function (req, res, next) {
    res.render('Users/edit', { user: req.session.user });
  });

  return router;
}
