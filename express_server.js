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

// generate 6 random alphanumeric characters
const generateRandomString = function() {
  let result = '';
  let charac = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let characLength = charac.length;
  for (let i = 0; i < 6; i++) {
    result += charac.charAt(Math.random() * characLength);
  }
  return result;
};

// object containing short and long urls
const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};


// list of responses to requests

// get list of urls in database
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies.username };
  res.render('urls_index', templateVars);
});


// create new short url
app.get('/urls/new', (req, res) => {
  let templateVars = { username: req.cookies.username };
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
    username: req.cookies.username
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
  let templateVars = { username: req.cookies.username };
  res.render('register', templateVars);
});


// log in
app.post('/login', (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});


// log out
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});