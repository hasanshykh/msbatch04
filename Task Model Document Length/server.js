const express = require('express')
const next = require('next')
const mongoose = require('mongoose'),
      bodyParser = require('body-parser'),
      passport = require('passport'),
      cookieParser = require('cookie-parser'),
      session = require('express-session')
const passportConf = require('./config/passport');
const fs = require('fs');
const NodeRSA = require('node-rsa');
const key = new NodeRSA({b: 512});
const secret = require('./config/secret');
const User = require('./models/user');
const Admin = require('./models/Admin');
const Webmaster = require('./models/Webmaster');
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
var NUMBER = [];
//Connect to Db
mongoose.connect(secret.database,(err)=>{
    if(err){console.error(err)}
    else{console.log("Database connected")}
})

app.prepare()
.then(() => {
  const server = express()

   //MIDDLEWARE
  server.use(bodyParser.json())
  server.use(bodyParser.urlencoded({extended: false}))
  server.use(cookieParser())
  server.use(session({
    secret: process.env.SESSION_SECRET || secret.key,
    resave: false,
    saveUninitialized: false
  }))
  server.use(passport.initialize())
  server.use(passport.session())

  server.get('/data',(req,res) =>
 {
User.find().exec(function (err, results) {
  NUMBER.push(" User: "+results.length)
});
Admin.find().exec(function (err, results) {
NUMBER.push(" Admin: "+results.length)
});
Webmaster.find().exec(function (err, results) {
NUMBER.push(" Webmaster: "+results.length)
});
  res.json(NUMBER);
  NUMBER=[];
 })
  server.get('/',(req,res)=>{
      if(req.user){
        var path = fs.readFileSync('./db/path.info','utf-8');
          app.render(req,res,'/'+path,req.query);
      }
      else{
          res.redirect('/index');
      }
  })


  server.post('/loginUser',passport.authenticate('user',{failureRedirect:'/loginUser'}),(req,res) => {
    var encrypted = key.encrypt(req.user.username, 'base64');
    var path="UserLoggedIn";
    fs.writeFileSync('./db/path.info',path);
    fs.writeFileSync('./db/user.info',encrypted);
      res.redirect('/UserLoggedIn');
  })

  server.post('/loginAdmin',passport.authenticate('admin',{failureRedirect:'/loginAdmin'}),(req,res) => {
    var encrypted = key.encrypt(req.user.username, 'base64');
    fs.writeFileSync('./db/user.info',encrypted);
    var path="AdminLoggedIn";
    fs.writeFileSync('./db/path.info',path);
      res.redirect('/AdminLoggedIn');
  })
  server.post('/loginWebmaster',passport.authenticate('webmaster',{failureRedirect:'/loginWebmaster'}),(req,res) => {
    var encrypted = key.encrypt(req.user.username, 'base64');
    fs.writeFileSync('./db/user.info',encrypted);
    var path="loggedIn";
    fs.writeFileSync('./db/path.info',path);
      res.redirect('/loggedIn');
  })
  server.get('/userdata',(req,res)=>{
     var encrypted = fs.readFileSync('./db/user.info','utf-8');
     var decrypted = key.decrypt(encrypted, 'utf8');
     res.json(decrypted);
 })
  server.post('/signup',(req,res) => {
      var user = new User();
      user.username = req.body.username;
      user.password = req.body.password;
      user.role = "User";
      var encrypted = key.encrypt(req.body.username, 'base64');
      fs.writeFileSync('./db/user.info',encrypted);
      user.save((err,user) => {
          if(err){console.error("Error: ", err)}
          else{res.redirect('/loginUser')}
      })
  })
  server.post('/AddAdmin',(req,res) => {
      var admin = new Admin();
      admin.username = req.body.username;
      admin.password = req.body.password;
      admin.role = "Admin";
      admin.save((err,user) => {
          if(err){console.error("Error: ", err)}
          else{res.redirect('/AdminLoggedIn')}
      })
  })
  server.post('/AddWebmaster',(req,res) => {
      var webmaster = new Webmaster();
      webmaster.username = req.body.username;
      webmaster.password = req.body.password;
      webmaster.role = "Webmaster";
      webmaster.save((err,user) => {
          if(err){console.error("Error: ", err)}
          else{res.redirect('/AdminLoggedIn')}
      })
  })
   server.post('/logout', (req, res) =>
   {
     req.logout();
     res.clearCookie('connect.sid');
     res.redirect('/');
   })
  server.get('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(secret.port, (err) => {
    if (err) throw err
    console.log('> Ready on http://localhost:'+secret.port)
  })
})
