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
		if (wait_for_data_channel) {
			wait_for_data_channel.abort();
		}
		wait_for_data_channel = ASQ();
		resetWaitFor();
		resetMessageQueue();
		if (data_channel) {
			data_channel.onopen = data_channel.onerror =
				data_channel.onmessage = null
			;
		}
		if (pc) {
			pc.ondatachannel = null;
		}
		data_channel = data_channel_pump_throttle = current_channel_id =
			pc = wait_for_complete = null
		;
		data_channel_stream = [];
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
			message.from_id = from_id;
			message.channel_id = current_channel_id;
			console.log("from (" + from_id + ") sending signal",JSON.stringify(message));
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
		if (evt.candidate && evt.candidate.candidate) {
			console.log("onIceCandidate: " + JSON.stringify(evt.candidate));
			signal({
				candidate: evt.candidate
			});
		}
	}

	// temporay hacks: patch various SDP issues
	function patchSDP(description) {
		// patch data channel index
		// from: https://groups.google.com/d/msg/mozilla.dev.media/Yx9ZtFPqV6w/fYpBw3TOXX0J
		description.sdp = description.sdp.replace(/webrtc-datachannel 65536/g,"webrtc-datachannel 2048");

		return description;
	}

	function onSessionDescription(description) {
		description = patchSDP(description);
		console.log("local description created",description);

		pc.setLocalDescription(description);

		signal({
			sdp: description
		});
	}

	function createDataChannel(callerSide) {
		return ASQ()
		.then(function(done){

			wait_for_data_channel
			.then(function(dcDone){
				// on the caller side, create the data channel
				if (callerSide) {
					console.log("creating data channel");
					data_channel = pc.createDataChannel(
						"game_" + current_channel_id,
						data_channel_opts
					);

					data_channel.onmessage = onDataChannelMessage;
					data_channel.onerror = done.fail;
					data_channel.onopen = function(){
						console.log("data channel onopen");
						dcDone(); // data-channel open!
					};

					done(); // data-channel created
				}
				// on the receiver side, receive the data channel
				else {
					console.log("listening for data channel");
					pc.ondatachannel = function(evt) {
						console.log("received data channel");
						data_channel = evt.channel;
						data_channel.onmessage = onDataChannelMessage;

						dcDone(); // data-channel open!
					};

					done(); // data-channel created
				}
			});

		});
	}

	function sendMessage(msg) {
		if (data_channel) {
			// let's only allow sending/receving JSON-parseable string data!
			if (typeof msg !== "string") msg = JSON.stringify(msg);

			data_channel_stream.push(msg);
			pumpDataChannel();
		}
	}

	// pump the stream with the next DataChannel message to send
	function pumpDataChannel() {
		var msg;

		if (!data_channel_pump_throttle &&
			data_channel_stream.length > 0 &&
			data_channel
		) {
			msg = data_channel_stream.shift();

			try {
				console.log("sending data-channel message: " + msg);
				data_channel.send(msg);

				// throttle the data channel pumping
				data_channel_pump_throttle = setTimeout(function __throttle__(){
					data_channel_pump_throttle = null;
					pumpDataChannel();
				},50);
			}
			catch (err) {
				console.log(msg);
				data_channel_stream.length = 0;
			}
		}
	}

	// received DataChannel message
	function onDataChannelMessage(evt) {
		if (RTC.onMessage) {
			// let's only allow sending/receving JSON-parseable string data!
			try {
				// notify the handler
				RTC.onMessage(JSON.parse(evt.data));
			}
			catch (err) {}
		}
	}

	// join a RTC signaling channel
	function join(channelID,fromID,callerSide) {
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
			rtc_signal_exchange
			.seq(function(){
				return createDataChannel(callerSide);
			})
			.val(message_queue_ready);
		}
		catch (err) {
			console.log("createDataChannel Error",err.stack);
			rtc_signal_exchange.abort();
		}
	}

	// the initiator of the RTC peer-to-peer connection request
	function caller() {
		console.log("caller");

		rtc_signal_exchange
		.then(function(done){
			console.log("creating offer");
			console.log(media_constraints);
			pc.createOffer(function(desc){
				console.log("offer created");
				done.apply(done,arguments);
			},done.fail,media_constraints);
		})
		// caller's local description created, and sent to receiver
		.val(onSessionDescription)
		.seq(function(){
			console.log("waiting on wait_for");
			return wait_for;
		})
		.seq(function(){
			console.log("waiting on wait_for_data_channel");
			return wait_for_data_channel;
		})
		.val(function(){
			console.log("**** data channel open! ****");

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
				done.apply(done,arguments);
			},done.fail,media_constraints);
		})
		.val(onSessionDescription)
		.seq(function(){
			console.log("waiting on wait_for");
			return wait_for;
		})
		.seq(function(){
			console.log("waiting on wait_for_data_channel");
			return wait_for_data_channel;
		})
		.val(function(){
			console.log("**** data channel open! ****");
		})
		.or(function(err){
			console.log("receiver error",err.stack);
		});

		return rtc_signal_exchange;
	}

	// leave the RTC signaling channel
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
		wait_for_data_channel = ASQ(),
		ice_queue = [],

		data_channel,
		data_channel_stream = [],
		data_channel_pump_throttle,

		wait_for,
		wait_for_complete,

		media_constraints = {
			optional: [],
			mandatory: {}
		},

		peer_connection_options = {
			optional: [
				{ DtlsSrtpKeyAgreement: true } // FF/Chrome interop? https://hacks.mozilla.org/category/webrtc/as/complete/
			]
		},

		iceServers = [
			{ url: "stun:23.21.150.121" },
			{ url: "stun:stun.l.google.com:19302" }
		],

		data_channel_opts = {},

		message_queue,
		message_queue_ready
	;

	resetWaitFor();
	resetMessageQueue();

	// reliable data channels!!
	data_channel_opts.reliable = true;
	data_channel_opts.ordered = true;

	// Effing browser sniff hacks
/*	if (is_moz) {
		media_constraints.mandatory.OfferToReceiveAudio = true;
		media_constraints.mandatory.OfferToReceiveVideo = true;
	}
	else {
		media_constraints.mandatory.OfferToReceiveAudio = false;
		media_constraints.mandatory.OfferToReceiveVideo = false;
	}*/

	RTC = window.unnamed.RTC = {
		init: init,
		join: join,
		caller: caller,
		receiver: receiver,
		leave: leave,
		sendMessage: sendMessage,
		onForceClosed: null,
		onMessage: null
	};

})(window,window.unnamed);
