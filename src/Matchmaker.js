var Autowire = require('autowire');

Autowire(function(_, Dispatcher, Utils) {
	var waiting = [];

	function matchmake(conn1, conn2) {

		conn1.spudzData.opponent = conn2;
		conn2.spudzData.opponent = conn1;

		var first = Math.random()<.5;

		conn1.sendEvent('match_found', {
			opponentId: conn2.spudzData.player,
			firstPlayer: first
		});

		conn2.sendEvent('match_found', {
			opponentId: conn1.spudzData.player,
			firstPlayer: !first
		});
	}

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
			matchmake(waiting[0], conn);
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