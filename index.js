var express = require('express');
var app=express();
app.use(express.static(__dirname + '/assets'));
var http = require('http').Server(app);
var io = require('socket.io')(http);

var presentPlayer=[];

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
});

io.on('connection', function(socket){
  socket.on('newPlayer', function(x,y,img,frame,id){
    //io.emit('chat message', msg);
	var player={x:x,y:y,img:img,frame:frame,id:id};
	//给新玩家发送已有玩家信息
	presentPlayer.forEach(function(PPP){
		socket.emit('newPlayer',PPP.x,PPP.y,PPP.img,PPP.frame,PPP.id);
	});
	//记录新玩家信息
	presentPlayer.push(player);
	
	//向其它玩家发送新玩家信息
	socket.broadcast.emit('newPlayer',x,y,img,frame,id);
  });
  socket.on('move',function(x,y,id){
	//更新玩家状态
	for(var i=0;i<presentPlayer.length;i++){
		if(presetPlayer[i].id==id){
			presetPlayer[i].x=x;
			presetPlayer[i].y=y;
		}
	}
	socket.broadcast.emit('move',x,y,id);
  });
});



http.listen(process.env.PORT||3000, function(){
  console.log('listening on *:3000');
});