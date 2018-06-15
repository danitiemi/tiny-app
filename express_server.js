const express = require("express");

//  initialize express
const app = express();

// tells the Express app to use EJS as its templating engine(views)
app.set("view engine", "ejs");

// The body-parser library will allow us to access POST request parameters
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// cookieParser
var cookieParser = require('cookie-parser');
app.use(cookieParser());

// start the server
const PORT = 8080; // default port 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// simulate generating a "unique" shortURL, produces a string of 6 random alphanumeric characters:
function generateRandomString() {
  let randomString = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomString;
}

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// used to store and access the users in the app.
let users = {
  "userRandomID": {
    id: "",
    email: "dog@example.com",
    password: "111"
  },
 "user2RandomID": {
    id: "",
    email: "cat@example.com",
    password: "0"
  }
};

// defining (registering) a HTTP GET request on "/""
// along with a callback func that will handle the request
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// new route handler for "/urls" and use res.render() to pass the URL data to your template.
//
app.get("/urls", (req, res) => {
  var templateVars = { urls: urlDatabase, users: users };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  var templateVars = {users: users};
  res.render("urls_new", templateVars);
});

// new that add another page for displaying a single URL and its shortened form.
app.get("/urls/:id", (req, res) => {
  var templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], users: users };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/users.json", (req, res) => {
  res.json(users);
});

// app.get("/hello", (req, res) => {
//   res.end("<html><body>Hello <b>World</b></body></html>\n");
// });

// fix it!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

function validateData(data) {
  if (data.longURL && data.longURL.length > 0) {
    return true;
  }
  return false;
}

app.post("/urls", (req, res) => {
  var valid = validateData(req.body);
  console.log('is valid',valid);
  if (valid) {
    // const urlDatabase = {
    //   : req.body.longURL
    // }
    var shortURL = generateRandomString();
    var longURL = req.body.longURL;
    urlDatabase[shortURL] = longURL;
    res.redirect("urls/" + shortURL);
  }
  else {
    // error
    res.render("urls_new", {
      error: "Please, enter a valid URL."
    });
  }
});

//  POST route that removes a URL resource
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// modify the corresponding longURL and redirect the client back to "/urls"
app.post("/urls/:id", (req, res) => {
  let id = req.params.id;
  let longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
})

// add an endpoint to handle a POST to /login
// set cookie "username"
// Modify the existing POST /login endpoint so that it uses the new form data and sets the user_id cookie on successful login.
app.post("/login", (req, res) => {
  // let userId = cookie?;
  let email = req.body.email;
  let password = req.body.password;
  let userID = req.cookies["userID"];
  // console.log(email, password, users);


  if (!email || !password) {
    res.status(403).send('Bad Request');
  } else {
    for (user in users) {
      if (email === users[user].email && password === users[user].password) {
        // res.cookie("userID", userID);
        res.redirect("/");
        return;
      } else {
        res.status(403).send('Bad Request');
      }
    }
  }
});

// /logout endpoint so that it clears the username cookie and redirects the user back to the /urls page
app.post("/logout", (req, res) => {
  let userID = req.cookies["userID"];
  console.log(req.cookies);
  res.clearCookie("userID", userID);
  res.redirect("/urls");
  // console.log(userID);
});

// returns a page that includes a form with an email and password field.
app.get("/register", (req, res) => {
  res.render("registration");
});

// getting info from user registration/ Registration Handler
// If the e-mail or password are empty strings, send back a response with the 400 status code
app.post("/register", (req, res) => {

  let userID = generateRandomString();
  let userEmail = req.body.email;
  let password = req.body.password;
  let user = {};

  if (!userEmail || !password) {
    res.send('email ou senha vazia');
  } else {
    for (user in users) {
      if (userEmail === users[user].email) {
        res.send('email ja existe');
        return;
      } else {
        user = {
          id: userID,
          email: userEmail,
          password: password
        }
        users[userID] = user;
        res.cookie("userID", userID);
        res.redirect("/urls");
      }
    }
  }

  // console.log(Object.keys(users).length);
  // console.log(users);

  // if (userEmail.length === 0 || password.length === 0) {
  //   res.status(400).send('Bad Request');
  // } else {
  //   for (user in users) {
  //     user[id]: userId,
  //     user[email]: req.body.email,
  //     user[password]: req.body.password
  //   }
  //   res.cookie("user_id", userId);
  //   // console.log("HEREEEEE!!!", userID);
  //   res.redirect("/urls");
  // }
});

app.get("/:shortURL", (req, res) => {
  var longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

