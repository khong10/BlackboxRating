/*********************************************************************************
* Online (Heroku) Link: _______https://blackboxrating.herokuapp.com/ ___
*
********************************************************************************/
const dataServiceAuth = require(__dirname + "/data-service-auth.js");
var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
var app = express();
var path = require("path");
var dataService = require('./data-service.js');
const multer = require("multer");
var fs = require('fs');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');

/**add for login */
const clientSessions = require("client-sessions");

const storage = multer.diskStorage({
  destination: "./public/images/uploaded",
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// tell multer to use the diskStorage function for naming files instead of the default.
const upload = multer({ storage: storage });

app.use(express.static('public'));

// Parse application/x-www-form-urlencoded ** need to be checked
app.use(bodyParser.urlencoded({ extended: true }));

/**add for login */
// A simple user object, hardcoded for this example
// const user = {
//     username: "CodeCatcher",
//     password: "CodeCatcher",
//     email: "CodeCatcher@gmail.com"
//   };
// This is a helper middleware function that checks if a user is logged in

// Setup client-sessions
app.use(clientSessions({
  cookieName: "session", // this is the object name that will be added to 'req'
  secret: "blackboxratingapp", // this should be a long un-guessable string.
  duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
  activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));

// hide/show condition depending on whether user is logged in or not
app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

app.use(function (req, res, next) {
  let route = req.baseUrl + req.path;
  app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
  next();
});

app.engine('.hbs', exphbs({
  extname: '.hbs', defaultLayout: 'main', helpers: {
    navLink: function (url, options) {
      return '<li' +
        ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
        '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  }
}));

app.set('view engine', '.hbs');

// helper middleware function
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

// GET!! 

// setup a 'route' to listen on the default 
app.get("/", function (req, res) {
  res.render("home.hbs");
});

// registration
app.get('/register', (req, res) => {
  res.render('register');
});

// Log in
app.get("/login", function (req, res) {
  res.render("login");
});

// Log a user out by destroying their session
// and redirecting them to /login
app.get("/logout", function (req, res) {
  req.session.reset();
  res.redirect("/login");
});

// user history
app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory');
})

app.get("/restaurant", ensureLogin, (req, res) => {
  res.render("restaurant", { user: req.session.user });
});

app.get('/restaurants', ensureLogin, function (req, res) {
  dataService.getAllRestaurants()
    .then((data) => res.render("restaurants", { restaurants: data }))
    .catch(() => res.render({ message: "no results" }))
});

app.get('/transit', ensureLogin, function (req, res) {
  dataService.getRestaurant(req.params.name)
    .then((data) => res.render("transit", { transit: data }))
    .catch(() => res.render({ message: "no results" }))
});

// An authenticated route that requires the user to be logged in.
// Notice the middleware 'ensureLogin' that comes before the function
// that renders the dashboard page
app.get("/dashboard", ensureLogin, (req, res) => {
  res.render("dashboard", { user: req.session.user });
});

// post
// register
app.post('/register', (req, res) => {
  dataServiceAuth.registerUser(req.body)
  .then(() => {
      res.render('register', {successMessage: "User created"});
  })
  .catch((err) => {
      res.render('register', {errorMessage: err, userName: req.body.userName});
  })
});

app.post('/login', (req, res) => {
  // set the value of the client's "User-Agent"
  req.body.userAgent = req.get('User-Agent');

  dataServiceAuth.checkUser(req.body)
  .then((user) => {
      req.session.user = {
          userName: user.userName,
          email: user.email,
          loginHistory: user.loginHistory
      }
      res.redirect('/restaurants');
  }).catch((err) => {
      res.render('login', {errorMessage: err, userName: req.body.userName});
  });
});

// The login route that adds the user to the session
// app.post("/login", (req, res) => {
//   const username = req.body.username;
//   const password = req.body.password;

//   if (username === "" || password === "") {
//     // Render 'missing credentials'
//     return res.render("login", { errorMsg: "Missing credentials." });
//   }
//   // use sample "user" (declared above)
//   if (username === user.username && password === user.password) {
//     // Add the user on the session and redirect them to the dashboard page.
//     req.session.user = {
//       username: user.username,
//       email: user.email
//     };

//     res.redirect("/restaurant");
//   } else {
//     // render 'invalid username or password'
//     res.render("login", { errorMsg: "invalid username or password!" });
//   }
// });


// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}


/**app.get("/restaurant",  (req, res) => {
    dataService.getRestaurantByNum(req.params.num)
    .then((data)=>res.render("restaurant", {restaurant:data}))
    .catch(()=>{res.render("restaurant",{message:"no results"})
    })
});
**/


app.get('*', (req, res) => {
  res.status(404);
  res.redirect("https://cdn-images-1.medium.com/max/1600/1*FBnkcaXrCpiSxCEUo7qneA.png");
})
// setup http server to listen on HTTP_PORT
dataService.initialize()
    .then(dataServiceAuth.initialize)
    .then(function () {
        app.listen(HTTP_PORT, function () {
            console.log("app listening on: " + HTTP_PORT)
        });
    }).catch(function (err) {
        console.log("unable to start server: " + err);
    });
