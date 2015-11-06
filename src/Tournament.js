var Autowire = require('autowire');

Autowire(function(_, Dispatcher, Utils) {
	
	var previousVerifyTime = 0;

	var Tournament = function() {
		Dispatcher.register('create_tournament', this, this.onCreateTournament);
		Dispatcher.register('tournament_sign_up', this, this.onTournamentRegister);
		Dispatcher.register('tournament_ready', this, this.onReady);
		Dispatcher.register('verify_state', this, this.onVerifyState);

		Dispatcher.register('connection_closed', this, this.onConnectionClosed);
		Dispatcher.register('connection_error', this, this.onConnectionClosed);
	};


	Tournament.autowire = {
		instantiate: true,
		singleton: true
	}
	module.exports = Tournament;
});