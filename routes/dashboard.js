const express = require('express');
const router = express.Router();
const { isAdmin } = require('../helpers/util')
const currencyFormatter = require('currency-formatter');

/* GET home page. */
module.exports = function (db) {
  router.get('/', isAdmin, async function (req, res, next) {
    try {

      const { startdate, enddate } = req.query
      let purchases = ''
      let sales = ''
      let invoice = ''

      if (!startdate && !enddate) {
        const { rows: totalpurchases } = await db.query('SELECT sum(totalsum) AS totalpurchases FROM purchases')
        purchases = totalpurchases
        const { rows: totalsales } = await db.query('SELECT sum(totalsum) AS totalsales FROM sales')
        sales = totalsales
        const { rows: totalinvoice } = await db.query('SELECT count(invoice) AS totalinvoice FROM sales')
        invoice = totalinvoice
      } else if (startdate != '' && enddate != '') {
        const { rows: totalpurchases } = await db.query('SELECT sum(totalsum) AS totalpurchases FROM purchases WHERE time BETWEEN $1 AND $2', [startdate, enddate])
        purchases = totalpurchases
        const { rows: totalsales } = await db.query('SELECT sum(totalsum) AS totalsales FROM sales WHERE time BETWEEN $1 AND $2', [startdate, enddate])
        sales = totalsales
        const { rows: totalinvoice } = await db.query('SELECT count(invoice) AS totalinvoice FROM sales Where time BETWEEN $1 AND $2', [startdate, enddate])
        invoice = totalinvoice
      } else if (startdate != '') {
        const { rows: totalpurchases } = await db.query('SELECT sum(totalsum) AS totalpurchases FROM purchases WHERE time >= $1', [startdate])
        purchases = totalpurchases
        const { rows: totalsales } = await db.query('SELECT sum(totalsum) AS totalsales FROM sales WHERE time >= $1', [startdate])
        sales = totalsales
        const { rows: totalinvoice } = await db.query('SELECT count(invoice) AS totalinvoice FROM sales Where time >= $1', [startdate])
        invoice = totalinvoice
      } else if (enddate != '') {
        const { rows: totalpurchases } = await db.query('SELECT sum(totalsum) AS totalpurchases FROM purchases WHERE time <= $1', [enddate])
        purchases = totalpurchases
        const { rows: totalsales } = await db.query('SELECT sum(totalsum) AS totalsales FROM sales WHERE time <= $1', [enddate])
        sales = totalsales
        const { rows: totalinvoice } = await db.query('SELECT count(invoice) AS totalinvoice FROM sales Where time <= $1', [enddate])
        invoice = totalinvoice
      }

      let totalPurchases = purchases[0].totalpurchases
      let totalSales = sales[0].totalsales
      let totalInvoice = invoice[0].totalinvoice
      let totalearnings = sales[0].totalsales - purchases[0].totalpurchases

      let tableP = ''
      let tableS = ''

      if (!startdate && !enddate) {
        const { rows: purchasesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases GROUP BY bulan, tanggal ORDER BY tanggal`)
        tableP = purchasesget
        const { rows: salesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales GROUP BY bulan, tanggal ORDER BY tanggal`)
        tableS = salesget
      } else if (startdate != '' && enddate != '') {
        const { rows: purchasesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases WHERE time BETWEEN $1 and $2 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate,enddate])
        tableP = purchasesget
        const { rows: salesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales WHERE time BETWEEN $1 AND $2 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate,enddate])
        tableS = salesget
      } else if (startdate != '') {
        const { rows: purchasesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases WHERE time >= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate])
        tableP = purchasesget
        const { rows: salesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales WHERE time >= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate])
        tableS = salesget
      } else if (enddate != '') {
        const { rows: purchasesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases WHERE time <= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [enddate])
        tableP = purchasesget
        const { rows: salesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales WHERE time <= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [enddate])
        tableS = salesget
      }

      let total = tableP.concat(tableS)
      let data = {}
      let subtotal = []

      total.forEach(item => {
        if (data[item.bulan]) {
          data[item.bulan] = { monthly: item.bulan, expense: item.jumlahpurchases ? item.jumlahpurchases : data[item.bulan].expense, revenue: item.jumlahsales ? item.jumlahsales : data[item.bulan].revenue }
        }
        else {
          data[item.bulan] = { monthly: item.bulan, expense: item.jumlahpurchases ? item.jumlahpurchases : 0, revenue: item.jumlahsales ? item.jumlahsales : 0 }
        }
      })

      for (const item in data) {
        subtotal.push({
          monthly: data[item].monthly,
          expense: data[item].expense,
          revenue: data[item].revenue
        })
      }

      console.log('ini query ', req.query.stardate);

      res.render('dashboard/list', {
        totalPurchases,
        totalSales,
        totalInvoice,
        totalearnings,
        user: req.session.user,
        currentPage: "POS - Dashboard",
        currencyFormatter,
        subtotal,
        query: req.query,
      })
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  })

  router.get('/line', isAdmin, async function (req, res, next) {
    try {
      const { startdate, enddate } = req.query
      let searchPurchase = ''
      let searchSales = ''

      if (startdate != '' && enddate != '') {
        const { rows: purchasesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases WHERE time BETWEEN $1 AND $2 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate, enddate])
        searchPurchase = purchasesget
        const { rows: salesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales WHERE time BETWEEN $1 AND $2 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate, enddate])
        searchSales = salesget
      } else if (startdate != '') {
        const { rows: purchasesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases WHERE time >= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate])
        searchPurchase = purchasesget
        const { rows: salesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales WHERE time >= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate])
        searchSales = salesget
      } else if (enddate != '') {
        totalsales
        const { rows: purchasesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases WHERE time <= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [enddate])
        searchPurchase = purchasesget
        const { rows: salesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales WHERE time <= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [enddate])
        searchSales = salesget
      } else {
        const { rows: purchasesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases GROUP BY bulan, tanggal ORDER BY tanggal`)
        searchPurchase = purchasesget
        const { rows: salesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales GROUP BY bulan, tanggal ORDER BY tanggal`)
        searchSales = salesget
      }

      let total = searchPurchase.concat(searchSales)
      let data = {}
      let subtotal = []

      let hasil = []
      let bulan = []


      total.forEach(item => {
        if (data[item.bulan]) {
          data[item.bulan] = { monthly: item.bulan, expense: item.jumlahpurchases ? item.jumlahpurchases : data[item.bulan].expense, revenue: item.jumlahsales ? item.jumlahsales : data[item.bulan].revenue }
        } else {
          data[item.bulan] = { monthly: item.bulan, expense: item.jumlahpurchases ? item.jumlahpurchases : 0, revenue: item.jumlahsales ? item.jumlahsales : 0 }
          bulan.push(item.bulan)
        }
      })

      for (const item in data) {
        subtotal.push({
          monthly: data[item].monthly,
          expense: data[item].expense,
          revenue: data[item].revenue
        })
      }

      for (const item in data) {
        hasil.push(data[item].revenue - data[item].expense)
      }

      res.json({ bulan, hasil })
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  })

  router.get('/dougnat', isAdmin, async function (req, res, next) {
    try {
      const { startdate, enddate } = req.query

      if (startdate != '' && enddate != '') {
        const { rows: direct } = await db.query('SELECT COUNT(*) FROM sales WHERE customer = 1 AND time BETWEEN $1 AND $2', [startdate, enddate])
        const { rows: customer } = await db.query('SELECT COUNT(*) FROM sales WHERE customer != 1 AND time BETWEEN $1 AND $2', [startdate, enddate])
        res.json({ direct: direct[0].count, customer: customer[0].count })
      } else if (startdate != '') {
        const { rows: direct } = await db.query('SELECT COUNT(*) FROM sales WHERE customer = 1 AND time >= $1', [startdate])
        const { rows: customer } = await db.query('SELECT COUNT(*) FROM sales WHERE customer != 1 AND time >= $1', [startdate])
        res.json({ direct: direct[0].count, customer: customer[0].count })
      } else if (enddate != '') {
        const { rows: direct } = await db.query('SELECT COUNT(*) FROM sales WHERE customer = 1 AND time <= $1', [enddate])
        const { rows: customer } = await db.query('SELECT COUNT(*) FROM sales WHERE customer != 1 AND time <= $1', [enddate])
        res.json({ direct: direct[0].count, customer: customer[0].count })
      } else {
        const { rows: direct } = await db.query('SELECT COUNT(*) FROM sales WHERE customer = 1')
        const { rows: customer } = await db.query('SELECT COUNT(*) FROM sales WHERE customer != 1')
        res.json({ direct: direct[0].count, customer: customer[0].count })
      }

    } catch (error) {
      console.log(error);
      res.send(error)
    }
  })

  return router;
}