
  //Ganti ama try catch
  // router.get('/', function (req, res, next) {
  //   res.render('user', { info: req.flash('info') });
  // });

  // router.get('/user', helpers.isLoggedIn, function (req, res, next) {
  //   db.query('Select * from users', (err, data) => {
  //     if (err) return console.log('gagal ambil data', err);
  //     res.render('Users/user', { daftar: data.rows, user: req.session.user })
  //   })
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

  router.get('/delete/:id', helpers.isLoggedIn, function (req, res, next) {
    const index = req.params.id
    db.query(`DELETE FROM users WHERE userid=$1`, [index], (err) => {
      if (err) return console.log('gagal ambil data', err)
      res.redirect('/user')
    })
  })

  //EDITNYA BELUM BISA
  router.get('/edit/:id', helpers.isLoggedIn, function (req, res, next) {
    const index = req.params.id
    db.query('Select * from users where userid=$1', [index], (err, data) => {
      if (err) return console.log('gagal ambil data', err);
      res.render('Users/edit', { data: data.rows[0], user: req.session.user })
    })
  });

  router.post('/edit/:id', helpers.isLoggedIn, function (req, res, next) {
    const index = req.params.id
    const { email, name, role } = req.body
    db.query(`Update users set email='$1', name='$2', role='$3' where userid=$4`, [email, name, role, index], (err, rows) => {
      if (err) return console.log('gagal masukkan data', err);
      res.redirect('/user')
    })
  });