(function(global,unnamed){

	function yesImReady() {
		$areyouready.hide();
	}

	function showReadyPrompt() {
		$areyouready.show();
	}

	function start(mypic) {
		$areyouready = $("#areyouready");
		$game = $("#game");

		$areyouready.click(yesImReady);

		showReadyPrompt();
	}

	var $areyouready,
		$game
	;

	unnamed.game = {
		start: start
	};

})(window,window.unnamed);
