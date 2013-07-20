(function(global,unnamed,game){

	function reset() {
		current_game_id = null;
	}

	function gameIDReceived(gameID) {
		console.log("game ID: " + gameID);
		current_game_id = +gameID;
	}

	function gameDataReceived(gameData) {
		var cnv, i, x, y, lx, ly;

		cnv = h5.canvas({
			width: 400,
			height: 400,
			matchDimensions: true
		});

		$playingsurface.append(cnv.element());

		cnv.setStyles({
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

		$areyouready,
		$game,
		$playingsurface,
		$leave_game
	;

	game = unnamed.game = {
		init: init,
		start: start,
		abort: abort
	};

})(window,window.unnamed);
