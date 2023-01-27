const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { isLoggedIn } = require('../helpers/util')
const saltRounds = 10;

module.exports = function (db) {

    router.get('/', isLoggedIn, function (req, res, next) {
        res.render('Suppliers/suppliers', { user: req.session.user, currentPage: 'POS - Suppliers' });
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

        const total = await db.query(`select count(*) as total from suppliers${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
        const data = await db.query(`select * from suppliers${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
        const response = {
            "draw": Number(req.query.draw),
            "recordsTotal": total.rows[0].total,
            "recordsFiltered": total.rows[0].total,
            "data": data.rows
        }
        res.json(response)
    })

    router.get('/add', isLoggedIn, function (req, res, next) {
        res.render('Suppliers/add', {
            user: req.session.user,
            currentPage: 'POS - Suppliers',
            successMessage: req.flash('successMessage'),
            failureMessage: req.flash('failureMessage')
        });
    });

    router.post('/add', isLoggedIn, async function (req, res, next) {
        try {
            const { supplierids, names, addresss, phones } = req.body
            const datadb = await db.query('SELECT * FROM suppliers where supplierid = $1', [supplierids])
            if (datadb.rows.length > 0) {
                req.flash('failureMessage', 'suppliers already exist')
                return res.redirect('/Suppliers/add')
            }
            await db.query("INSERT INTO suppliers(name,address,phone) VALUES ($1, $2, $3)", [names, addresss, phones])
            res.redirect('/suppliers')
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });

    router.get('/edit/:supplierid', isLoggedIn, async function (req, res, next) {
        try {
            const index = req.params.supplierid
            const { rows: dataedit } = await db.query("SELECT * FROM suppliers WHERE supplierid = $1", [index])
            res.render('Suppliers/edit', { data: dataedit[0], user: req.session.user, currentPage: 'POS - Suppliers' })
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });

    router.post('/edit/:supplierid', isLoggedIn, async function (req, res, next) {
        try {
            const index = req.params.supplierid
            const { name, address, phone } = req.body
            await db.query("UPDATE suppliers SET name = $1, address = $2, phone = $3 WHERE supplierid = $4", [name,address,phone,index])
            res.redirect('/suppliers')
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });

    router.get('/delete/:supplierid', isLoggedIn, async function (req, res, next) {
        try {
            const supplier = req.params.supplierid
            await db.query("DELETE FROM suppliers WHERE supplierid = $1", [supplier])
            res.redirect('/suppliers')
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });

    return router;
}
