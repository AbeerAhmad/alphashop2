var express = require('express');
var bodyParser = require("body-parser");
var server = express();
var session = require('express-session');
let LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');
var mongoose = require('mongoose');
var flash = require('connect-flash');
var multer = require('multer');
var path = require('path')



server.use(express.static('./build'))
server.use(bodyParser.urlencoded({ extended: true }))
server.use(bodyParser.json())

server.use(flash());
server.use(express.static('./uploads'));
server.use(express.static('./'));



mongoose.connect('mongodb://abeer:asad1234@ds115071.mlab.com:15071/alphashop', { useNewUrlParser: true })
mongoose.connection.once('open', function () { console.log('Successfully Connected to DB') })
const User = mongoose.model('user', { password: String, contact: Number, email: String, name: String });
const AD = mongoose.model('ad', { type: String, purpose: String, location: String, area: Number, unit: String, price: Number, recommendation: Array, files: Array, Address: String, user_id: String })



// passport






passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
},
    function (req, email, password, done) {
        process.nextTick(function () {
            User.findOne({ email: email }, function (err, user) {
                if (err)
                    return done(err);
                if (!user) {
                    return done(null, false);
                }
                if (user.password !== password) {
                    return done(null, false);
                }
                return done(null, user);
            })
        })
    }));;




passport.serializeUser(function (user, next) {
    next(null, user)
})
passport.deserializeUser(function (_id, next) {
    User.findOne({ _id: _id }, (err, user) => {
        next(null, user)
    })
    // next(null, user);
})
server.use(session({ secret: "secret-word" }));
server.use(passport.initialize());
server.use(passport.session());

server.post('/signin', passport.authenticate('local'), function (req, res) {

    res.json(req.user)

})
//passport ends


server.post('/signup', function (req, res) {
    var email = req.body.email;
    User.findOne({ email: email }, function (err, user) {
        if (err)
            res.json({ msg: 'something went wrong ' });
        if (user) {
            res.json({ taken: true })
        } else {
            var newUser = new User({ password: req.body.password, contact: req.body.contact, email: req.body.email, name: req.body.name });
            newUser.save(() => console.log('added to db'))
            res.json({ success: true })
        }
    })
})


server.post('/userads', (req, res) => {
    let id = req.body.id

    AD.find({
        user_id: id
    }).exec(function (err, ads) {
        if (err) {
            return res.json({ success: false, err: err })
        }
        res.json(ads)
    });
})
server.get('/allrentals', (req, res) => {


    AD.find({
    }).exec(function (err, ads) {
        if (err) {
            return res.json({ success: false, err: err })
        }
        res.json(ads)
    });
})





var customConfig = multer.diskStorage({
    destination: function (req, file, next) {
        next(null, path.join(__dirname, './uploads'))
    },
    filename: function (req, file, next) {
        next(null, Math.floor(Math.random() * 100000000) + '-' + file.originalname)
    }
})
var upload = multer({ storage: customConfig })


server.post('/create', upload.array('file'), function (req, res) {
    let ad = new AD({ type: req.body.type, purpose: req.body.purpose, location: req.body.city, area: req.body.area, unit: req.body.unit, price: req.body.price, recommendation: req.body.recommendation, files: req.files, Address: req.body.address, user_id: req.body.userid })

    ad.save(() => console.log('added to db'))
    res.send(ad)

})

//Search area
server.post('/searching', (req, res) => {
    let city = req.body.city
    let prefer = req.body.prefer

    AD.find({
        location: city,
        recommendation: prefer,

    }).exec(function (err, users) {
        if (err) {
            return res.json({ success: false, err: err })
        }
        res.json(users)
    });
})

//addetails
server.post('/addetail', (req, res) => {
    let id = req.body._id
    AD.findById(id, function (err, data) {
        if (data) {
            let userid = data.user_id
            User.findById(userid, function (err, user) {
                res.json({ data, user })


            })
        }
        else {
            res.json('no result found')
        }
    })
})
// autheticate
server.get('/is_authenticated', (req, res) => {
    if (req.user) {
        res.json(req.user)
    }
    else {
        res.send(null)
    }
})
server.get('/suggestions', (req, res) => {
    AD.find((err, data) => {

        let arr = []
        for (var i = 0; i < data.length; i++) {
            arr.push(data[i].recommendation)

        }
    
        var suggest = Array.prototype.concat.apply([], arr)
    
       
        var uniq = suggest.reduce(function(a,b){
            if (a.indexOf(b) < 0 ) a.push(b);
            return a;
          },[]);




        let suggestions = []
        for (var i = 0; i < uniq.length; i++) {
            let obj = { name: uniq[i] }
            suggestions.push(obj)
        }
      
        res.json(suggestions)
       



    })

})









server.listen(process.env.PORT ||8000 , () => console.log("server is running"))