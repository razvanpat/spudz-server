var Autowire = require('autowire');

Autowire(function(_, Dispatcher, Utils) {
	
	var Tournament = function() {
		Dispatcher.register('create_tournament', this, this.onCreateTournament);
		Dispatcher.register('tournament_sign_up', this, this.onTournamentRegister);
		Dispatcher.register('tournament_ready', this, this.onReady);

		//connection_closed
		//connection_error
	};

	Tournament.prototype.onCreateTournament = function(arg) {

		this.currentRound = {};
		this.previousRounds = [];

		this.currentRound.startTime = arg.param.startTime;
		this.currentRound.readyUpLimit = arg.param.readyUpLimit;
		this.currentRound.maxPlayers = arg.param.maxPlayers;
		this.currentRound.playerList = [];
		this.currentRound.playersOut = [];

		if(this.isTournamentStarted()) {
			this.currentRound.startAllowed = true;
		} else {
			this.currentRound.startAllowed = false;
		}
	};

	Tournament.prototype.isTournamentStarted = function() {
		return Utils.getTime() > this.currentRound.startTime;
	};

	Tournament.prototype.onTournamentRegister = function(arg) {
		if(this.isTournamentStarted()) {
			arg.connection.sendEvent('tournament_already_started', {});
		} else {
			this.currentRound.playerList.push(arg.connection);
			arg.connection.sendEvent('tournament_signed_up', {});
		}
	};

	Tournament.prototype.onReady = function(arg) {
		var index = _.findIndex(this.currentRound.playerList, function(elem) {
			return elem.spudzData.player === arg.connection.spudzData.player;
		});
		if(index >= 0) {
			var playerCon = this.currentRound.playerList[index];
			this.currentRound.playerList[index].spudzData.ready = true;

			if(arg.connection.spudzData.opponent && arg.connection.spudzData.opponent.spudzData.ready) {
				Utils.matchmake(arg.connection, arg.connection.spudzData.opponent)
			} else {
				arg.connection.sendEvent('waiting_for_opponent', {});
			}
		} else {
			arg.connection.sendEvent('error', {message: 'Not signed up for tournament'});
		}
	};

	Tournament.autowire = {
		instantiate: true,
		singleton: true
	}
	module.exports = Tournament;
});