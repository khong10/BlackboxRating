const bcrypt = require("bcryptjs");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var userSchema = new Schema({
  "userName":
  {
    "type": String,
    "unique": true
  },
  "password": String,
  "email": String,
  "loginHistory":
  [{
    "dateTime": Date,
    "userAgent": String
  }]
});

let User; // to be defined on new connection (see initialize)


module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection("mongodb://codecatcher:catchers18@ds041404.mlab.com:41404/blackbox_rating");

    db.on('error', (err) => {
      reject(err); // reject the promise with the provided error
    });

    db.once('open', () => {
      User = db.model("users", userSchema);
      resolve();
    });

  });
};

// register users
module.exports.registerUser = function (userData) {
  return new Promise(function (resolve, reject) {
    if (userData.password != userData.password2) {
      reject("Password do not match");
    } else {
      bcrypt.genSalt(10, function (err, salt) { // Generate a "salt" using 10 rounds
        bcrypt.hash(userData.password, salt, function (err, hash) { // encrypt the password: "myPassword123"
          // TODO: Store the resulting "hash" value in the DB
          if (err) {
            reject("There was an error encrypting the password");
          } else {
            userData.password = hash;
            let newUser = new User(userData);
            newUser.save((err) => {
              if (err) {
                // if there are errors
                if (err.code == 11000) {
                  reject("User Name already taken");
                } else {
                  reject("There was an error creating the user: " + err);
                }
              } else {
                resolve();
              }
            });
          }
        });
      });
    }
  });
};


// check user
module.exports.checkUser = function (userData) {
  return new Promise(function (resolve, reject) {
    User.find({ userName: userData.userName })
      .exec()
      .then((users) => {
        if (users.length === 0) {
          reject("Unable to find user: " + userData.userName);
        } else {
          bcrypt.compare(userData.password, users[0].password)
          .then((res) => {
            // res === true if it matches and res === false if it does not match
          if(res === true){
            users[0].loginHistory.push({ dateTime: (new Date()).toString(), userAgent: userData.userAgent });
            User.update(
              { userName: users[0].userName }, // which documents to update
              { $set: { loginHistory: users[0].loginHistory } }, //  the fields to set for the documents that match the query
              { multi: false }) //  if you want to update multiple matching documents or only the first match.
              .exec()
              .then(() => {
                resolve(users[0]);
              })
              .catch((err) => {
                reject("There was an error verifying the user: " + err);
              })
            } else {
                reject("Incorrect Password for user: " + userData.userName);
              }
          });
        }
      })
      .catch(() => {
        reject("Unable to find user: " + userData.userName); // Instruction
      })
  })
};