const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// tells the Express app to use EJS as its templating engine(views)
app.set("view engine", "ejs");

// The body-parser library will allow us to access POST request parameters
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bcrypt = require("bcrypt");
const password = "purple-monkey-dinosaur"; // you will probably this from req.params
const hashedPassword = bcrypt.hashSync(password, 10);

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// ------------ GLOBAL OBJECTS ------------------------------------------------------------------------------- //

// used to store URLs (short and long), userID
let urlDatabase = {

  // urls: shortURL { longURL: "http://www.lighthouselabs.ca", userID: userID }

    // "9sm5xK": "http://www.google.com"
};


// used to store and access the users in the app.
let users = {
  "userRandomID": {
    email: "dog@example.com",
    password: "111"
  },
 "user2RandomID": {
    email: "cat@example.com",
    password: "0"
  }
};

// ------------ FUNCTIONS ------------------------------------------------------------------------------------ //

// simulate generating a "unique" shortURL, produces a string of 6 random alphanumeric characters:
function generateRandomString() {
  let randomString = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomString;
}

function validateData(data) {
  if (data.longURL && data.longURL.length > 0) {
    return true;
  }
  return false;
}

// function which returns the subset of the URL database that belongs to the user with ID id
function saveUrlsForUser(id, url) {
  let userURL = [];
  // for (user in urlDatabase) {
  //   if (userID === user) {
  //     userURL.push(req.body.url);
  //   }
  // }
  // return userURL;
  if (id in urlDatabase) {
    urlDatabase[id].append(url);
  } else {
    urlDatabase[id] = [url];
  }
}

function isLoggedIn(req, res, next) {
  let userID = req.cookies["userID"];
  let templateVars = {
    longURL: req.body.longURL,
    users: users
  };
  if (!userID) {
    res.redirect("/login");
  } else {
    next();
  }
}

function ownUrl(req, res, next) {
  let userID = req.cookies["userID"];
  let id = req.params.id;
  let longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  if (!userID) {
    res.status(403).send("Sorry! You are not logged in, yet.");
  } else {
    if (longURL !== urlDatabase[userID]) {
      res.status(403).send("Sorry, this URL is not part of you libray.");
    } else {
      next();
    }
  }
}

// ------------ GETs -------------------------------------------------------------------------------------- //

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/users.json", (req, res) => {
  res.json(users);
});

app.get("/", isLoggedIn, (req, res) => {
  res.redirect("/urls");
});

// new route handler for "/urls" and use res.render() to pass the URL data to your template.
app.get("/urls", isLoggedIn, (req, res) => {
  // let userID = req.cookies["userID"];
  let templateVars = {
    users: users,
    urls: urlDatabase
    // urls: urlsForUser(userID)
  };
  res.render("urls_index", templateVars);
});

// route to present the form to the user
app.get("/urls/new", isLoggedIn, (req, res) => {
  let templateVars = {
    users: users,
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
});

// new that add another page for displaying a single URL and its shortened form.
app.get("/urls/:id", (req, res) => {
  let userID = req.cookies["userID"];
  let id = req.params.id;
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], users: users };
  res.render("urls_show", templateVars);
});

// redirect shortUrls to its longURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


app.get("/login", (req, res) => {
  let userID = req.cookies["userID"];
  // let userEmail = req.body.email;
  // let password = req.body.password;

  //   password: req.body.password,
  //   email: req.body.email};

  if ( userID ) {
     return res.redirect("/urls");
  } // console.log("00000000000000000000000000000" );
  res.render("login");
});

// returns a page that includes a form with an email and password field.
app.get("/register", (req, res) => {
  res.render("registration");

});

// app.get("/:shortURL", (req, res) => {
//   var longURL = urlDatabase[req.params.shortURL];
//   res.redirect(longURL);
// });

// ------------ POSTs -------------------------------------------------------------------------------------- //

app.post("/urls", (req, res) => {
  var valid = validateData(req.body);
  if (valid) {
    var shortURL = generateRandomString();
    var longURL = req.body.longURL;
    urlDatabase[shortURL] = longURL;
    res.redirect("urls/" + shortURL);
  } else {
    res.render("urls_new", {
      error: "Please, enter a valid URL."
    });
  }
});

// route to receive the new url form submission
app.post("/urls/new", (req, res) => {
  let userID = req.cookies["userID"];
  saveUrlsForUser(userID,req.body.longURL );
  res.redirect("/urls");
});

//  POST route that removes a URL resource
app.post("/urls/:id/delete", ownUrl, (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// modify the corresponding longURL and redirect the client back to "/urls"
app.post("/urls/:id", ownUrl, (req, res) => {
  // updates the URL  ----------------------------
  res.redirect("/urls");
});

// add an endpoint to handle a POST to /login
// set cookie "username"
// Modify the existing POST /login endpoint so that it uses the new form data and sets the user_id cookie on successful login.
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  // console.log(email, password, users);

  if (!email || !password) {
    res.status(403).send("You have not registered yet...");
  } else {
    for (user in users) {
      if (email === users[user].email && password === users[user].password) {
        res.cookie("userID", user);
        res.redirect("/urls");
      } else {
        res.status(403).send('Bad Request');
        res.redirect('/login');
      }
    }
  }
});

// logout endpoint so that it clears the username cookie and redirects the user back to the /urls page
app.post("/logout", (req, res) => {
  let userID = req.cookies["userID"];
  res.clearCookie("userID", userID);
  res.redirect("/urls");
});

// getting info from user registration/ Registration Handler
// If the e-mail or password are empty strings, send back a response with the 400 status code
app.post("/register", (req, res) => {

  let userID = generateRandomString();
  let userEmail = req.body.email;
  let password = req.body.password;
  let user = {};

  if (!userEmail || !password) {
    res.status(400).send('Bad Request');
  } else {
    for (user in users) {
      if (userEmail === users[user].email) {
        res.send("E-mail already registered");
        return;
      } else {
        user = {
          email: userEmail,
          password: password
        }
        users[userID] = user;
        res.cookie("userID", userID);
        res.redirect("/urls");
      }
    }
  }
});
  // console.log(Object.keys(users).length);
  // console.log(users)




