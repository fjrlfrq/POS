const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { isLoggedIn } = require('../helpers/util')
const saltRounds = 10;

module.exports = function (db) {

  router.get('/', isLoggedIn, function (req, res, next) {
    res.render('Users/user', {user: req.session.user, currentPage: 'POS - Users'});
  });

  router.get('/datatable', async (req, res) => {
    let params = []

    if(req.query.search.value){
        params.push(`email ilike '%${req.query.search.value}%'`)
    }

    if(req.query.search.value){
      params.push(`name ilike '%${req.query.search.value}%'`)
    }

    if(req.query.search.value){
      params.push(`role ilike '%${req.query.search.value}%'`)
    }

    const limit = req.query.length
    const offset = req.query.start
    const sortBy = req.query.columns[req.query.order[0].column].data
    const sortMode = req.query.order[0].dir

    const total = await db.query(`select count(*) as total from users${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
    const data = await db.query(`select * from users${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
    const response = {
        "draw": Number(req.query.draw),
        "recordsTotal": total.rows[0].total,
        "recordsFiltered": total.rows[0].total,
        "data": data.rows
      }
    res.json(response)
  })

  
  router.get('/add',isLoggedIn, function (req, res, next) {
    res.render('Users/add', {
      user: req.session.user,
      currentPage: 'POS - Users',
      successMessage: req.flash('successMessage'),
      failureMessage: req.flash('failureMessage')
  });
  });

  router.post('/add', isLoggedIn, async function (req, res, next) {
    try {
      const { emails, names, passwords,roles } = req.body
      const datadb = await db.query('SELECT * FROM users where email = $1', [emails])
      if (datadb.rows.length > 0) {
        req.flash('failureMessage', 'email already registered')
        return res.redirect('/users/add')
      }

      const hash = bcrypt.hashSync(passwords, saltRounds);
      await db.query("INSERT INTO users(email, name, password, role) VALUES ($1, $2, $3, $4)", [emails, names, hash, roles])
      res.redirect('/users')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  router.get('/edit/:userid', isLoggedIn, async function (req, res, next) {
    try {
      const id = req.params.userid
      const {rows: dataedit} = await db.query("SELECT * FROM users WHERE userid = $1", [id])
      res.render('Users/edit', {data: dataedit[0], user: req.session.user, currentPage: 'POS - Users'})
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  router.post('/edit/:userid', isLoggedIn, async function (req, res, next) {
    try {
      const id = req.params.userid
      const { email, name, role } = req.body
      await db.query("UPDATE users SET email = $1, name = $2, role = $3 WHERE userid = $4", [email, name, role, id])
      res.redirect('/users')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  router.get('/delete/:userid', isLoggedIn, async function (req, res, next) {
    try {
      const id = req.params.userid
      await db.query("DELETE FROM users WHERE userid = $1", [id])
      res.redirect('/users')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  router.get('/profile',isLoggedIn, function (req, res, next) {
    res.render('Users/profile',{
      user: req.session.user,
      currentPage: 'POS - Users',
      successMessage: req.flash('successMessage'),
      failureMessage: req.flash('failureMessage')
    });
  });

  router.post('/profile',isLoggedIn, async function (req, res, next) {
    try {
      const id = req.session.user.userid
      const { email, name } = req.body
      await db.query("UPDATE users SET email = $1, name = $2 WHERE userid = $3", [email, name, id])

      const {rows: dataprofile} = await db.query("SELECT * FROM users WHERE email = $1", [email])

      const data = dataprofile[0]
      req.session.user = data
      req.flash('successMessage', 'your profile has been update')


      res.redirect('/users/profile')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  router.get('/changepassword',isLoggedIn, function (req, res, next) {
    res.render('Users/changepassword', {
      user: req.session.user,
      currentPage: 'POS - Users',
      successMessage: req.flash('successMessage'),
      failureMessage: req.flash('failureMessage')
    });
  });

  router.post('/changepassword',isLoggedIn,  async function (req, res, next) {
    try {
      const id = req.session.user.userid
      const { oldpassword, newpassword, retypepassword } = req.body

      const {rows: datadb} = await db.query('SELECT * FROM users where userid = $1', [id]);


      const passcheck = bcrypt.compareSync(oldpassword, datadb[0].password);
      if (!passcheck) {
        req.flash('failureMessage', 'Old Password is Wrong')
        return res.redirect('/users/changepassword')
      }

      if (newpassword != retypepassword ) {
        req.flash('failureMessage', `Retype Password is doesn't match`)
        return res.redirect('/users/changepassword')
      }
      
      const newpass = bcrypt.hashSync(newpassword, saltRounds);
      await db.query("UPDATE users SET password = $1 WHERE userid = $2", [newpass, id])
      req.flash('successMessage', `your password has been updated`)


      res.redirect('/users/changepassword')
    } catch (error) {
      console.log('changepassword error ', error);
    }
  });

  return router;
}
