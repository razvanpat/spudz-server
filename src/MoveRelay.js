var Autowire = require('autowire');

Autowire(function(Dispatcher) {
	var MoveRelay = function() {
		Dispatcher.register('move', this, this.onMove);
	};

	MoveRelay.prototype.onMove = function(arg) {
		var conn = arg.connection;
		if(conn.spudzData.opponent !== undefined) {
			conn.spudzData.opponent.sendEvent('move', arg.param, conn.spudzData.player);
		}
	}

	MoveRelay.autowire = {
		instantiate: true,
		singleton: false
	}
	module.exports = MoveRelay;
});