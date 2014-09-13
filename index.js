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
var MonsterIdUsed=[];
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
	emitter.on('shuaGuai',function(id){
		if(id==thisPlayer.id){
			socket.emit('shuaGuai');
		}
	});  
	//回复新怪编号请求
	socket.on('requestMonsterId',function(jstring){
		var P=JSON.parse(jstring);
		var k=0;
		for(var i=0;i<presentMonster.length;i++){
			if(presentMonster[i].id>k){
				k=presentMonster[i].id;
			}
		}
		k++;
		P.id=k;
		presentMonster.push(P);
		socket.emit('applyRequestMonsterId',P.id);
	});
	
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
  
  //销毁敌人
  socket.on('destroyEnemy',function(id){
	for(var i=0;i<presentMonster.length;i++){
		if(id==presentMonster[i].id){
			presentMonster.splice(i,1);
			socket.broadcast.emit('destroyEnemy',id);
		}
	}
  });
  
  //定时更新玩家的怪物信息
  emitter.on('updateMonster',function(){
	socket.emit('updateMonster',"hehe");
	//socket.emit('updateMonster',JSON.stringify(presentMonster));
  });
  
  
});

//定时刷怪
shuaGuai=setInterval(function(){
	//地图上怪物的最大数量
	var num=20;
	if(presentMonster.length>=num)return;
	//如果没有玩家，就不执行
	if(presentPlayer.length==0)return;
	//随机指定一名玩家刷怪
	for(var i=0;i<(num-presentMonster.length);i++){
		//id是随机指定的现存玩家的id
		var id=presentPlayer[Math.floor(Math.random()*presentPlayer.length)].id;
		emitter.emit('shuaGuai',id);
	} 
	
},5000);  

//定时更新玩家的怪物信息
setInterval(function(){
	emitter.emit('updateMonster');
},1000);


http.listen(process.env.PORT||3000, function(){
  console.log('listening on *:3000');
});