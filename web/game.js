(function(global,unnamed,game){

	function reset() {
		game_points = [];
		offset_game_points = [];
		$points = my_board = opponent_board = playing_surface_offset =
			game_timestamp_differential = next_play_step =
			current_game_id = null
		;
		$playingsurface.empty();
		start_point = next_point = 0;
		record_plays = ASQ();
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

		drawOpponentLines();
	}

	// TODO: temporary hack to simulate simultaneous drawing
	function drawOpponentLines() {
		var i;

		opponent_board
		.clear()
		.startPath(game_points[0].x,game_points[0].y);

		for (i=1; i<=Math.min(next_point,game_points.length-1); i++) {
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

	function playerDataReceived(token,gameID) {
		if (gameID) {
			console.log("game ID: " + gameID);
			current_game_id = Number(gameID);
		}

		next_play_step(token);
	}

	function gameDataReceived(gamePoints,gameTimestamp) {
		var cnv, i, x, y, lx, ly;

		// use server-provided game-start timestamp to correct our own timestamps
		game_timestamp_differential = Date.now() - Number(gameTimestamp);

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
		abort();
		showReadyPrompt();
		alert("Invalid game. Let's try again!");
	}

	function gameEnded(gameID) {
		if (current_game_id === +gameID) {
			abort();
			showReadyPrompt();
			alert("Game ended. Play again!");
		}
	}

	function gameDisconnected() {
		abort();
		showReadyPrompt();
	}

	function doGameDisconnect() {
		gameEnded(current_game_id);
	}

	function abort() {
		if (game_socket) {
			killSocket();
			game_socket.disconnect();
			game_socket = null;
		}
		killSocketNamespace();
		reset();
	}

	function killSocket() {
		game_socket.removeListener("connect_failed",gameDisconnected);
		game_socket.removeListener("disconnect",gameDisconnected);
		game_socket.removeListener("invalid_game",invalidGame);
		game_socket.removeListener("player_data",playerDataReceived);
		game_socket.removeListener("game_data",gameDataReceived);
		game_socket.removeListener("game_ended",gameEnded);
	}

	// kill socket namespace cache so we can reconnect to it later
	function killSocketNamespace() {
		// NOTE: this is a hack, the socket.io API seems to misbehave without it
		delete io.sockets[unnamed.SERVER]["namespaces"]["/game"];
	}

	function yesImReady() {
		$areyouready.hide();

		// TODO: temporary hack
		current_game_id = +($("#join_game_id").val());
		$("#join_game_id").val("");

		game_socket = io.connect(global.unnamed.SERVER + "/game",global.unnamed.SOCKET_IO_CONNECT_OPTS);
		game_socket.once("connect_failed",gameDisconnected);
		game_socket.once("disconnect",gameDisconnected);
		game_socket.once("invalid_game",invalidGame);
		game_socket.on("player_data",playerDataReceived);
		game_socket.on("game_data",gameDataReceived);
		game_socket.on("game_ended",gameEnded);

		game_socket.emit("user",user_id,current_game_id);

		record_plays.then(function(done){
			next_play_step = done;
		});

		$game.show();
	}

	function showReadyPrompt() {
		$game.hide();
		$areyouready.show();
	}

	function start(userID,myPic) {
		user_id = userID;
		mypic = myPic;

		showReadyPrompt();
	}

	function init() {
		$areyouready = $("#areyouready");
		$game = $("#game");
		$playingsurface = $("#playingsurface");
		$leave_game = $("#leave_game");

		$areyouready.find("input[type='button']").click(yesImReady);
		$leave_game.click(doGameDisconnect);
	}

	var game_socket,
		user_id,
		mypic,
		current_game_id,

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
		abort: abort
	};

})(window,window.unnamed);
