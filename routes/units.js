const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { isAdmin } = require('../helpers/util')
const saltRounds = 10;

module.exports = function (db) {

  router.get('/', isAdmin, function (req, res, next) {
    res.render('Units/units', {user: req.session.user, currentPage: 'POS - Units'});
  });

  router.get('/datatable', async (req, res) => {
    let params = []

    if(req.query.search.value){
        params.push(`name ilike '%${req.query.search.value}%'`)
    }

    if(req.query.search.value){
      params.push(`note ilike '%${req.query.search.value}%'`)
    }

    const limit = req.query.length
    const offset = req.query.start
    const sortBy = req.query.columns[req.query.order[0].column].data
    const sortMode = req.query.order[0].dir

    const total = await db.query(`select count(*) as total from units${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
    const data = await db.query(`select * from units${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
    const response = {
        "draw": Number(req.query.draw),
        "recordsTotal": total.rows[0].total,
        "recordsFiltered": total.rows[0].total,
        "data": data.rows
      }
    res.json(response)
  })

  router.get('/add',isAdmin, function (req, res, next) {
    res.render('Units/add', {
      user: req.session.user,
      currentPage: 'POS - Units',
      successMessage: req.flash('successMessage'),
      failureMessage: req.flash('failureMessage')
  });
  });

  router.post('/add', isAdmin, async function (req, res, next) {
    try {
      const { units, names, notes } = req.body
      const datadb = await db.query('SELECT * FROM units where unit = $1', [units])
      if (datadb.rows.length > 0) {
        req.flash('failureMessage', 'units already exist')
        return res.redirect('/units/add')
      }
      await db.query("INSERT INTO units(unit,name,note) VALUES ($1, $2, $3)", [units, names, notes])
        res.redirect('/units')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  router.get('/edit/:unit', isAdmin, async function (req, res, next) {
    try {
      const index = req.params.unit
      const {rows: dataedit} = await db.query("SELECT * FROM units WHERE unit = $1", [index])
      res.render('Units/edit', {data: dataedit[0], user: req.session.user, currentPage: 'POS - Units'})
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  router.post('/edit/:unit', isAdmin, async function (req, res, next) {
    try {
      const index = req.params.unit
      const { unit, name, note } = req.body
      await db.query("UPDATE units SET unit = $1, name = $2, note = $3 WHERE unit = $4", [unit, name, note, index])
      res.redirect('/units')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  router.get('/delete/:unit', isAdmin, async function (req, res, next) {
    try {
      const unit = req.params.unit
      await db.query("DELETE FROM units WHERE unit = $1", [unit])
      res.redirect('/units')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });
  
  return router;
}
