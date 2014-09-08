var express = require('express');
var app=express();
app.use(express.static(__dirname + '/assets'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
//目前在线玩家
var presentPlayer=[];

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
});

io.on('connection', function(socket){
  socket.on('newPlayer', function(jstring){
    //var player=JSON.parse(jstring);
	//io.emit('chat message', msg);
	//给新玩家发送已有玩家信息
	presentPlayer.forEach(function(PPP){
		socket.emit('newPlayer',PPP);
	});
	//记录新玩家信息
	presentPlayer.push(JSON.parse(jstring));
	
	//向其它玩家发送新玩家信息
	socket.broadcast.emit('newPlayer',jstring);
  });
  socket.on('move',function(jstring){
	var P=JSON.parse(jstring);
	//更新玩家状态
	for(var i=0;i<presentPlayer.length;i++){
		if(presentPlayer[i].id==P.id){
			presentPlayer[i].x=P.x;
			presentPlayer[i].y=P.y;
		}
	}
	socket.broadcast.emit('move',jstring);
  });
});



http.listen(process.env.PORT||3000, function(){
  console.log('listening on *:3000');
});