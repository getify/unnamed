(function(global,unnamed,RTC){

	function reset() {
		// NOTE: leaving the RTC signal socket connected

		// close the peer-connection directly
		if (pc) {
			pc.close();
		}

		if (rtc_signal_exchange) {
			rtc_signal_exchange.abort();
		}
		rtc_signal_exchange = ASQ();
		resetWaitFor();
		resetMessageQueue();
		if (data_channel) {
			data_channel.onopen = data_channel.onerror = data_channel.onmessage = null;
		}
		data_channel = current_channel_id = pc = wait_for_complete = null;
	}

	function resetMessageQueue(){
		message_queue_ready = null;

		if (message_queue) {
			message_queue.abort();
		}

		// pause the messages-queue until the peer-connection is initialized
		message_queue = ASQ()
		.then(function(done){
			message_queue_ready = done;
		})
		.or(function(err){
			if (err.stack) {
				console.log(err.stack);
			}
			else {
				console.log(err+"");
			}
		});
	}

	function resetWaitFor() {
		wait_for_complete = null;

		if (wait_for) {
			wait_for.abort();
		}

		wait_for = ASQ()
		.then(function(done){
			console.log("wait_for_complete created");
			wait_for_complete = done;
		});
	}

	function createPeerConnection(config,optional) {
		if (global.RTCPeerConnection) return new RTCPeerConnection(config,optional);
		else if (global.webkitRTCPeerConnection) return new webkitRTCPeerConnection(config,optional);
		else if (global.mozRTCPeerConnection) return new mozRTCPeerConnection(config,optional);
		throw new Error("RTC Peer Connection not available");
	}

	function createIceCandidate(candidate) {
		console.log("creating ice candidate",JSON.stringify(candidate));

		if (global.RTCIceCandidate) return new RTCIceCandidate(candidate);
		else if (global.webkitRTCIceCandidate) return new webkitRTCIceCandidate(candidate);
		else if (global.mozRTCIceCandidate) return new mozRTCIceCandidate(candidate);
		throw new Error("RTC Ice Candidate not available");
	}

	function createSessionDescription(desc) {
		if (global.RTCSessionDescription) return new RTCSessionDescription(desc);
		else if (global.webkitRTCSessionDescription) return new webkitRTCSessionDescription(desc);
		else if (global.mozRTCSessionDescription) return new mozRTCSessionDescription(desc);
		throw new Error("RTC Session Description not available");
	}

	function signal(message) {
		if (rtcsignals_socket) {
			console.log("from (" + from_id + ") sending signal",JSON.stringify(arguments));

			message.from_id = from_id;
			message.channel_id = current_channel_id;
			rtcsignals_socket.emit("message",message);
		}
	}

	function onSignal(message) {
		message_queue
		.val(function(){
			// make sure we don't accidentally process one of our own messages
			// also, that the message is actually for the correct channel
			if (message.from_id != from_id && message.channel_id == current_channel_id) {
				if (message.candidate) {
					console.log("ice candidate received: " + JSON.stringify(message.candidate));
					try {
						pc.addIceCandidate(createIceCandidate({
							sdpMLineIndex: message.candidate.sdpMLineIndex,
							candidate: message.candidate.candidate
						}));
					}
					catch (err) {
						console.log(err.stack);
					}
				}
				else if (message.sdp) {
					console.log("remote description received: " + JSON.stringify(message.sdp));
					pc.setRemoteDescription(createSessionDescription(message.sdp));
					wait_for_complete();
				}
				// NOTE: not part of the standard RTC flow
				// receiver gets this signal back to confirm caller finished the connection
				else if (message.handshake) {
					console.log("handshake received");
					wait_for_complete();
				}
				// NOTE: not part of the standard RTC flow
				// signal that the peer connection needs to shut down
				else if (message.close) {
					console.log("from (" + from_id + ") close received: " + JSON.stringify(message));
					leave(/*sendClose=*/false);
					if (RTC.onForceClosed) {
						RTC.onForceClosed();
					}
				}
				else {
					console.log("from (" + from_id + ") in channel (" + current_channel_id + ") **** UNHANDLED MESSAGE ****");
					console.log(JSON.stringify(message));
				}
			}
			// TODO: figure out why socket.io is allowing this to happen
			else {
				console.log("from (" + from_id + ") in channel (" + current_channel_id + ") **** WRONGLY RECEIVED BROADCAST ****");
				console.log(JSON.stringify(message));
			}
		});
	}

	function onIceCandidate(evt) {
		signal({
			candidate: evt.candidate
		});
	}

	// From: https://googledrive.com/host/0B6GWd_dUUTT8RzVSRVU2MlIxcm8/RTCPeerConnection-v1.5.js
	function randomChars(length) {
		var i, chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), ret = "";
		for (i=0; i<length; i++) {
			ret += chars[Math.round(Math.random() * 100) % chars.length];
		}
		return ret;
	}

	// From: https://googledrive.com/host/0B6GWd_dUUTT8RzVSRVU2MlIxcm8/RTCPeerConnection-v1.5.js
	function getInteropSDP(sdp) {
		var inline = randomChars(40) + "\r\n";

		sdp = !~sdp.indexOf("a=crypto") ?
			sdp.replace(/c=IN/g,"a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:" + inline + "c=IN") :
			sdp
		;

		return sdp;
	}

	function onSessionDescription(description) {
		console.log("local description created",description);

		pc.setLocalDescription(description);
		signal({
			sdp: description
		});
	}

	function onDataChannelError(err) {
		console.log("onDataChannelError",err.stack);
	}

	function createDataChannel() {
		console.log("creating data channel");
		data_channel = pc.createDataChannel(
			"game_" + current_channel_id,
			data_channel_opts
		);

		// Effing browser sniff hacks
		if (is_moz) {
			data_channel.binaryType = "blob";
		}

		data_channel.onmessage = onDataChannelMessage;
		data_channel.onerror = onDataChannelError;
	}

	function onDataChannelMessage(evt) {
		console.log("data channel message(s) received:",evt.data);
	}

	// Effing browser sniff hacks
	// firefox requires a fake/unused stream to initiate peer-connection
	function getFakeMozStream() {
		return ASQ(function(done){
			console.log("creating fake streams for firefox");
			h5
			.userMedia({
				audio: true,
				fake: true
			})
			.stream(function(src){
				try {
					pc.addStream(src);
					console.log("fake streams created");
					done();
				}
				catch (err) {
					done.fail("fakeMozStream failed",err);
				}
			});
		});
	}

	function join(channelID,fromID) {
		current_channel_id = channelID;
		from_id = fromID;

		console.log("from (" + fromID + ") joining channel: " + channelID);
		rtcsignals_socket.emit("join_channel",channelID,fromID);

		console.log("creating peer-connection");
		pc = createPeerConnection(
			{ iceServers: iceServers },
			peer_connection_options
		);
		pc.onicecandidate = onIceCandidate;

		try {
			createDataChannel();
			message_queue_ready();
		}
		catch (err) {
			console.log("createDataChannel",err.stack);
			rtc_signal_exchange.abort();
		}
	}

	// the initiator of the RTC peer-to-peer connection request
	function caller() {
		console.log("caller");

		data_channel.onopen = function() {
			console.log("**** data channel open! ****");
			data_channel.send("hello from caller");
		};

		// Effing browser sniff hacks
		// firefox requires a fake/unused stream to initiate peer-connection
		if (is_moz) {
			rtc_signal_exchange.seq(getFakeMozStream);
		}

		rtc_signal_exchange
		.then(function(done){
			console.log("creating offer");
			console.log(media_constraints);
			pc.createOffer(function(desc){
				console.log("offer created");
				desc.sdp = getInteropSDP(desc.sdp);
				done.apply(done,arguments);
			},done.fail,media_constraints);
		})
		// caller's local description created, and sent to receiver
		.val(onSessionDescription)
		.seq(function(){
			return wait_for;
		})
		.val(function(){
			// let receiver know handshake is complete
			signal({ handshake: true });
		})
		.or(function(err){
			console.log("caller error",err.stack);
		});

		return rtc_signal_exchange;
	}

	// the receiver of the RTC peer-to-peer connection request
	function receiver() {
		console.log("receiver");

		data_channel.onopen = function() {
			console.log("**** data channel open! ****");
			data_channel.send("hello from receiver");
		};

		// Effing browser sniff hacks
		// firefox requires a fake/unused stream to initiate peer-connection
		if (is_moz) {
			rtc_signal_exchange.seq(getFakeMozStream);
		}

		rtc_signal_exchange
		.seq(function(){
			return wait_for;
		})
		.val(function(){
			console.log("wait_for_complete used");
			wait_for
			.then(function(done){
				console.log("recreating wait_for_complete");
				wait_for_complete = done;
			});
		})
		.then(function(done){
			console.log("creating answer");

			pc.createAnswer(function(desc){
				console.log("answer created");
				desc.sdp = getInteropSDP(desc.sdp);
				done.apply(done,arguments);
			},done.fail,media_constraints);
		})
		.val(onSessionDescription)
		.seq(function(){
			return wait_for;
		})
		.or(function(err){
			console.log("receiver error",err.stack);
		});

		return rtc_signal_exchange;
	}

	function leave(sendClose) {
		console.log("rtc leave:" + sendClose);
		if (rtcsignals_socket) {
			if (sendClose) {
				// let the other peer know we're leaving, so close the RTC connection
				signal({ close: true });
			}
			else if (current_channel_id) {
				rtcsignals_socket.emit("leave_channel",current_channel_id);
			}
		}
		current_channel_id = null;
		reset();
	}

	function rtcDisconnected() {
		console.error("rtc disconnected");
		abort(/*sendClose=*/false);
	}

	function abort(sendClose) {
		console.log("rtc abort: " + sendClose);
		if (rtcsignals_socket) {
			leave(sendClose);
			killSocket();
			rtcsignals_socket.disconnect();
			rtcsignals_socket = null;
		}
		killSocketNamespace();
	}

	function killSocket() {
		rtcsignals_socket.removeListener("connect_failed",rtcDisconnected);
		rtcsignals_socket.removeListener("disconnect",rtcDisconnected);
		rtcsignals_socket.removeListener("message",onSignal);
	}

	// kill socket namespace cache so we can reconnect to it later
	function killSocketNamespace() {
		// NOTE: this is a hack, the socket.io API seems to misbehave without it
		delete io.sockets[unnamed.SERVER]["namespaces"]["/rtcsignals"];
	}

	function init() {
		rtcsignals_socket = io.connect(global.unnamed.SERVER + "/rtcsignals",global.unnamed.SOCKET_IO_CONNECT_OPTS);
		rtcsignals_socket.once("connect_failed",rtcDisconnected);
		rtcsignals_socket.once("disconnect",rtcDisconnected);
		rtcsignals_socket.on("message",onSignal);
	}

	var
		// Effing browser sniff hacks
		is_moz = ("MozAppearance" in document.documentElement.style),

		from_id,

		rtcsignals_socket,
		pc,
		current_channel_id,
		rtc_signal_exchange = ASQ(),
		ice_queue = [],

		data_channel,

		wait_for,
		wait_for_complete,

		media_constraints = {
			optional: [],
			mandatory: {}
		},

		peer_connection_options = (
			!is_moz ?
			{
				optional: [{ RtpDataChannels: true }]
			} :
			undefined
		),

		iceServers = [
			{
				url: !is_moz ? "stun:stun.l.google.com:19302" : "stun:23.21.150.121"
			}
		],

		data_channel_opts = {},

		message_queue,
		message_queue_ready
	;

	resetWaitFor();
	resetMessageQueue();

	// Effing browser sniff hacks
	if (is_moz) {
		media_constraints.mandatory.OfferToReceiveAudio = true;
		media_constraints.mandatory.OfferToReceiveVideo = true;
	}
	else {
		media_constraints.mandatory.OfferToReceiveAudio = false;
		media_constraints.mandatory.OfferToReceiveVideo = false;

		// no one really supports "reliable" yet :(
		data_channel_opts.reliable = false;
	}

	RTC = window.unnamed.RTC = {
		init: init,
		join: join,
		caller: caller,
		receiver: receiver,
		leave: leave,
		onForceClosed: null
	};

})(window,window.unnamed);
