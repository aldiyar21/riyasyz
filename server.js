require('dotenv').config();
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const https = require("https")
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const PORT = process.env.PORT || 3001;

app.use(bodyParser.urlencoded({extended: true}))
app.set("view engine", "ejs")
app.use(express.json())
app.use(express.static("public"));
mongoose.connect("mongodb+srv://aldik:naiman21@riyasiz.clald.mongodb.net/?retryWrites=true&w=majority")

app.use(session({
  secret: "the secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());




/*------------------------------USER SCHEMA-----------------------------------------------*/


var UserSchema = new mongoose.Schema({
  names: [
     {
       firstname: String,
       lastname: String,
       city: String
     }
   ],
   email: String,
   password: String,
   profileImage: String,
   usertype: String,
   regDate: String
});


UserSchema.plugin(passportLocalMongoose);



const User = new mongoose.model("User", UserSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
/*-----------------------------EVENT SCHEMA------------------------------------------------*/

const partSchema = mongoose.Schema({
  mail: String,
  participationAt: String,
  idofevent:String
})
const Part = mongoose.model("part", partSchema)


const eventSchema = mongoose.Schema({
  title:{type:String, required: true},
  description: {type:String, required: true},
  category : String,
  urlToImage: String,
  company: String,
  author: String,
  publishedAt: String,
  date: String
})


const Events = mongoose.model("event", eventSchema)

app.get("/", function(req,res){
  res.render("mainmain")
})
app.route("/register")
  .get(function(req, res){
    res.render("register")
  })
  .post(function(req, res) {
    User.register({
      username: req.body.username,
      email: req.body.username,
      profileImage: req.body.url,
      usertype: req.body.category,
      regDate: new Date().toLocaleString(),
      names: [{
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        city: req.body.city
      }]
    }, req.body.password, function(err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/main");
        });
      }
    });
  })
app.route("/login")
    .get(function(req, res) {
      res.render("login")
    })
    .post(function(req, res) {

      const user = new User({
        username: req.body.username,
        passwrod: req.body.password
      })

      req.login(user, function(err) {
        if (err) {
          res.redirect("/login")

          console.log(err)
        } else {
          passport.authenticate("local")(req, res, function() {
            res.redirect("/main")
          })
        }
      })
    })
app.post("/logout", function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


app.get("/main", function(req, res){
  if(req.isAuthenticated()) {
    url = "https://newsdata.io/api/1/news?apikey=pub_7306212c069c16f8e015af01e562c887d0ca&q=volunteer&language=en"
    https.get(url, function (response) {
      let data = []
      response.on("data", function (chunk) {
        data.push(chunk)
      })
      response.on("end", function () {
        let news = JSON.parse(Buffer.concat(data).toString())
        res.render("", {newsInfo: news})
      })
    })
  }
  else{
    res.redirect("/")
  }
})

app.get("/events", function(req, res){
  if(req.isAuthenticated()){
    const category = req.query.category;
    let match = {};
    if (category) {
      match = { category: category };
    }

    Events.aggregate([
      { $match: match }
    ], function(err, foundEvent){
      if (err) {
        console.log(err);
        res.sendStatus(500);
      } else {
        res.render("events", { data: foundEvent, category: category });
      }
    });
  }
  else{
    res.redirect("/login")
  }
})

app.get("/post", function(req, res){
  if(req.isAuthenticated()&&req.user.usertype == "Organization"){
    res.render("post")
  }
  else{
    res.redirect("/main")
  }
})

app.get("/admin", function(req, res){
  if(req.isAuthenticated()&&req.user.usertype == "Organization"){
    Events.find(function(err, foundEvent){
    res.render("adminpanel", {data: foundEvent})
      })
  }
  else{
    res.redirect("/events")
  }
})

app.post("/post", function(req,res){
  const events = new Events({
    title:req.body.title,
    description:req.body.content,
    category:req.body.category,
    urlToImage:req.body.url,
    company:req.body.company,
    author:req.body.author,
    publishedAt:new Date().toLocaleString(),
    date: req.body.date
  })
  console.log("Post was added")
  events.save()
  res.redirect("/events")
})

app.get("/readmore/:id", function(req,res){
  Events.findOne({_id:req.params.id}, function(err,foundEvent){
      res.render("read", {news:foundEvent})
  })
})
app.post("/readmore/:id", function(req, res){
  User.find({username:req.user}, function(err,result){
    const part = new Part({
      mail: req.user.email,
      participationAt: req.body.buton,
      idofevent : req.params.id
    })
    part.save()
    res.redirect("/events")
  })

})

app.get("/profile", function(req,res){
  if(req.isAuthenticated()){
    Part.find({mail:req.user.email}, function(err, foundPart){
      res.render("profile", {user: req.user, data:foundPart})
    })
  }else{
    res.redirect("/")
  }
})
app.post("/cancel/:id", function(req, res){
  const {id}=req.params;
  Events.deleteOne({_id:id}, function(err){
    if(!err){
      res.redirect("/events");
    }
  })
})


app.listen(PORT, () => {
            console.log('Server has been started...')
        })
