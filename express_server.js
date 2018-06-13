var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
// The body-parser library will allow us to access POST request parameters
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// tells the Express app to use EJS as its templating engine
app.set("view engine", "ejs");

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

// new route handler for "/urls" and use res.render() to pass the URL data to your template.
app.get("/urls", (req, res) => {
  var templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// new that add another page for displaying a single URL and its shortened form.
app.get("/urls/:id", (req, res) => {
  var templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => {
  var shortURL = generateRandomString();
  var longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect("urls/" + shortURL);
});


app.get("/u/:shortURL", (req, res) => {
  var longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});