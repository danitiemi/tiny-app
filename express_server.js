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

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// defining (registering) a HTTP GET request on "/""
// along with a callback func that will handle the request
app.get("/", (req, res) => {
  res.end("Hello!");
});

// new route handler for "/urls" and use res.render() to pass the URL data to your template.
//
app.get("/urls", (req, res) => {
  var templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
  console.log("HEREEEEE!!!",templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// new that add another page for displaying a single URL and its shortened form.
app.get("/urls/:id", (req, res) => {
  var templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

// fix it!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

function validateData(data) {
  if (data.longURL && data.longURL.length > 0) {
    return true;
  }
  return false;
}

app.post("/urls", (req, res) => {
  var valid = validateData(req.body);
console.log('ís valid',valid)
  if (valid) {
    // const urlDatabase = {
    //   : req.body.longURL
    // }
    var shortURL = generateRandomString();
    var longURL = req.body.longURL;
    urlDatabase[shortURL] = longURL;
    res.redirect("urls/" + shortURL);
  } else {
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
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

// add an endpoint to handle a POST to /login
// set cookie "username"
app.post("/login", (req, res) => {
  let username = req.body.username;
  res.cookie("username", username);
  res.redirect("/urls");
});

// /logout endpoint so that it clears the username cookie and redirects the user back to the /urls page
app.post("/logout"), (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
}

app.get("/u/:shortURL", (req, res) => {
  var longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

