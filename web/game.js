(function(global,unnamed,game){

	function reset() {
		current_game_id = null;
		game_points = [];
		offset_game_points = [];
		$playingsurface.empty();
		$points = $mine = $opponent = null;
		next_point = 0;
	}

	function startDragging(evt) {
		evt.preventDefault();
		evt.stopImmediatePropagation();

		if (!dragging) {
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

		if (
			(evt.pageX >= offset_game_points[point].x1) &&
			(evt.pageX <= offset_game_points[point].x2) &&
			(evt.pageY >= offset_game_points[point].y1) &&
			(evt.pageY <= offset_game_points[point].y2)
		) {
			// successfully found the previous point to start from?
			if (start_point < next_point) {
				start_point = next_point;
			}
			else {
				console.log("Point " + (next_point + 1));
				next_point++;
				start_point = next_point;

				// are we done with the game?
				if (next_point >= game_points.length) {
					endDragging(evt);
					next_point = 0;
				}
			}
		}
	}

	function endDragging(evt) {
		evt.preventDefault();
		evt.stopImmediatePropagation();

		$(document).unbind("mousemove",drag).unbind("mouseup",endDragging);
		dragging = false;

		// if we've already found a point, have to start at previously connected point
		if (next_point > 0) {
			start_point = next_point - 1;
		}
	}

	function gameIDReceived(gameID) {
		console.log("game ID: " + gameID);
		current_game_id = +gameID;
	}

	function gameDataReceived(gameData) {
		var cnv, i, x, y, lx, ly, playing_surface_offset;

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

		for (i=0; i<gameData.length; i++) {
			x = gameData[i][0];
			y = gameData[i][1];
			lx = gameData[i][2];
			ly = gameData[i][3];

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
		cnv = h5.canvas({
			width: 400,
			height: 400,
			matchDimensions: true
		});

		$opponent = $(cnv.element()).attr({ id: "opponent" }).appendTo($playingsurface);

		cnv.clear();

		// draw my game canvas
		cnv = h5.canvas({
			width: 400,
			height: 400,
			matchDimensions: true
		});

		$mine = $(cnv.element()).attr({ id: "mine" }).appendTo($playingsurface);

		cnv.clear();

		playing_surface_offset = $playingsurface.offset();

		for (i=0; i<game_points.length; i++) {
			// calculate game points with respect to global offset
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
		game_socket.removeListener("game_id",gameIDReceived);
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
		game_socket.on("game_id",gameIDReceived);
		game_socket.on("game_data",gameDataReceived);
		game_socket.on("game_ended",gameEnded);

		game_socket.emit("user",user_id,current_game_id);

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
		$mine,
		$opponent
	;

	game = unnamed.game = {
		init: init,
		start: start,
		abort: abort
	};

})(window,window.unnamed);
