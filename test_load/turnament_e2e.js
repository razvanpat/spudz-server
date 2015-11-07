var ws = require("nodejs-websocket");
var Autowire= require('autowire');
var WebSocket = require('ws');

Autowire(function(Dispatcher,Matchmaker, Greeter, Tournament){
    var server;
    before(function(done){
        server = ws.createServer(function(conn){
            Dispatcher.broadcast('new_connection', {
                connection: conn
            });

            conn.on("text", function (str) {
                var command = JSON.parse(str);
                Dispatcher.broadcast(command.name, {
                    connection: conn,
                    param: command.param
                });
            });

        });
        server.listen(8001, done);
    });

    function send(socket, message, data){
        socket.send(JSON.stringify({
            name : message,
            param : data
        }));
    }
    function waitABit(){
        return new Promise(function(done){
            setTimeout(done, 10)
        });
    }
    function doTest(admin, player1, player2){
        send(admin, 'configure_tournament', {
            startTime : 1
        });
        send(player1, 'tournament_sign_up');
        send(player2, 'tournament_sign_up');
        return waitABit().then(function(){
            Tournament.onTournamentStart();
            send(player1, 'ready');
            send(player2, 'ready');
            return waitABit();
        }).then(function () {
            send(player1, 'characterSelected');
            send(player2, 'characterSelected');
            return waitABit();
        }).then(function(){
            send(player1, 'playerMove', {
            state : {
                player1 : {
                    health : 10
                },
                player2 : {
                    health : 0
                }
            }});
            return waitABit();
        });

    }
    function logMessage(message){
        console.log("MESSAGE (", this._name,")", message);
    }
    describe("Tournament E2E", function(){
        var CONNECTION = "ws://127.0.0.1:8001";
        it("works", function(done){
            var player1 = new WebSocket(CONNECTION);
            player1._name = 'pl1';
            player1.on('message', logMessage);
            player1.on('open', function(){
                var player2 = new WebSocket(CONNECTION);
                player2._name = 'pl2';
                player2.on('message', logMessage);
                player2.on('open', function(){
                    var admin = new WebSocket(CONNECTION);
                    admin._name = 'admin';
                    admin.on('message', logMessage);
                    admin.on('open', function(){
                        doTest(admin, player1, player2).then(done);
                    });
                });
            });
        });
    });
});
