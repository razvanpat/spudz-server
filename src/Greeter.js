var Autowire = require('autowire');

Autowire(function(Dispatcher, StatsTracker) {
	var Greeter = function() {
		Dispatcher.register('new_connection', this, this.onNewConnection);
		Dispatcher.register('register_name', this, this.onPlayerName);
	};

	Greeter.prototype.onNewConnection = function(arg) {
		var conn = arg.connection;
		conn.sendEvent = function(name, param, player) {
			var evt = {
				name: name,
				param: param
			};
			if(player !== undefined) {
				evt.player = player
			}
			conn.sendText(JSON.stringify(evt));
		}
		conn.spudzData = {};
		conn.sendEvent('welcome');
	}

	Greeter.prototype.onPlayerName = function(arg) {
		var conn = arg.connection;
		if(StatsTracker.isPlayerNameAvailable(arg.param)) {
			conn.spudzData.player = arg.param;

			conn.sendEvent('player_registered');
		} else {
			conn.sendEvent('error', 'Another player with the same id is already connected');
			conn.close('900', 'Player name already taken');
		}
	}

	Greeter.autowire = {
		instantiate: true,
		singleton: false
	}
	module.exports = Greeter;
});