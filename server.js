var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
var validator = require('validator');

users = [];
connections = [];

server.listen(process.env.PORT || 3000);
console.log('Server is running...');

app.use(express.static('public'));
app.get('/', function(req, res){
	res.sendFile(__dirname + "/public/index.html");
	
});

//Called when someone makes a connection to the login part of the page.
io.sockets.on('connection', function(socket){
	connections.push(socket); //Add the new connection to our list
	console.log("Connected: %s sockets connected", connections.length);
	//Let's send the person a user count so he or she knows how many users are currently logged in
	io.sockets.emit("user count",users.length);

	//Log a user off when they disconnect and let everyone that is still connected know about the log off.
	socket.on('disconnect',function(data){
		if (socket.username) {
			users.splice(users.indexOf(socket.username),1);
			io.sockets.emit('user list',{usr:users, log:socket.username+" just logged off"});
		}
		connections.splice(connections.indexOf(socket),1);
		console.log("Disconnected: %s sockets connected",connections.length);
	});

	//Message recieved. Let's send it out to everyone that is connected
	socket.on('send message',function(data){
		if (data.msg.trim()) {  //If incoming message is not blank
			data.msg=validator.escape(data.msg);
			io.sockets.emit('new message',{msg:data.msg, usr:data.usr} );
		}
	});

	//A user is requesting a log in name
	socket.on('request login',function(data){
		if (!data.trim()){ //If the username is blank
			socket.emit('user request rejected',{usr:"",log:"You must input a user name to log in."});
		}
		else {
			if (users.indexOf(data)==-1) //Nobody is currently using this name
			{
				data=validator.escape(data);
				socket.username=data;
				users.push(data);
				users.sort();
				socket.emit('user request accepted',{usr:data,log:data+" is currently available"});
				io.sockets.emit('user list',{usr: users, log:data+" just logged on"} );
			}
			else { //Someone is already using this name
				socket.emit('user request rejected',{usr:data,log:data+" is currently in use. Please try again."});
			}
		}
	});

});