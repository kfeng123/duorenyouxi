//工具
var util={};
//构造菜单关卡
util.makeMenu=function(GAME){
	this.GAME=GAME;
}
util.makeMenu.prototype={
	preload:function(){
		this.GAME.game.load.tilemap('tilemap','assets\jj.json',null,Phaser.Tilemap.TILED_JSON);
		this.GAME.game.load.image('tiles','assets\free_tileset_version_10.png');
		this.GAME.game.load.spritesheet('TILES','assets\free_tileset_version_10.png',32,32);
		this.GAME.game.load.spritesheet('sheep','assets\sheep.png',32,48);
	},
	create:function(){
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
		this.role=util.createPlayer(220,200,'sheep',1,this.GAME);
		this.GAME.game.camera.follow(this.role);
		this.cursors=this.GAME.game.input.keyboard.createCursorKeys();
		
		
		this.otherPlayers=this.GAME.game.add.group();
		util.addNewPlayer(100,100,'sheep',1,this.GAME,this.otherPlayers);
		
		//socket编程
		var socket=io();
		socket.emit('newPlayer',this.role.position.x,this.role.position.y,'sheep',1);
		socket.on('newPlayer',function(x,y,img,frame){
			util.addNewPlayer(x,y,img,frame,context.otherPlayers);
		});
		socket.on('move',x,y);
		
	},
	update:function(){
		this.GAME.game.physics.arcade.collide(this.role,this.layer2);
		if(this.cursors.up.isDown){
			this.role.body.velocity.y=-200;
			this.role.body.velocity.x=0;
		}else if(this.cursors.down.isDown){
			this.role.body.velocity.y=200;
			this.role.body.velocity.x=0;
		}else if(this.cursors.left.isDown){
			this.role.body.velocity.x=-200;
			this.role.body.velocity.y=0;
		}else if(this.cursors.right.isDown){
			this.role.body.velocity.x=200;
			this.role.body.velocity.y=0;
		}else{
			this.role.body.velocity.x=0;
			this.role.body.velocity.y=0;
		}
		var context=this;
		//socket通信
		socket.emit('move',this.role.position.x,this.role.position.y);
		
	},
	render:function(){
		this.GAME.game.debug.body(this.role);
		
	}
}
//创建玩家，参数：x,y:坐标,img:图片，frame:初始的帧，GAME：整个游戏对象
util.createPlayer=function(x,y,img,frame,GAME){
	var role=GAME.game.add.sprite(x,y,img,frame);
	GAME.game.physics.enable(role,Phaser.Physics.ARCADE);
	return role;
}
//group:要加入的group
util.addNewPlayer=function(x,y,img,frame,GAME,group){
	var player=util.createPlayers(x,y,img,frame,GAME);
	group.add(player);
	
	return(player);
}


//游戏对象的构造函数
var start=function(){
	this.States={};
	this.States.menu=new util.makeMenu(this);
	//this.States.game=;
	//this.States.end=;
	this.game=new Phaser.Game(800, 600, Phaser.CANVAS, 'game');
}






var MYGAME=new start();
MYGAME.game.state.add('menu',MYGAME.States.menu);
MYGAME.game.state.start('menu');

