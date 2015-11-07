var Autowire = require('autowire');
var util = require('util');

Autowire(function(Dispatcher) {

    function DoubleTap(name, match){
        this.match = match;
        this.name = name;
        this._firstTap = null;
        this._secondTap = null;
    }
    DoubleTap.prototype.next = function(player){
        var player1 = this.match.player1;
        var player2 = this.match.player2;

        this._firstTap = this._firstTap || player1 === player;
        this._secondTap = this._secondTap || player2 === player;

        if(this._firstTap &&  this._secondTap){
            var next = this.nextState.apply(this, arguments);
            return next;
        }
        return this;
    };

    function EndState(match, winner){
        this.name = 'endMatch';
        match.winner = winner;
    }

    function PlayState(match){
        this.name = 'play';
        this.match = match;
    }
    PlayState.prototype.endTurn = function(){
        this.changePlayer();
        return this;
    };
    PlayState.prototype.playerMove = function(player, params){
        this.match._determineOtherPlayer(player).sendEvent('opponent_move', params);
        if(!params){
            return this;
        }
        if(!this.isPlayerAlive(params.player2)){
            this.playerWin('player1', 'player2');
        }
        if(!this.isPlayerAlive(params.player1)){
            this.playerWin('player2', 'player1');
        }
        return this.endMatch();
    };

    PlayState.prototype.endMatch = function(){
        if(this.match.rounds.player1 >= 2){
            this.match.player1.sendEvent('end_match');
            this.match.player2.sendEvent('end_match');
            return new EndState(this.match, this.match.player1);
        }
        if(this.match.rounds.player2 >= 2){
            this.match.player1.sendEvent('end_match');
            this.match.player2.sendEvent('end_match');
            return new EndState(this.match, this.match.player2);
        }
        return this;
    }
    PlayState.prototype.playerWin = function(winningPlayer, losingPlayer){
        var player = this.match[winningPlayer];
        var otherPlayer = this.match[losingPlayer];
        player.sendEvent('win');
        otherPlayer.sendEvent('lose');
        this.match.rounds[winningPlayer]++;
    };
    PlayState.prototype.isPlayerAlive = function(player){
        return player.health > 0;
    };

    PlayState.prototype.changePlayer = function(){
        this.match.currentPlayer = this.match._determineOtherPlayer(this.match.currentPlayer);
        this.match.currentPlayer.sendEvent('your_move');
    };


    function CharacterSelectionState(match){
        DoubleTap.call(this, 'characterSelection', match);
    }
    util.inherits(CharacterSelectionState, DoubleTap);
    CharacterSelectionState.prototype.nextState = function(){
        this.match.currentPlayer = this.match._pickRandomPlayer();
        this.match.currentPlayer.sendEvent('your_move');
        return new PlayState(this.match);
    };

    function ReadyUpState(match){
        DoubleTap.call(this, 'readyUp', match);
    }
    util.inherits(ReadyUpState, DoubleTap);
    ReadyUpState.prototype.nextState = function(){
        return new CharacterSelectionState(this.match);
    };


    function bindPlayer(player, match){
        player.on('text', function(data){
            var command = JSON.parse(data);
            command.params = command.params || {};
            command.params.player = player;
            match.handleAction(command);
        });

        player.on('disconnect', function(){
            match.handleAction({
                action : 'disconnect',
                params : {
                    player : player
                }
            });
        });

        player.on('error', function(error){
            match.handleAction({
                action : 'error',
                params : {
                    player : player,
                    error : error
                }
            });
        });
    }
    var Match = function(player1, player2) {
        this._state = null;
        this.currentPlayer = null;
        this.player1 = player1;
        this.player2 = player2;
        this.rounds = {
            player1 : 0,
            player2 : 0
        };
        bindPlayer(player1, this);
        bindPlayer(player2, this);
	};


    Match.prototype.state = function(){
        return this._state.name;
    };

    Match.prototype.playerReadyEvent = function(player, params){
        this._state = this._state.next(player, params);
    };

    Match.prototype.playerCharacterSelectedEvent = function(player, params){
        this._state = this._state.next(player, params);
    };
    Match.prototype.endTurn = function(player, params){
        this._state = this._state.endTurn(player, params);
    };

    Match.prototype.playerMove = function(player, params){
        this._state = this._state.playerMove(player, params);
    };

    Match.prototype.readyTimeout = function(player){
        var otherPlayer = this._determineOtherPlayer(player);
        this._state = new EndState(this, otherPlayer);
    };

    Match.prototype.start = function(){
        this.player1.sendEvent('match_initialized');
        this.player2.sendEvent('match_initialized');
        this._state = new ReadyUpState(this);
    };

    Match.prototype._pickRandomPlayer = function(){
        return Math.random() > 0.5 ? this.player2 : this.player1;
    };
    Match.prototype._determineOtherPlayer = function(player){
        if(player === this.player1){
            return this.player2;
        }
        if(player === this.player2){
            return this.player1;
        }
        throw new Error("just another day for you and me in paradise");
    };

    Match.prototype.handleAction = function(data){
        switch(data.action){
            case 'ready':
                return this.playerReadyEvent(data.params.player);
            case 'characterSelected':
                return this.playerCharacterSelectedEvent(data.params.player);
            case 'endTurn' :
                return this.endTurn();
            case 'playerMove':
                return this.playerMove(data.params.player, data.params.state);
            case 'readyTimeout':
            case 'disconnect':
            case 'error':
                return this.readyTimeout(data.params.player);
        }
    };

	Match.autowire = {
		instantiate: false,
		singleton: false
	};
	module.exports = Match;
});
