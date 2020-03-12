//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");

const homeStartingContent = "You can find a summary of my daily reads and thoughts here";
const aboutContent = "I'm a computer scientist, husband, father and IT geek who follows the stock market and has a lot of curiosity about finding a relevant meditation with the goal of happiness and well-being";
const contactContent = "you can contact me through my email : mehrdad.azh@gmail.com";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
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

const postSchema = {
  title: String,
  content: String
};
const Post = mongoose.model("Post", postSchema);

const userSchema = new mongoose.Schema({
  email : String,
  password : String
});
userSchema.plugin(encrypt, { secret : process.env.KEY , encryptedFileds : ["password"]});
const User = mongoose.model("User", userSchema);

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
  res.send("Please login..");
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
  User.findOne({email : req.body.username }, function(err, foundUser){
    if(foundUser && foundUser.password === req.body.password){
      res.render("compose");
    }else{
      res.send("Username and Password does not match!");
    }
  })
});

//for now only admin is registered

app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", function(req, res){
  const user = new User({
    email : req.body.username,
    password : req.body.password
  });
  user.save(function(err){
      if (!err){
          res.redirect("/");
      }else{
        console.log(err);
      }
    });
});

app.listen(process.env.PORT || 3000, function() {
  console.log("###Server started on port 3000");
});
