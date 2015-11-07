var Autowire = require('autowire');

var TStateNone = function() {};
TStateNone.prototype.onConfig = function(arg) {
	this.tournament.startTime = arg.param.startTime;
	this.tournament.changeState(new TStateConfigured());
};
TStateNone.prototype.onSignUp = function() {};
TStateNone.prototype.onMatchEnd = function() {};

var TStateConfigured = function() {};
TStateConfigured.prototype.onConfig = function() {};
TStateConfigured.prototype.onSignUp = function() {};
TStateConfigured.prototype.onMatchEnd = function() {};

var TStateInProgress = function() {};
TStateInProgress.prototype.onConfig = function() {};
TStateInProgress.prototype.onSignUp = function() {};
TStateInProgress.prototype.onMatchEnd = function() {};

var TStateEnd = function() {};
TStateEnd.prototype.onConfig = function() {};
TStateEnd.prototype.onSignUp = function() {};
TStateEnd.prototype.onMatchEnd = function() {};


Autowire(function(_, Dispatcher, Utils) {
	
	var previousVerifyTime = 0;

	var Tournament = function() {
		this.changeState(new TStateNone());

		Dispatcher.register('configure_tournament', this, this.onConfig);
		Dispatcher.register('tournament_sign_up', this, this.onSignUp);
		Dispatcher.register('match_end', this, this.onMatchEnd)
	};

	Tournament.prototype.changeState = function(state) {
		this.state = state;
		this.state.tournament = this;
	}

	Tournament.prototype.onConfig = function(arg) {
		this.state.onConfig(arg);
	};

	Tournament.prototype.onSignUp = function(arg) {
		this.state.onSignUp(arg);
	}

	Tournament.prototype.onMatchEnd = function(arg) {
		this.state.onMatchEnd(arg);
	};

	Tournament.autowire = {
		instantiate: true,
		singleton: true
	}
	module.exports = Tournament;
});