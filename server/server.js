
var asyncHelpers = (function(){
	/*! asynquence
	    v0.0.2 (c) Kyle Simpson
	    MIT License: http://getify.mit-license.org
	*/
	!function(a){function d(a){return"undefined"!=typeof setImmediate?setImmediate(a):setTimeout(a,0)}function e(){function a(){function a(){clearTimeout(v),v=null,r.length=0,s.length=0,t.length=0,u.length=0}function b(){return p?e():(v||(v=d(e)),void 0)}function e(){var c,d;if(v=null,p)a();else if(o)for(;s.length;){c=s.shift();try{c.apply(c,u)}catch(e){u.push(e),e.stack&&u.push(e.stack),0===s.length&&console.error.apply(console,u)}}else if(q&&r.length>0){q=!1,c=r.shift(),d=t.slice(),t.length=0,d.unshift(f());try{c.apply(c,d)}catch(e){u.push(e),o=!0,b()}}}function f(){function a(){o||p||q||(q=!0,t.push.apply(t,arguments),u.length=0,b())}return a.fail=function(){o||p||q||(o=!0,t.length=0,u.push.apply(u,arguments),b())},a.abort=function(){o||p||(q=!1,p=!0,t.length=0,u.length=0,b())},a}function g(a,b){function e(){clearTimeout(v),v=r=s=u=null}function f(){return k?g():(v||(v=d(g)),void 0)}function g(){if(!(o||p||l)){var b,c=[];if(v=null,j)a.fail.apply(a,u),e();else if(k)a.abort(),e();else if(h()){for(l=!0,b=0;b<r.length;b++)c.push(s["m"+b]);a.apply(a,c),e()}}}function h(){if(!(o||p||j||k||l||0===r.length)){var a,b=!0;for(a=0;a<r.length;a++)if(null===r[a]){b=!1;break}return b}}function i(){function a(){if(!(o||p||j||k||l||r[b])){var a=c.call(arguments);s["m"+b]=a.length>1?a:a[0],r[b]=!0,f()}}var b=r.length;return a.fail=function(){o||p||j||k||l||r[b]||(j=!0,u=c.call(arguments),f())},a.abort=function(){o||p||j||k||l||(k=!0,g())},r[b]=null,a}var m,n,q,u,v,j=!1,k=!1,l=!1,r=[],s={};for(m=0;m<b.length&&!j&&!k;m++){n=t.slice(),n.unshift(i());try{b[m].apply(b[m],n)}catch(w){q=w,j=!0;break}}q&&a.fail(q)}function h(){return o||p?w:(arguments.length>0&&r.push.apply(r,arguments),b(),w)}function i(){return p?w:(s.push.apply(s,arguments),b(),w)}function j(){if(o||p||0===arguments.length)return w;var a=c.apply(arguments);return h(function(b){g(b,a)}),w}function k(){if(o||p||0===arguments.length)return w;var a,b=c.call(arguments);for(a=0;a<b.length;a++)!function(a){h(function(b){var d=c.call(arguments,1);a.apply(a,d),b()}).or(a.fail)}(b[a]);return w}function l(){if(o||p||0===arguments.length)return w;var a,b=c.call(arguments);for(a=0;a<b.length;a++)!function(a){h(function(b){var d=c.call(arguments,1);a.apply(a,d).pipe(b)})}(b[a]);return w}function m(){if(o||p||0===arguments.length)return w;var a,b=c.call(arguments);for(a=0;a<b.length;a++)!function(a){h(function(b){var d=c.call(arguments,1);b(a.apply(a,d))})}(b[a]);return w}function n(){return o?w:(p=!0,e(),w)}var v,o=!1,p=!1,q=!0,r=[],s=[],t=[],u=[],w={then:h,or:i,gate:j,pipe:k,seq:l,val:m,abort:n};return arguments.length>0&&w.then.apply(w,arguments),w}return a}var b=a.ASQ,c=Array.prototype.slice;a.ASQ=e(),a.ASQ.noConflict=function(){var c=a.ASQ;return a.ASQ=b,c}}(this);

	return this;
}).call({});

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
			email: reqData.email.toLowerCase()
		};
	}

	ores.setHeader("Content-Type","application/json; charset=UTF-8");
	ores.writeHead(200,CORS_POST_HEADERS);
	ores.end(JSON.stringify({
		user_id: user_id,
		first_name: users[user_id].first_name,
		email: users[user_id].email
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

	ASQ = asyncHelpers.ASQ,

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


// spin up the HTTP server
httpserv.listen(INTERNAL_SERVER_PORT, INTERNAL_SERVER_ADDR);
