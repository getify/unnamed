(function(global,unnamed,game){

	function reset() {
		console.log("user (" + user_id + ") game reset");
		unnamed.RTC.leave(/*sendClose=*/true); // leave the RTC channel

		game_points = [];
		offset_game_points = [];
		$points = my_board = opponent_board = playing_surface_offset =
			game_timestamp_differential = next_play_step =
			current_game_id = opponentpic = opponentname = null
		;
		$playingsurface.empty();
		game_status = start_point = next_point = 0;
		record_plays = ASQ();

		$them.find("img").attr({ src: "" });
		$them.find("figcaption").text("");
	}

	function drawMyLines(x,y) {
		var i, end_x = x - playing_surface_offset.left,
			end_y = y - playing_surface_offset.top
		;

		my_board
		.clear()
		.startPath(game_points[0].x,game_points[0].y);

		for (i=1; i<next_point; i++) {
			my_board.defineSegments([
				{ lineTo: [game_points[i].x, game_points[i].y] }
			]);
		}

		if (next_point === start_point) {
			my_board.defineSegments([
				{ lineTo: [end_x, end_y] }
			]);
		}

		my_board.endPath({ stroke: true });
	}

	function drawOpponentLines(point) {
		var i;

		opponent_board
		.clear()
		.startPath(game_points[0].x,game_points[0].y);

		for (i=1; i<=Math.min(point,game_points.length-1); i++) {
			opponent_board.defineSegments([
				{ lineTo: [game_points[i].x, game_points[i].y] }
			]);
		}

		opponent_board.endPath({ stroke: true });
	}

	function startDragging(evt) {
		evt.preventDefault();
		evt.stopImmediatePropagation();

		if (!dragging && next_point < game_points.length) {
			dragging = true;
			$(document).bind("mousemove",drag).bind("mouseup",endDragging);

			// if we've already found a point, have to start at previously connected point
			if (next_point > 0) {
				start_point = next_point - 1;
			}

			drag(evt);
		}
	}

	function drag(evt) {
		var point = next_point;

		evt.preventDefault();
		evt.stopImmediatePropagation();

		// have to start with the previously connected point
		if (start_point < next_point) {
			point = start_point;
		}

		// draw lines for already connected points
		if (point > 0) {
			drawMyLines(evt.pageX,evt.pageY);
		}

		// did we find a point?
		if (
			(evt.pageX >= offset_game_points[point].x1) &&
			(evt.pageX <= offset_game_points[point].x2) &&
			(evt.pageY >= offset_game_points[point].y1) &&
			(evt.pageY <= offset_game_points[point].y2)
		) {
			// found the previous point to re-start from?
			if (start_point < next_point) {
				start_point = next_point;
			}
			// found the next point to connect to!
			else {
				recordPlay(next_point);

				next_point++;
				start_point = next_point;

				// are we done with the game?
				if (next_point >= game_points.length) {
					endDragging(evt);
				}
			}
		}
	}

	function endDragging(evt) {
		evt.preventDefault();
		evt.stopImmediatePropagation();

		$(document).unbind("mousemove",drag).unbind("mouseup",endDragging);
		dragging = false;

		// any points left to play?
		if (next_point < game_points.length) {
			// if we've already found a point, have to start at previously connected point next time
			if (next_point > 0) {
				start_point = next_point - 1;
			}
		}
		// done with the game!
		else {
			next_point = start_point = game_points.length;
		}

		drawMyLines();
	}

	function recordPlay(playIndex) {
		var timestamp = Date.now() - game_timestamp_differential;

		record_plays.then(function(done,token){
			game_socket.emit("play",token,playIndex,timestamp);
			next_play_step = done;
		});
	}

	function playerDataReceived(token,gameID,callerSide) {
		console.log("user (" + user_id + ") player data received");
		if (gameID) {
			console.log("user (" + user_id + ") game ID: " + gameID);
			current_game_id = Number(gameID);
			unnamed.RTC.join(current_game_id,user_id,callerSide);
		}

		if (next_play_step) {
			next_play_step(token);
		}
		else {
			console.log("user (" + user_id + ") ERROR(playerDataReceived): next step not yet registered");
		}
	}

	function exchangePics() {
		function chunkSend() {
			var chunk, msg;

			chunk = chunk_source.substr((sent_index * chunk_size),chunk_size);

			msg = {
				chunk: chunk,
				index: sent_index
			};

			// no more to send?
			if (((sent_index+1)*chunk_size) >= chunk_source.length) {
				chunk_send_complete = true;
				msg.last = true;
				msg.name = myname.substr(0,20);
			}

			console.log("sending chunk: " + sent_index);
			unnamed.RTC.sendMessage(msg);

			// do we need a timeout for retry if no ACK received?
			if (!ack_waiting) {
				ack_waiting = setTimeout(function(){
					if (retry_count < 3) {
						// retry chunk-send
						retry_count++;
						ack_waiting = null;
						chunk_send_complete = false;
						chunkSend();
					}
					else {
						send_done.fail("aborting pic-exchange, send-chunk failed: " + sent_index);
					}
				},1000);
			}
		}

		function chunkReceive(msg) {
			console.log("chunk received: " + msg.index);
			opponentpic += msg.chunk;

			console.log("sending ack: " + msg.index);
			unnamed.RTC.sendMessage({ ack: msg.index });
		}

		function onMessage(msg) {
			if (msg.chunk && msg.index > received_index) {
				received_index++;
				chunkReceive(msg);
				if (msg.last) {
					console.log("done receiving");
					opponentname = msg.name;
					receive_done();
				}
			}
			else if (("ack" in msg) && msg.ack == sent_index) {
				console.log("chunk acknowledged: " + msg.ack);
				sent_index++;
				clearTimeout(ack_waiting);
				ack_waiting = null;
				retry_count = 0;
				if (!chunk_send_complete) {
					chunkSend();
				}
				else {
					console.log("done sending");
					send_done();
				}
			}
			else {
				console.log("**** unhandled RTC message ****",JSON.stringify(msg));
			}
		}

		var steps = ASQ(), chunk_source = mypic,
			chunk_size = 1E9, sent_index = 0, received_index = -1,
			send_done, receive_done, chunk_send_complete = false,
			ack_waiting, retry_count = 0
		;

		// prepare to receive pic from opponent
		opponentpic = "";

		// temporarily listen to RTC peer messages (for pic exchange!)
		unnamed.RTC.onMessage = onMessage;

		if (true/*!is_moz*/) {
			steps
			.gate(
				// send my pic
				function(done){
					send_done = done;
					chunkSend();
				},
				// receive opponent pic
				function(done){
					receive_done = done;
				}
			)
			.val(function(){
				console.log("pic exchange complete!");

				// we're done (for now) listening to RTC peer messages
				unnamed.RTC.onMessage = null;

				$them.find("img").attr({ src: opponentpic });
				$them.find("figcaption").text(opponentname);
			})
			.or(function(){
				// we're done (for now) listening to RTC peer messages
				unnamed.RTC.onMessage = null;
			});
		}
		else {
			console.log("Skipping pic exchange since data-channel isn't working (yet) in this browser.");
		}

		return steps;
	}

	function gameDataReceived(gamePoints,players,gameTimestamp) {
		console.log("user (" + user_id + ") game data received");
		var rtcCaller, steps;

		// by convention, the first player in the player list will be the "caller" (for RTC purposes)
		rtcCaller = (players.indexOf(user_id) === 0);

		// use server-provided game-start timestamp to correct our own timestamps
		game_timestamp_differential = Date.now() - Number(gameTimestamp);

		// initiate the RTC peer-to-peer connection
		if (rtcCaller) {
			steps = unnamed.RTC.caller();
		}
		else {
			steps = unnamed.RTC.receiver();
		}

		steps
		.seq(exchangePics)
		.val(function(){
			buildGame(gamePoints);
		})
		.or(function(err){
			console.log("user (" + user_id + ") error!!");
			console.log(err+"");
			invalidGame();
		});
	}

	function buildGame(gamePoints) {
		console.log("user (" + user_id + ") building game");

		var cnv, i, x, y, lx, ly;

		game_status = 2;

		cnv = h5.canvas({
			width: 400,
			height: 400,
			matchDimensions: true
		});

		$points = $(cnv.element()).attr({ id: "points" }).appendTo($playingsurface);

		cnv
		.clear()
		.setStyles({
			text: {
				font: "8px sans-serif",
				baseline: "top"
			},
			stroke: {
				color: "black"
			},
			fill: {
				color: "black"
			}
		});

		for (i=0; i<gamePoints.length; i++) {
			x = gamePoints[i][0];
			y = gamePoints[i][1];
			lx = gamePoints[i][2];
			ly = gamePoints[i][3];

			game_points.push({
				x: x,
				y: y
			});

			cnv.pushState();

			// draw the dot
			cnv
			.startPath(x,y)
			.defineSegments([
				{ arc: [x,y,4,0,Math.PI*2,true] }
			])
			.endPath({
				fill: true
			});

			// print the dot label
			cnv.text({
				fill: [(i+1)+"",lx,ly]
			});

			cnv.popState();
		}

		// draw opponent's game canvas
		opponent_board = h5.canvas({
			width: 400,
			height: 400,
			matchDimensions: true
		})
		.setStyles({
			alpha: 0.6,
			stroke: {
				width: 6,
				color: "orange",
				caps: "round",
				joints: "round"
			}
		})
		.clear();

		$(opponent_board.element()).attr({ id: "opponent" }).appendTo($playingsurface);

		// draw my game canvas
		my_board = h5.canvas({
			width: 400,
			height: 400,
			matchDimensions: true
		})
		.setStyles({
			stroke: {
				width: 2,
				color: "black",
				caps: "round",
				joints: "round"
			}
		})
		.clear();

		$(my_board.element()).attr({ id: "mine" }).appendTo($playingsurface);

		playing_surface_offset = $playingsurface.offset();

		// precalculate game points
		for (i=0; i<game_points.length; i++) {
			// account for coordinate global offset
			offset_game_points.push({
				x1: Math.round(game_points[i].x + playing_surface_offset.left),
				y1: Math.round(game_points[i].y + playing_surface_offset.top)
			});

			// expand game points' hit areas to make the game easier to play
			offset_game_points[i].x1 -= 4;
			offset_game_points[i].y1 -= 4;
			offset_game_points[i].x2 = offset_game_points[i].x1 + 8;
			offset_game_points[i].y2 = offset_game_points[i].y1 + 8;
		}

		// get ready for play!
		$playingsurface.bind("mousedown",startDragging);
	}

	function invalidGame() {
		console.log("user (" + user_id + ") invalid game");
		gameEndReset();
		alert("Invalid game. Let's try again!");
	}

	function gameDisconnected() {
		console.log("user (" + user_id + ") game disconnected");
		gameEndReset();
		alert("Game ended. Play again!");
	}

	function gameLeft(evt) {
		evt.preventDefault();
		evt.stopImmediatePropagation();

		console.log("user (" + user_id + ") left game");

		gameEndReset();
	}

	function gameEndReset() {
		console.log("user (" + user_id + ") game end reset");
		abort();
		showReadyPrompt();
	}

	function gameRTCForceClosed() {
		console.log("user (" + user_id + ") game rtc force closed");
		if (game_status === 1) {
			invalidGame();
		}
		else if (game_status === 2) {
			gameDisconnected();
		}
	}

	function abort() {
		console.log("user (" + user_id + ") game abort");
		if (game_socket) {
			killSocket();
			console.log("user (" + user_id + ") ***** disconnecting game socket *****");
			game_socket.disconnect();
			game_socket = null;
		}
		killSocketNamespace();
		reset();
	}

	function socketGameEnded() {
		console.log("user (" + user_id + ") socketGameEnded");
		gameDisconnected();
	}

	function socketConnectFailed() {
		console.log("user (" + user_id + ") connectFailed");
		gameDisconnected();
	}

	function socketDisconnect() {
		console.log("user (" + user_id + ") socketDisconnect");
		gameDisconnected();
	}

	function killSocket() {
		game_socket.removeListener("connect_failed",socketConnectFailed);
		game_socket.removeListener("disconnect",socketDisconnect);
		game_socket.removeListener("invalid_game",invalidGame);
		game_socket.removeListener("player_data",playerDataReceived);
		game_socket.removeListener("opponent_play",drawOpponentLines);
		game_socket.removeListener("game_data",gameDataReceived);
		game_socket.removeListener("game_ended",socketGameEnded);
	}

	// kill socket namespace cache so we can reconnect to it later
	function killSocketNamespace() {
		// NOTE: this is a hack, the socket.io API seems to misbehave without it
		delete io.sockets[unnamed.SERVER]["namespaces"]["/game"];
	}

	function yesImReady() {
		game_status = 1;

		$areyouready.hide();

		record_plays.then(function(done){
			console.log("user (" + user_id + ") defining next_play_step");
			next_play_step = done;

			// TODO: temporary hack
			current_game_id = +($("#join_game_id").val());
			$("#join_game_id").val("");

			game_socket = io.connect(global.unnamed.SERVER + "/game",global.unnamed.SOCKET_IO_CONNECT_OPTS);
			game_socket.once("connect_failed",socketConnectFailed);
			game_socket.once("disconnect",socketDisconnect);
			game_socket.once("invalid_game",invalidGame);
			game_socket.on("player_data",playerDataReceived);
			game_socket.on("opponent_play",drawOpponentLines);
			game_socket.on("game_data",gameDataReceived);
			game_socket.on("game_ended",socketGameEnded);

			console.log("user (" + user_id + ") joining game: " + current_game_id);
			game_socket.emit("user",user_id,current_game_id);

			$game.show();
		});
	}

	function showReadyPrompt() {
		$game.hide();
		$areyouready.show();
	}

	function start(userID,firstName,myPic) {
		user_id = userID;
		myname = firstName;
		mypic = myPic;

		showReadyPrompt();
	}

	function init() {
		$areyouready = $("#areyouready");
		$game = $("#game");
		$playingsurface = $("#playingsurface");
		$leave_game = $("#leave_game");
		$them = $("#game #them");

		$areyouready.find("input[type='button']").click(yesImReady);
		$leave_game.click(gameLeft);

		unnamed.RTC.onForceClosed = gameRTCForceClosed;
	}

	var
		// Effing browser sniff hacks
		is_moz = ("MozAppearance" in document.documentElement.style),

		game_socket,
		user_id,
		myname,
		mypic,
		opponentpic,
		opponentname,
		current_game_id,

		game_status = 0,

		game_points = [],
		offset_game_points = [],
		next_point = 0,
		start_point = 0,

		dragging = false,

		$areyouready,
		$game,
		$playingsurface,
		$leave_game,
		$points,
		$them,

		game_timestamp_differential,
		playing_surface_offset,
		my_board,
		opponent_board,

		record_plays = ASQ(),
		next_play_step
	;

	game = unnamed.game = {
		init: init,
		start: start,
		abort: abort,
		invalidGame: invalidGame,
		gameDisconnected: function(){
			console.log("user (" + user_id + ") game manually disconnected");
			gameDisconnected();
		}
	};

})(window,window.unnamed);
