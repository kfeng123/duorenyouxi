var express = require('express');
var app=express();
app.use(express.static(__dirname + '/assets'));
var http = require('http').Server(app);
var io = require('socket.io')(http);

//事件发射器
var events=require('events');
var emitter=new events.EventEmitter();

//目前在线玩家
var presentPlayer=[];

//目前怪物
var presentMonster=[];

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
		socket.emit('newPlayer',JSON.stringify(PPP));
	});
	//记录新玩家信息
	var thisPlayer=JSON.parse(jstring);
	presentPlayer.push(thisPlayer);
	
	//向其它玩家发送新玩家信息
	socket.broadcast.emit('newPlayer',jstring);
	
	//刷怪
	/* emitter.on('shuaGuai',function(id){
		if(id==thisPlayer.id){
			socket.emit('shuaGuai');
		}
	});  */
	//断线
	socket.on('disconnect',function(){
		socket.broadcast.emit('playerGone',jstring);
		var k=-1;
		for(var i=0;i<presentPlayer.length;i++){
			if(thisPlayer.id==presentPlayer[i].id){
					k=i;
			}
		}
		presentPlayer.splice(k,1);
		//socket.broadcast.emit('playerGone',presentPlayer[L].id);
		//delete presentPlayer[L];
	});
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
  
  socket.on('useSkill',function(jstring){
	//var P=JSON.parse(jstring);
	socket.broadcast.emit('useSkill',jstring);
  });
  
  
  
  
  
});

//定时刷怪
shuaGuai=setTimeout(function(){
	//地图上怪物的最大数量
	var num=20;
	if(presentMonster.length>=num)return;
	//随机指定一名玩家刷怪
	for(var i=0;i<(num-presentMonster.length);i++){
		//id是随机指定的现存玩家的id
		var h=Math.floor(Math.random()*presentPlayer.length);
		//var id=presentPlayer[Math.floor(Math.random()*presentPlayer.length)].id;
		//emitter.emit('shuaGuai',id);
	} 
},5000);  



http.listen(process.env.PORT||3000, function(){
  console.log('listening on *:3000');
});