var Autowire = require('autowire');

Autowire(function(_, Dispatcher, Utils) {
	var waiting = [];

	function playerAlreadyInQueue(conn) {
		return undefined !== _.find(waiting, function(elem) {
			return elem.spudzData.player === conn.spudzData.player;
		});
	}

	function clearDisconnected() {
		waiting = Utils.clearDisconnected(waiting);
	}

	function getWaitingPlayers() {
		return _.map(waiting, function(elem) {
			return elem.spudzData.player;
		});
	}

	var Matchmaker = function() {
		Dispatcher.register('find_match', this, this.onFindMatch);
	};

	Matchmaker.prototype.onFindMatch = function(arg) {
		var conn = arg.connection;
		
		clearDisconnected();
		if(playerAlreadyInQueue(conn)) {
			conn.sendEvent('already_in_mm');
			return;
		}

		if(waiting.length > 0) {
			Utils.matchmake(waiting[0], conn);
			waiting.shift();
		} else {
			conn.sendEvent('searching_for_match');
			waiting.push(conn);
		}
	}

	Matchmaker.prototype.getMatchmakingQueue = function() {
		clearDisconnected();
		return getWaitingPlayers();
	}

	Matchmaker.autowire = {
		instantiate: true,
		singleton: true
	}
	module.exports = Matchmaker;
});