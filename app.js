//jshint esversion:6
require("dotenv").config();
const express= require("express");
const bodyParser= require("body-parser");
const ejs= require("ejs");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const  mongoose= require("mongoose");
const session = require("express-session");
const passport= require("passport");
const passportLocalMongoose= require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const AmazonStrategy = require("passport-amazon").Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const GitHubStrategy = require("passport-github").Strategy;
const findOrCreate = require("mongoose-findorcreate");

// const encrypt= require("mongoose-encryption");
const app = express();




app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb+srv://admin-ayan:radhaswami@ayans.pb3xa.mongodb.net/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});





const userschema = new mongoose.Schema({
  username: {
    type: String,
    
  },
  password: {
    type: String,
    
  },
  googleId: String,
  facebookId: String,
  instagramId: String,
  githubId: String,
  secrets: [String],
});


userschema.plugin(passportLocalMongoose);
userschema.plugin(findOrCreate);

// userschema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// });

const User= mongoose.model("users", userschema);


passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});



passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});



passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) { 
      
      
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);


passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FB_ID,
      clientSecret: process.env.FB_SECRET,
      callbackURL: "https://18c8ef720c96.ngrok.io/auth/facebook/secrets",
      
    },
    function (accessToken, refreshToken, profile, cb) {
      // console.log(profile.id);

      User.findOrCreate({ facebookId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);
passport.use(new GitHubStrategy({
    clientID: process.env.GIT_ID,
    clientSecret: process.env.GIT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ githubId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req,res){
    res.render("home");
})


app.get("/login", function (req, res) {
    res.render("login");
})


app.get("/register", function (req, res) {
    res.render("register");
})

app.get("/logout", function(req,res){
    req.logout();
    res.redirect("/");
})

app.get("/secrets", function(req,res){
  if(req.isAuthenticated())
  res.render("secrets",{secrets: req.user.secrets});
  else
  res.redirect("/login");
})
app.get("/submit", function(req,res){
   if (req.isAuthenticated())
    res.render("submit");
   else 
    res.redirect("/login");
})


app.get('/auth/google',
  passport.authenticate("google", { scope: ["profile"] }));


app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // if successful redirect to secrets page
    res.redirect("/secrets");
  }
);

app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
  "/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  }
);

app.get('/auth/github',
  passport.authenticate('github'));

app.get('/auth/github/secrets', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });


app.post("/register", function(req,res){


    // bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    //     let details = new User({
    //       username: req.body.username,
    //       password: hash,
    //     });

    //     details.save(function (err) {
    //       if (err) console.log(err);
    //       else
    //         res.write(
    //           "<h1 style='text-align: center;'>Successfully REGISTERED!!</h1>"
    //         );
    //       res.send();
    //     });

    // });
    User.register({username:req.body.username }, req.body.password, function(err, user) {
  if(err) 
    {
      
      console.log(err);
      
      res.redirect("/register");
      }
      else{
       passport.authenticate("local")(req, res, function(){
         res.redirect("/secrets");
       })

      }
 
  
});

})


app.post("/login", function(req,res){
    // uid= req.body.username;
    // pwd= req.body.password;
    // User.findOne({username: uid}, function(err,details){
       
    //     if(!err){
    //         bcrypt.compare(pwd, details.password, function (err, result) {
              
    //           if(result === true)
    //           res.render("secrets");
    //           else{
    //               res.write(
    //                 "<h1 style='color: red;text-align: center;'>ERROR:username or password is incorrect!!</h1>"
    //               );
    //               res.send();
    //           }

    //         });
    //     }
        
        
    //     else{
    //         res.write("<h1 style='color: red;'>ERROR:username or password is incorrect!!</h1>");
    //         res.send();
    //     }
    // })

    const user= new User({
      username: req.body.username,
      password:req.body.password
    });

    req.login(user, function (err) {
      if (err) {
        console.log(err);
      }
      else{
          passport.authenticate("local")(req, res, function () {
            res.redirect("/secrets");
          });

      }
    });
    
})



app.post("/submit", function(req,res){
  const secret= req.body.secret;
console.log(req);

 
 User.findOne({$or:[{facebookId: req.user.facebookId},{googleId:req.user.googleId},{githubId: req.user.githubId}]}, function(err,profile){
   console.log(profile);
   
   if(!err){
     profile.secrets.push(secret);
     profile.save();
   }
 });

 
 res.redirect("/submit");
 

})



app.listen(process.env.PORT||3000, function(req,res){
    console.log("Server started at port 3000");
})