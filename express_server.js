// set up
const express = require('express');
const app = express();

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['user']
}));

const bodyParser = require('body-parser');  // make POST reqs human readable
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require('bcrypt'); // hash passwords

const PORT = 8080;
app.set('view engine', 'ejs');

// confirm server is running
app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}`);
});

// require helper functions
const { generateRandomString, getUserByEmail, urlsForUser, urlValid } = require('./helpers');


// DATABASES
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


// SERVER ROUTES
// root
app.get('/', (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

// get list of urls
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  if (req.session.user_id === undefined) {
    res.send('Please <a href="/login">log in</a> or <a href="/register">register</a> to view your URLs.');
  } else {
    let templateVars = { urls: urlsForUser(req.session.user_id, urlDatabase), user: users[req.session.user_id] };
    res.render('urls_index', templateVars);
  }
});


// create new short url (logged in users)
app.get('/urls/new', (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect('/login');
  } else {
    let templateVars = { user: users[req.session.user_id] };
    res.render('urls_new', templateVars);
  }
});

app.post('/urls', (req, res) => {
  if (req.session.user_id === undefined) {
    res.send('Please log in to create a new URL.');
  } else {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };
    res.redirect(`/urls/${shortURL}`);
  }
});


// view url
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlValid(shortURL, urlDatabase)) { // if url is no in db
    res.status(404).send('URL not found.');
  } else { // url is in db
    if (req.session.user_id === undefined) { // user not logged in
      res.send('Please <a href="/login">log in</a> to view this URL.');
    } else { // user is logged in
      if (req.session.user_id === urlDatabase[shortURL].userID) { // user is owner
        for (let url in urlDatabase) {
          if (req.params.shortURL === url) {
            let templateVars = {
              shortURL: req.params.shortURL,
              longURL: urlDatabase[req.params.shortURL].longURL,
              user: users[req.session.user_id]
            };
            res.render('urls_show', templateVars);
          }
        }
      } else { // user is not owner
        res.status(401).send('Require owner access to view this URL.');
      }
    }
  }

});


// edit long url (logged in as owner)
app.put('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;
  if (req.session.user_id === undefined) { // user not logged in
    res.send('Please <a href="/login">log in</a> as the URL owner to edit URL.');
  } else if (req.session.user_id === urlDatabase[shortURL].userID) { // user is owner
    urlDatabase[shortURL].longURL = newLongURL;
    res.redirect('/urls');
  } else { // user is not owner
    res.status(401).send('Require owner access to edit URL');
  }
});


// delete url (logged in as owner)
app.delete('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.session.user_id === undefined) { // user not logged in
    res.send('Please <a href="/login">log in</a> as the URL owner to delete URL.');
  } else if (req.session.user_id === urlDatabase[shortURL].userID) { // user is owner
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else { // user is not owner
    res.status(401).send('Require owner access to delete URL.');
  }
});


// redirect short url to long url
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlValid(shortURL, urlDatabase)) { // check if url is in db
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send('Invalid URL.');
  }
});


// register
app.get('/register', (req, res) => {
  if (req.session.user_id === undefined) {
    let templateVars = { user: users[req.session.user_id] };
    res.render('register', templateVars);
  } else {
    res.redirect('/urls');
  }
});

app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') { // reject empty fields
    res.status(400).send('Please enter a valid e-mail/password.');
  } else if (getUserByEmail(req.body.email, users)) { // existing user tries to register
    res.status(400).send('E-mail already exists. Please <a href="/login">log in</a>.');
  } else {
    const id = generateRandomString();
    users[id] = {
      id: id,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.user_id = id;
    res.redirect('/urls');
  }
});


// log in
app.get('/login', (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;

  if (getUserByEmail(inputEmail, users)) { // check if user is in db
    for (let userId in users) {
      const user = users[userId];
      if (inputEmail === user.email) {
        if (bcrypt.compareSync(inputPassword, user.password)) {
          req.session.user_id = userId;
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
  res.clearCookie('session');
  res.clearCookie('session.sig');
  res.redirect('/urls');
});