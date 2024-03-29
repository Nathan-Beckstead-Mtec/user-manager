const express = require("express");
const crypto = require("crypto");
const fs = require("fs");


const app = express();
const port = 3000;


var users = {};
/*
var users = {
	1: {
		name:"bob",
		username:"bebertson",
		email:"bobbyboi@aol.com",
		age:69
	}
}; //key = uuid
*/

function save(reason = "no reason supplied"){
	try {

		fs.writeFile("./database.json", JSON.stringify(users), (err) => {
			if (err){
				throw err;
			}
			console.group("Save:");
				console.log("Reason for save: " + reason);
				console.log("Write Successful");
			console.groupEnd("Save:");
		})



	} catch (error) {
		console.group("Save \x1b[41mFAILED:\x1b[0m");
			console.log("Reason for save: " + reason);
			console.error("Error: \x1b[31m" + error + "\x1b[0m");
		console.groupEnd("Save \x1b[41mFAILED:\x1b[0m");
	}
	

}
function load(){
	try {
		
		users = JSON.parse(
			fs.readFileSync("./database.json", {encoding: "utf-8"})
		);
		console.log("loaded ./database.json");

	} catch (error) {
		console.group("Load \x1b[41mFAILED:\x1b[0m");
			console.error("Error: \x1b[31m" + error + "\x1b[0m");
			console.error("Using garbage data");
		console.groupEnd("Load \x1b[41mFAILED:\x1b[0m");

		users = {
			1: {
				name:"admin",
				username:"LOAD FAILED",
				email:"admin@example.com",
				age:69
			}
		};
	}
}


load();





app.set("views", "./templates");
app.set("view engine", "pug");
app.use(express.urlencoded({extended: false}));
app.use("/static",express.static("./static"));

//404
//400




app.get("/", (req,res) => {
    res.render("list", {users: users});
});

app.get("/edit/:uuid", (req,res) => {
	const uuid = req.params.uuid;
	// console.log("editing uuid:(" + uuid + ")");

	if(users[uuid] === undefined){
		res.status(404);
		res.render("404user", {uuid: uuid});
	}else{
		const value = users[uuid];
		value.uuid = uuid;
		res.render("edit", {user: value});
	}
});

app.get("/create", (req,res) => {
    res.render("create");
});

app.post("/edit/:uuid", (req, res) => {
	let uuid = req.params.uuid;
	
	if (users[uuid] === undefined){
		console.log("could not find uuid: " + uuid);
		uuid = crypto.webcrypto.randomUUID();
		console.log("           new uuid: " + uuid);

	}

	editUser(req,res,uuid,"edited");
});

app.post("/create", (req,res) => {

	const uuid = crypto.webcrypto.randomUUID();
	editUser(req,res,uuid,"created");
})

function dataValidation(user){
	//NOTE: dataValidation mutates the refrence
	if(user.username === undefined || user.name === undefined || user.email === undefined || user.age === undefined){
		//missing data
		throw Error("Malformed data");
	}
	if(user.username === "" || user.name === "" || user.email === "" || user.age === ""){
		//missing data
		throw Error("Missing data");
	}

	// console.log(typeof user.age);
	user.age = Number.parseInt(user.age);
	// console.log(typeof user.age);
	if(!(user.age>=0)){ //double negative to account for NaN
		throw Error("Invalid age");
	}

	//TODO: email validation :D

	return user; //not strictly neccissary because pass by refrence, but improves code readability 
}
function editUser(req,res,uuid, pastTenseVerbDescribingTransaction){
	const newUser = {};
	newUser.username = req.body.username
	newUser.name = req.body.name
	newUser.email = req.body.email
	newUser.age = req.body.age

	try {
		// newUser = dataValidation(newUser); //(readability for pass by refrence)
		dataValidation(newUser); //NOTE: dataValidation mutates the refrence
	} catch (error) {
		res.status(400);
		console.error(error);
		res.end(error.msg);
		return;
	}

	users[uuid] = newUser;

	save("a user was " + pastTenseVerbDescribingTransaction);

	res.status(201) //created
	// res.setHeader("Location", "/");
	// res.render("list", {users: users});

	res.redirect("/");
}


app.post("/delete/:uuid", (req,res) => {
	const uuid = req.params.uuid;
	const user = users[uuid];

	if (user === undefined){
		res.status(404);
		res.render("404user", {uuid: uuid});
		return;
	}

	delete users[uuid]; //                O
	save("a user was deleted");//      👌/|\👍
	res.status(204) // all good          / \
	res.redirect("/"); //                | |  
});

app.listen(port, () => {
    console.log("listening on port: " + port);
});
