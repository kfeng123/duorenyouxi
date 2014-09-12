//工具
var util={};
var socket={};
//构造菜单关卡
util.makeMenu=function(GAME){
	this.GAME=GAME;
	this.text=null;
	this.ifComplete=false;
}
util.makeMenu.prototype={
	preload:function(){
		this.text=this.GAME.game.add.text(100,200,'loading',{fill:'#54613C'});
	},
	create:function(){
		this.GAME.game.load.tilemap('tilemap','jj.json',null,Phaser.Tilemap.TILED_JSON);
		this.GAME.game.load.image('tiles','free_tileset_version_10.png');
		this.GAME.game.load.spritesheet('TILES','free_tileset_version_10.png',32,32);
		this.GAME.game.load.spritesheet('sheep','sheep.png',32,48);
		this.GAME.game.load.spritesheet('kulou','kulou.png',32,32);
		this.GAME.game.load.spritesheet('longpaoxiao','longpaoxiao.png',192,192);
		
		this.GAME.game.load.onLoadStart.add(function(){
			this.text.setText('loading...');
		},this);
		this.GAME.game.load.onFileComplete.add(function(progress,cacheKey,success,totalLoaded,totalFiles){
			this.text.setText("completes "+progress+"% - "+totalLoaded+" / "+totalFiles);
		},this);
		this.GAME.game.load.onLoadComplete.add(function(){
			this.text.setText("complete");
			this.ifComplete=true;
		},this);
		this.GAME.game.load.start();
	},
	update:function(){
		if(this.ifComplete){
			this.GAME.game.state.start('game');
		}
	}

}



util.makeGame=function(GAME){
	this.GAME=GAME;
	//标记是否要刷怪
	this.toShuaGuai=false;
}
util.makeGame.prototype={
	preload:function(){

	},
	create:function(){
		//添加动画
	
		this.GAME.game.physics.startSystem(Phaser.Physics.ARCADE);
		this.map=this.GAME.game.add.tilemap('tilemap');
		this.map.addTilesetImage('free_tileset_version_10','tiles');
		this.layer=this.map.createLayer('Tile Layer 1');
		this.layer.resizeWorld();
		this.layer2=this.map.createLayer('collide');
		this.layer2.resizeWorld();
		//this.layer2=this.map.createFromObjects('Object Layer 1',64,'TILES',65,true,false);
		
		this.map.setCollisionBetween(1,1000,true,'collide');
		
		//debug
		//this.layer2.debug=true;
		
		
		//创建主角
		this.role=util.createPlayer(220,200,'sheep',1,Math.floor(Math.random()*1000+1),this.GAME);
		this.role.body.collideWorldBounds=true;
		
		//创建蝙蝠敌人group
		//util.createBianfu(this);
		
		//创建本地控制的敌人group
		this.localEnemy=this.GAME.game.add.group();
		this.localEnemy.enableBody=true;
		this.localEnemy.physicsBodyType=Phaser.Physics.ARCADE;
		
		//摄像机
		this.GAME.game.camera.follow(this.role);
		this.cursors=this.GAME.game.input.keyboard.createCursorKeys();
		
		
		this.otherPlayers=this.GAME.game.add.group();
		
		//socket编程
		socket=io();
		var context=this;
		socket.emit('newPlayer',JSON.stringify({x:this.role.position.x,y:this.role.position.y,img:"sheep",frame:1,id:this.role.id}));
		socket.on('newPlayer',function(jstring){
			var PPP=JSON.parse(jstring);
			util.addNewPlayer(PPP.x,PPP.y,PPP.img,PPP.frame,PPP.id,context.GAME,context.otherPlayers);
		});
		//其他玩家的移动
		socket.on('move',function(jstring){
			var P=JSON.parse(jstring);
			context.otherPlayers.forEach(function(player){
				if(player.id==P.id){
				player.move.x=P.x;
				player.move.y=P.y;
				}
			});
		});
		//其他玩家施放技能
		socket.on('useSkill',function(jstring){
			var P=JSON.parse(jstring);
			context.otherPlayers.forEach(function(player){
				if(player.id==P.id){
					player.toGo={context:context,sprite:player.longPaoXiao,x:P.x,y:P.y};
				
				}
			});
		});
		//有玩家离开。
		socket.on('playerGone',function(jstring){
			var P=JSON.parse(jstring);
			context.otherPlayers.forEach(function(player){
				if(player.id==P.id){
					player.toBeDestroy=true;
				}
			});
		});
		
		//刷怪
		socket.on('shuaGuai',function(id){
			context.toShuaGuai=true;
		});
		
	},
	update:function(){
		this.GAME.game.physics.arcade.collide(this.role,this.layer2);
		this.GAME.game.physics.arcade.overlap(this.role.longPaoXiao,this.bianfu,function(a,b){b.kill();}, null, this);
		this.GAME.game.physics.arcade.overlap(this.role,this.bianfu,function(a,b){util.killRenWu(a);},null,this);
		if(this.cursors.up.isDown){
			this.role.body.velocity.y=-200;
			this.role.body.velocity.x=0;
			this.role.animations.play('up');
		}else if(this.cursors.down.isDown){
			this.role.body.velocity.y=200;
			this.role.body.velocity.x=0;
			this.role.animations.play('down');
		}else if(this.cursors.left.isDown){
			this.role.body.velocity.x=-200;
			this.role.body.velocity.y=0;
			this.role.animations.play('left');
		}else if(this.cursors.right.isDown){
			this.role.body.velocity.x=200;
			this.role.body.velocity.y=0;
			this.role.animations.play('right');
		}else{
			this.role.body.velocity.x=0;
			this.role.body.velocity.y=0;
			this.role.animations.stop();
		}
		
		//使用技能
		if(this.GAME.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)){
			//向服务器通信，施放的地点
			if(this.role.longPaoXiao.exists==false){
				socket.emit('useSkill',JSON.stringify({x:this.role.position.x,y:this.role.position.y,id:this.role.id}));
			}
			//x,y技能施放的地点
			util.useSkill(this,this.role.longPaoXiao,this.role.x,this.role.y);
		}
		//其他玩家施放技能
		this.otherPlayers.forEach(function(player){
			if(player.toGo!=null){
				util.useSkill(player.toGo.context,player.toGo.sprite,player.toGo.x,player.toGo.y);
				player.toGo=null;
			}
		});
		
		
		/* //增加敌人
		if(this.GAME.game.input.keyboard.isDown(Phaser.Keyboard.Z)){
			util.addEnemy(this);
		} */
		
		//其他玩家的移动
		this.otherPlayers.forEach(util.otherPlayerMove);
		
		//其他玩家是否要被destroy
		var temp=0;
		while(temp<this.otherPlayers.children.length){
			if(this.otherPlayers.children[temp].toBeDestroy){
				util.killRenWu(this.otherPlayers.children[temp]);
			}else{
				temp++;
			}
		}
		//刷怪
		if(this.toShuaGuai){
			util.ShuaGuai(this,this.localEnemy);
			this.toShuaGuai=false;
		}
		
		var context=this;
		//socket通信
		socket.emit('move',JSON.stringify({x:this.role.position.x,y:this.role.position.y,id:this.role.id}));
		
	},
	render:function(){
		//this.GAME.game.debug.body(this.role);
		//this.GAME.game.debug.body(this.role.longPaoXiao);
		
	}
}
//创建玩家，参数：x,y:坐标,img:图片，frame:初始的帧，id:玩家id,GAME：整个游戏对象
util.createPlayer=function(x,y,img,frame,id,GAME){
	var role=GAME.game.add.sprite(x,y,img,frame);
	role.animations.add('right',[6,7,8],3,true);
	role.animations.add('left',[3,4,5],3,true);
	role.animations.add('up',[9,10,11],3,true);
	role.animations.add('down',[0,1,2],3,true);
	GAME.game.physics.enable(role,Phaser.Physics.ARCADE);
	role.id=id;
	role.scale={x:0.6,y:0.6};
	role.anchor.x=0.5;
	role.anchor.y=0.5;
	//是否要在下次update时施放技能
	role.toGo=null;
	//是否该被destroy
	role.toBeDestroy=false;
	
	//技能龙咆哮
	role.longPaoXiao=GAME.game.add.sprite(x,y,'longpaoxiao',15);
	role.longPaoXiao.scale={x:0.5,y:0.5};
	role.longPaoXiao.anchor={x:0.5,y:0.5};
	GAME.game.physics.enable(role.longPaoXiao,Phaser.Physics.ARCADE);
	role.longPaoXiao.body.setSize(130,130);
	role.longPaoXiao.kill();
	role.longPaoXiao.animations.add('do',[15,16,17,18,19,20,21,22,23,24,25,26,27],8,false);
	
	
	return role;
}
//group:要加入的group
util.addNewPlayer=function(x,y,img,frame,id,GAME,group){
	var player=util.createPlayer(x,y,img,frame,id,GAME);
	//其他玩家的行动通过move.x和move.y来确定，所以给他们一个des属性
	player.move={};
	player.move.x=x;
	player.move.y=y;
	
	group.add(player);
	
	return(player);
}


/* //创建敌人group
util.createBianfu=function(state_game){
	state_game.bianfu=state_game.GAME.game.add.group();
	state_game.bianfu.enableBody=true;
	state_game.bianfu.physicsBodyType=Phaser.Physics.ARCADE;
	
	/* //最多3个敌人
	state_game.bianfu.num=3;
	for(var i=0;i<3;i++){
		util.addEnemy(state_game);
	} */
} */
//增加敌人,group代表要加入的group，可能是本地操控的group也可能是服务器操控的group
util.addEnemy=function(state_game,group){
	var bianfu=state_game.GAME.game.add.sprite(state_game.GAME.game.world.randomX,state_game.GAME.game.world.randomY,'kulou',0);
	bianfu.animations.add('move',[0,1,2,3],4,true);
	bianfu.animations.play('move');
	group.add(bianfu);
	return bianfu;
}

//依照服务器的命令刷怪,加入到group里
util.ShuaGuai=function(state_game,group){
	var bianfu=util.addEnemy(state_game,group);
	
	//socket.emit('doneShuaGuai',);
}



//使用技能
//context：上下文，sprite:技能的sprite,x,y,技能施放坐标
util.useSkill=function(context,sprite,x,y){
	if(sprite.exists)return;
	sprite.body.reset(x,y);
	sprite.position={x:x,y:y};
	sprite.exists=true;
	sprite.play('do',8,false,true);
}

//销毁人物
util.killRenWu=function(player){
	player.longPaoXiao.destroy();
	player.destroy();

}


//更新其他玩家的移动
util.otherPlayerMove=function(player){
	var dx=player.move.x-player.position.x;
	var dy=player.move.y-player.position.y;
	

	player.body.velocity.x=0;
	player.body.velocity.y=0;
	
	if(Math.abs(dx)<=7&&Math.abs(dy)<=7){

		//防止抖动现象
			if(Math.abs(dx)<=7){
				player.body.reset(player.move.x,player.position.y);
			}else if(Math.abs(dy)<=7){
				//player.position.y=player.move.y;
				player.body.reset(player.position.x,player.move.y);
			}
		//动画
		player.animations.stop();
	}else{
		if(Math.abs(dx)>Math.abs(dy)){
			
			if(dx>0){
				player.body.velocity.x=200;
				
			}else{
				player.body.velocity.x=-200;
			}
			
			//动画
			if(dx>0){
				player.animations.play('right');
			}else{
				player.animations.play('left');
			}
			
			
		}else{
			
			if(dy>0){
				player.body.velocity.y=200;
			}else{
				player.body.velocity.y=-200;
			}
		
			//动画
			if(dy>0){
				player.animations.play('down');
			}else{
				player.animations.play('up');
			}
			
		}
	}
}





//游戏对象的构造函数
var start=function(){
	this.States={};
	this.States.menu=new util.makeMenu(this);
	this.States.game=new util.makeGame(this);
	//this.States.end=;
	this.game=new Phaser.Game(800, 600, Phaser.CANVAS, 'game');
}






var MYGAME=new start();
MYGAME.game.state.add('menu',MYGAME.States.menu);
MYGAME.game.state.add('game',MYGAME.States.game);
MYGAME.game.state.start('menu');

