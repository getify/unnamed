
/*! h5ive:storage,usermedia,canvas,animationFrame | (c) Kyle Simpson | MIT License: http://getify.mit-license.org */
(function(e){e.h5={}})(this),function(e){if(!e)throw new Error("storage.h5ive: core.h5ive required.");e.storage=function(e){function i(e){var i,s;for(i in e)s={"h5ive:data":e[i]},r&&(s["h5ive:expires"]=r),t.setItem(i,JSON.stringify(s));return n}function s(e){Object.prototype.toString.call(e)!="[object Array]"&&(e=[e]);for(var r=0;r<e.length;r++)t.removeItem(e[r]);return n}function o(e){var n,r,i=[],s=(new Date).getTime();Object.prototype.toString.call(e)!=="[object Array]"&&(e=[e]);for(n=0;n<e.length;n++){r=i[e[n]]=t.getItem(e[n]);try{r=JSON.parse(r);if("h5ive:data"in r){if("h5ive:expires"in r&&s>=r["h5ive:expires"]){delete i[e[n]],t.removeItem(e[n]);continue}i[e[n]]=r["h5ive:data"]}}catch(o){}}if(e.length<2){if(e.length>0&&e[0]in i)return i[e[0]];return}return i}var t,n,r;return e=e||{},"expires"in e&&typeof e.expires=="number"&&e.expires>0&&(r=e.expires+(new Date).getTime()),e.expires=="session"?t=sessionStorage:t=localStorage,n={save:i,discard:s,get:o},n}}(this.h5);!function(a){if(!a)throw new Error("userMedia.h5ive: core.h5ive required.");var b=navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia||navigator.msGetUserMedia;a.userMedia=function(c,d,e){function i(b){if(g){if(g!==!0)throw new Error("Success callback already defined.");b.apply(a.userMedia,j)}else g=b;return f}function m(b){if(h){if(g!==!0)throw new Error("Failed callback already defined.");b.apply(a.userMedia,k)}else h=b;return f}function n(){var b=[].slice.call(arguments);i=b[0],window.webkitURL&&(b[0]=webkitURL.createObjectURL(b[0])),g&&"function"==typeof g?g.apply(a.userMedia,b):(g=!0,j=b.slice())}function o(){h&&"function"==typeof h?h.apply(a.userMedia,arguments):(h=!0,k=[].slice.call(arguments))}function p(){try{i.stop()}catch(a){}return i=null,f}var f,g,h,i,l,j=[],k=[];if(g=d,h=e,b){for(idx in c)c.hasOwnProperty(idx)&&(l+=(""!=l?",":"")+idx);try{b.call(navigator,c,n,o)}catch(q){try{b.call(navigator,l,n,o)}catch(r){o("'getUserMedia' failed.")}}}else o("'getUserMedia' is not available.");return f={stream:i,failed:m,abort:p}}}(this.h5);!function(a){if(!a)throw new Error("canvas.h5ive: core.h5ive required.");a.canvas=function(a){function g(){return c}function h(){return 0==arguments.length?d.clearRect(0,0,a.width,a.height):d.clearRect.apply(d,arguments),b}function i(a){return a=a||{},"composite"in a&&(d.globalCompositeOperation=a.composite),"alpha"in a&&(d.globalAlpha=a.alpha),a.stroke&&("width"in a.stroke&&(d.lineWidth=a.stroke.width),"caps"in a.stroke&&(d.lineCap=a.stroke.caps),"joints"in a.stroke&&(d.lineJoin=a.stroke.joints),"color"in a.stroke&&(d.strokeStyle=a.stroke.color),"miter"in a.stroke&&(d.miterLimit=a.stroke.miter)),a.fill&&"color"in a.fill&&(d.fillStyle=a.fill.color),a.shadow&&("offsetX"in a.shadow&&(d.shadowOffsetX=a.shadow.offsetX),"offsetY"in a.shadow&&(d.shadowOffsetY=a.shadow.offsetY),"blur"in a.shadow&&(d.shadowBlur=a.shadow.blur),"color"in a.shadow&&(d.shadowColor=a.shadow.color)),"text"in a&&("font"in a.text&&(d.font=a.text.font),"align"in a.text&&(d.textAlign=a.text.align),"baseline"in a.text&&(d.textBaseline=a.text.baseline)),b}function j(a,c){if(e)throw new Error("A path is still currently being defined. End it first.");return d.beginPath(),null!=a&&null!=c&&d.moveTo(a,c),e=!0,b}function k(a){var c,g;if(!e)throw new Error("Segments need a path started first.");a=a||[];for(var h=0;h<a.length;h++)c=a[h],g=Object.keys(c)[0],g in f&&d[g].apply(d,c[g]);return b}function l(a){if(!e)throw new Error("No path currently active.");return a=a||{},a.close&&d.closePath(),a.fill&&d.fill(),a.stroke&&d.stroke(),e=!1,b}function m(a){return a=a||{},a.path?k([{rect:a.path}]):a.stroke?d.strokeRect.apply(d,a.stroke):a.fill&&d.fillRect.apply(d,a.fill),b}function n(a){return a=a||{},a.stroke?d.strokeText.apply(d,a.stroke):a.fill&&d.fillText.apply(d,a.fill),b}function o(a){return a=a||{},"translate"in a&&d.translate(a.translate.x,a.translate.y),"scale"in a&&d.scale(a.scale.x,a.scale.y),"rotate"in a&&d.rotate(a.rotate),b}function p(a,c){return d.moveTo(a,c),b}function q(){return d.save(),b}function r(){return d.restore(),b}function s(){return d.clip(),b}function t(b){var e,f;return b=b||{},b.bitmap?d.getImageData(b.bitmap.x,b.bitmap.y,b.bitmap.width,b.bitmap.height):b.dataURL?"x"in b.dataURL&&"y"in b.dataURL||"width"in b.dataURL&&"height"in b.dataURL?(e=document.createElement("canvas"),e.setAttribute("width",b.dataURL.width||a.width),e.setAttribute("height",b.dataURL.height||a.height),f=e.getContext("2d"),f.drawImage(c,b.dataURL.x,b.dataURL.y,b.dataURL.width||a.width,b.dataURL.height||a.height,0,0,b.dataURL.width||a.width,b.dataURL.height||a.height),e.toDataURL(b.dataURL.type)):c.toDataURL(b.dataURL.type):void 0}function u(a,c){var e;return c=c||{},c.bitmap?d.putImageData(a,c.bitmap.x||0,c.bitmap.y||0):c.dataURL&&(e=[a],"x"in c.dataURL&&"y"in c.dataURL&&e.push(c.dataURL.x,c.dataURL.y),"width"in c.dataURL&&"height"in c.dataURL&&e.push(c.dataURL.width,c.dataURL.height),"sx"in c.dataURL&&"sy"in c.dataURL&&"sWidth"in c.dataURL&&"sHeight"in c.dataURL&&"dx"in c.dataURL&&"dy"in c.dataURL&&"dWidth"in c.dataURL&&"dHeight"in c.dataURL&&e.push(c.dataURL.sx,c.dataURL.sy,c.dataURL.sWidth,c.dataURL.sHeight,c.dataURL.dx,c.dataURL.dy,c.dataURL.dWidth,c.dataURL.dHeight),d.drawImage.apply(d,e)),b}var b,c,d,e=!1,f={lineTo:1,arc:1,rect:1,quadraticCurveTo:1,bezierCurveTo:1};return a=a||{},a.width="width"in a?a.width:300,a.height="height"in a?a.height:150,a.matchDimensions="matchDimensions"in a?a.matchDimensions:!0,a.type="webgl"==a.type?"experimental-webgl":"2d",c=document.createElement("canvas"),c.setAttribute("width",a.width),c.setAttribute("height",a.height),a.matchDimensions&&(c.style.width=a.width+"px",c.style.height=a.height+"px"),d=c.getContext(a.type),b={__raw__:c,__raw__context__:d,element:g,clear:h,setStyles:i,startPath:j,defineSegments:k,endPath:l,rect:m,text:n,transform:o,shiftPathTo:p,pushState:q,popState:r,getImage:t,putImage:u,clip:s}}}(this.h5);!function(a){function f(){var a;do a=Math.floor(1e9*Math.random());while(a in e);return a}function g(a){var c=f();return e[c]=b(function(){delete e[c],a.apply(d,arguments)}),c}function h(a){var c;return c=g(function(){e[c]=b(function(){delete e[c],a.apply(d,arguments)})})}function i(a){return a in e&&(c(e[a]),delete e[a]),d}function j(){throw new Error("'requestAnimationFrame' not supported.")}if(!a)throw new Error("animationFrame.h5ive: core.h5ive required.");var d,b=window.requestAnimationFrame||window.msRequestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.oRequestAnimationFrame,c=window.cancelAnimationFrame||window.msCancelAnimationFrame||window.msCancelRequestAnimationFrame||window.mozCancelAnimationFrame||window.mozCancelRequestAnimationFrame||window.webkitCancelAnimationFrame||window.webkitCancelRequestAnimationFrame||window.oCancelAnimationFrame||window.oCancelRequestAnimationFrame,e={};d=b&&c?{queue:g,queueAfter:h,cancel:i}:{queue:j,queueAfter:j,cancel:j},a.animationFrame=d}(this.h5);

/*! asynquence
    v0.1.0 (c) Kyle Simpson
    MIT License: http://getify.mit-license.org
*/
!function(a,b,c){"undefined"!=typeof module&&module.exports?module.exports=c():"function"==typeof define&&define.amd?define(c):b[a]=c(a,b)}("ASQ",this,function(a,b){function f(a){return"undefined"!=typeof setImmediate?setImmediate(a):setTimeout(a,0)}function g(){function a(){function a(){clearTimeout(v),v=null,r.length=0,s.length=0,t.length=0,u.length=0}function b(){return p?c():(v||(v=f(c)),void 0)}function c(){var c,e;if(v=null,p)a();else if(o)for(;s.length;){c=s.shift();try{c.apply(c,u)}catch(f){u.push(f),f.stack&&u.push(f.stack),0===s.length&&console.error.apply(console,u)}}else if(q&&r.length>0){q=!1,c=r.shift(),e=t.slice(),t.length=0,e.unshift(d());try{c.apply(c,e)}catch(f){u.push(f),o=!0,b()}}}function d(){function a(){o||p||q||(q=!0,t.push.apply(t,arguments),u.length=0,b())}return a.fail=function(){o||p||q||(o=!0,t.length=0,u.push.apply(u,arguments),b())},a.abort=function(){o||p||(q=!1,p=!0,t.length=0,u.length=0,b())},a}function g(a,b){function c(){clearTimeout(v),v=r=s=u=null}function d(){return k?g():(v||(v=f(g)),void 0)}function g(){if(!(o||p||l)){var b,d=[];if(v=null,j)a.fail.apply(a,u),c();else if(k)a.abort(),c();else if(h()){for(l=!0,b=0;b<r.length;b++)d.push(s["m"+b]);a.apply(a,d),c()}}}function h(){if(!(o||p||j||k||l||0===r.length)){var a,b=!0;for(a=0;a<r.length;a++)if(null===r[a]){b=!1;break}return b}}function i(){function a(){if(!(o||p||j||k||l||r[b])){var a=e.call(arguments);s["m"+b]=a.length>1?a:a[0],r[b]=!0,d()}}var b=r.length;return a.fail=function(){o||p||j||k||l||r[b]||(j=!0,u=e.call(arguments),d())},a.abort=function(){o||p||j||k||l||(k=!0,g())},r[b]=null,a}var m,n,q,u,v,j=!1,k=!1,l=!1,r=[],s={};for(m=0;m<b.length&&!j&&!k;m++){n=t.slice(),n.unshift(i());try{b[m].apply(b[m],n)}catch(w){q=w,j=!0;break}}q&&a.fail(q)}function h(){return o||p?w:(arguments.length>0&&r.push.apply(r,arguments),b(),w)}function i(){return p?w:(s.push.apply(s,arguments),b(),w)}function j(){if(o||p||0===arguments.length)return w;var a=e.apply(arguments);return h(function(b){g(b,a)}),w}function k(){if(o||p||0===arguments.length)return w;var a,b=e.call(arguments);for(a=0;a<b.length;a++)!function(a){h(function(b){var c=e.call(arguments,1);a.apply(a,c),b()}).or(a.fail)}(b[a]);return w}function l(){if(o||p||0===arguments.length)return w;var a,b=e.call(arguments);for(a=0;a<b.length;a++)!function(a){h(function(b){var c=e.call(arguments,1);a.apply(a,c).pipe(b)})}(b[a]);return w}function m(){if(o||p||0===arguments.length)return w;var a,b=e.call(arguments);for(a=0;a<b.length;a++)!function(a){h(function(b){var c=e.call(arguments,1);b(a.apply(a,c))})}(b[a]);return w}function n(){return o?w:(p=!0,c(),w)}var v,o=!1,p=!1,q=!0,r=[],s=[],t=[],u=[],w={then:h,or:i,gate:j,pipe:k,seq:l,val:m,abort:n};return arguments.length>0&&w.then.apply(w,arguments),w}return a}var c,d=(b||{})[a],e=Array.prototype.slice;return c=g(),c.noConflict=function(){return b&&(b[a]=d),c},c});

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
// From: http://blog.stevenlevithan.com/archives/parseuri
function parseUri(a){for(var b=parseUri.options,c=b.parser[b.strictMode?"strict":"loose"].exec(a),d={},e=14;e--;)d[b.key[e]]=c[e]||"";return d[b.q.name]={},d[b.key[12]].replace(b.q.parser,function(a,c,e){c&&(d[b.q.name][c]=e)}),d}parseUri.options={strictMode:!1,key:["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],q:{name:"queryKey",parser:/(?:^|&)([^&=]*)=?([^&]*)/g},parser:{strict:/^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,loose:/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/}};

// various non-ES5 polyfills
Object.keys||(Object.keys=function(a){var b,c;for(b in a)a.hasOwnProperty(b)&&c.push(b);return c});
Array.isArray||(Array.isArray=function(e){return Object.prototype.toString.call(e)==="[object Array]"});
Array.prototype.filter||(Array.prototype.filter=function(a){for(var b=Object(this),c=b.length>>>0,d=[],e=arguments[1],f=0;c>f;f++)if(f in b){var g=b[f];a.call(e,g,f,b)&&d.push(g)}return d});
Array.prototype.forEach||(Array.prototype.forEach=function(a,b){for(var c=0,d=this.length;d>c;++c)a.call(b,this[c],c,this)});
Array.prototype.some||(Array.prototype.some=function(a){"use strict";if(null==this)throw new TypeError;var b=Object(this),c=b.length>>>0;if("function"!=typeof a)throw new TypeError;for(var d=arguments[1],e=0;c>e;e++)if(e in b&&a.call(d,b[e],e,b))return!0;return!1});
Array.prototype.every||(Array.prototype.every=function(a){"use strict";if(null==this)throw new TypeError;var b=Object(this),c=b.length>>>0;if("function"!=typeof a)throw new TypeError;for(var d=arguments[1],e=0;c>e;e++)if(e in b&&!a.call(d,b[e],e,b))return!1;return!0});
Date.now||(Date.now=function(){return+new Date});
String.prototype.trim||(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")});

// my own "hopefills"
Object.values||(Object.values=function(e){var t,n=[];for(t in e)n.push(e[t]);return n});
JSON.clone||(JSON.clone=function(a){return JSON.parse(JSON.stringify(a))});
// wraps Error.prototype.toString() to output the `.stack` property, if available
!function(){var a=Error.prototype.toString;Error.prototype.toString=function(){var b;return this.stack?(b=(this.stack+"").replace(new RegExp(this.name+": "+this.message+"\n"),""),this.name+": "+this.message+"\n"+b):a.call(this)}}();



// *********************************************************

(function(global,unnamed){

	function killSocket() {
		leaderboard_socket.removeListener("connect_failed",userDisconnected);
		leaderboard_socket.removeListener("disconnect",userDisconnected);
		leaderboard_socket.removeListener("invalid_user",invalidUser);
		leaderboard_socket.removeListener("update",updateLeaderboard);
	}

	// kill socket namespace cache so we can reconnect to it later
	function killSocketNamespace() {
		// NOTE: this is a hack, the socket.io API seems to misbehave without it
		delete io.sockets[unnamed.SERVER]["namespaces"]["/"];
		delete io.sockets[unnamed.SERVER]["namespaces"]["/rtcsignals"];
		delete io.sockets[unnamed.SERVER]["namespaces"]["/leaderboard"];
		delete io.sockets[unnamed.SERVER]["namespaces"]["/game"];
	}

	function userDisconnected() {
		cancelVideoCapture();

		$("#whome, #areyouready, #game, #leaderboard").hide();
		$leaderboard_list.empty();	
		if (leaderboard_socket) {
			killSocket();
			leaderboard_socket = null;
			killSocketNamespace();
		}

		unnamed.game.abort();

		alert("Lost connection to server. Please refresh.");
	}

	function invalidUser() {
		doLogout();
		alert("Leaderboard user authorization failed. You've been logged out, so login to try again.");
	}

	function updateLeaderboard(leaderboard) {
		var html = "";

		leaderboard.forEach(function(leader){
			html += "<li><span class=\"leader\">" + leader.name + "</span>" +
				"<span class=\"score\">" + leader.score + "</span></li>"
			;
		});

		$leaderboard_list.html(html);
	}

	function cancelVideoCapture() {
		$captureme.hide();

		if ($video && $video.length > 0) {
			$video[0].pause();
			$video.removeAttr("src").removeAttr("mozSrcObject");
			$video.remove();
			$video = null;
		}
		if (media_stream) {
			media_stream.abort();
			media_stream = null;
		}

		if (capture_thumbnail_drawing) {
			h5.animationFrame.cancel(capture_thumbnail_drawing);
		}
		capture_thumbnail_drawing = null;
	}

	function doCapture() {
		var cnv;

		cnv = h5.canvas({
			width: 125,
			height: 103,
			matchDimensions: true
		});

		cnv.putImage($video[0],{
			dataURL: {
				x: 0,
				y: 0,
				width: 125,
				height: 103
			}
		});

		mypic = cnv.getImage({ dataURL: { type: "image/jpeg" } });
		$myimg.attr({ src: mypic });

		// can we store the pic in sessionStorage?
		if (session_storage_available) {
			app_session.save({
				mypic: mypic
			});
		}

		cancelVideoCapture();

		if (leaderboard_socket) {
			unnamed.game.start(user_id,first_name,mypic);
		}
	}

	function doThumbnailCapture() {
		try {
			thumbnail_canvas.putImage($video[0],{
				dataURL: {
					x: 0,
					y: 0,
					width: 27,
					height: 22
				}
			});
			$myimg.attr({
				src: thumbnail_canvas.getImage({dataURL:{}})
			});
		} catch (err) {}

		capture_thumbnail_drawing = h5.animationFrame.queue(doThumbnailCapture);
	}

	function captureMe() {
		var video;

		$video = $("<video></video>").attr({ width:"500px", height:"410px" });
		$captureme.append($video);
		video = $video[0];

		thumbnail_canvas = h5.canvas({
			width: 27,
			height: 22,
			matchDimensions: true
		});

		$myimg.show();
		
		media_stream = h5
		.userMedia({
			video: true
		})
		.stream(function(src){
			if (video.mozSrcObject !== undefined) {
				video.mozSrcObject = src;
			}
			else {
				video.src = src;
			}
			video.play();
			$("#captureme").show();

			doThumbnailCapture();
		})
		.failed(function(){
			$captureme.hide();

			alert("Access to the media failed.");
		});
	}

	function doLogin() {
		$.ajax({
			url: unnamed.SERVER + "/login",
			type: "POST",
			contentType: "application/json",
			dataType: "json",
			cache: false,
			data: JSON.stringify({
				first_name: $("#first_name").val(),
				email: $("#email").val()
			}),
			success: loginSuccess,
			error: function() {
				alert("Error logging in. Try again!");
			}
		});
	}

	function loginSuccess(resp) {
		user_id = resp.user_id;
		first_name = resp.first_name;
		email = resp.email;

		// save login info to sessionStorage, if possible
		if (session_storage_available) {
			app_session.save({
				user_id: user_id,
				first_name: first_name,
				email: email
			});
		}

		loggedIn();
	}

	function loggedIn() {
		$("#loginentry").hide();
		$("#whome, #leaderboard").show();
		$("#whome #myname").text(first_name).show();

		leaderboard_socket = io.connect(unnamed.SERVER + "/leaderboard",unnamed.SOCKET_IO_CONNECT_OPTS);
		leaderboard_socket.once("connect_failed",userDisconnected);
		leaderboard_socket.once("disconnect",userDisconnected);
		leaderboard_socket.once("invalid_user",invalidUser);
		leaderboard_socket.on("update",updateLeaderboard);

		// register ourself with the leaderboard to receive updates
		leaderboard_socket.emit("user",user_id);

		// do we already have our own pic captured?
		if (mypic) {
			$myimg.attr({src:mypic}).show();
			unnamed.game.start(user_id,first_name,mypic);
		}
		// otherwise, let's capture it!
		else {
			captureMe();
		}
	}

	function doLogout() {
		user_id = first_name = email = mypic = null;

		// discard sessionStorage data, if any
		if (session_storage_available) {
			app_session.discard(["user_id","first_name","email","mypic"]);
		}

		cancelVideoCapture();

		if (leaderboard_socket) {
			killSocket();
			leaderboard_socket.disconnect();
			leaderboard_socket = null;
			killSocketNamespace();
		}

		unnamed.game.abort();
		
		loggedOut();
	}

	function loggedOut() {
		$("#loginentry").show();
		$("#whome, #captureme, #areyouready, #game, #leaderboard").hide();
		$leaderboard_list.empty();	
		$myimg.attr({src:""}).hide();
		$("#whome #myname").empty().hide();
	}

	function init() {
		$(document).ready(function(){
			$captureme = $("#captureme");
			$myimg = $("#whome #myimg");
			$leaderboard_list = $("#leaderboard ul");
			$leaderboard_list.empty();	

			$("#login").click(doLogin);
			$("#logout").click(doLogout);
			$captureme.find("#btn").click(doCapture);

			unnamed.game.init();
			unnamed.RTC.init();

			if (user_id) {
				loggedIn();
			}
			else {
				loggedOut();
			}
		});
	}

	var user_id,
		first_name,
		email,
		mypic,

		$captureme,
		$myimg,
		$video,
		$leaderboard_list,

		media_stream,
		thumbnail_canvas,
		capture_thumbnail_drawing,
		app_session,
		leaderboard_socket,

		// feature test for sessionStorage
		session_storage_available = (function(test) {
			try {
				sessionStorage.setItem(test, test);
				sessionStorage.removeItem(test);
				return true;
			}
			catch (err) {
				return false;
			}
		})("unnamed")
	;

	// do we have sessionStorage available?
	if (session_storage_available) {
		app_session = h5.storage({ expires: "session" });

		// pull login session info from sessionStorage
		user_id = app_session.get("user_id");
		first_name = app_session.get("first_name");
		email = app_session.get("email");
		mypic = app_session.get("mypic");
	}

	unnamed = global.unnamed = {
		init: init,

		SERVER: "http://localhost:8005",
		SOCKET_IO_CONNECT_OPTS: {
			"connect timeout": 3000,
			"reconnect": false
		}
	};

})(window);
