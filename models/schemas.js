const mongoose = require("mongoose");

const usersSchema = mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	name : {type : String, required : true},
	email : {type : String, required : true, unique : true },
	password : {type : String}, 
	phone : {type : Number},
	confirm : {type : Number}, 
	gid : {type : Number},
});

const booksSchema = mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	name : String,
	desc : String,
	price : Number,
	type : String,
	addedby : String,
	status : String
});

const purchasesSchema = mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	email : String,
	bookid : String
});

module.exports = { users : mongoose.model("Users",usersSchema),
				   books : mongoose.model("Books",booksSchema),
				   purchases : mongoose.model("Purchases",purchasesSchema)	
				 };