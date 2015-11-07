var Autowire = require('autowire');

Autowire(function(_, Dispatcher, Match, Utils) {

	var TStateNone = function() {this.name = 'none';};
	TStateNone.prototype.onConfig = function(arg) {
		this.tournament.startTime = arg.param.startTime;
		this.tournament.changeState(new TStateConfigured());
	};
	TStateNone.prototype.onSignUp = function() {};
	TStateNone.prototype.onMatchEnd = function() {};

	var TStateConfigured = function() {this.name = 'configured';};
	TStateConfigured.prototype.onConfig = function() {};
	TStateConfigured.prototype.onSignUp = function(arg) {
		this.tournament.playersSignedUp.push(arg.connection);
	};
	TStateConfigured.prototype.onMatchEnd = function() {};

	var TStateInProgress = function() {this.name = 'in_progress'};
	TStateInProgress.prototype.onConfig = function() {};
	TStateInProgress.prototype.onSignUp = function() {};
	TStateInProgress.prototype.onMatchEnd = function(arg) {
		var allEnded = _.reduce(this.tournament.matches, function(memo, match) {
			if(!match.ended) return false;
			return memo;
		}, true);
		if(allEnded) {
			this.tournament.newStage();
		}
	};

	var TStateEnd = function() {this.name = 'end'};
	TStateEnd.prototype.onConfig = function() {};
	TStateEnd.prototype.onSignUp = function() {};
	TStateEnd.prototype.onMatchEnd = function() {};



	var previousVerifyTime = 0;

	var Tournament = function() {
		this.changeState(new TStateNone());
		this.playersSignedUp = [];
		this.matches = [];
		this.unmatched = undefined;

		Dispatcher.register('configure_tournament', this, this.onConfig);
		Dispatcher.register('tournament_sign_up', this, this.onSignUp);
		Dispatcher.register('match_end', this, this.onMatchEnd);
		Dispatcher.register('tournament_start', this, this.onTournamentStart);
		Dispatcher.register('get_tournament_state', this, this.onGetTournamentState);
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

	Tournament.prototype.onGetTournamentState = function(arg) {
		arg.connection.sendEvent('tournament_state', this.state.name);
	};

	Tournament.prototype.buildMatches = function(playerList) {
		this.matches = [];
		playerList = this.shufflePlayers(playerList);
		for(var i=0; i<playerList.length-1; i+=2) {
			var m = new Match(playerList[i], playerList[i+1]);
            m.start();
            this.matches.push(m);
		}
		if(playerList.length % 2 === 1) {
			if(this.unmatched !== undefined) {
				var m = new Match(_.last(playerList), this.unmatched);
                m.start();
                this.matches.push(m);
				this.unmatched = undefined;
			} else {
				this.unmatched = _.last(playerList);
				this.unmatched.sendEvent('tournament_advance');
			}
		} else {
			this.unmatched = undefined;
		}
	}

	Tournament.prototype.shufflePlayers = function(playerList) {
		return _.shuffle(playerList);
	}

	Tournament.prototype.newStage = function() {
		var playerList = _.pluck(this.matches, 'winner');
		if(this.unmatched === undefined && playerList.length === 1) {
			this.tournamentWinner = playerList[0];
			this.changeState(new TStateEnd());
			this.tournamentWinner.sendEvent('tournament_win');
		} else {
			this.buildMatches(playerList);
		}
	}

	Tournament.prototype.onTournamentStart = function() {
		this.buildMatches(this.playersSignedUp);
		this.changeState(new TStateInProgress());
	};

	Tournament.autowire = {
		instantiate: true,
		singleton: true
	}
	module.exports = Tournament;
});
