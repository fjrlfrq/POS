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
      if (err) return console.log('gagal ambil data', err);
      res.render('Users/user', { daftar: data.rows, user: req.session.user })
    })
  });

  // router.get('/add', helpers.isLoggedIn, function (req, res, next) {
  //   res.render('Users/add', { user: req.session.user });
  // });

  router.get('/add', function (req, res, next) {
    res.render('Users/add', { user: req.session.user });
  });

  router.post('/add', function (req, res, next) {
    const { emails, names, passwords, roles } = req.body
    bcrypt.hash(passwords, saltRounds, function (err, hash) {
      if (err) return console.log('gagal masukkan data', err);
      db.query('INSERT INTO users (email, name, password, role) VALUES ($1, $2, $3, $4)', [emails, names, hash, roles], (err, data) => {
        if (err) return console.log('gagal masukkan data', err);
        res.redirect('/user')
      })
    })
  });

  router.get('/delete/:id', function (req, res, next) {
    const index = req.params.id
    db.query(`DELETE FROM users WHERE userid=$1`, [index], (err) => {
      if (err) return console.log('gagal ambil data', err)
      res.redirect('/user')
    })
  })

  router.get('/edit', helpers.isLoggedIn, function (req, res, next) {
    res.render('Users/edit', { user: req.session.user });
  });

  return router;
}
