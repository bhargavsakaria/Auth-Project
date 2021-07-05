require("dotenv").config();
const express               = require("express");
const ejs                   = require("ejs");
const bodyParser            = require("body-parser");
const mongoose              = require("mongoose");
const session               = require("express-session");
const passport              = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy        = require("passport-google-oauth20");
const findOrCreate          = require("mongoose-findorcreate");
const FacebookStrategy      = require("passport-facebook").Strategy;
// const bcrypt     = require("bcrypt");
// const saltRounds = 10;
// const encrypt    = require("mongoose-encryption");

const app = express();

// Adds Public directory
app.use(express.static("public"));

app.set("view engine", 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

// Creates session
app.use(session({
	secret: "This is my little secret",
	resave: false,
	saveUninitialized: false
}));

// Initialized passport and uses session
app.use(passport.initialize());
app.use(passport.session());

// PORT 3000 opened
app.listen(3000, console.log("Server running on port 3000"));

// Mongoose mongoDB connected
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

// User schema defined
const userSchema = new mongoose.Schema({
	email: String,
	password: String,
	googleId: String,
	facebookId: String
});

// Schema plugins
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Initialized new User model with mongoose
const User = new mongoose.model("User", userSchema);

// User model now uses passport's stretegies
passport.use(User.createStrategy());

// passport serialize User
passport.serializeUser(function (user, done) {
	done(null, user.id);
});

// passport deserialize User
passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

// passport's Google OAuth 2.0 code
passport.use(
	new GoogleStrategy(
		{
			clientID      : process.env.GOOGLE_CLIENT_ID,
			clientSecret  : process.env.GOOGLE_CLIENT_SECRET,
			callbackURL   : "http://localhost:3000/auth/google/secrets",
			userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
		},
		function (accessToken, refreshToken, profile, cb) {
			User.findOrCreate({ googleId: profile.id }, function (err, user) {
				return cb(err, user);
			});
		}
	)
);
		
// passport's Facebook OAuth code
passport.use(
	new FacebookStrategy(
		{
			clientID: process.env.FACEBOOK_APP_ID,
			clientSecret: process.env.FACEBOOK_APP_SECRET,
			callbackURL: "http://localhost:3000/auth/facebook/secrets",
		},
		function (accessToken, refreshToken, profile, cb) {
			User.findOrCreate({ facebookId: profile.id }, function (err, user) {
				return cb(err, user);
			});
		}
	)
);

// routes
app.get("/", function (req, res) {
	res.render("home");
});

// app routes & 
// passport authentication to social accounts &
// defined scope of social information
app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));
app.get("/auth/facebook", passport.authenticate("facebook"));

// route to access google's app authentication & redirect to secrets
app.get("/auth/google/secrets", passport.authenticate("google", { failureRedirect: "/login" }),
	function (req, res) {
		// Successful authentication, redirect home.
		res.redirect("/secrets");
	}
);

// route to access facebook's app authentication & redirect to secrets
app.get("/auth/facebook/secrets", passport.authenticate("facebook", { failureRedirect: "/login" }),
	function (req, res) {
		// Successful authentication, redirect home.
		res.redirect("/secrets");
	}
);

// app routes
app.get("/login", function (req, res) {
	res.render("login");
});
app.get("/register", function (req, res) {
	res.render("register");
});

app.get("/secrets", function(req, res) {
	if(req.isAuthenticated()){
		res.render("secrets");
	} else {
		res.redirect("/login");
	}
});

// passport local mongoose way!
/* app.post("/register", function(req, res) {
	User.register({username: req.body.username}, req.body.password, function(err, user) {
		if(err) {
			console.log(err);
			res.redirect("/register");
		} else {
			passport.authenticate("local")(req, res, function(){
				res.redirect("/secrets");
			})
		}
	})
});

app.post("/login", function (req, res) {
	const user = new User({
		username: req.body.username,
		password: req.body.password
	});

	req.login(user, function(err) {
		if(err) {
			console.log(err);
		} else {
			passport.authenticate("local")(req, res, function() {
				res.redirect("/secrets");
			});
		}
	});
}); */

app.get("/logout", function(req, res) {
	req.logout();
	res.redirect("/");
});
// bcrypt way!
/* app.post("/register", function(req, res) {
	bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
		if(err) {
			console.log(err);
		} else {
			console.log(hash);
			const newUser = new User({
				email: req.body.username,
				password: hash,
			});
			
			newUser.save(function (err) {
				if (err) {
					console.log(err);
				} else {
					res.render("secrets");
				}
			});
		}
	});
});

app.post("/login", function(req, res) {
	const username = req.body.username;
	const password = req.body.password;

	User.findOne(
		{email: username},
		function(err, foundUser) {
			if(err) {
				console.log(err);
			} else {
				if(foundUser) {
					bcrypt.compare(password, foundUser.password, function (err, result) {
						if(result == true) {
							res.render("secrets");
						} else {
							console.log(err);
						}
					});
				}
			}
		}
	);
}); */