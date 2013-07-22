var io,
	channels = {}
;

function connection(socket) {

	function channelMessage(message) {
		//console.log("channel (" + current_channel_id + ") message",JSON.stringify(message));
		if (channels[current_channel_id]) {
			// don't queue 'close' messages
			if (!message.close) {
				channels[current_channel_id].message_queue.push(message);
				processMessageQueue();
			}
			// immediately broadcast the 'close' signal, then leave the channel and empty its message queue
			else {
				console.log("in (" + current_channel_id + ") close message broadcasted from: " + message.from_id + ", for channel: " + message.channel_id);
				socket.broadcast.to(current_channel_id).emit("message",message);
				channels[current_channel_id].message_queue = [];
				leaveChannel(current_channel_id);
			}
		}
		else {
			socket.broadcast.to(current_channel_id).emit("message",message);
		}
	}

	function processMessageQueue() {
		if (channels[current_channel_id].users.length > 1) {
			while (channels[current_channel_id].message_queue.length > 0) {
				socket.broadcast.to(current_channel_id).emit(
					"message",
					channels[current_channel_id].message_queue.shift()
				);
			}
		}
	}

	function joinChannel(channelID,fromID) {
		// set up new channel, if necessary
		channels[channelID] = channels[channelID] || {
			users: [],
			message_queue: []
		};

		// add current user to the channel-user list
		if (!~channels[channelID].users.indexOf(fromID)) {
			channels[channelID].users.push(fromID);
		}

		socket.join(channelID);
		current_channel_id = channelID;
		from_id = fromID;

		processMessageQueue();
	}

	function leaveChannel(channelID) {
		if (from_id && channels[channelID]) {
			// remove current user from the channel-users list
			channels[channelID].users =
				channels[channelID].users.filter(function(userID){
					return userID !== from_id;
				})
			;

			// channel now empty? clean it up
			if (channels[channelID].users.length === 0) {
				delete channels[channelID];
			}
		}

		if (channelID) {
			console.log("from (" + from_id + ") actually leaving channel: " + channelID);
			socket.leave(channelID);
		}
		else {
			console.log("from (" + from_id + ") couldn't leave empty channel: " + channelID);
		}
		current_channel_id = null;
	}

	function disconnected() {
		leaveChannel(current_channel_id);

		socket.removeListener("join_channel",joinChannel);
		socket.removeListener("message",channelMessage);
		socket.removeListener("leave_channel",leaveChannel);
		socket.removeListener("disconnect",disconnected);

		from_id = null;
	}

	var current_channel_id,
		from_id
	;

	socket.on("join_channel",joinChannel);
	socket.on("message",channelMessage);
	socket.on("leave_channel",leaveChannel);
	socket.on("disconnect",disconnected);
}

function init(socketio) {
	io = socketio;
	io.of("/rtcsignals").on("connection",connection);
}

exports.init = init;
