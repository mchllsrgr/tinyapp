const express = require('express');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

// confirm server is running
app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}`);
});

// import body-parser library to make POST reqs human readable
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

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

// getting list of urls in database
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});


// create new url
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render('urls_show', templateVars);
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