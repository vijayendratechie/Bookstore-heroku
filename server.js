const express = require("express");
const session = require("express-session");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const flash = require("connect-flash");
const path = require("path");
const bodyparser = require("body-parser");
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const promise = require('promise');

const Schemas = require("./models/schemas");
const Users = Schemas.users;
const Books = Schemas.books;
const Purchases = Schemas.purchases;

mongoose.connect("mongodb+srv://vijju:vijju@cluster0-ex1xq.mongodb.net/bookstore-heroku?retryWrites=true&w=majority", 
				{ useNewUrlParser: true});

var app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine","ejs");


app.use(bodyparser());
app.use(express.static(path.join(__dirname,"static")));
app.use(cookieParser());

app.use((req,res,next) => {
	res.header("Access-Control-Allow-Origin","*");
	res.header("Access-Control-Allow-Headers","*");
	if(req.method === 'OPTIONS')
	{
		res.header('Access-Control-Allow-Methods','GET, POST');
		return res.status(200).json({});
	}
	next();
});


app.use(session({
	secret : 'key',
	resave : false,
	saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

passport.use(new localStrategy({
	usernameField : 'email',
	passwordField : 'password',
	passReqToCallback : true
	},
	function(req,email,password,done)
	{	

		
		Users.find({email : email})
		.exec()
		.then(result =>	{
			//console.log("email is:"+JSON.stringify(result[0]));	
			if(result.length == 1)
			{
				if(result[0].toObject().hasOwnProperty('password'))
				{
					bcrypt.compare(password, result[0].password, function(err, result1) {
					    if(err)
					    {
					    	console.log("Error while comparing password : "+err);
					    	return done(null,false);
					    } 
					    if(result1)
					    {
					    	if(result[0].confirm == 2)
					    	{
					    		//console.log("Successfully logged in");
						    	return done(null,result[0]._id);
						    		
					    	
					    	}
					    	else if(result[0].confirm == 1)
					    	{
					    		return done(null,false, {message : 'Please confirm registered email address to login'});		
					    	}				    	
					    }
					    else
					    {
					    	return done(null,false, {message : 'Wrong password'});
					    }
					});
				}
				else
				{
					return done(null,false , {message : "Login Failed"});	
				}
				
			}
			else
			{
				//console.log("EMail not registed in if");
				return done(null,false , {message : "Email is not registered. Please Signup"});
			}
		})
		.catch(err => {
			//console.log("Email not registed in else");
			return done(null,false , {message : "Please try again after sometime"});
		})

	}		
));


const port=process.env.PORT || 3000
app.listen(port,function()
{
	console.log("listen to port 3000");
});



app.post("/login",passport.authenticate(
	'local',{
	//successRedirect : "/home",	
	failureRedirect : "/failure",
	failureFlash : true
	}
),function(req,res)
{
	
	res.send({message : "success"});
	//res.redirect("/home");
});

app.get("/failure",function(req,res)
{
	console.log("Hello");
	res.json({message : req.flash("error")});
	
});

app.get("/logout",function(req,res)
{
	req.logout();
	clearcookie(res);
	res.redirect("/");
});

app.get("/signup",function(req,res) 
{	
	res.render("signup");
});

app.post("/signup",function(req,res)
{
	//console.log("req.body :"+JSON.stringify(req.body));

	Users.find({ email : req.body.email})
	.exec()
	.then((result) => {
		if(result.length == 0)
		{
			//console.log("Email does not exists");
			
			bcrypt.hash(req.body.password, 10 , function(err, hash)
			{
				if(err)
				{
					console.log("Error while hashing password");
				}
				else
				{
					const user = new Users({
						_id : new mongoose.Types.ObjectId(),
						name : req.body.name,
						email : req.body.email,	
						password : hash,
						phone : req.body.phone,
						confirm : 1,                                         //To be used later when function will be implemented to confirm email address
					});

					user.save()
					.then(() => {

						//Send confirmation email
						sendmail(req.body.email,req.body.name,res);
						//res.redirect("/?message=confirmationemailsent");	
					})
					.catch(err => {
						res.redirect("/signup");
						res.json({message : -1})     //0 error while inserting in db
					})					
				}
			});			
		}
		else if(!result[0].toObject().hasOwnProperty('password'))
		{
			bcrypt.hash(req.body.password, 10 , function(err, hash)
			{
				if(err)
				{
					console.log("Error while hashing password");
				}
				else
				{
					Users.findOneAndUpdate({email : req.body.email},{$set : {password : hash,confirm : 1}})
					.exec()
					.then(() => {
						sendmail(req.body.email,req.body.name,res);
					})
					.catch(err => {
						console.log("Error while storing signup user");
					})
				}
			});				
		}
		else
		{
			console.log("email already exists in db : "+JSON.stringify(result[0]));
			if(result[0].confirm == 2)
			{
				res.json({message : 2});    //2 email exists and verified
			}
			else if(result[0].confirm == 1)
			{
				res.json({message : 1});   //1 email exists and not verified
			}			
		}
	});
})



app.get("/",function(req,res)
{
	//res.render("homepage");
	if(req.isAuthenticated())
	{
		//console.log("on homepage"+JSON.stringify(req.query.reload));
		Users.findOne({_id : req.user}).select('name')
		.exec()
		.then(user => {

				Books.find({$and : [{addedby : {$ne : req.user}},{status : {$ne : "removed"}}]}).select('_id name desc price type status')
				.exec()
				.then(result => {
					//console.log("result is :"+JSON.stringify(result));
					res.render("homepage",{user : true,bookcollection : result});
					
				})
				.catch(err => {
					console.log("Error while fetching book information :"+ err);				
				});		
		})
		.catch(err => {
			console.log("Error while fetching username");
		})	
	}
	else
	{
		Books.find({status : {$ne : "removed"}}).select('_id name desc price type status')
		.exec()
		.then(result => {
			//console.log("result is :"+JSON.stringify(result));
			res.render("homepage",{user : false,bookcollection : result});
			
		})
		.catch(err => {
			console.log("Error while fetching book information :"+ err);				
		});
	}

})


app.post("/addbook",authenticationMiddleware(),function add(req,res)
{
	//console.log(req.body);

	Books.find
	var book = new Books({
		_id : new mongoose.Types.ObjectId(),
		name : req.body.bookname,
		desc : req.body.bookdesc,
		price : req.body.bookprice,
		type : req.body.booktype,
		addedby : req.user,
		status : "available"
	});

	book.save()
	.then(res.redirect("/myadds"))
	.catch(err => {
		console.log("Error occured while adding book : "+ JSON.stringify(err));
	})

})

app.post("/buybook",authenticationMiddleware(),function(req,res)
{
	var bookid = req.body.id;
	var user = req.user;

	console.log("buy book"+JSON.stringify(bookid));

	Books.find({_id : bookid})
	.exec()
	.then(result => {
		
		var bookname = result[0].name;
		var bookowner = result[0].addedby;

		//console.log("Book info is:"+JSON.stringify(bookname));
		
		Users.find({_id : bookowner})
		.exec()
		.then(bookowner => {

			Users.find({_id : req.user})
			.exec()
			.then(useremail => {

				sendemailtoseller(bookowner[0].email,bookowner[0].name,res,bookname,useremail[0].toObject());
				
				var purchases = new Purchases({
					_id : mongoose.Types.ObjectId(),
					email : useremail[0].email,
					bookid : bookid
				})	

				purchases.save()
				.then(() => {
					console.log("Updated in purchase table");
					
					Books.findOneAndUpdate({_id : bookid},{status : 'sold'})
					.exec()
					.then(() => {
						res.send("Sold");
					})
					.catch(err => {
						console.log("Error while updating status to sold : "+err);
					})					
				})
				.catch(err => {
					console.log("Error while saving info to purchase document : "+err);
				});				
			})
			.catch(err => {
				console.log("Error while getting email of using in buybook : "+err);
			})

		})
		.catch(err => {
			console.log("Error while getting sellers info in buybook : "+err);
		})	

	})
	.catch(err => {
		console.log("Error while selling book:"+err);
	})	
		
})


app.get("/myadds",authenticationMiddleware(),function(req,res)
{
	

	Users.findOne({_id : req.user}).select('name')
	.exec()
	.then(user => {

		Books.find({addedby : req.user}).select('_id name desc price type status')
		.exec()
		.then(mybooks => {
			res.render("myadds",{username : user.name,bookcollection : mybooks});
		})
	})
	.catch(err => {
		console.log("Error while fetching username");
	})
})

app.get("/mypurchase",authenticationMiddleware(),function(req,res)
{
	

	Users.findOne({_id : req.user}).select('name email')
	.exec()
	.then(user => {

		//console.log("user email is : "+JSON.stringify(user.email));
		Purchases.find({email : user.email}).select('bookid')
		.exec()
		.then(purchasedbooks => {
			let purchasedbooksidarr = [];
			//console.log("user purchased ids are : "+JSON.stringify(purchasedbooks));
			for(let i=0;i<purchasedbooks.length;i++)
			{	
				purchasedbooksidarr.push(purchasedbooks[i].bookid);
			}

			Books.find({_id : purchasedbooksidarr}).select('_id name desc price type status')
			.exec()
			.then(bookdetails => {
				
				//console.log("vijju purchased books details are : "+JSON.stringify(bookdetails));
				res.render("mypurchase",{username : user.name,bookcollection : bookdetails});					
			})
			.catch(err => {
				console.log("Error while fetching purchased book details");			
			});			
		})
		.catch(err => {
			console.log("Error while fetching bookid from purchase schema");			
		});	
	})
	.catch(err => {
		console.log("Error while fetching user email");
	});
});


app.get("/confirmemail",function(req,res)
{
	Users.findOneAndUpdate({email : req.query.email},{$set : {confirm : 2}})
	.exec()
	.then(result => {
		res.send("Email address verified successful");
	})
	.catch(err => {
		console.log("Email address not verified");
	})
})

passport.serializeUser(function(userid,done)
{
	done(null,userid);
});
passport.deserializeUser(function(userid,done)
{
	done(null,userid);	
		
});

function authenticationMiddleware()
{
	return (req,res,next) => 
	{
		if(req.isAuthenticated())
		{
			return next();
		}
		
		res.redirect("/");
	}	
}

function clearcookie(res)
{
	res.status(200).clearCookie('connect.sid', {
    path: '/'
  	});
}

var transporter = nodemailer.createTransport({
	service : 'gmail',
	auth : {
		type : "oauth2",	
		user : "discountedtradee@gmail.com",
		clientId : "95883734910-m9jlu2dqass2upsdu0anolbl022epddu.apps.googleusercontent.com",
		clientSecret : "ixRJZS_DeQJqYR46mAWHOkKt",
		refreshToken : "1/28Hs_ExaRXILNxVMg27fiWjq-RnpvozDdlbSKDy0VdjoITaQjPF19G37OagQ7Qpl"

		//user : 'vijayendracourse@gmail.com',
		//clientId : '734132093263-07tbcmloe50fjlfp5darjqasmeb6jovs.apps.googleusercontent.com',
		//clientSecret : 'ru8T55pLk0tEf9j2JKtCTZPd',
		//refreshToken :  '1/bnD8nGeCOvF8cN0IMKMmJaHn7U5Tsgj2oKR-gMdVPJg'	
	},
	tls: {
      rejectUnauthorized: false
  	}
})


function sendmail(email,name,res)
{
	//console.log("email while sending mail is : "+email);
	
	var mailOptions = {
	  from: 'discountedtradee@gmail.com',
	  to: email,
	  subject: 'Verify email address',
	  //html : '<a href="https://discountedtrade.herokuapp.com/confirmemail?email='+email+'" return false;>Click me</a>'
	  html : '<div>Hi '+name+',</div><p> Thank you for Signing up. Please click the link below to verify your email address.</p><b><a href="https://discountedtrade.herokuapp.com/confirmemail?email='+email+'" return false;>Verification link</a></b>'
	};	
	
	transporter.sendMail(mailOptions, function(error, info){
	  if (error) {
	    console.log("Error while sending mail : "+JSON.stringify(error));
	  } else {
	    console.log('Email sent: ' + info.response);
	    //res.redirect("/?message=confirmationemailsent");
	  	res.json({message : "verficationemailsent"});
	  }
	});
}


function sendemailtoseller(bookowneremail,bookownername,res,bookname,buyerinfo)
{
	console.log("Sending mail to seller :"+JSON.stringify(bookowneremail));
	console.log("Buyers info : "+ JSON.stringify(buyerinfo));


	if(buyerinfo.hasOwnProperty('phone') && bookowneremail=='vijayendrapagare05@gmail.com')
	{
		var mailOptions = {
		  from: 'discountedtradee@gmail.com',
		  to: bookowneremail,
		  subject: bookname+' has got an interested buyer',
		  //html : '<a href="https://discountedtrade.herokuapp.com/confirmemail?email='+email+'" return false;>Click me</a>'
		  html : '<div>Hi '+bookownername+',</div><p> Your book <b>'+bookname+'</b> has got an interested buyer.</p><p> Buyers info : </p><ul><li>'+buyerinfo.name+'</li><li>'+buyerinfo.email+'</li><li>'+buyerinfo.phone+'</li></ul>'
		};			
	}
	else
	{
		var mailOptions = {
		  from: 'discountedtradee@gmail.com',
		  to: bookowneremail,
		  subject: bookname+' has got an interested buyer',
		  //html : '<a href="https://discountedtrade.herokuapp.com/confirmemail?email='+email+'" return false;>Click me</a>'
		  html : '<div>Hi '+bookownername+',</div><p> Your book <b>'+bookname+'</b> has got an interested buyer. Please contact the buyer'+buyerinfo.name+' at '+buyerinfo.email+' for further action</p>'
		};	
	}		
	
	transporter.sendMail(mailOptions, function(error, info){
	  if (error) {
	    console.log("Error while sending mail to seller: "+JSON.stringify(error));
	  } else {
	    console.log('Email sent to seller: ' + info.response);
	    return 0;
	    //res.redirect("/?message=confirmationemailsent");
	  	//res.json({message : "verficationemailsent"});
	  }
	});
}



//Google authentication

const googlestrategy = require("passport-google-oauth20");
	
app.get("/google",passport.authenticate("google",{
	scope : ['profile','email']
}))

app.get("/google/redirect",passport.authenticate("google"),function(req,res)
{
	//console.log("Redirected from google: " +JSON.stringify(req.user));
	res.redirect("/");		
})

passport.use(
		new googlestrategy({
	callbackURL : "/google/redirect",
	clientID : "95883734910-m9jlu2dqass2upsdu0anolbl022epddu.apps.googleusercontent.com",
	clientSecret : "ixRJZS_DeQJqYR46mAWHOkKt"
	//clientID : "734132093263-07tbcmloe50fjlfp5darjqasmeb6jovs.apps.googleusercontent.com", //google credentials for hosting on heroku with vijayendracourse
	//clientSecret : "ru8T55pLk0tEf9j2JKtCTZPd"
},function(accessToken,refreshToken,profile,done)
{
	//console.log("redirect to passport");
	//console.log(JSON.stringify(profile));
	var email = profile.emails[0].value;
	var fullusername = profile.displayName.split(" "); 
	var username = fullusername[0];
	var googleid = profile.id;

	//console.log("emailid is: "+JSON.stringify(emailid));
	//console.log("displayName is: "+JSON.stringify(displayName));
	//console.log("googleid is: "+googleid);
	//console.log("id is: "+JSON.stringify(emailid) + " " +JSON.stringify(googleid)+" "+JSON.stringify(displayName));
	
	Users.find({email : email})
	.exec()
	.then(userinfo => {
		//console.log("userinfo is :"+JSON.stringify(userinfo[0]));
		if(userinfo.length == 1)
		{
			if(userinfo[0].toObject().hasOwnProperty('gid'))
			{
				done(null,userinfo[0]._id);
			}
			else
			{
				Users.findOneAndUpdate({email : email},{$set : {gid : googleid}})
				.exec()
				.then(result => {
					//console.log("updated result : "+JSON.stringify(result));
					done(null,userinfo[0]._id);
				})
				.catch(err => {
					console.log("Error while updating googleid : "+err);
				})	
			}			
		}
		else
		{
			console.log("new user");
			const user = new Users({
				_id : new mongoose.Types.ObjectId(),
				name : username,
				email : email,
				gid : googleid                                 
			});

			user.save()
			.then((saveduser) => {
				console.log("user saved : "+JSON.stringify(saveduser));
				done(null,saveduser._id);
				
			})
			.catch(err => {
				console.log("Error while saving user info during google login : "+err);
			})
		}
		
	})
	.catch(err => {
		console.log("Error while Google login : "+err);
	})
		
}));






//API's with JWT authorization
//To get token signup or login to the application(https://discountedtrade.herokuapp.com/) and then you will get the token on the console screen upon successful login

app.get("/token",authenticationMiddleware(),function(req,res)
{
	Users.findOne({_id : req.user}).select('email')
	.exec()
	.then(result => {

		const token = tokeninit(result.email,req.user);
		console.log("token after login is : "+JSON.stringify(token));
		res.json({ 'token' : token});
	})
	.catch(err => {
		console.log("Error while geneating token");
	})
	
})

function tokeninit(email,id)
{
	return jwt.sign(
    	   {
   		   	email : email,
			userid : id	
  		   },
  		   "secret",
  		   {
 			expiresIn : "1h"
  		   });
}

jwtcheck = function(req,res,next)
{
	try
	{
		jwt.verify(req.headers.authorization,"secret");
		next();
	}
	catch(err)
	{
		return res.json({message : "Jwt authentication failed"});
	}		
}


app.post("/jwtaddbook",jwtcheck,function(req,res)
{

	//console.log(req.body);
	var decoded = jwt.decode(req.headers.authorization, {complete: true});
	var userid = decoded.payload.userid;

	Books.find
	var book = new Books({
		_id : new mongoose.Types.ObjectId(),
		name : req.body.bookname,
		desc : req.body.bookdesc,
		price : req.body.bookprice,
		type : req.body.booktype,
		addedby : userid,                             
		status : "available"
	});

	book.save()
	.then(result => {
		res.json({message : "book added"});
	})
	.catch(err => {
		console.log("Error occured while adding book : "+ JSON.stringify(err));
		res.json({message : "Error occured while adding books"});	
	})
})


app.post("/jwtbuybook",jwtcheck,function(req,res)
{
	var decoded = jwt.decode(req.headers.authorization, {complete: true});
	var userid = decoded.payload.userid;

	var bookid = req.body.id;
	

	//console.log("buy book"+JSON.stringify(req.body.id));

	Books.findOneAndUpdate({_id : bookid},{status : "sold"})
	.exec()
	
	Users.find({_id : userid}).select('email')
	.exec()
	.then(useremail => {

		var purchases = new Purchases({
			_id : mongoose.Types.ObjectId(),
			email : useremail[0].email,
			bookid : bookid
		})	

		purchases.save()
		.then(() => {
			res.json({message : "Thanks for buying the book"});
		})
		.catch(err => {
			console.log("Error while updating purchase table : "+err);
			res.json({message : "Error while buying book"});
		});
	})	
	.catch(err => {
		console.log("Error while getting email of using in buybook : "+err);
	})	
})

app.post("/jwtstoreuser",function(req,res)
{
	Users.find({ email : req.body.email})
	.exec()
	.then((result) => {
		if(result.length == 0)
		{
			//console.log("Email does not exists");
			
			bcrypt.hash(req.body.password, 10 , function(err, hash)
			{
				if(err)
				{
					console.log("Error while hashing password");
				}
				else
				{
					const user = new Users({
						_id : new mongoose.Types.ObjectId(),
						name : req.body.name,
						email : req.body.email,	
						password : hash,
						confirm : 1,                                 //To be used later when function will be implemented to confirm email address
					});

					user.save()
					.then(() => {

						//Send confirmation email
						res.json({message : "user information stored"});	
					})
					.catch(err => {
						console.log(err);
						res.json({message : "Error whiles storing user information"});
					})					
				}
			});			
		}
		else
		{
			//console.log("email already exists in db : "+JSON.stringify(result[0]));
			res.json({message : "Email address already exists. Please login"});
		}
	});
})

app.get("/jwtmyadds",jwtcheck,function(req,res)
{
	var decoded = jwt.decode(req.headers.authorization, {complete: true});
	var userid = decoded.payload.userid;
	
	Users.findOne({_id : userid}).select('name')
	.exec()
	.then(user => {
		
		Books.find({addedby : req.query.userid}).select('_id name desc price type status')
		.exec()
		.then(mybooks => {
			res.json({mybooks : mybooks});
		})
	})
	.catch(err => {
		console.log("Error while fetching username");
		res.json({message : "Error while fetching your added books"});
	})
})

app.get("/jwtmypurchase",jwtcheck,function(req,res)
{
	var decoded = jwt.decode(req.headers.authorization, {complete: true});
	var userid = decoded.payload.userid;

	Users.findOne({_id : userid}).select('name email')
	.exec()
	.then(user => {

		//console.log("user email is : "+JSON.stringify(user.email));
		Purchases.find({email : user.email}).select('bookid')
		.exec()
		.then(purchasedbooks => {
			let purchasedbooksidarr = [];
			//console.log("user purchased ids are : "+JSON.stringify(purchasedbooks));
			for(let i=0;i<purchasedbooks.length;i++)
			{	
				purchasedbooksidarr.push(purchasedbooks[i].bookid);
			}

			Books.find({_id : purchasedbooksidarr}).select('_id name desc price type status')
			.exec()
			.then(bookdetails => {
				
				//console.log("vijju purchased books details are : "+JSON.stringify(bookdetails));
				res.json({bookdetails : bookdetails});					
			})
			.catch(err => {
				console.log("Error while fetching purchased book details");			
				res.json({message : "Error while fetching purchased book details"});
			});			
		})
		.catch(err => {
			console.log("Error while fetching bookid from purchase schema");			
			res.json({message : "Error while fetching bookid from purchase schema"});
		});	
	})
	.catch(err => {
		console.log("Error while fetching user email");
		res.json({message : "Error while fetching user email"});
	});
});


app.get("/jwtbookcollection",jwtcheck,function(req,res)
{
	var decoded = jwt.decode(req.headers.authorization, {complete: true});
	var userid = decoded.payload.userid;

	Books.find({$and : [{addedby : {$ne : userid}},{status : {$ne : "removed"}}]}).select('_id name desc price type status')
	.exec()
	.then(result => {
		//console.log("result is :"+JSON.stringify(result));
		res.json({bookcollection : result});
		
	})
	.catch(err => {
		console.log("Error while fetching book information :"+ err);				
		res.json("Error while fetching collection of books");
	});	
})