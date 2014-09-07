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
		
		this.GAME.game.load.onLoadStart.add(function(){
			this.text.setText('loading...');
		},this);
		this.GAME.game.load.onFileComplete.add(function(progress,cacheKey,success,totalLoaded,totalFiles){
			this.text.setText("completes"+progress+"% - "+totalLoaded+" / "+totalFiles);
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
}
util.makeGame.prototype={
	preload:function(){
		
		//读取部分放到前面的state里了
		/* this.GAME.game.load.tilemap('tilemap','jj.json',null,Phaser.Tilemap.TILED_JSON);
		this.GAME.game.load.image('tiles','free_tileset_version_10.png');
		this.GAME.game.load.spritesheet('TILES','free_tileset_version_10.png',32,32);
		this.GAME.game.load.spritesheet('sheep','sheep.png',32,48); */
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
		this.role.body.collidWorldBounds=true;
		
		this.GAME.game.camera.follow(this.role);
		this.cursors=this.GAME.game.input.keyboard.createCursorKeys();
		
		
		this.otherPlayers=this.GAME.game.add.group();
		
		//socket编程
		socket=io();
		var context=this;
		socket.emit('newPlayer',this.role.position.x,this.role.position.y,'sheep',1,this.role.id);
		socket.on('newPlayer',function(x,y,img,frame,id){
			util.addNewPlayer(x,y,img,frame,id,context.GAME,context.otherPlayers);
		});
		//其他玩家的移动
		socket.on('move',function(x,y,id){
			context.otherPlayers.forEach(function(player){
				if(player.id==id){
				player.move.x=x;
				player.move.y=y;
				}
			});
		});
		
	},
	update:function(){
		this.GAME.game.physics.arcade.collide(this.role,this.layer2);
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
		//其他玩家的移动
		this.otherPlayers.forEach(function(player){
			var dx=player.move.x-player.position.x;
			var dy=player.move.y-player.position.y;
			
		
			player.body.velocity.x=0;
			player.body.velocity.y=0;
			if(Math.abs(dx)>Math.abs(dy)){
				//防止抖动现象
				if(Math.abs(dx)<=7){
					player.position.x=player.move.x;
				}else{
					if(dx>0){
						player.body.velocity.x=200;
						
					}else{
						player.body.velocity.x=-200;
					}
				}
				//动画
				if(dx>0){
					player.animations.play('right');
				}else{
					player.animations.play('left');
				}
				
				
			}else{
				if(Math.abs(dy)<=7){
					player.position.y=player.move.y;
				}else{
					if(dy>0){
						player.body.velocity.y=200;
					}else{
						player.body.velocity.y=-200;
					}
				}
				//动画
				if(dy>0){
					player.animations.play('down');
				}else{
					player.animations.play('up');
				}
				
			}
			if(dx==0&&dy==0){
				player.body.velocity.x=0;
				player.body.velocity.y=0;
				//动画
				player.animations.stop();
			}
		});
		
		
		
		var context=this;
		//socket通信
		socket.emit('move',this.role.position.x,this.role.position.y,this.role.id);
		
	},
	render:function(){
		//this.GAME.game.debug.body(this.role);
		
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

