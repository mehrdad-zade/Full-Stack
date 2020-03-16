//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
//const encrypt = require("mongoose-encryption");//md5 is more powerful
//const md5 = require("md5");//hashing..bcrypt is stronger
// const bcrypt = require("bcrypt"); //replaced to use cookies and passport
// const saltRounds = 10; //replaced to use cookies and passport
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const homeStartingContent = "You can find a summary of my daily reads and thoughts here";
const aboutContent = "I'm a computer scientist, husband, father and IT geek who follows the stock market and has a lot of curiosity about finding a relevant meditation with the goal of happiness and well-being";
const contactContent = "you can contact me through my email : mehrdad.azh@gmail.com";
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({secret : "our little secret", resave : false, saveUninitialized : false}));//initialize session
app.use(passport.initialize());
app.use(passport.session());

const uri = "mongodb+srv://" + process.env.ADMIN + ":" + process.env.PASSWORD + "@mongodbcluster-qiqmh.mongodb.net/blogDB";
//mongoose.connect(uri, {useNewUrlParser: true});
mongoose.connect(uri, function(err, client) {
   if(err) {
        console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
   }
   console.log('###MongoDB Atlas is Connected...');
   const collection = client.db("test").collection("devices");
   // perform actions on the collection object
   client.close();
});
mongoose.set("useCreateIndex", true);

const postSchema = {
  title: String,
  content: String
};
const Post = mongoose.model("Post", postSchema);

const userSchema = new mongoose.Schema({
  email : String,
  password : String
});

userSchema.plugin(passportLocalMongoose);

//userSchema.plugin(encrypt, { secret : process.env.KEY , encryptedFileds : ["password"]});//md5 is mode powerful
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());//add a cookie with user info
passport.deserializeUser(User.deserializeUser());//get user ID

app.get("/", function(req, res){
  Post.find({}, function(err, posts){
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts
      });
  });
});

//we don't want access to compose unless people are logged in
app.get("/compose", function(req, res){
  if(req.isAuthenticated()){
    res.render("/compose");
  }else{
    res.render("/login");
  }
});

app.post("/compose", function(req, res){
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });


post.save(function(err){
    if (!err){
        res.redirect("/");
    }
  });
});

app.get("/posts/:postId", function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      title: post.title,
      content: post.content
    });
  });

});

app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});

app.get("/login", function(req, res){
  res.render("login");
});

app.post("/login", function(req, res){
  //***********************************Registration with bcrypt*****************
  // //const bodyPassword = md5(req.body.password)
  // User.findOne({email : req.body.username }, function(err, foundUser){
  //   if(foundUser){
  //     bcrypt.compare(req.body.password, foundUser.password, function(err, bcryptResult){
  //       if(bcryptResult === true){
  //         res.render("compose");
  //       }
  //     });
  //   }else{
  //     res.redirect("/login");
  //   }
  // })
  // replaced bcrypt to use cookies and passport

  //***********************************Registration with passport/session*******
  const user = new User({
    username : req.body.username,
    password : req.body.password
  });
  req.login(user, function(err){//login is a passport method
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function(){
        res.render("compose");
      });
    }
  });
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
})

//for now only admin is registered

app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", function(req, res){
  //***********************************Registration with bcrypt*****************
  // bcrypt.hash(req.body.password, saltRounds, function(err, hash){
  //   const user = new User({
  //     email : req.body.username,
  //     password : hash
  //   });
  //   user.save(function(err){
  //       if (!err){
  //           res.redirect("/");
  //       }else{
  //         console.log(err);
  //       }
  //     });
  // });
  //replaced to use cookies and passport
  //***********************************Registration with passport/session*******
  User.register({ username : req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/login");
      });
    }
  });
});

app.listen(process.env.PORT || 3000, function() {
  console.log("###Server started on port 3000");
});
