const express = require("express");
const app = express();
const PORT = 8080;

// tells the Express app to use EJS as its templating engine(views)
app.set("view engine", "ejs");

// The body-parser library to access POST request parameters
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: "session",
  keys: ["cutepet", "731"]
}));

const bcrypt = require("bcrypt");
const password = "purple-monkey-dinosaur";
const hashedPassword = bcrypt.hashSync(password, 10);


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// ------------ GLOBAL OBJECTS - DATABASES ------------------------------------------------------------------------------- //

// used to store URLs (short and long) and userID
let urlDatabase = {

  "b2xVn2":{
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouse.ca",
    userID: "userRandomID",
  },

  "h39Yu":{
    shortURL: "h39Yu",
    longURL: "http://www.google.com",
    userID: "userRandomID",
  }

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

// validates data
function validateData(data) {
  if (data.longURL && data.longURL.length > 0) {
    return true;
  }
  return false;
}

// function which returns the subset of the URL database that belongs to the user with ID id
function saveUrlsForUser(userID, urlObjects) {
  if (userID in urlDatabase) {
    urlDatabase[userID].push(urlObjects);
  } else {
    urlDatabase[userID] = [urlObjects];
  }
}

// checks if the user is logged in
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

// checks if the URL belongs to the user
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

function getUrlsForUser(userId){
  let urls = {};
  for(var key in urlDatabase){
    if(urlDatabase[key].userID===userId){
      //console.log(matched);
      urls[key] = {
        "shortURL": urlDatabase[key].shortURL,
        "longURL": urlDatabase[key].longURL
      }
    }
  }
  //console.log(urls);
  return urls;
}

// ------------ GET REQUESTS------------------------------------------------------------------------------ //

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", isLoggedIn, (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  let userID = req.session.userID;
  if (!userID) {
    res.redirect("/login");
  } else {
    // let urls = urlDatabase[userID];
    let urls = getUrlsForUser(userID);
    console.log(urls);
    let templateVars = {
      //users: users,
      urls: urls,
     // urls: urlDatabase[req.params.id]
      userID: userID
    };
    res.render("urls_index", templateVars);
  }
});

// route to present the form to the user
app.get("/urls/new", isLoggedIn, (req, res) => {
  let userID = req.session.userID;
  let templateVars = {
    users: users,
    urls: urlDatabase[userID]
  };
  res.render("urls_new", templateVars);
});

// new that add another page for displaying a single URL and its shortened form.
app.get("/urls/:id", (req, res) => {
  let userID = req.session.userID;
  let id = req.params.id;
  let urls = getUrlsForUser(userID);
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    //user: userID;
    //urls: urls;
  };
  res.render("urls_show", templateVars);
});

// redirect shortUrls to its longURL
app.get("/u/:id", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL.url);
});

app.get("/login", (req, res) => {
  let userID = req.session.userID;
  let templateVars = {
    users: users
  };
  res.render("login", templateVars);
});

// returns a page that includes a form with an email and password field.
app.get("/register", (req, res) => {
  let userID = req.session.userID;
  let templateVars = {
    users: users
  }
  res.render("register", templateVars);
});

// ------------ POST REQUESTS ---------------------------------------------------------------------------- //

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
    // saveUrlsForUser(userID, {
    //   longURL: req.body.longURL,
    //   shortURL: generateRandomString()
    // });
    console.log(urlDatabase);
    res.redirect("urls/" + shortURL);
  } else {
    res.status(403).send("Sorry! You are not logged in, yet.");
  }
});

// route to receive the new url form submission
app.post("/urls/new", (req, res) => {
  let userID = req.session.userID;
  saveUrlsForUser(userID, {
    longURL: req.body.longURL,
    shortURL: generateRandomString()
  });
  res.redirect("/urls");
});

//  POST route that removes a URL resource
app.post("/urls/:id/delete", isUsersUrl, (req, res) => {
  let userID = req.session.userID;
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// update the corresponding longURL and redirect the client back to "/urls"
app.post("/urls/:id", isUsersUrl, (req, res) => {
  if (urlDatabase[req.params.id].userID === req.session.userID) {
    urlDatabase[req.params.id].url = req.body.longURL;
  }
  res.redirect("/urls");
});

// add an endpoint to handle a POST to /login
// set cookie "username"
// Modify the existing POST /login endpoint so that it uses the new form data and sets the userID cookie on successful login.
app.post("/login", (req, res) => {
  let userID = req.session.userID;
  let email = req.body.email;
  let password = req.body.password;

  for (user in users) {
    if (email !== users[user].email) {
      res.status(403).send("You have not registered yet...");
    } else {
      bcrypt.compareSync(password, users[user].password, 10, function(err, res) {
        if (true) {
          req.session.userID = user;
          res.redirect("/urls");
        } else {
        res.status(403).send('Login information not found.');
        res.redirect('/login');
        }
      });
    }
  }
});

// logout endpoint so that it clears the username cookie and redirects the user back to the /urls page
app.post("/logout", (req, res) => {
  let userID = req.session.userID;
  req.session = null;
  res.redirect("/urls");
});

// getting info from user registration/ Registration Handler
// If the e-mail or password are empty strings, send back a response with the 400 status code
app.post("/register", (req, res) => {

  let userID = generateRandomString();
  let userEmail = req.body.email;
  let password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  let user = {};

  if (!userEmail || !password) {
    res.status(400).send("Bad Request");
  } else {
    for (var key in  users) {
      if (userEmail === users[key].email) {
        res.send("E-mail already registered");
        return;
      }
    }
    console.log("random generate ", userID);
    user = {
      email: userEmail,
      password: hashedPassword
    }
    users[userID] = user;
    console.log("users database ", users);
    req.session.userID = userID;
    res.redirect("/urls");
  }
});
