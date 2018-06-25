const express = require("express");
const app = express();
const PORT = 3000;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

// tells the Express app to use EJS as its templating engine(views)
app.set("view engine", "ejs");

// The body-parser library to access POST request parameters
app.use(bodyParser.urlencoded({extended: true}));

//  cookieSession
app.use(cookieSession({
  name: "session",
  keys: ["cutepet", "731"]
}));


// ------------ GLOBAL OBJECTS - DATABASES ------------------------------------------------------------------------------- //

// used to store URLs (short and long) and userID
let urlDatabase = {
    // "b2xVn2":{
    //   shortURL: "b2xVn2",
    //   longURL: "http://www.lighthouse.ca",
    //   userID: "userRandomID",
    // },

    // "h39Yu":{
    //   shortURL: "h39Yu",
    //   longURL: "http://www.google.com",
    //   userID: "userRandomID",
    // }
};

// used to store and access the users in the app.
let users = {
   //  "userRandomID": {
   //    email: "dog@example.com",
   //    password: "111"
   //  },

   // "user2RandomID": {
   //    email: "cat@example.com",
   //    password: "0"
   //  }
};

// ------------ FUNCTIONS ------------------------------------------------------------------------------------ //

// Simulate generating a "unique" shortURL, produces a string of 6 random alphanumeric characters:
function generateRandomString() {
  let randomString = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomString;
}


// -- Validates data
function validateData(data) {
  if (data.longURL && data.longURL.length > 0) {
    return true;
  }
  return false;
}


// -- Checks if the user is logged in
function isLoggedIn(req, res, next) {
  let userID = req.session.userID;
  let templateVars = {
    longURL: req.body.longURL,
    users: users,
    userID: userID,
    urls: urlDatabase[userID]
  };
  if (!userID) {
    res.redirect("/login");
  } else {
    next();
  }
}

// -- Checks if the URL belongs to the user
function isUsersUrl(req, res, next) {
  let userID = req.session.userID;
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

// -- Returns the subset of the URL database that belongs to the user with ID
function getUrlsForUser(userId){
  let urls = {};
  for(let key in urlDatabase){
    if(urlDatabase[key].userID===userId){
      urls[key] = {
        "shortURL": urlDatabase[key].shortURL,
        "longURL": urlDatabase[key].longURL
      }
    }
  }
  return urls;
}

// -- Checks if user's email matches one in the database
function isRegistered(usersDB, email, userEmail) {
  if (!userEmail) {
    return false;
  } else {
    for (let key in usersDB) {
      let result = usersDB[key][email];
      if (userEmail.toLowerCase() === result.toLowerCase()) {
        return usersDB[key];
      }
    }
  }
  return false;
}


// ------------ GET REQUESTS ---------------------------------------------------------------------------- //
// URLs Database in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Root page
app.get("/", isLoggedIn, (req, res) => {
  res.redirect("/urls");
});

// List with the Short and LongURLs
app.get("/urls", (req, res) => {

  let userID = req.session.userID;
  if (!userID) {
    res.redirect("/login");
  } else {
    let urls = getUrlsForUser(userID);
    let templateVars = {
      users: users,
      urls: urls,
      userID: userID
    };
    res.render("urls_index", templateVars);
  }
});

// Route to the form to add a new shortURL, given an URL
app.get("/urls/new", isLoggedIn, (req, res) => {

  let userID = req.session.userID;
  let templateVars = {
    userID: userID,
    urls: urlDatabase[userID]
  };
  res.render("urls_new", templateVars);
});

// Displays a single URL and its shortened form.
app.get("/urls/:id", (req, res) => {
  let userID = req.session.userID;
  let shortURL = req.params.id;
  let urls = getUrlsForUser(userID);
  let templateVars = {
    user: users[userID],
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL
  };

  if (userID) {
    if (userID !== urlDatabase[shortURL].userID) {
      res.render("urls_index", {
        user: users[userID],
        urls: urls,
        error: "This short link belong to another user."
      });
      return;
    }
   } else {
    res.redirect("/login");
    return;
  }
  res.render("urls_show", templateVars);
});

// Redirect shortUrls to its longURL
app.get("/u/:id", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL.url);
});

// Login Page
app.get("/login", (req, res) => {
  let userID = req.session.userID;
  let templateVars = { users: users };
  res.render("login");
});

// Register form with an email and password field.
app.get("/register", (req, res) => {
  let userID = req.session.userID;
  let templateVars = { users: users };
  res.render("register", templateVars);
});

// ------------ POST REQUESTS - Endpoints ---------------------------------------------------------------------------- //

// Allows logged users to generate a short URL associated to his ID
app.post("/urls", (req, res) => {
  let userID = req.session.userID;
  var valid = validateData(req.body);

  if (valid) {
    var shortURL = generateRandomString();
    var longURL = req.body.longURL;

    urlDatabase[shortURL] = {
      shortURL: shortURL,
      longURL: longURL,
      userID: userID
    };
    res.redirect("/urls");
  } else {
    res.status(403).send("Sorry! You are not logged in, yet.");
  }
});

// Route to receive the new url form submission
app.post("/urls/new", (req, res) => {
  let userID = req.session.userID;
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();

  urlDatabase[shortURL] = { };
  res.redirect("/urls");
});

// POST route that removes a URL resource
app.post("/urls/:id/delete", isUsersUrl, (req, res) => {
  let userID = req.session.userID;
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// update the corresponding longURL and redirect the client back to "/urls"
app.post("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id].userID === req.session.userID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    urlDatabase[req.params.id].url = urlDatabase[req.params.id].longURL;
    // urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.send("Sorry! This URL does not belong to you.");
    return;
  }

});

// POST /login endpoint that uses the form data and sets the userID cookie on successful login.
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let userID = undefined;
  let matchId;

  if (!email || !password) {
    res.status(403).send("Please provide your email and password.");
    return;
  }

  matchId = isRegistered(users, "email", email);

  if (matchId) {
    let matchPassword = bcrypt.compareSync(password, matchId.password, 10);

    if (matchPassword) {
      req.session.userID = matchId.id;
      res.redirect("/urls");
    } else {
      res.status(403).send("Login information not found. Please try again.");
    }
  } else {
    res.status(403).send("You have not registered yet...");
    return;
  }
});

// Logout endpoint - clears the username cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

// Registration Handler - sets  the userID cookie and hashes the password
app.post("/register", (req, res) => {

  const userID = generateRandomString();
  const userEmail = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  let user = {};

  if (!userEmail || !password) {
    res.status(400).send("Please, register first.");
  } else {
    for (let key in users) {
      if (userEmail === users[key].email) {
        res.send("E-mail already registered.");
        return;
      }
    }
    user = {
      email: userEmail,
      password: hashedPassword
    }
    users[userID] = user;
    req.session.userID = userID;
    res.redirect("/urls");
  }
});

//  Listener
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
