var Autowire = require('autowire');

Autowire(function(Dispatcher, StatsTracker) {
	var Greeter = function() {
		Dispatcher.register('new_connection', this, this.onNewConnection);
		Dispatcher.register('register_name', this, this.onPlayerName);
	};

	Greeter.prototype.onNewConnection = function(arg) {
		var conn = arg.connection;
		conn.spudzData = {};
		conn.sendText('Greetings');
	}

	Greeter.prototype.onPlayerName = function(arg) {
		var conn = arg.connection;
		if(StatsTracker.isPlayerNameAvailable(arg.param)) {
			conn.spudzData.player = arg.param;
			conn.sendText('Registered player name \''+arg.param+'\'');
		} else {
			conn.sendText('Player name is already taken. Bye bye!');
			conn.close('900', 'Player name already taken');
		}
	}

	Greeter.autowire = {
		instantiate: true,
		singleton: false
	}
	module.exports = Greeter;
});