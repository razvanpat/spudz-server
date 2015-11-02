var Autowire = require('autowire');

Autowire(function(Dispatcher) {
	var MoveRelay = function() {
		Dispatcher.register('move', this, this.onMove);
	};

	MoveRelay.prototype.onMove = function(arg) {
		var conn = arg.connection;
		if(conn.spudzData.opponent === undefined) {
			conn.sendText('You don\'t have an opponent, your move command has disappeared into the void');
		} else {
			conn.spudzData.opponent.sendText('Your opponent made a move: ' + arg.param);
		}
	}

	MoveRelay.autowire = {
		instantiate: true,
		singleton: false
	}
	module.exports = MoveRelay;
});