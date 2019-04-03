// https://www.webrtc-experiment.com/

// Dependencies:
// 1. WebSocket
// 2. Node-Static

// Features:
// 1. WebSocket over Nodejs connection
// 2. WebSocket channels i.e. rooms
// 3. SSL websocket connection i.e. wss://localhost:9449/

var app = require('express')();
var server = require('http').createServer(app);
var WebSocketServer = require('websocket').server;

var port = process.env.PORT || 3000;
server.listen(port);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/img/glyphicons-halflings.png', function(req, res) {
  res.sendFile(__dirname + '/img/glyphicons-halflings.png');
});

app.get('/javicon.ico', function(req, res) {
  res.sendFile(__dirname + '/javicon.ico');
});

app.get('/css/bootstrap.css', function(req, res) {
  res.sendFile(__dirname + '/css/bootstrap.css');
});

app.get('/css/bootstrap.min.css', function(req, res) {
  res.sendFile(__dirname + '/css/bootstrap.min.css');
});

app.get('/css/global.css', function(req, res) {
  res.sendFile(__dirname + '/css/global.css');
});

app.get('/js/style.js', function(req, res) {
  res.sendFile(__dirname + '/js/style.js');
});

app.get('/js/adapt.js', function(req, res) {
  res.sendFile(__dirname + '/js/adapt.js');
});

app.get('/js/bootstrap.js', function(req, res) {
  res.sendfile(__dirname + '/js/bootstrap.js');
});

app.get('/js/bootstrap.min.js', function(req, res) {
  res.sendFile(__dirname + '/js/bootstrap.min.js');
});

app.get('/js/global.js', function(req, res) {
  res.sendFile(__dirname + '/js/global.js');
});

app.get('/js/jquery-1.7.1.min.js', function(req, res) {
  res.sendFile(__dirname + '/js/jquery-1.7.1.min.js');
});

app.get('/js/webrtc.js', function(req, res) {
  res.sendFile(__dirname + '/js/webrtc.js');
});


// create websocketSever

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

// shared stuff

/**
 * Declare the variable connections for rooms and users
 */
var connections = new Array();

/**
 * When a user connects
 */
wsServer.on('request', function(request) {

    //-- Variables declarations--//
    var guest = false;
    var room = '';

    /**
     * Accept the connection
     */
    var connection = request.accept(null, request.origin);
    console.log((new Date()) + ' Connection accepted.');

    /**
     * When we receive signal message from the client
     */
    connection.on('message', function(message) {
        message = JSON.parse(message.utf8Data);
        console.log(message);
        switch(message["type"]) {

            /**
             * When a user is invited
             * join the room
             */
            case "INVITE" :
                guest = true;
                room = message["value"];
                console.log(message);
                connections[room].push(connection);
            break;

            /**
             * If you are the first user to connect
             * create room
             */
            case "GETROOM" :
                room = Math.floor(Math.random()*1000001).toString();
                // room = "12345";
                message = JSON.stringify({'type' : 'GETROOM', 'value': room});
                connection.send(message);
                connections.push(room);
                console.log(room);
                connections[room] = new Array();
                connections[room].push(connection);
            break;

            /**
             * When a user send a SDP message
             * broadcast to all users in the room
             */
            case "candidate" : case "offer" : case "answer" :
                console.log(message);
                connections[room].forEach(function(destination) {
                    if(destination != connection) {
                        message = JSON.stringify(message);
                        destination.send(message);
                    }
                });
            break;
        }
    });


    /**
     * When the user hang up
     * broadcast bye signal to all users in the room
     */
    connection.on('close', function(reasonCode, description) {
        if(connections[room]) {
            connections[room].forEach(function(destination) {
                if(destination != connection) {
                    var message = JSON.stringify({'type' : 'BYE', 'value': ''});
                    destination.send(message);
                }
            });
        }
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });

})

console.log('Please open SSL URL: https://localhost: '+(port)+'/');
