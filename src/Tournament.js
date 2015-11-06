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

/**
	player data: 
	{
		player
		opponent
		matchId
		pointsWon
		matchWin
	}
*/

	Tournament.prototype.onCreateTournament = function(arg) {
		this.previousRounds = [];

		this.initRound(arg.param);

		if(this.isTournamentStarted()) {
			this.currentRound.startAllowed = true;
		} else {
			this.currentRound.startAllowed = false;
		}
	};

	Tournament.prototype.initRound = function(param) {
		this.currentRound = {};

		this.currentRound.startTime = param.startTime;
		this.currentRound.readyUpLimit = param.readyUpLimit;
		this.currentRound.maxPlayers = param.maxPlayers;
		this.currentRound.playerList = [];
		this.currentRound.playersOut = [];
		this.currentRound.winners = [];

	};

	Tournament.prototype.isTournamentStarted = function() {
		return Utils.getTime() > this.currentRound.startTime;
	};

	Tournament.prototype.onTournamentRegister = function(arg) {
		if(this.isTournamentStarted()) {
			arg.connection.sendEvent('tournament_already_started', {});
		} else {
			this.currentRound.playerList.push({
				player: arg.connection.spudzData.player,
				connection: arg.connection
			});
			arg.connection.sendEvent('tournament_signed_up', {});
		}
	};

	Tournament.prototype.getPlayerIndex = function(player) {
		return _.findIndex(this.currentRound.playerList, function(elem) {
			return elem.player === player;
		});
	}

	Tournament.prototype.getPlayer = function(player) {
		var index = this.getPlayerIndex(player);
		if(index !== -1) {
			return this.currentRound.playerList[index];
		} else {
			return null;
		}
	};

	Tournament.prototype.onReady = function(arg) {
		var index = this.getPlayerIndex(arg.connection.spudzData.player);
		if(index >= 0) {
			var player = this.currentRound.playerList[index];
			player.connection.spudzData.ready = true;

			if(arg.connection.spudzData.opponent && arg.connection.spudzData.opponent.spudzData.ready) {
				var opponent = this.getPlayer(arg.connection.spudzData.opponent.spudzData.player);
				player.opponent = opponent.player;
				opponent.opponent = player.player;
				
				Utils.matchmake(arg.connection, arg.connection.spudzData.opponent);
			} else {
				arg.connection.sendEvent('waiting_for_opponent', {});
			}
		} else {
			arg.connection.sendEvent('error', {message: 'Not signed up for tournament'});
		}
	};

	Tournament.prototype.onConnectionClosed = function(arg) {
		this.currentRound.winners.push(arg.connection.spudzData.opponent);
		this.currentRound.playerList = _.reject(this.currentRound.playerList, function(elem) {
			return elem === arg.connection.spudzData.opponent ||
					elem === arg.connection;
		}); 
		this.currentRound.playersOut.push(arg.connection.spudzData.player);
	};

	Tournament.prototype.onVerifyState = function(arg) {
		if(previousVerifyTime < this.currentRound.startTime && this.isTournamentStarted()) {
			this.currentRound.startAllowed = true;
			this.currentRound.roundStartTime = this.currentRound.startTime;
		}

		var allFinished = _.reduce(this.currentRound, function(result, elem) {
			return (elem.matchWin != undefined) && result;
		}, true);

		if(allFinished) {
			this.previousRounds.push(this.currentRound);
			console.log('init')
		
			this.initRound(_.last(this.previousRounds));
		}

		previousVerifyTime = Utils.getTime();
	};

	Tournament.prototype.setMatchWin = function(playerName) {
		var player = this.getPlayer(playerName);
		player.matchWin = true;
		var opponent = this.getPlayer(player.opponent);
		opponent.matchWin = false;
	}

	Tournament.autowire = {
		instantiate: true,
		singleton: true
	}
	module.exports = Tournament;
});