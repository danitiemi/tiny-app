const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// tells the Express app to use EJS as its templating engine(views)
app.set("view engine", "ejs");

// The body-parser library will allow us to access POST request parameters
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var cookieParser = require('cookie-parser');
app.use(cookieParser());

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
    id: "mmm",
    email: "dog@example.com",
    password: "111"
  },
 "user2RandomID": {
    id: "mmm",
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
// function urlsForUser(id) {
//   let userURL = [];
//   for (userID in urlDatabase) {
//     if (userID === urlDatabase[shortURL].userID) {
//       userURL.push(req.body.url);
//     }
//   }
//   return userURL;
// }

// ------------ GETs -------------------------------------------------------------------------------------- //

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/users.json", (req, res) => {
  res.json(users);
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

// new route handler for "/urls" and use res.render() to pass the URL data to your template.
app.get("/urls", (req, res) => {
  // let userID = req.cookies["userID"];
  let templateVars = {
    users: users,
    urls: urlDatabase
    // urls: urlsForUser(userID)
  };
  res.render("urls_index", templateVars);
});

// route to present the form to the user
app.get("/urls/new", (req, res) => {
  let userID = req.cookies["userID"];
  let templateVars = {
    longURL: req.body.longURL,
    users: users
  };
  if (!userID) {
    res.redirect("/login");
  } else {
  res.render("urls_new", templateVars);
  }
});

// new that add another page for displaying a single URL and its shortened form.
app.get("/urls/:id", (req, res) => {
  // let userID = req.cookies["userID"];
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
  let templateVars = {
    users: users
  }
  //   password: req.body.password,
  //   email: req.body.email};
   // console.log("00000000000000000000000000000" );
  res.render("login", templateVars);
});

// returns a page that includes a form with an email and password field.
app.get("/register", (req, res) => {
  res.render("registration");
});

app.get("/:shortURL", (req, res) => {
  var longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

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

//   if (!userID) {
//     res.render("/register", {
//       error: "Log in ou register first."
//     });
//   } else if (req.body.longURL && req.body.longURL.length > 0) {
//     var shortURL = generateRandomString();
//     var longURL = req.body.longURL;
//     urlDatabase[shortURL] = longURL;
//     res.redirect("urls/" + shortURL);
//   } else {
//     res.render("urls_new", {
//       error: "Please, enter a valid URL."
//     });
//   }
// });

// route to receive the new url form submission
app.post("/urls/new", (req, res) => {
  let userID = req.cookies["userID"];
  let newUrl = {
    urls: req.body.longURL,
    userID: userID
  }
  urlDatabase[userID] = newUrl;
  res.redirect("/urls");
});

//  POST route that removes a URL resource
app.post("/urls/:id/delete", (req, res) => {
  // let userID = req.cookies["userID"];
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// modify the corresponding longURL and redirect the client back to "/urls"
app.post("/urls/:id", (req, res) => {
  // let userID = req.cookies["userID"];
  let id = req.params.id;
  // if (!userID) {
  //   res.render("/register", {
  //     error: "Log in ou register first."
  //   });
  // }
  let longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect("/urls");
});

// add an endpoint to handle a POST to /login
// set cookie "username"
// Modify the existing POST /login endpoint so that it uses the new form data and sets the user_id cookie on successful login.
app.post("/login", (req, res) => {
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
        res.redirect("/urls");
        return;
      } else {
        res.status(403);
         // .send('Bad Request')
        res.redirect('/login');
      }
    }
  }
});

//   if (email && email === users[userID].email && password && password === users[userID].password) {
//     res.redirect('/urls');
//     return;
//   } else {
//     res.status(403).send('Username and/ or password are incorrect');
//     res.redirect('/login');
//   }
// });

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
});
  // console.log(Object.keys(users).length);
  // console.log(users)




