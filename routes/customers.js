const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { isLoggedIn } = require('../helpers/util')
const saltRounds = 10;

module.exports = function (db) {

    router.get('/', isLoggedIn, function (req, res, next) {
        res.render('Customers/customers', { user: req.session.user, currentPage: 'POS - Customers' });
    });

    router.get('/datatable', async (req, res) => {
        let params = []

        if (req.query.search.value) {
            params.push(`name ilike '%${req.query.search.value}%'`)
        }

        if (req.query.search.value) {
            params.push(`address ilike '%${req.query.search.value}%'`)
        }

        if (req.query.search.value) {
            params.push(`phone ilike '%${req.query.search.value}%'`)
        }

        const limit = req.query.length
        const offset = req.query.start
        const sortBy = req.query.columns[req.query.order[0].column].data
        const sortMode = req.query.order[0].dir

        const total = await db.query(`select count(*) as total from customers${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
        const data = await db.query(`select * from customers${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
        const response = {
            "draw": Number(req.query.draw),
            "recordsTotal": total.rows[0].total,
            "recordsFiltered": total.rows[0].total,
            "data": data.rows
        }
        res.json(response)
    })

    router.get('/add', isLoggedIn, function (req, res, next) {
        res.render('Customers/add', {
            user: req.session.user,
            currentPage: 'POS - Customers',
            successMessage: req.flash('successMessage'),
            failureMessage: req.flash('failureMessage')
        });
    });

    router.post('/add', isLoggedIn, async function (req, res, next) {
        try {
            const { customerids, names, addresss, phones } = req.body
            const datadb = await db.query('SELECT * FROM customers where customerid = $1', [customerids])
            if (datadb.rows.length > 0) {
                req.flash('failureMessage', 'customers already exist')
                return res.redirect('/Customers/add')
            }
            await db.query("INSERT INTO customers(name,address,phone) VALUES ($1, $2, $3)", [names, addresss, phones])
            res.redirect('/customers')
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });

    router.get('/edit/:customerid', isLoggedIn, async function (req, res, next) {
        try {
            const index = req.params.customerid
            const { rows: dataedit } = await db.query("SELECT * FROM customers WHERE customerid = $1", [index])
            res.render('Customers/edit', { data: dataedit[0], user: req.session.user, currentPage: 'POS - Customers' })
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });

    router.post('/edit/:customerid', isLoggedIn, async function (req, res, next) {
        try {
            const index = req.params.customerid
            const { name, address, phone } = req.body
            await db.query("UPDATE customers SET name = $1, address = $2, phone = $3 WHERE customerid = $4", [name,address,phone,index])
            res.redirect('/customers')
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });

    router.get('/delete/:customerid', isLoggedIn, async function (req, res, next) {
        try {
            const customer = req.params.customerid
            await db.query("DELETE FROM customers WHERE customerid = $1", [customer])
            res.redirect('/customers')
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });

    return router;
}
