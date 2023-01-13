const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const helpers = require('../helpers/util')
const saltRounds = 10;


module.exports = function (db) {

  router.get('/', function (req, res, next) {
    res.render('login', { info: req.flash('info') });
  });

  router.post('/', function (req, res, next) {
    const { email, name, password, role } = req.body
    db.query('SELECT * FROM users where email = $1', [email], (err, data) => {
      if (err) return res.send('email ', err)

      if (data.rows.length == 0) {
        req.flash('info', 'Email tidak terdaftar')
        return res.redirect('/')
      }

      bcrypt.compare(password, data.rows[0].password, function (err, result) {
        if (err) return res.send(err)

        if (!result) {
          req.flash('info', 'Password salah')
          return res.redirect('/')
        }

        req.session.user = data.rows[0]
        res.redirect('/index')
      });
    });
  });

  router.get('/register', function (req, res, next) {
    res.render('register');
  });

  router.post('/register', function (req, res, next) {
    const { email, name, password, role } = req.body
    db.query('SELECT * FROM users where email = $1', [email], (err, data) => {
      if (err) return res.send('email ', err)

      if (data.rows.length > 0) return res.send('email sudah terdaftar')

      bcrypt.hash(password, saltRounds, function (err, hash) {
        if (err) return res.send(err)
        db.query('INSERT INTO users (email, name, password, role) VALUES ($1, $2, $3, $4)', [email, name, hash, role], (err, data) => {
          if (err) return res.send('password ', err)
          res.redirect('/')
        })
      });
    })
  });

  router.get('/logout', helpers.isLoggedIn, function (req, res, next) {
    req.session.destroy(function (err) {
      res.redirect('/');
    })
  });

  router.get('/index', helpers.isLoggedIn, function (req, res, next) {
    res.render('index', { user: req.session.user });
  });

  router.get('/user', helpers.isLoggedIn, function (req, res, next) {
    res.render('user', { user: req.session.user });
  });

  return router;
}
