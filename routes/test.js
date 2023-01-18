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
