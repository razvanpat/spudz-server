var Autowire = require('autowire');

Autowire(function(_) {
	var Utils = function() {};

	Utils.prototype.clearDisconnected = function(connectionArray) {
		return _.reject(connectionArray, function(conn) {
			return conn.readyState != conn.OPEN;
		});
	};

	Utils.prototype.removeConnection = function(connectionArray, connection) {
		return _.reject(connectionArray, function(conn) {
			return conn == connection;
		});
	}

	Utils.prototype.broadcast = function(connectionArray, msg) {
		_.each(connectionArray, function(conn) {
			conn.sendText(JSON.stringify(msg));
		});
	};

	Utils.prototype.getTime = function() {
		return (new Date()).getTime();
	};

	Utils.prototype.matchmake = function(conn1, conn2) {
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

	Utils.autowire = {
		instantiate: true,
		singleton: true
	};

	module.exports = Utils;
});