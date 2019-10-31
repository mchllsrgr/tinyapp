// HELPER FUNCTIONS
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

// get user by email lookup
const getUserByEmail = function(email, database) {
  for (let user in database) {
    const userInfo = database[user];
    if (email === userInfo.email) {
      return user;
    }
  }
  return undefined;
};

// return urls for logged in user
const urlsForUser = function(id, database) {
  const filteredList = {};
  for (let url in database) {
    if (id === database[url].userID) {
      filteredList[url] = database[url];
    }
  }
  return filteredList;
};

module.exports = { generateRandomString, getUserByEmail, urlsForUser };