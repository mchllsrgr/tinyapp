const { assert } = require('chai');
const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

describe('getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = getUserByEmail('user2@example.com', testUsers);
    const expectedOutput = 'user2RandomID';
    assert.equal(user, expectedOutput);
  });

  it('should return undefined when looking up a non-existent email', () => {
    const user = getUserByEmail('michelle@new.com', testUsers);
    const expectedOutput = undefined;
    assert.equal(user, expectedOutput)
  });
});