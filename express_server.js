// set up
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser'); // read values from a cookie
app.use(cookieParser());
const bodyParser = require('body-parser');  // make POST reqs human readable
app.use(bodyParser.urlencoded({extended: true}));
const PORT = 8080;
app.set('view engine', 'ejs');

// confirm server is running
app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}`);
});


// DATABASE
// short and long urls
const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

// users
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};


// FUNCTIONS
// generate userid and short url - 6 random alphanumeric characters
const generateRandomString = function() {
  let result = '';
  let charac = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let characLength = charac.length;
  for (let i = 0; i < 6; i++) {
    result += charac.charAt(Math.random() * characLength);
  }
  return result;
};

// check if email already exists in database
const checkEmailExist = function(inputEmail) {
  for (let userId in users) {
    const userInfo = users[userId];
    if (inputEmail === userInfo.email) {
      return true;
    } else {
      return false;
    }
  }
};


// SERVER RESPONSES
// get list of urls in database
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render('urls_index', templateVars);
});


// create new short url
app.get('/urls/new', (req, res) => {
  let templateVars = { user: users[req.cookies.user_id] };
  res.render('urls_new', templateVars);
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});


// view url
app.get('/urls/:shortURL', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies.user_id]
  };
  res.render('urls_show', templateVars);
});


// edit long url
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});


// delete url
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});


// redirect short url to long url
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


// register
app.get('/register', (req, res) => {
  let templateVars = { user: users[req.cookies.user_id] };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  if (checkEmailExist(req.body.email) || req.body.email === '' || req.body.password === '') {
    res.sendStatus(400);
  } else {
    const id = generateRandomString();
    users[id] = {
      id: id,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie('user_id', id);
    res.redirect('/urls');
  }
});


// log in
app.get('/login', (req, res) => {
  let templateVars = { user: users[req.cookies.user_id] };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;

  if (checkEmailExist(inputEmail)) {
    for (let userId in users) {
      const user = users[userId];
      if (inputEmail === user.email) {
        if (inputPassword === user.password) {
          res.cookie('user_id', userId);
          res.redirect('/urls');
        } else {
          res.send('Wrong password');
        }
      }
    }
  } else {
    res.send('Cannot find email in db.');
  }

});


// log out
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});