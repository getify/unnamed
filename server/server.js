
// my own "hopefills"
Object.values||(Object.values=function(e){var t,n=[];for(t in e)n.push(e[t]);return n});
JSON.clone||(JSON.clone=function(a){return JSON.parse(JSON.stringify(a))});



// *********************************************************

function handleHTTP(req, res) {
	var reqData = "";

	// CORS preflight requests?
	if (req.method.toLowerCase() == "options") {
		// GET?
		if (req.headers["access-control-request-method"].toLowerCase() == "get") {
			res.writeHead(200,CORS_GET_HEADERS);
			res.end();
		}
		// POST?
		if (req.headers["access-control-request-method"].toLowerCase() == "post") {
			res.writeHead(200,CORS_POST_HEADERS);
			res.end();
		}
		// otherwise, bail because we won't handle this kind of request!
		else {
			res.writeHead(403,CORS_POST_HEADERS);
			res.end();
		}
		return;
	}
	// GET routes?
	else if (req.method == "GET") {
		if (req.url == "/") {
			res.writeHead(307,{
				Location: UNNAMED_SITE
			});
			res.end();
		}
		else if (req.url.match(/^\/something\b/)) {
			req.addListener("end",function(){
				something(req,res);
			});
			req.resume();
		}
		else {
			res.writeHead(403,CORS_GET_HEADERS);
			res.end();
		}
		return;
	}
	// POST routes?
	else if (req.method == "POST") {
		if (req.url.match(/^\/login\b/)) {
			req.on("data",function(d){ reqData += d; });
			req.on("end",function(){
				login(JSON.parse(reqData),req,res);
			});
		}
		else {
			res.writeHead(403,CORS_POST_HEADERS);
			res.end();
		}
		return;
	}
	// otherwise, reject
	else {
		res.writeHead(403,CORS_POST_HEADERS);
		res.end();
	}
	return false;
}

function generateID(store) {
	var id;
	do {
		id = Math.round(Math.random()*1E9);
	} while (id in store);
	store[id] = true;
	return id;
}

function login(reqData,oreq,ores) {
	var uid, user_id;

	for (uid in users) {
		if (
			reqData.first_name.toLowerCase() === users[uid].first_name &&
			reqData.email.toLowerCase() === users[uid].email
		) {
			user_id = uid;
			break;
		}
	}

	if (!user_id) {
		user_id = generateID(users);
		users[user_id] = {
			first_name: reqData.first_name.toLowerCase(),
			email: reqData.email.toLowerCase(),
			score: 0,
			timestamp: Date.now()
		};
	}
	else {
		// update the user's login timestamp
		users[user_id].timestamp = Date.now();
	}

	ores.setHeader("Content-Type","application/json; charset=UTF-8");
	ores.writeHead(200,CORS_POST_HEADERS);
	ores.end(JSON.stringify({
		user_id: user_id,
		first_name: users[user_id].first_name,
		email: users[user_id].email,
		score: users[user_id].score
	}));
}

function something(oreq,ores) {
	ores.writeHead(200,{
		"Content-type": "text/plain"
	});
	ores.end("Hello World");
}




// *********************************************************

var global = this,

	http = require("http"),
	https = require("https"),
	url_parser = require("url"),

	httpserv = http.createServer(handleHTTP),
	io = require("socket.io").listen(httpserv),

	Leaderboard = require("./leaderboard.js"),

	ASQ = require("asynquence"),

	// pull in "secret" config settings
	secret = require("./secret.js"),

	// config constants
	INTERNAL_SERVER_ADDR = secret.INTERNAL_SERVER_ADDR,
	INTERNAL_SERVER_PORT = secret.INTERNAL_SERVER_PORT,
	PUBLIC_SERVER_ADDR = secret.PUBLIC_SERVER_ADDR,
	PUBLIC_SERVER_PORT = secret.PUBLIC_SERVER_PORT,

	CORS_GET_HEADERS = secret.CORS_GET_HEADERS,
	CORS_POST_HEADERS = secret.CORS_POST_HEADERS,

	UNNAMED_SITE = "http://localhost:8080",

	users = { }
;

// configure socket.io
io.configure(function(){
	io.enable("browser client minification"); // send minified client
	io.enable("browser client etag"); // apply etag caching logic based on version number
	io.set("log level", 1); // reduce logging
	io.set("transports", [
		"websocket"
		, "flashsocket"
		, "htmlfile"
		, "xhr-polling"
		, "jsonp-polling"
	]);
});

// spin up the HTTP server
httpserv.listen(INTERNAL_SERVER_PORT, INTERNAL_SERVER_ADDR);

// init the Leaderboard socket
Leaderboard.init(io,users);
