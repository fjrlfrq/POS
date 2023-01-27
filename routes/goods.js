const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../helpers/util')
const path = require('path')

module.exports = function (db) {

  router.get('/', isLoggedIn, function (req, res, next) {
    res.render('Goods/goods', { user: req.session.user, currentPage: 'POS - Goods' });
  });

  router.get('/datatable', async (req, res) => {
    let params = []

    if (req.query.search.value) {
      params.push(`name ilike '%${req.query.search.value}%'`)
    }

    if (req.query.search.value) {
      params.push(`unit ilike '%${req.query.search.value}%'`)
    }

    const limit = req.query.length
    const offset = req.query.start
    const sortBy = req.query.columns[req.query.order[0].column].data
    const sortMode = req.query.order[0].dir

    const total = await db.query(`select count(*) as total from goods${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
    const data = await db.query(`select * from goods${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
    const response = {
      "draw": Number(req.query.draw),
      "recordsTotal": total.rows[0].total,
      "recordsFiltered": total.rows[0].total,
      "data": data.rows
    }
    res.json(response)
  })

  router.get('/add', isLoggedIn, async function (req, res, next) {
    const { rows: dataUnit } = await db.query("SELECT * FROM units")
    res.render('Goods/add',
      {
        data: dataUnit,
        user: req.session.user,
        currentPage: 'POS - Goods',
        successMessage: req.flash('successMessage'),
        failureMessage: req.flash('failureMessage')
      });
  });

  router.post('/add', isLoggedIn, async function (req, res, next) {
    try {
      const { barcodes, names, stocks, purchaseprices, sellingprices, units } = req.body
      const datadb = await db.query('SELECT * FROM goods WHERE barcode = $1', [barcodes])

      if (datadb.rows.length > 0) {
        req.flash('failureMessage', 'barcode already')
        return res.redirect('/goods/add')
      }

      if (!req.files || Object.keys(req.files).length === 1) {
        res.status(400).send('No files were uploaded.');
        return;
      }

      const uploadFile = req.files.pictures;
      // tujuan di concat dengan Date now supaya file tidak bertumpuk
      const fileName = `${Date.now()}-${uploadFile.name}`
      // tujuan untuk menyimpan file upload
      const uploadPath = path.join(__dirname, '..', 'public', 'image', 'upload', fileName);

      uploadFile.mv(uploadPath, async function (err) {
        if (err) {
          return res.status(500).send(err);
        }
        await db.query("INSERT INTO goods(barcode, name, stock, purchaseprice, sellingprice, unit, picture) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [barcodes, names, stocks, purchaseprices, sellingprices, units, fileName])
        res.redirect('/goods')
      });
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  router.get('/edit/:barcode', isLoggedIn, async function (req, res, next) {
    try {
      const index = req.params.barcode
      const { rows: dataEdit } = await db.query("SELECT * FROM goods WHERE barcode = $1", [index])
      const { rows: dataUnit } = await db.query("SELECT * FROM units")
      res.render('Goods/edit',
        {
          data: dataEdit[0],
          unitData: dataUnit,
          user: req.session.user,
          currentPage: 'POS - Goods'
        });
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  router.post('/edit/:barcode', isLoggedIn, async function (req, res, next) {
    try {
      const index = req.params.barcode
      const { name, stock, purchaseprice, sellingprice, unit } = req.body

      if (!req.files || Object.keys(req.files).length === 0) {
        await db.query("UPDATE goods SET name = $1, stock = $2, purchaseprice = $3, sellingprice = $4, unit = $5 WHERE barcode = $6",
          [name, stock, purchaseprice, sellingprice, unit, index])
        res.redirect('/goods')
        return;
      } else {
        const uploadFile = req.files.picture;
        const fileName = `${Date.now()}-${uploadFile.name}`
        const uploadPath = path.join(__dirname, '..', 'public', 'image', 'upload', fileName);

        uploadFile.mv(uploadPath, async function (err) {
          if (err) {
            console.log(err);
            return res.status(500).send(err);
          }
          await db.query("UPDATE goods SET name = $1, stock = $2, purchaseprice = $3, sellingprice = $4, unit = $5, picture = $6 WHERE barcode = $7",
            [name, stock, purchaseprice, sellingprice, unit, fileName, index])
          res.redirect('/goods')
        })
      }
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  router.get('/delete/:barcode', isLoggedIn, async function (req, res, next) {
    try {
      const index = req.params.barcode
      await db.query("DELETE FROM goods WHERE barcode = $1", [index])
      res.redirect('/goods')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  return router;
}