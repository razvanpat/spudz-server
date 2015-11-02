var Autowire = require('autowire');

Autowire(function(Dispatcher) {
	var DisconnectR = function() {
		Dispatcher.register('connection_closed', this, this.onDisconnect);
	};

	DisconnectR.prototype.onDisconnect = function(arg) {
		var opp = arg.connection.spudzData.opponent;
		if(opp) {
			opp.sendText("Your opponent has disconnected!");
			delete opp.spudzData.opponent;
		}
	}

	DisconnectR.autowire = {
		instantiate: true,
		singleton: false
	}
	module.exports = DisconnectR;
});