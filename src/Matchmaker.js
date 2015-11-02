var Autowire = require('autowire');

Autowire(function(_, Dispatcher, Utils) {
	var waiting = [];

	function matchmake(conn1, conn2) {

		console.log('Matchmaking ' + conn1.spudzData.player + ' with ' + conn2.spudzData.player);

		conn1.spudzData.opponent = conn2;
		conn2.spudzData.opponent = conn1;

		conn1.sendText('You are now matchmaked with ' + conn2.spudzData.player);
		conn2.sendText('You are now matchmaked with ' + conn1.spudzData.player);
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
		console.log(conn.spudzData.player + ' is looking for a game');
	
		clearDisconnected();
		if(playerAlreadyInQueue(conn)) {
			conn.sendText('You are already registered for matchmaking');
			return;
		}

		if(waiting.length > 0) {
			console.log(conn.spudzData.player + ' has a match');
			matchmake(waiting[0], conn);
			waiting.shift();
		} else {
			console.log(conn.spudzData.player + ' is put in a queue');
			conn.sendText('Searching for a match');
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