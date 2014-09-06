var express = require('express');
var app=express();
app.use(express.static(__dirname + '/assets'));
var http = require('http').Server(app);
var io = require('socket.io')(http);


app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
});

io.on('connection', function(socket){
  socket.on('newPlayer', function(x,y,img,frame,id){
    //io.emit('chat message', msg);
	socket.broadcast.emit('newPlayer',x,y,img,frame,id);
  });
  socket.on('move',function(x,y,id){
	socket.broadcast.emit('move',x,y,id);
  });
});



http.listen(process.env.PORT||3000, function(){
  console.log('listening on *:3000');
});