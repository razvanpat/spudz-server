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

	Utils.autowire = {
		instantiate: true,
		singleton: true
	};

	module.exports = Utils;
});