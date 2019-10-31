// set up
const express = require('express');
const app = express();

const cookieParser = require('cookie-parser'); // read values from a cookie
app.use(cookieParser());

const bodyParser = require('body-parser');  // make POST reqs human readable
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require('bcrypt'); // hash passwords

const PORT = 8080;
app.set('view engine', 'ejs');

// confirm server is running
app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}`);
});


// DATABASE
// short and long urls, associated with userId
const urlDatabase = {
  b6UTxQ: { longURL: 'https://www.tsn.ca', userID: 'userRandomID' },
  i3BoGr: { longURL: 'https://www.google.ca', userID: 'user2RandomID' }
};


// users
const users = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: bcrypt.hashSync('purple-monkey-dinosaur', 10)
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: bcrypt.hashSync('dishwasher-funk', 10)
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
    }
  }
  return false;
};

// return urls for logged in user
const urlsForUser = function(id) {
  const filteredList = {};
  for (let url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      filteredList[url] = urlDatabase[url];
    }
  }
  return filteredList;
};

// SERVER RESPONSES
// get list of urls (logged in users)
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  if (req.cookies.user_id === undefined) {
    res.send('Please <a href="/login">log in</a> or <a href="/register">register</a> to view your URLs.');
  } else {
    let templateVars = { urls: urlsForUser(req.cookies.user_id), user: users[req.cookies.user_id] };
    res.render('urls_index', templateVars);
  }
});


// create new short url (logged in users)
app.get('/urls/new', (req, res) => {
  if (req.cookies.user_id === undefined) {
    res.send('Please <a href="/login">log in</a> or <a href="/register">register</a> to create a new URL.');
  } else {
    let templateVars = { user: users[req.cookies.user_id] };
    res.render('urls_new', templateVars);
  }
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
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies.user_id]
  };
  res.render('urls_show', templateVars);
});


// edit long url (logged in as owner)
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;
  if (req.cookies.user_id === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = newLongURL;
    res.redirect('/urls');
  } else {
    res.send('Please <a href="/login">log in</a> as the URL owner to edit URL.');
  }
});


// delete url (logged in as owner)
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.cookies.user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.send('Please <a href="/login">log in</a> as the URL owner to delete URL.');
  }
});


// redirect short url to long url
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});


// register
app.get('/register', (req, res) => {
  let templateVars = { user: users[req.cookies.user_id] };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  if (checkEmailExist(req.body.email) || req.body.email === '' || req.body.password === '') {
    res.status(400).send('E-mail already exists. Please log in.');
  } else {
    const id = generateRandomString();
    users[id] = {
      id: id,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
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
          res.status(403).send('Wrong password.');
        }
      }
    }
  } else {
    res.status(403).send('Invalid log in e-mail.');
  }

});


// log out
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});