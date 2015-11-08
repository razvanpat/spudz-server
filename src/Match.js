var Autowire = require('autowire');
var util = require('util');
var _ = require('underscore');


function DoubleTap(name, match){
    this.match = match;
    this.name = name;
    this._firstTap = null;
    this._secondTap = null;
}
DoubleTap.prototype.onNextCheck = _.noop;
DoubleTap.prototype.next = function(player){
    var player1 = this.match.player1;
    var player2 = this.match.player2;

    this._firstTap = this._firstTap || player1 === player;
    this._secondTap = this._secondTap || player2 === player;
    this.onNextCheck.apply(this, arguments);
    if(this._firstTap &&  this._secondTap){
        return this.nextState.apply(this, arguments);
    }
    return this;
};

function EndState(match, winner){
    this.name = 'endMatch';
    match.winner = winner;
    match.ended = true;
}

function PlayState(match){
    this.name = 'play';
    this.match = match;
    this.match.player1.sendEvent('match_started');
    this.match.player2.sendEvent('match_started');
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
CharacterSelectionState.prototype.onNextCheck = function(player, data){
    var otherPlayer = this.match._determineOtherPlayer(player);
    otherPlayer.sendEvent('opponent_charater_selected', data);
};
CharacterSelectionState.prototype.nextState = function(){
    this.match.currentPlayer = this.match._pickRandomPlayer();
    var playState = new PlayState(this.match);
    this.match.currentPlayer.sendEvent('your_move');
    return playState;
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
        command.param = command.param || {};
        command.player = player;
        match.handleAction(command);
    });

    player.on('disconnect', function(){
        match.handleAction({
            event : 'disconnect',
            player : player,
            param : {}
        });
    });

    player.on('error', function(error){
        match.handleAction({
            event : 'error',
            player : player,
            param : {
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
    bindPlayer(this.player1, this);
    bindPlayer(this.player2, this);

    this.player1.sendEvent('match_found', {
        opponentCharacterId : this.player2.characterId,
        opponentNickname : this.player2.nickname
    });
    this.player2.sendEvent('match_found', {
        opponentCharacterId : this.player1.characterId,
        opponentNickname : this.player1.nickname
    });
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
    switch(data.event){
        case 'ready':
            return this.playerReadyEvent(data.player);
        case 'characterSelected':
            return this.playerCharacterSelectedEvent(data.player, data.param);
        case 'endTurn' :
            return this.endTurn();
        case 'move':
            return this.playerMove(data.player, data.param.state);
        case 'readyTimeout':
        case 'disconnect':
        case 'error':
            return this.readyTimeout(data.player);
    }
};


module.exports = Match;
