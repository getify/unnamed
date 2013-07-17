
/*! core.h5ive.js | (c) Kyle Simpson | MIT License: http://getify.mit-license.org */
(function(e){e.h5={}})(this),function(e){if(!e)throw new Error("storage.h5ive: core.h5ive required.");e.storage=function(e){function i(e){var i,s;for(i in e)s={"h5ive:data":e[i]},r&&(s["h5ive:expires"]=r),t.setItem(i,JSON.stringify(s));return n}function s(e){Object.prototype.toString.call(e)!="[object Array]"&&(e=[e]);for(var r=0;r<e.length;r++)t.removeItem(e[r]);return n}function o(e){var n,r,i=[],s=(new Date).getTime();Object.prototype.toString.call(e)!=="[object Array]"&&(e=[e]);for(n=0;n<e.length;n++){r=i[e[n]]=t.getItem(e[n]);try{r=JSON.parse(r);if("h5ive:data"in r){if("h5ive:expires"in r&&s>=r["h5ive:expires"]){delete i[e[n]],t.removeItem(e[n]);continue}i[e[n]]=r["h5ive:data"]}}catch(o){}}if(e.length<2){if(e.length>0&&e[0]in i)return i[e[0]];return}return i}var t,n,r;return e=e||{},"expires"in e&&typeof e.expires=="number"&&e.expires>0&&(r=e.expires+(new Date).getTime()),e.expires=="session"?t=sessionStorage:t=localStorage,n={save:i,discard:s,get:o},n}}(this.h5);

/*! asynquence
    v0.0.2 (c) Kyle Simpson
    MIT License: http://getify.mit-license.org
*/
!function(a){function d(a){return"undefined"!=typeof setImmediate?setImmediate(a):setTimeout(a,0)}function e(){function a(){function a(){clearTimeout(v),v=null,r.length=0,s.length=0,t.length=0,u.length=0}function b(){return p?e():(v||(v=d(e)),void 0)}function e(){var c,d;if(v=null,p)a();else if(o)for(;s.length;){c=s.shift();try{c.apply(c,u)}catch(e){u.push(e),e.stack&&u.push(e.stack),0===s.length&&console.error.apply(console,u)}}else if(q&&r.length>0){q=!1,c=r.shift(),d=t.slice(),t.length=0,d.unshift(f());try{c.apply(c,d)}catch(e){u.push(e),o=!0,b()}}}function f(){function a(){o||p||q||(q=!0,t.push.apply(t,arguments),u.length=0,b())}return a.fail=function(){o||p||q||(o=!0,t.length=0,u.push.apply(u,arguments),b())},a.abort=function(){o||p||(q=!1,p=!0,t.length=0,u.length=0,b())},a}function g(a,b){function e(){clearTimeout(v),v=r=s=u=null}function f(){return k?g():(v||(v=d(g)),void 0)}function g(){if(!(o||p||l)){var b,c=[];if(v=null,j)a.fail.apply(a,u),e();else if(k)a.abort(),e();else if(h()){for(l=!0,b=0;b<r.length;b++)c.push(s["m"+b]);a.apply(a,c),e()}}}function h(){if(!(o||p||j||k||l||0===r.length)){var a,b=!0;for(a=0;a<r.length;a++)if(null===r[a]){b=!1;break}return b}}function i(){function a(){if(!(o||p||j||k||l||r[b])){var a=c.call(arguments);s["m"+b]=a.length>1?a:a[0],r[b]=!0,f()}}var b=r.length;return a.fail=function(){o||p||j||k||l||r[b]||(j=!0,u=c.call(arguments),f())},a.abort=function(){o||p||j||k||l||(k=!0,g())},r[b]=null,a}var m,n,q,u,v,j=!1,k=!1,l=!1,r=[],s={};for(m=0;m<b.length&&!j&&!k;m++){n=t.slice(),n.unshift(i());try{b[m].apply(b[m],n)}catch(w){q=w,j=!0;break}}q&&a.fail(q)}function h(){return o||p?w:(arguments.length>0&&r.push.apply(r,arguments),b(),w)}function i(){return p?w:(s.push.apply(s,arguments),b(),w)}function j(){if(o||p||0===arguments.length)return w;var a=c.apply(arguments);return h(function(b){g(b,a)}),w}function k(){if(o||p||0===arguments.length)return w;var a,b=c.call(arguments);for(a=0;a<b.length;a++)!function(a){h(function(b){var d=c.call(arguments,1);a.apply(a,d),b()}).or(a.fail)}(b[a]);return w}function l(){if(o||p||0===arguments.length)return w;var a,b=c.call(arguments);for(a=0;a<b.length;a++)!function(a){h(function(b){var d=c.call(arguments,1);a.apply(a,d).pipe(b)})}(b[a]);return w}function m(){if(o||p||0===arguments.length)return w;var a,b=c.call(arguments);for(a=0;a<b.length;a++)!function(a){h(function(b){var d=c.call(arguments,1);b(a.apply(a,d))})}(b[a]);return w}function n(){return o?w:(p=!0,e(),w)}var v,o=!1,p=!1,q=!0,r=[],s=[],t=[],u=[],w={then:h,or:i,gate:j,pipe:k,seq:l,val:m,abort:n};return arguments.length>0&&w.then.apply(w,arguments),w}return a}var b=a.ASQ,c=Array.prototype.slice;a.ASQ=e(),a.ASQ.noConflict=function(){var c=a.ASQ;return a.ASQ=b,c}}(this);

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

(function(global){
	function init() { }

	global.unnamed = {
		init: init
	};
})(window);
