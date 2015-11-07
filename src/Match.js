var Autowire = require('autowire');

Autowire(function(Dispatcher) {

    function DoubleTapState(name, match, nextState, action){
        action = action || function(){};
        var firstTap;
        var secondTap;
        var player1 = match.player1;
        var player2 = match.player2;
        return {
            name : name,
            next : function(player){
                firstTap = firstTap || player1 === player;
                secondTap = secondTap || player2 === player;
                if(firstTap && secondTap){
                    action(match);
                    return nextState;
                }
                return this;
            }
        };
    }


    function PlayState(match){
        this.name = 'play';
        this.match = match;
    }
    PlayState.prototype.endTurn = function(){
        this.changePlayer();
    };
    PlayState.prototype.playerMove = function(player, params){
        this.determineOtherPlayer(player).sendEvent('opponent_move', params);
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
            return this.nextState;
        }
        if(this.match.rounds.player2 >= 2){
            this.match.player1.sendEvent('end_match');
            this.match.player2.sendEvent('end_match');
            return this.nextState;
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
    PlayState.prototype.determineOtherPlayer = function(player){
        if(player === this.match.player1){
            return this.match.player2;
        }
        if(player === this.match.player2){
            return this.match.player1;
        }
        throw new Error("just another day for you and me in paradise");
    };

    PlayState.prototype.changePlayer = function(){
        this.match.currentPlayer = this.determineOtherPlayer(this.match.currentPlayer);
        this.match.currentPlayer.sendEvent('your_move');
    };

    var Match = function(player1, player2) {
        this._state = null;
        this.currentPlayer = null;
        this.player1 = player1;
        this.player2 = player2;
        this.rounds = {
            player1 : 0,
            player2 : 0
        };
	};


    Match.prototype.state = function(){
        return this._state.name;
    };

    Match.prototype.playerReadyEvent = function(player){
        this._state = this._state.next(player);
    };

    Match.prototype.playerCharacterSelectedEvent = function(player){
        this._state = this._state.next(player);
    };
    Match.prototype.endTurn = function(player){
        this._state = this._state.endTurn(player);
    };

    Match.prototype.playerMove = function(player, params){
        this._state = this._state.playerMove(player, params);
    }

    Match.prototype.start = function(){
        var play = new PlayState(this);
        var characterSelection = new DoubleTapState('characterSelection', this, play, function(match){
            match.currentPlayer = match._pickRandomPlayer();
            match.currentPlayer.sendEvent('your_move');
        });
        var readyUp = new DoubleTapState('readyUp', this, characterSelection);

        this._state = readyUp;
    };

    Match.prototype._pickRandomPlayer = function(){
        return Math.random() > 0.5 ? this.player2 : this.player1;
    };

	Match.autowire = {
		instantiate: false,
		singleton: false
	};
	module.exports = Match;
});
