var MasaoConstruction =function(){
	//色
	function Color(r,g,b){
		this.r=r,this.g=g,this.b=b;
	}
	Color.prototype.toString=function(){
		return "rgb("+this.r+","+this.g+","+this.b+")";
	};
	function Point(x,y){
		this.x = x;
		this.y = y;
	}
	Point.prototype = {
		toString : function(){ return "point("+this.x+","+this.y+")"; }
	};
	function Size(width,height){
		this.width = width;
		this.height = height;
	}
	Size.prototype = {
		toString : function(){ return "size("+this.width+","+this.height+")"; }
	};
	function Rect(x,y,width,height){
		if(x instanceof Point && y instanceof Size){
			this.x =x.x;
			this.y =x.y;
			this.height = y.height;
			this.width = y.width;
		}else{
			this.x =x;
			this.y =y;
			this.height =height;
			this.width =width;
		}
	}
	Rect.prototype = {
		toString:function(){ return "rect("+this.x+","+this.y+","+this.width+","+this.height+")" ; }
	};
	//設定
	function MasaoConfig(){
		this.init();
	}
	MasaoConfig.prototype={
		init:function(){
			this.filenames ={
				title:'title.gif',
				ending:'ending.gif',
				gameover:'gameover.gif',
				pattern:'pattern.gif',
				haikei:null,
				chizu:null
			};
			this.colors= {
				score:new Color(255,255,0),
				back:new Color(0,255,255),
				grenade1:new Color(255,255,255),
				grenade2:new Color(255,255,0),
				mizunohadou:new Color(0,32,255),
				firebar1:new Color(255,0,0),
				firebar2:new Color(255,192,0),
			};
		},
		stage_sky_padding:10,	//マップの上の余白
		c_width:512,	//画面のXサイズ
		c_height:320,	//画面のYサイズ
		fps:30,		//fps
		gameover_cnt:48,	//ゲームオーバー時のウェイト
		ending_cnt:48,		//エンディング時のウェイト
		stageclear_cnt:48,	//ステージクリア時のウェイト

		fireball_max: 2,	//ファイヤーボールの数
		grenade_max:2,

	//===========================================
		filenames:null,
		colors:null,
		moji_score:"SCORE",
		moji_highscore:"HIGHSCORE",
		moji_time:"TIME",
		moji_jet:"JET",
		moji_grenade:"GRENADE",

		moji_left:"LEFT",
		moji_size:16,

		grenade_color1:new Color(255,255,255),
		grenade_color2:new Color(255,255,0),
	};

	//まさおコンストラクション
	function MasaoConstruction(){
		this.canvas = null;	//HTMLCanvasElement
		this.ctx = null;	//コンテキスト
		this.stages = [];	//Stage
		this.field=new Field(this);	//Field
		this.thisStage = -1;	//現在のステージ
		this.player = new Player(this);	//主人公
		this.config = new MasaoConfig(this);//MasaoConfig

		this.config.fps=parseInt(location.search.slice(1,location.search.length))?parseInt(location.search.slice(1,location.search.length)):30;

		this.images={};	//UseImageたち
		this.mode=0;	//モード

		this.highScore=0;	//ハイスコア

		this.key = new KeyCapture(this);

		this.counter=1;	//起動時刻カウント

		//ステージごとにリセットされるべきフラグ
		this.gameover_time=0;
		this.clear_time=0;

		this.fps_pow2=Math.pow(this.config.fps,2);
		this.fv15 = 15/this.config.fps;
		this.fa15 = 15*15/this.fps_pow2;

		this.bef=0;
		this.fps_count=0;

	//====================================
	};
	MasaoConstruction.prototype={
		//canvas要素を指定
		initCanvas:function(c){
			this.canvas=c;this.ctx=c.getContext("2d");
			c.addEventListener('click',this.c('click'),false);
		},
		//新しいステージを追加
		addStage:function(stage){
			if(stage instanceof Stage){
				this.stages.push(stage);
			}
		},
		//次のステージへ
		nextStage:function(){

			this.field.addScore(this.field.time);
			if(++this.thisStage < 0){
				this.thisStage=0;
			}
			if(this.thisStage >= this.stages.length){
				//終了
				this.endStages();
				return;
			}
			this.mode = this.MODE_STAGE+this.thisStage;
			this.field.setStage(this.stages[this.thisStage]);

			//主人公の配置
			this.player=new Player(this);
			this.player.reset(this.field.map);

			this.gameover_time=0;
			this.clear_time=0;
		},
		//全ステージ終了しました
		endStages:function(){
			this.mode=this.MODE_ENDING;
			this.clear_time=this.counter;
			return;
		},
		//ファイルを読み込む
		loadFiles:function(){
			for(var key in this.config.filenames){
				this.images[key]=new UseImage(this.config.filenames[key]);
			}
		},
		//ミス
		miss:function(){
			this.gameOver();
		},
		//ステージクリア
		stageClear:function(){
			this.clear_time=this.config.stageclear_cnt;
			this.playSound("se_clear");
		},
		//ゲームオーバー
		gameOver:function(){
			this.mode=this.MODE_GAMEOVER;
			this.gameover_time=this.counter;
		},
		//ループ開始
		loop:function(){
			var self = this.c('main');
			var _loop =  function(){
				requestAnimationFrame(self);
			};
            setInterval(_loop,1000/this.config.fps);
		},


		//タイトルへ
		title:function(){
			this.mode=this.MODE_TITLE;
			this.thisStage=-1;
			if(this.field){
				if(this.highScore < this.field.score){
					this.highScore=this.field.score;
				}
			}
		},
	//=======================================
		//メインループ
		main:function(){
			if(this.mode==this.MODE_GAMEOVER){
				if(this.gameover_time+this.FPSgetT(this.config.gameover_cnt)<=this.counter){
					//一定時間が経った
					this.title();
				}
			}else if(parseInt(this.mode/100)==this.MODE_STAGE/100){
				this.field.doo();
				this.player.doo();
				this.field.setScroll(this.player);

				if(this.clear_time>0){
					this.clear_time-=this.FPSgetV(1);
					if(this.clear_time<=0){
						//クリア！
						this.nextStage();
					}
				}
			}else if(this.mode==this.MODE_ENDING){
				if(this.clear_time+this.FPSgetT(this.config.ending_cnt)<=this.counter){
					this.title();
				}
			}

			this.fps_count++;
			if((new Date).getSeconds()!=this.bef){
				this.fps_count=0;
				this.bef=(new Date).getSeconds();
			}

			this.draw();
			this.counter++;
		},
	//=======================================
		//描画
		draw:function(){
			var co=this.config,ctx=this.ctx;
			switch(this.mode){
			case this.MODE_TITLE:
				if(!this.images.title.ready)break;
				ctx.drawImage(this.images.title.i,0,0,co.c_width,co.c_height,0,0,co.c_width,co.c_height);
				break;
			case this.MODE_GAMEOVER:
				if(!this.images.gameover.ready)break;
				ctx.drawImage(this.images.gameover.i,0,0,co.c_width,co.c_height,0,0,co.c_width,co.c_height);
				break;
			case this.MODE_ENDING:
				if(!this.images.ending.ready)break;
				ctx.drawImage(this.images.ending.i,0,0,co.c_width,co.c_height,0,0,co.c_width,co.c_height);
				this.field.drawInfo();
				break;


			default:
				if(parseInt(this.mode/100)==this.MODE_STAGE/100){
					//ステージ
					ctx.clearRect(0,0,co.c_width,co.c_height);
					//背景の描画
					this.field.drawBG();
					this.field.drawBlocks();
					this.field.drawAthletics();
					this.field.drawEnemies();
					this.field.drawPlayer(this.player);
					this.field.drawInfo();
					this.player.drawInfo();
				}
				break;
			}
		},
	//イベント==============================
		//クリック
		click:function(){
			switch(this.mode){
			case this.MODE_TITLE:
				//最初のステージへ
				this.nextStage();
				break;
			}
		},

	//描画==================================
		//パターン描画
		drawPattern:function(x,y,chip,direction){
			var c10=Math.floor(chip/10);
			if(direction==0){
				this.ctx.drawImage(this.images.pattern.i,(chip%10)*32,c10*32,32,32,parseInt(x),parseInt(y),32,32);
			}else{
				this.ctx.save();
				this.ctx.scale(-1,1);
				this.ctx.drawImage(this.images.pattern.i,(chip%10)*32,c10*32,32,32,-parseInt(x)-32,parseInt(y),32,32);
				this.ctx.restore();
			}
		},

	//その他================================
		c:function(name){
			////return this[name].bind(this);
			return (function(i){
				return function(){ i[name].apply(i);};
			})(this);
		},
		//効果音鳴らす
		playSound:function(soundid){

		},
		//15[f]用の数値を現在のfpsに変換
		FPSgetV:function(num){ return num*this.fv15;},	//速度用
		FPSgetA:function(num){ return num*this.fa15;},	//加速度用
		FPSgetT:function(num){ return num/this.fv15;},	//時間用

	//定数==================================
		MODE_TITLE: 1,
		MODE_STAGE: 100,	//101,102,・・・
		MODE_GAMEOVER: 200,
		MODE_ENDING: 300,
		//描画

	};
	var _mc =MasaoConstruction;
	_mc.Color = Color;
	_mc.Point = Point;
	_mc.Size = Size;
	_mc.Rect = Rect;
	_mc.Config = MasaoConfig;

	//ステージデータ
	function Stage(map){
		this.map=map;	//Map
		this.time=300;
	}
	_mc.Stage = Stage;
	//マップデータ
	function Map(){

		this.width=0;
		this.height=0;
		this.raw=[];	//生データ
		this.map = [];
	}
	//map:配列, MasaoConfig config
	Map.prototype={
		//マップを初期化
		initMap:function(map,config){
			if(!(map instanceof Array))return;
			//文字列→配列変換
			/*this.map=(function(n){
					var arr=[];
					for(var i=0;i<n;i++)arr[arr.length]=[];
					return arr;
				})(config.stage_sky_padding).concat(
				map.map(function(n){
				if(n instanceof Array)return n;
				if(typeof n=="string")returnn.split("");
				return [];
			}));*/
			this.raw=map;
			this.map=[];
		},
		getMapchip:function(x,y){
			return y<0?".":
				x<0?".":
				y>=this.height?".":
				x>=this.map[y].length?".":
				this.map[y][x];
		},
		setMapchip:function(x,y,chip){
			if(!this.map[y])this.map[y]=[];
			this.map[y][x]=chip;
		},

		//マップのサイズを得る
		getSize:function(){
			this.width=Math.max.apply(null,this.map.map(function(n){return n.length;}));
			this.height=this.map.length;
		},
		//主人公を探す
		findPlayer:function(){
			var x=-1,y=0;
			for(var l=this.raw.length;y<l;y++){
				x=this.raw[y].indexOf("A");
				if(x>=0)break;
			}
			if(x==-1){
				//見つからない
				return [-1,-1];
			}
			return [x,y];
		},
	};
	_mc.Map = Map;
	//フィールド
	//MasaoConstruction p
	function Field(p){
		this.parent=p;
		this.map=null;	//Map
		this.time=null;	//タイム
		this.score=0;	//スコア
		this.scrollx=-1,this.scrolly=-1;

		this.blocks=new BlockData();

		this.time_count=14;

		this.enemies=[];
		this.enemyAC=0;	//敵のアクションカウンタ

		this.athletics=[];
	}
	Field.IS_NORMAL_ENEMY=0;
	Field.IS_ITEM_BLOCK=40;
	Field.IS_WATER_ENEMY=4;
	Field.prototype={
		setMap:function(map){
			this.map=map;
		},
		//ステージを読み込む
		setStage:function(stage){
			this.map=stage.map;
			this.setField();

			this.time=stage.time?stage.time:null;
		},
		enemys:{
			"B":function(rx,ry){this.addEnemy(new Kame(this,rx,ry,1));return Field.IS_NORMAL_ENEMY;},
			"C":function(rx,ry){this.addEnemy(new Kame(this,rx,ry,0));return Field.IS_NORMAL_ENEMY;},
			"E":function(rx,ry){this.addEnemy(new Pikachie(this,rx,ry));return Field.IS_NORMAL_ENEMY;},
			"F":function(rx,ry){this.addEnemy(new Chikorin(this,rx,ry));return Field.IS_NORMAL_ENEMY;},
			"G":function(rx,ry){this.addEnemy(new Hinorarashi(this,rx,ry));return Field.IS_NORMAL_ENEMY;},
			"H":function(rx,ry){this.addEnemy(new PoppieTate(this,rx,ry));return Field.IS_NORMAL_ENEMY;},
			"I":function(rx,ry){this.addEnemy(new PoppieYoko(this,rx,ry));return Field.IS_NORMAL_ENEMY;},
			"N":function(rx,ry){this.addAthletic(new Dossunsun_faller(this,rx-32,ry));return Field.IS_NORMAL_ENEMY;},
			"O":function(rx,ry){this.addEnemy(new Mariri(this,rx,ry));return Field.IS_NORMAL_ENEMY;},
			"P":function(rx,ry){this.addEnemy(new Yachamo(this,rx,ry));return Field.IS_NORMAL_ENEMY;},
			"Q":function(rx,ry){this.addEnemy(new Mizutaro(this,rx,ry));return Field.IS_NORMAL_ENEMY;},
			"R":function(rx,ry){this.addEnemy(new Airms(this,rx-8,ry));return Field.IS_NORMAL_ENEMY;},
			"W":function(rx,ry){this.addEnemy(new Taiking(this,rx,ry-16));return Field.IS_WATER_ENEMY;},
			"X":function(rx,ry){this.addEnemy(new Kuragesso(this,rx,ry));return Field.IS_WATER_ENEMY;},
			"k":function(rx,ry){this.addEnemy(new I_coin(this,rx,ry,this.parent.FPSgetV(-170),ry-32)); return Field.IS_ITEM_BLOCK;},
			"l":function(rx,ry){
				this.addEnemy(new I_coin(this,rx,ry,this.parent.FPSgetV(-170),ry-32));
				this.addEnemy(new I_coin(this,rx,ry,this.parent.FPSgetV(-205),ry-64));
				this.addEnemy(new I_coin(this,rx,ry,this.parent.FPSgetV(-240),ry-96));return Field.IS_ITEM_BLOCK;},
			"m":function(rx,ry){this.addEnemy(new I_FireFlower(this,rx,ry));return Field.IS_ITEM_BLOCK;},
			"n":function(rx,ry){this.addEnemy(new I_Barrier(this,rx,ry));return Field.IS_ITEM_BLOCK;},
			"o":function(rx,ry){this.addEnemy(new I_Time(this,rx,ry));return Field.IS_ITEM_BLOCK;},
			"p":function(rx,ry){this.addEnemy(new I_Jet(this,rx,ry));return Field.IS_ITEM_BLOCK;},
			"q":function(rx,ry){this.addEnemy(new I_Helmet(this,rx,ry));return Field.IS_ITEM_BLOCK;},
			"r":function(rx,ry){this.addEnemy(new I_Tail(this,rx,ry));return Field.IS_ITEM_BLOCK;},
			"s":function(rx,ry){this.addEnemy(new I_Drill(this,rx,ry));return Field.IS_ITEM_BLOCK;},
			"t":function(rx,ry){this.addEnemy(new I_Grenade(this,rx,ry));return Field.IS_ITEM_BLOCK;},
		},
		//フィールドを作る
		setField:function(){
			var co=this.parent.config;
			var raw=this.map.raw;
			var map=(function(l){
				var res=[];
				for(var i=0;i<l;i++){
					res[i]=[];
				}
				return res;
			})(co.stage_sky_padding);
			var p=this.parent;

			this.scrollx=-1,this.scrolly=-1;
			this.enemies.length=0;
			this.score=0;
			this.time_count=14;

			for(var y=0;y<raw.length;y++){
				var line = raw[y];
				var newline=[];
				for(var x=0,l=line.length;x<l;x++){
					var char=line.charAt(x);
					var rx=x*32,ry=y*32+co.stage_sky_padding*32;

					var code=0;
						//敵---------------------------------------------------
					if(char in this.enemys){
						code = this.enemys[char].call(this,rx,ry);
					}else{
						//ブロック
						if(this.blocks[char]){
							code=this.blocks[char];
						}else if("0"<=char && char<="9"){
						//障害物------------------------------------------------
							code=parseInt(char);
						}
					}
					newline[newline.length]=code;
				}
				map[map.length]=newline;
			}
			this.map.map=map;
			this.map.getSize();
		},
		//敵を追加
		addEnemy:function(e){
			if(e instanceof Enemy)this.enemies.push(e);
		},
		//仕掛けを追加
		addAthletic:function(a){
			if(a instanceof Athletic)this.athletics.push(a);
		},
		//アイテムを探す
		findItem:function(x,y){
			var ret=null;
			for(var i=0,l=this.enemies.length;i<l;i++){
				var ei=this.enemies[i];
				if(ei instanceof Item && !ei.shown && ei.x==x && ei.y==y){
					ret=ei;
					break;
				}
			}
			return ret;
		},
		//メインループ
		doo:function(){
			var pl = this.parent.player;
			for(var i=0,l=this.enemies.length;i<l;i++){
				if(this.enemies[i].moving<0){
					this.enemies.splice(i,1);
					i--,l--;
					continue;
				}
				this.enemies[i].doo(pl);
			}
			for(var i=0,l=this.athletics.length;i<l;i++){
				if(this.athletics[i].moving<0){
					this.athletics.splice(i,1);
					i--,l--;
					continue;
				}
				this.athletics[i].doo(pl);
			}
			this.enemyAC=(this.enemyAC+1)%16;
			//タイム減少
			if(this.time!=null && this.time_count--<=0){
				if(this.time>=0 && --this.time<0){
					this.parent.gameOver();
				}
				this.time_count=14;
			}
		},
		//スクロール位置を更新
		//Player pl
		setScroll:function(pl){
			var co=this.parent.config;
			var scx,scy;
			if(this.scrollx==-1 || this.scrolly==-1){
				//初期化
				scx=pl.x-240,scy=pl.y-224;
			}else{
				if(pl.living>0){
					//死んだ
					return;
				}
				var sax=pl.x-this.scrollx, say=pl.y-this.scrolly;
				if(sax<128){
					sax=128;
				}else if(sax>240){
					sax=240;
				}
				if(say<64){
					say=64;
				}else if(say>212){
					say=212;
				}
				scx=pl.x-sax;
				scy=pl.y-say;
			}
			if(scx>this.map.width*32-co.c_width){
				scx=this.map.width*32-co.c_width;
			}
			if(scy>this.map.height*32-co.c_height){
				scy=this.map.height*32-co.c_height;
			}
			if(scx<0){
				scx=0;
			}
			if(scy<co.stage_sky_padding*32){
				scy=co.stage_sky_padding*32;
			}
			this.scrollx=scx,this.scrolly=scy;
		},
		//スコアゲット
		addScore:function(sc){
			this.score+=sc;
		},
		//コインゲット
		getCoin:function(pl){
			this.addScore(5);
			this.parent.playSound("se_coin");
		},
		//範囲内の敵を倒す 左上(x1,y1)～右下(x2,y2)
		//戻り値：倒した数
		destroyEnemy:function(x1,y1,x2,y2,pl){
			var count=0;
			for(var i=0,l=this.enemies.length;i<l;i++){
				var en=this.enemies[i];
				if(en.moving==1 && en.dieflg&2 && x1<en.x+en.sizey && y1<en.y+en.sizey &&
				   en.x<=x2 && en.y<=y2){
					//当たってる
					en.die(2,pl);
					count++;
				}
			}
			return count;
		},
		//円形範囲内の敵を倒す 中心(x,y), 半径r
		//戻り値：倒した数
		destroyEnemyC:function(x,y,r,pl){
			var count=0;
			var r_r=Math.pow(r,2);
			for(var i=0,l=this.enemies.length;i<l;i++){
				var en=this.enemies[i];
				var dir_dir=Math.pow(en.x+en.sizex/2-x,2)+Math.pow(en.y+en.sizey/2-y,2);
				if(en.moving==1 && en.dieflg&2 && r_r>=dir_dir){
					//当たってる
					en.die(2,pl);
					count++;
				}
			}
			return count;
		},
		//ブロックを破壊 Player pl(破壊したプレイヤー)
		breakBlock:function(cx,cy,pl){
			this.addEnemy(new BrokenBlock(this,cx*32,cy*32,0));
			this.addEnemy(new BrokenBlock(this,cx*32,cy*32,1));
			this.parent.playSound("se_block");

			this.destroyEnemy(cx*32,cy*32-1,cx*32+31,cy*32-1,pl);

			var map=this.map;
			map.setMapchip(cx,cy,
				map.getMapchip(cx-1,cy)==4 || map.getMapchip(cx,cy-1)==4 || map.getMapchip(cx+1,cy)==4 || map.getMapchip(cx,cy+1)==4 ? 4 : 0);
		},
	//===============================================
		//（主人公用）ブロックかどうか
		isBlockP:function(x,y){
			if(x<0 || x>=this.map.width)return true;
			var chip=this.map.getMapchip(x,y);
			return chip>=20 && chip<=255;
		},
		//（敵用）ブロックかどうか
		isBlockE:function(x,y){
			if(x<0 || x>=this.map.width)return false;
			var chip=this.map.getMapchip(x,y);
			return chip>=20 && chip<=255;
		},
		//水中かどうか
		isInWater:function(x,y){
			if(x<0 || x>=this.map.length)return false;
			return this.map.getMapchip(x,y)==4;
		},
	//===============================================
		//背景を描画
		drawBG:function(){
			var mc=this.parent,ctx=mc.ctx,co=mc.config,b=ctx.fillStyle;
			ctx.fillStyle=co.colors.back.toString();
			ctx.fillRect(0,0,co.c_width,co.c_height);
			if(mc.images.haikei.ready){
				ctx.drawImage(mc.images.haikei.i,0,0,co.c_width,co.c_height,0,0,co.c_width,co.c_height);
			}
			ctx.fillStyle = b;
		},
		//ブロックを描画
		drawBlocks:function(){
			var mc=this.parent,co=mc.config,map=this.map;
			var my=Math.floor(this.scrolly/32);
			if(my<0)my=0;
			var cy=my*32-this.scrolly;
			for(;cy<co.c_height && my<map.height;my++,cy+=32){
				var thisline = map.map[my];
				var mx=Math.floor(this.scrollx/32);
				var cx=mx*32-this.scrollx;

				for(var l=thisline.length;cx<co.c_width && mx<l;mx++,cx+=32){
					var chip=thisline[mx];
					if(chip<20 || chip>255){
						this.drawelse(cx,cy,chip);
					}else{
						mc.drawPattern(cx,cy,chip,0);
					}
				}
			}
		},
		//その他を1つ描画
		drawelse:function(x,y,chip){
			var mc=this.parent;
			switch(chip){
				case 4://水
					mc.drawPattern(x,y,4,0);
					break;
				case 5://下トゲ
					mc.drawPattern(x,y,5,0);
					break;
				case 6://上トゲ
					mc.drawPattern(x,y,6,0);
					break;
				case 8://星
					mc.drawPattern(x,y,this.enemyAC>=8?94:95,0);
					break;
				case 9://コイン
					var acc=this.enemyAC%8;
					mc.drawPattern(x,y,acc>=6?93:acc>=4?92:acc>=2?91:90,0);
					break;
			}
		},
		//敵を描画
		drawEnemies:function(){
			for(var i=0,l=this.enemies.length;i<l;i++){
				this.enemies[i].draw();
			}
		},
		//仕掛けを描画
		drawAthletics:function(){
			for(var i=0,l=this.athletics.length;i<l;i++){
				this.athletics[i].draw();
			}
		},
		//主人公を描画
		//Player pl
		drawPlayer:function(pl){
			pl.draw(this.scrollx,this.scrolly);
		},
		//情報を描画
		drawInfo:function(){
			var mc=this.parent,co=mc.config,ctx=mc.ctx;

			ctx.font="bold "+co.moji_size+"px 'Comic Sans MS','Arial',sans-serif";

			ctx.fillStyle = co.colors.score.toString();
			var str=co.moji_score+" "+this.score+" "+co.moji_highscore+" "+mc.highScore;
			if(this.time != null){
				str+=" "+co.moji_time+" "+this.time;
			}
			ctx.fillText(str,30,25);


		},

	};
	_mc.Field = Field;
	function BlockData(){
	}
	BlockData.prototype={
		"a":20,"b":21,"c":22,"d":23,"e":24,"f":25,"g":26,"h":27,"i":28,"j":29,".":0
	};
	_mc.BlockData = BlockData;
	//主人公
	//MasaoConstruction p
	function Player(p){
		this.parent=p;

		this.x=null,this.y=null;
		this.direction=1;	//0:左、1:右
		this.vx=0,this.vy=0;

		this.ac=0;	//アニメーションカウンタ
		this.rideGround=false;

		this.w_trig_j=false;	//左右トリガーをジャンプ中に押したか
		this.j_key=0;	//ジャンプキー判定（0:未トリガー 1:トリガー済み 2:トリガー（ジェット使用）
		this.run_start_flg=false;	//走り始めかどうか
		this.jumping=0;	//0:踏んでいない 1:踏んだ 2:踏んだ瞬間 3:普通にジャンプ 4:ドリル使用後
		this.inwater=false;	//水中にいるかどうか
		this.water_counter=0;	//足の動き

		this.barrier=0;	//バリア残り
		this.jet=0;	//ジェット残り
		this.helmet=false;	//ヘルメット装備
		this.drill=false;	//ドリル装備
		this.tail=false;	//しっぽ装備
		this.fire=0;	//ファイヤーボール装備
		this.grenade=0;	//グレネード

		this.fireBall_count=0;	//現在何個ファイヤーボール出てるか
		this.grenade_count=0;

		//一時フラグ
		this.jet_using=0;
		this.tail_using=0;	//1～：使用中
		this.t_key_flg=0;	//トリガーが左:0 右:1（走り始め用）

		//死亡時フラグ
		this.living=0;	//生存フラグ 0:生きている 1:その場で回転 2:跳ねて回転
		this.rolling_flg=0;

		this.track_on=0;	//軌跡をつくる残りフレーム
		this.tracks=[];

		this.stop_flg=0;	//一定時間停止・残りフレーム
	}
	Player.prototype={
		setPos:function(x,y){
			this.x=x,this.y=y;
		},
		//Map map
		reset:function(map){
			////[x,y]=map.findPlayer();
			var res=map.findPlayer();
			var x,y;
			if(res[0]==-1 || res[1]==-1){
				x=32,y=this.parent.config.stage_sky_padding*32-32;
			}else{
				x=res[0]*32,y=res[1]*32+this.parent.config.stage_sky_padding*32;
			}
			this.x=x,this.y=y;
		},
		//フレーム
		doo:function(){
			if(this.living>0){
				this.dying();
				return;
			}
			var mc=this.parent,key=mc.key;
			var fps=mc.config.fps;
			var field=mc.field;
			var map=field.map;

			var kl=key.isPressLeftKey(),kr=key.isPressRightKey();
			var kdt = key.isPressDownKeyTrig();
			var cx,cy;

			var th=this;

			var sv40=mc.FPSgetV(40),sv60=mc.FPSgetV(60),sv120=mc.FPSgetV(120);
			var sa15=mc.FPSgetA(15),sa5=mc.FPSgetA(5),sa10=mc.FPSgetA(10);

			var kld=key.isPressLeftKeyD(), krd=key.isPressRightKeyD();
			if(kld || krd){
				if(this.w_trig_j==this.rideGround){
					//地上と空中で1回ずつはダメ
					if (this.t_key_flg==0? kld : krd){
						this.running=true;
						this.run_start_flg=true;
					}
				}
			}
			if(key.isPressJumpKeyTrig()){
				this.j_key=1;
			}
			if(key.isPressLeftKeyTrig()||key.isPressRightKeyTrig()){
				this.w_trig_j=this.rideGround;	//空中でトリガーされたかどうか
				this.t_key_flg= key.isPressLeftKeyTrig()? 0 : 1;
			}

			if(this.jumping==2)this.jumping=1;
			if(this.stop_flg>0){
				this.stop_flg-=mc.FPSgetV(1);
				if(this.stop_flg<0)this.stop_flg=0;
				jumping_move();
				return;
			}
	//========================移動
			if(!this.inwater){
				this.vy+=mc.FPSgetA(25);
				var max=mc.FPSgetV(160);
				if(this.vy>max)this.vy=max;
				this.water_counter=0;
			}else{
				if(this.vy<sv40){
					this.vy+=sa5;
					if(this.vy>sv40)this.vy=sv40;
				}else if(this.vy>sv40){
					//速すぎ
					this.vy-=mc.FPSgetA(20);
					if(this.vy<sv40)this.vy=sv40;
				}
				if(this.vx>0)this.vx-=mc.FPSgetA(1);
				if(this.vx<0)this.vx+=mc.FPSgetA(1);
			}
			var res = this.fall();
			if(res&1 || res&4){
				this.vx=0;
			}
			if(res&2 || res&32){
				this.vy=0;

				if(res&2){
					//ブロック
					cx=Math.floor((this.x+16)/32),cy=Math.floor((this.y-1)/32);
					block_hit(this,cx,cy);
				}
			}
			if(res&8){
				this.vy=0;
				this.rideGround=true;
				if(this.j_key==2){
					//ジェット後はトリガー解除
					this.j_key=0;
				}
			}else{
				this.rideGround=false;
			}
			cx=Math.floor((this.x+16)/32), cy=Math.floor((this.y+16)/32);
			if(!this.inwater && this.vy>0 && field.isInWater(cx,cy)){
				//水に入った！
				field.addEnemy(new SheetOfSpray(field,this.x,cy*32-32));
				mc.playSound("se_mizu");
				if(this.j_key>0 && !key.isPressJumpKeyTrig()){
					this.j_key=0;
				}
			}

			if(this.tail_using>0){
				this.tail_using++;
				if(this.tail_using>=10){
					this.tail_using=0;
				}else{
					var cx;
					var cy=Math.floor((this.y+16)/32);
					if(this.direction==0){
						field.destroyEnemy(this.x-31,this.y,this.x,this.y+31,this);
						cx=Math.floor((this.x-16)/32);
					}else{
						field.destroyEnemy(this.x+31,this.y,this.x+63,this.y+31,this);
						cx=Math.floor((this.x+48)/32);
					}
					if(this.tail_using<=2){
						var chip=map.getMapchip(cx,cy);
						if(chip==20){
							field.breakBlock(cx,cy,this);
						}
					}
				}
			}

			if(this.rideGround){
				var sp_max= this.running?(this.inwater?sv60:sv120):(this.inwater?sv40:sv60);	//歩く速度の上限
				if(kl){
					if(key.isPressLeftKeyTrig() && !this.run_start_flg && this.running){
						//初めて押した
						if(this.vx>=-sv60){
							this.running=false;
						}
					}
					this.vx-=sa15;
					if(this.vx<-sp_max)this.vx=-sp_max;
					this.direction=0;
				}else if(kr){
					if(key.isPressRightKeyTrig() && !this.run_start_flg && this.running){
						//初めて押した
						if(this.vx<=sv60){
							this.running=false;
						}
					}
					this.vx+=sa15;
					if(this.vx>sp_max)this.vx=sp_max;
					this.direction=1;
				}else{
					if(this.vx>0){
						this.vx-=sa5;
						this.direction=1;
						if(this.vx<0)this.vx=0;
					}else if(this.vx<0){
						this.vx+=sa5;
						this.direction=0;
						if(this.vx>0)this.vx=0;
					}else{
						this.running=false;
					}
				}
				if(this.jumping>0)this.jumping=0;
				if(this.drill && kdt){
					//ドリルだ！
					var cx=Math.floor((this.x+16)/32),cy=Math.floor((this.y+32)/32);
					var chip=map.getMapchip(cx,cy);
					if(chip==20){
						//壊すぞ！
						field.breakBlock(cx,cy,this);

						this.jumping=4;
						this.rideGround=false;
						this.x=cx*32;
						this.vy=0;
						this.vx=0;
						this.stop_flg=8;
					}
				}else if(this.j_key>0){
					//ジャンプ
					//頭上確認
					var j_fl=false;
					var cx=Math.floor((this.x+16)/32),cy=Math.floor((this.y-1)/32);
					if(!field.isBlockP(cx,cy)){
						//ジャンプできる
						j_fl=true;
					}else{
						var cx=Math.floor((this.x+parseInt(this.vx/10)+16)/32),cy=Math.floor((this.y-1)/32);
						if(!field.isBlockP(cx,cy)){
							//飛び出る感じ
							j_fl=true;
						}else{
							//ぶつかるからジャンプできない！
							cx=Math.floor((this.x+16)/32);
							if(block_hit(this,cx,cy))this.j_key=0;
						}
					}
					if(j_fl && key.isPressJumpKey()){
						var sp=Math.abs(this.vx);
						if ((this.vx<0 && res&1)||(this.vx>0 && res&4))sp=0;
						if(!this.running && sp>(this.inwater?sv40:sv60))sp=this.inwater?sv40:sv60;
						if(!this.inwater){
							if(sp==0){
								this.vy=mc.FPSgetV(-175);
							}else if(sp<sv60){
								this.vy=mc.FPSgetV(-255);
							}else if(sp==sv60){
								this.vy=mc.FPSgetV(-285);
							}else if(sp<sv120){
								this.vy=mc.FPSgetV(-315);
							}else{
								this.vy=mc.FPSgetV(-365);
								this.track_on=24;	//軌跡
							}
						}else{
							if(sp<=sv40){
								this.vy=mc.FPSgetV(-75);
							}else{
								this.vy=mc.FPSgetV(-95);
							}
						}
						this.j_key=0;
						this.jumping=3;
						if(this.vy<=mc.FPSgetV(-365)){
							//スーパージャンプ
							mc.playSound("se_sjump");
						}else{
							mc.playSound("se_jump");
						}
					}
				}


				//ac増加
				if(this.vx!=0){
					this.ac=(this.ac+1)%8;
				}
				if(this.run_start_flg)this.run_start_flg=false;
				if(this.jet_using>0)this.jet_using=0;
			}else{
				if(kl && this.vx>-sv60){
					if(this.vx>0 && !this.run_start_flg)this.running=false;
					if(!this.inwater){
						this.vx-=sa10;
						if(this.vx<-sv60){
							this.vx=-sv60;
							mc.playSound("se_kiki");
						}
					}
				}else if(kr && this.vx<sv60){
					if(this.vx<0 && !this.run_start_flg)this.running=false;
					if(!this.inwater){
						this.vx+=sa10;
						if(this.vx>sv60){
							this.vx=sv60;
							mc.playSound("se_kiki");
						}
					}
				}
				if(this.inwater && this.j_key>0){
					//水中で泳ぐ
					var cx=Math.floor((this.x+16)/32),cy=Math.floor((this.y+11)/32);
					if(map.getMapchip(cx,cy)!=4){
						//水から出そうだ！
						this.y=cy*32+6;
						this.vy=mc.FPSgetV(-180);

						field.addEnemy(new SheetOfSpray(field,this.x,cy*32));
						mc.playSound("se_mizu");
					}else{
						this.vx+=mc.FPSgetA(30)*(this.direction==0?-1:1);
						if(this.vx<-sv60)this.vx=-sv60;
						if(this.vx>sv60)this.vx=sv60;
						this.vy=mc.FPSgetV(-45);
						this.water_counter=3;
					}
					this.j_key=0;
					this.jumping=3;
				}
				if(this.inwater){
					if(kl)this.direction=0;
					if(kr)this.direction=1;
				}
				if(this.jet>0 && this.j_key>0 && key.isPressJumpKey()){
					this.jet_using=5;
					if(this.jumping==0)this.jumping=3;
					this.j_key=2;	//ジェット使用
				}
				if(this.jet_using>0 && this.jet>0){
					//ジェット
					var sv175 = mc.FPSgetV(175);
					if(this.vy>-sv175){
						if(this.vy<=mc.FPSgetV(160)){
							this.vy-=mc.FPSgetA(50);
						}else{
							this.vy-=mc.FPSgetA(25);
						}
						if(this.vy<-sv175)this.vy=-sv175;
					}
					this.jet--;
					this.jet_using--;

				}else if(this.jet_using>0)this.jet_using=0;
			}
			if(kdt && this.tail && (this.tail_using==0 || this.tail_using>6) && (this.jumping!=4 || this.vy!=0)){
				//しっぽ
				this.tail_using=1;
				/*if(this.jumping==4 && !this.rideGround){
					//ドリル解除
					this.jumping=3;
				}*/
			}
			if(kdt || key.isPressJumpKeyTrig() || key.isPressXKeyTrig()){
				//ファイヤーボール
				if((kdt || key.isPressXKeyTrig()) && this.grenade>0){
					sgrenade();
				}else if(this.fire>0){
					sfireBall();
				}
			}

			//落ちたら死ぬ
			if(this.y>=map.height*32+32){
				mc.miss();
			}

			//現在地の処理
			cx=Math.floor((this.x+16)/32), cy=Math.floor((this.y+16)/32);
			var chip=map.getMapchip(cx,cy);
			switch(chip){
				case 5:case 6://トゲ
					this.damage(1,1);
					if(this.living>0){
						//死んだ
						this.y=cy*32;
					}
					break;
				case 8://星
					map.setMapchip(cx,cy,0);
					field.addScore(100);
					mc.stageClear();
					break;
				case 9://コイン
					map.setMapchip(cx,cy,0);
					field.getCoin();
					break;
			}
			this.inwater=field.isInWater(cx,cy);	//水中かどうか

			if(this.barrier>0)this.barrier--;

			//ジャンプ時の移動
			function jumping_move(){
				if(kl && th.vx>-sv60){
					if(th.vx>0 && !th.run_start_flg)th.running=false;
					th.vx-=sa10;
					if(th.vx<-sv60){
						th.vx=-sv60;
					}
				}else if(kr && th.vx<sv60){
					if(th.vx<0 && !th.run_start_flg)th.running=false;
					th.vx+=sa10;
					if(th.vx>sv60){
						th.vx=sv60;
					}
				}

			}
			//ブロックに下からぶつかる
			//Player pl
			//戻り値：何か動作したらtrue,何もなかったらfalse
			function block_hit(pl,cx,cy){
				var chip=map.getMapchip(cx,cy);
				var ret=false;
				if(chip==Field.IS_ITEM_BLOCK){
					//？ブロック
					var itm;
					while(itm=field.findItem(cx*32,cy*32)){
						itm.appear();
					}
					map.setMapchip(cx,cy,41);
					ret=true;
				}else if(pl.helmet && chip==20){
					//壊す
					field.breakBlock(cx,cy,pl);
					ret=true;

				}
				return ret;
			}
			//グレネード発射
			function sgrenade(){
				if(th.grenade_count >= mc.config.grenade_max)return;
				field.addEnemy(new Grenade(field,th.x+8,th.y+8,th,th.vx+(th.direction==0?-70:70)));
				if(th.grenade>0)th.grenade--;
			}		//ファイヤーボール発射
			function sfireBall(){
				if(th.fireBall_count >= mc.config.fireball_max)return;
				if(th.fire==1){
					field.addEnemy(new FireBall1(field,th.x+8,th.y+8,th,th.vx+mc.FPSgetV(th.direction==0?-80:80)));
				}
			}

		},
		//落ちる
		//返り値：壁とぶつかった方向（1,2,4,8:左、上、右、下）のビットフラグ 16:頭かする 32:水中で上昇中止
		fall:function(){
			var sx=32, sy=32;
			var cx,cy, cx2,cy2;

			var field=this.parent.field;
			var map=field.map;

			var chk=false,chk2=false;	//左右移動時の足元・頭の状態
			var key=this.parent.key;
			var kl=key.isPressLeftKey(),kr=key.isPressRightKey();

			var ret = 0;
			this.x+=this.vx/10;

			cx = Math.floor((this.x+16)/32);
			cy = Math.floor(this.y/32), cy2=Math.floor((this.y+sy-1)/32);
			//左
			if(this.vx<0 && (field.isBlockP(cx,cy) || field.isBlockP(cx,cy2))){
				chk=field.isBlockP(cx,cy2);	//足元
				chk2=field.isBlockP(cx,cy);	//頭
				this.x = cx*32 +16;


				ret|=1;
			}else if(this.vx<0 && -10<this.vx){
				//1マスにも満たない！
				if(kl){
					//先をチェックしておく
					cx = Math.floor((this.x-1+16)/32);
					chk=field.isBlockP(cx,cy2);	//足元
					chk2=field.isBlockP(cx,cy);	//頭
					if(chk||chk2){
						this.x=cx*32+16;
					}
				}
			}
			//右
			cx = Math.floor((this.x+16)/32);
			if(this.vx>0 && (field.isBlockP(cx,cy) || field.isBlockP(cx,cy2))){
				chk=field.isBlockP(cx,cy2);	//足元
				chk2=field.isBlockP(cx,cy);	//頭
				this.x = cx*32 -17;


				ret|=4;
			}else if(0<this.vx && this.vx<10){
				//1マスにも満たない！
				if(kr){
					//先をチェックしておく
					cx = Math.floor((this.x+1+16)/32);
					chk=field.isBlockP(cx,cy2);	//足元
					chk2=field.isBlockP(cx,cy);	//頭
					if(chk||chk2){
						this.x=cx*32-17;
					}
				}
			}

			//上
			this.y+=this.vy/10;
			cx = Math.floor((this.x+16)/32);
			cy = Math.floor(this.y/32);
			if(this.vy<0){
				if(field.isBlockP(cx,cy)){
					this.y = cy*32 +32;

					ret|=2;
				}else{
					cy2=Math.floor((this.y+sy-1)/32);
					if(field.isBlockP(cx,cy2)){
						//頭上はないのに足元だけある！
						cx2=Math.floor((this.x-this.vx/10+16)/32);
						if(field.isBlockP(cx2,cy)){
							//すり抜けてきたぞ！
							//戻す
							this.x=cx*32+16;
							this.y=cy*32+32;
							ret|=2;
						}
					}
				}
				cy2=Math.floor((this.y+16)/32);
				if(this.inwater && map.getMapchip(cx,cy2)!=4){
					//水から出てしまう！
					this.y = cy2*32+16;
					ret|=32;
				}
				if(chk){
					//ぶつかった時、足元があった
					var mae_x=this.x;
					this.x+=this.vx/10;
					if(Math.abs(this.vx)<10){
						if(this.vx>0 && kr){
							this.x+=1;
						}else if(this.vx<0 && kl){
							this.x-=1;
						}
					}
					cx = Math.floor((this.x+16)/32);
					cy=Math.floor(this.y/32);
					cy2=Math.floor((this.y+sy-1)/32);
					if(!field.isBlockP(cx,cy2) && field.isBlockP(cx,cy)){
						//はさまった！
						this.y=cy2*32;
						ret|=2;
					}else{
						this.x=mae_x;
					}
				}
			}
			//頭かすっているかどうか
			cx = Math.floor((this.x+16)/32);
			cy = Math.floor((this.y-1)/32);
			if(field.isBlockP(cx,cy)){
				ret|=16;
			}
			//下
			cx = Math.floor((this.x+16)/32);
			cy = Math.floor((this.y+sy)/32), cy2=Math.floor((this.y+sy-1)/32);
			if(this.vy>0){
				if(field.isBlockP(cx,cy)){
					this.y = cy*32 -sy;

					ret|=8;
				}
				if(!chk && chk2 && this.vx<=60){
					//ぶつかった時、足元がなかった

					var mae_x=this.x;
					this.x+=this.vx/10;
					if(Math.abs(this.vx)<10){
						if(this.vx>0 && kr){
							this.x+=1;
						}else if(this.vx<0 && kl){
							this.x-=1;
						}
					}
					cx = Math.floor((this.x+16)/32);
					cy2=Math.floor((this.y+sy-1)/32);
					if(field.isBlockP(cx,cy2)){
						//はさまった！
						this.y=(cy2-1)*32;
						ret|=8;
					}else{
						this.x=mae_x;
					}
				}
			}

			return ret;

		},
		//敵を踏んだ！ mode:踏みの種類
		press:function(mode){
			this.jumping=2; //踏んだ瞬間
			this.stop_flg=5;
			this.vy= this.parent.FPSgetV(mode==1? -160 : -220);
			this.parent.playSound("se_fumu");
		},
		//死んだ時の処理
		dying:function(){
			//ac増加
			var mc=this.parent;
			if(this.living==1){
				//その場
				this.rolling_flg++;
				if(this.rolling_flg>=16){
					this.y+=mc.FPSgetV(8);
				}
			}else if(this.living==2){
				//下がる
				this.y+=this.vy/10;
				this.vy+=mc.FPSgetA(25);
				if(this.vy>mc.FPSgetV(100))this.vy=mc.FPSgetV(100);
			}
			if(this.y>=mc.field.scrolly+mc.config.c_height+32){
				mc.miss();
			}

			this.ac=(this.ac+1)%8;
		},
		//ダメージを受ける
		//num:ダメージ量,type:ダメージの種類（1:その場、2:跳ね上がる）
		damage:function(num,type){
			if(!num)num=1;
			this.parent.playSound("se_miss");
			this.miss(type);
		},
		//ミス！
		miss:function(mode){
			this.living=mode;
			this.rolling_flg=0;
			this.ac=0;
			this.vx=0;
			this.barrier=0;
			this.jet_using=false;
			if(mode==2){
				//跳ねて回転
				this.vy=this.parent.FPSgetV(-250);
			}else if(mode==1){
				//その場で回転
				this.vy=0;
			}
		},

		//主人公を描画
		//scx,scy:スクロール座標
		draw:function(scx,scy){
			var mc=this.parent,key=mc.key;
			var kl=key.isPressLeftKey(),kr=key.isPressRightKey();
			var ctx=mc.ctx;
			if(this.track_on>0){
				//軌跡がある
				ctx.save();
				for(var i=0,l=this.tracks.length;i<l;i++){
					var y=this.tracks[i];	//軌跡1つ
					ctx.globalAlpha = 0.1*i+0.1;
					mc.drawPattern(y[0]-scx,y[1]-scy,y[2],y[3]);
				}
				ctx.restore();
			}
			var pattern_no,dir;
			if(this.living>0){
				pattern_no=110+(this.ac%4),dir=0;
			}else if(this.tail_using>0 && this.stop_flg==0){
				//しっぽ
				if(this.tail_using>3 && this.tail_using<=6){
					//伸びてる
					pattern_no=118,dir=this.direction;
					mc.drawPattern(this.x+(dir==0?-32:32)-scx,this.y-scy,117,dir);
				}else{
					pattern_no=116,dir=this.direction;
				}
			}else if(this.jumping==4){
				//ドリル
				pattern_no=119,dir=this.direction;
			}else if(this.inwater && !this.rideGround){
				pattern_no=this.water_counter>0?84:83,dir=this.direction;
				if(this.water_counter>0)this.water_counter--;
			}else if(this.jumping>0 && this.jumping<=2){
				//踏んだ
				pattern_no=109,dir=this.direction;
			}else if(this.jumping==3){
				//ジャンプ
				if(this.vy<0){
					pattern_no=101,dir=this.direction;
				}else{
					pattern_no=102,dir=this.direction;
				}
			//}else if(this.rideGround){
			}else{
				if(this.vx!=0){
					var md = this.vx>0? 1 : 0;	//進行方向の向き
					var kd = kl?0: kr?1 : -1;	//キー入力の向き
					if(kd>=0 && md^1==kd){
						//逆向き
						pattern_no=108,dir=kd;
					}else if(this.running){
						if(kd>=0){
							pattern_no=105+parseInt(this.ac/4),dir=this.direction;
						}else{
							pattern_no=107,dir=this.direction;
						}
					}else{
						pattern_no=103+parseInt(this.ac/4)+(this.running?2:0),dir=this.direction;
					}
				}else{
					pattern_no=100,dir=this.direction;
				}
			}
			mc.drawPattern(parseInt(this.x-scx),parseInt(this.y-scy),pattern_no,dir);
			//軌跡の処理
			if(this.track_on>0){
				this.tracks[this.tracks.length]=[this.x,this.y,pattern_no,dir];
				var max=this.track_on>10?10:this.track_on;
				while(this.tracks.length>max){
					this.tracks.shift();
				}
				this.track_on--;
				if(this.track_on<=0){
					this.tracks.length=0;
				}
			}
			//バリア
			if(this.barrier>0 && (this.barrier>30 || (this.barrier%4)<2)){
				var b_size=40;
				ctx.beginPath();
				var sx=this.x-scx+16,sy=this.y-scy+16;

				ctx.strokeStyle="rgb(255,255,255)";

				for(var j=0;j<2;j++){

					var kak= (j==0 ? this.barrier%360 : (360-this.barrier)%360 )*Math.PI/180 ;

					ctx.moveTo(sx+parseInt(Math.cos(kak)*b_size),sy+parseInt(Math.sin(kak)*b_size));
					for(var i=1;i<6;i++){
						ctx.lineTo(sx+parseInt(Math.cos(kak+Math.PI/3*i)*b_size),sy+parseInt(Math.sin(kak+Math.PI/3*i)*b_size));
					}
					ctx.closePath();
					ctx.stroke();

					kak=((360-this.barrier)%360)*Math.PI/180;
				}


			}
			//ジェット
			if(this.jet_using>0){
				mc.drawPattern(this.x-scx,this.y+32-scy,(mc.field.enemyAC%8)>=4?135:134,0);
			}
		},
		//情報を描画
		drawInfo:function(){
			var mc=this.parent,co=mc.config,ctx=mc.ctx;

			ctx.font="bold "+co.moji_size+"px 'Comic Sans MS','Arial',sans-serif";

			ctx.fillStyle = co.colors.score.toString();
			var str="";
			if(this.jet>0){
				str+=co.moji_jet+" "+this.jet+" ";
			}
			if(this.grenade>0){
				str+=co.moji_grenade+(this.grenade>=2?" "+this.grenade:"")+" ";
			}
			ctx.fillText(str,40,300);
			//ctx.fillText("VX:"+this.vx,40,260);
			//ctx.fillText("VY:"+this.vy,40,280);
		},
	};
	_mc.Player = Player;
	function UseImage(file){
		var i=this;
		this.i=new Image();
		////this.i.onload=f.bind(this);
		this.i.onload=f;
		this.i.src=file;
		this.ready=false;

		function f(){
			////this.ready=true;
			i.ready=true;
		}
	}
	//キー入力を監視
	function KeyCapture(p){
		this.parent=p;
		document.addEventListener("keydown",keydown,false);
		document.addEventListener("keyup",keyup,false);
		var i=this;
		this.keys={};
		this.keyups={};

		function keydown(e){
			if(!i.keys[e.keyCode])
				i.keys[e.keyCode]=i.parent.counter;

			switch(e.keyCode){
			case 0x54:
				//T
				i.parent.title();
				break;
			case 32:case 0x5A:
				//スペース・Z
				if(i.parent.mode==i.parent.MODE_TITLE){
					i.parent.click();
					i.keys[e.keyCode]=false;
				}
				break;
			}
		}
		function keyup(e){
			i.keys[e.keyCode]=0;
			i.keyups[e.keyCode]=i.parent.counter;
		}

	}
	KeyCapture.prototype={
		isPress:function(code){
			return !!this.keys[code];
		},
		isPressDTrig:function(code){
			return this.keys[code]>=this.parent.counter && this.keups[code]>=this.parent.counter-6;
		},
		isPressLeftKey:function(){return !!this.keys[37] || !!this.keys[100];},
		isPressUpKey:function(){return !!this.keys[38];},
		isPressRightKey:function(){return !!this.keys[39] || !!this.keys[102];},
		isPressDownKey:function(){return !!this.keys[40] || !!this.keys[98];},
		isPressSpaceKey:function(){return !!this.keys[32] ||  !!this.keys[13];},
		isPressZKey:function(){return !!this.keys[0x5A];},
		isPressXKey:function(){return !!this.keys[0x58];},

		isPressJumpKey:function(){return !!this.keys[32] || !!this.keys[0x5A] || !!this.keys[13];},
		isPressJumpKeyTrig:function(){return this.keys[32]>=this.parent.counter || this.keys[0x5A]>=this.parent.counter  || this.keys[13]>=this.parent.counter;},

		isPressXKeyTrig:function(){return this.keys[0x58]>=this.parent.counter;},

		isPressLeftKeyTrig:function(){
			return this.keys[37]>=this.parent.counter || this.keys[100]>=this.parent.counter;
		},
		isPressRightKeyTrig:function(){
			return this.keys[39]>=this.parent.counter || this.keys[102]>=this.parent.counter;
		},
		isPressDownKeyTrig:function(){
			return this.keys[40]>=this.parent.counter || this.keys[98]>=this.parent.counter;
		},
		isPressLeftKeyD:function(){
			return (this.keys[37]>=this.parent.counter && this.keyups[37]>=this.parent.counter-6) ||
			       (this.keys[100]>=this.parent.counter && this.keyups[100]>=this.parent.counter-6);
		},
		isPressRightKeyD:function(){
			return (this.keys[39]>=this.parent.counter && this.keyups[39]>=this.parent.counter-6) ||
			       (this.keys[102]>=this.parent.counter && this.keyups[102]>=this.parent.counter-6);
		},
	};
	_mc.KeyCapture = KeyCapture;
	function Enemy(p,x,y){
		this.parent=p;	//Field
		if(p)this.mc=p.parent;	//MasaoConstruction
		this.x=x,this.y=y;
		this.direction=0;

		this.moving=0;	//活動中かどうか -1:消えました　0:未活動 1:活動中 2:死
		this.diemode=0;	//死の種類 1:踏まれ 2:その他
		this.diecounter=0;	//死カウンタ

		this.vx=0,this.vy=0;	//移動時（死んだ時・敵の処理などに使用）
		this.chip=0;	//現在のパターン番号

	}
	Enemy.prototype={
		//歩く mode:0→落ちる　1→落ちない
		//メイン処理
		//Player pl
		doo:function(pl){
		},
		//衝突判定
		//Player pl
		hitcheck:function(pl){
			if(pl.living>0)return false;
			return this.x<=pl.x+31 && pl.x<=this.x+this.sizex-1 &&
			       this.y<=pl.y+31 && pl.y<=this.y+this.sizey-1;
		},
		//中心のみの衝突判定
		hitcheck2:function(pl){
			if(pl.living>0)return false;
			return this.x<=pl.x+16 && pl.x+16<=this.x+this.sizex-1 &&
			       this.y<=pl.y+16 && pl.y+16<=this.y+this.sizey-1;
		},
		//踏んだ判定
		//Player pl
		presscheck:function(pl){
			if(pl.living>0)return false;
			if(!(this.x<=pl.x+31 && pl.x<=this.x+this.sizex-1))return false;
			if(pl.barrier>0)return false;

			if(!pl.inwater && (pl.vy>0 || pl.jumping==2)){
				if(pl.y<=this.y && this.y<=pl.y+31){
					return true;
				}
			}
			return false;
		},
		//画面内にいるかどうか判定
		incheck:function(){
			var field=this.parent;
			var co=field.parent.config;
			if(this.x>=field.scrollx+co.c_width+64 || this.y+this.sizey<=field.scrolly-64 ||
			   this.x+this.sizex<=field.scrollx-64 || this.y>=field.scrolly+co.c_height+64){
				//まだ画面外
				return false;
			}
			this.moving=1;
			return true;
		},
		//死んだかどうか判定
		//Player pl
		diecheck:function(pl){
			if(this.moving!=1)return false;
			var p=this.parent;
			if(this.dieflg&1){
				//踏まれる
				if(this.presscheck(pl)){
					this.die(1,pl);
					pl.press(this.dieflg&4?2:1);
					pl.y=this.y-32+this.sizey-this.pressed_sizey;
					return true;
				}
			}
			/*if(this.dieflg&2){
				//アイテムなど
			}*/
			if(!(this.dieflg&8)){
				//落ちたか
				if(this.y>=p.map.height*32){
					this.erase();
					return true;
				}
			}
			if(pl.barrier>0 && !(this.dieflg&16) && this.hitcheck(pl)){
				this.die(2,pl);
				if(this instanceof Creature)this.mc.playSound("se_tobasu");
				return true;
			}
			if(this.dieflg&32){
				var co=p.parent.config;
				if(this.x>p.scrollx+co.c_width || this.x+this.sizex<p.scrollx ){
					//画面外
					this.erase();
					return true;
				}
			}
			return false;
		},
		//死んだ　mode:死んだ種類,Player pl
		die:function(mode,pl){
			this.diemode=mode;
			this.diecounter=0;
			if(mode==2){
				//飛ぶ
				this.vy=this.mc.FPSgetV(-120);
				this.vx=this.mc.FPSgetV(40)*(this.x<=pl.x?-1:1);
			}
			this.moving=2;
		},
		//死ぬ処理
		dying:function(){
			switch(this.diemode){
				case 1://踏まれ
					this.diecounter+=this.mc.FPSgetV(1);
					if(this.diecounter >= 24){
						this.parent.addScore(this.score);
						this.erase();
					}
					break;
				case 2://アイテムなど
					this.vy+=this.mc.FPSgetA(25);
					this.x+=this.vx/10,this.y+=this.vy/10;
					if(this.y>=this.parent.map.height*32){
						this.parent.addScore(this.score);
						this.erase();
					}
					break;
			}
		},
		//消える
		erase:function(){
			this.moving=-1;
		},
		//描画
		draw:function(){
			if(this.moving<=0)return;
			var p=this.parent;
			this.setChip();
			this.mc.drawPattern(this.x-p.scrollx,this.y-p.scrolly,this.chip,this.direction);
		},
		//チップを得る
		setChip:function(){

		},

		sizex:32,
		sizey:32,
		pressed_sizey:12,//踏まれたときのサイズ
		score:10,	//スコア
		dieflg:3,	//死の種類 1:踏まれる 2:アイテム 4:踏むと高く跳ぶ 8:落ちても死なない 16:バリアで死なない 32:画面から左右に出ると消える
	};
	_mc.Enemy = Enemy;
	//動く敵
	function Creature(p,x,y){
		Enemy.apply(this,arguments);
	}
	Creature.prototype=new Enemy;
	_mc.Creature = Creature;

	function Walker(p,x,y){
		Creature.apply(this,arguments);

		this.rideGround=false;
	}
	Walker.prototype=new Creature;
	Walker.prototype.speed=2;
	Walker.prototype.walk=function(mode){
		//mode:0なら落ちる　1なら落ちない
		var field=this.parent;
		var i=this;
		var szx=this.sizex,szy=this.sizey;

		var mc=this.mc;

		var svsp = mc.FPSgetV(this.speed);

		if(!foot()){
			//落ちる
			this.y+=svsp;
			if(foot()){
				this.y=Math.floor(this.y/32)*32+32-szy;
				this.rideGround=true;
			}else{
				this.rideGround=false;
			}

		}else{
			this.rideGround=true;
			if(this.direction==0){
				this.x-=svsp;
			}else{
				this.x+=svsp;
			}
			var cx=parseInt(this.x/32),cx2=parseInt((this.x+szx-1)/32);
			var cy=parseInt((this.y+szy-1)/32);
			if(this.direction==0){
				if(field.isBlockE(cx,cy)){
					this.x=cx*32+32;
					if(foot()){
						this.direction=1;
					}
				}
			}else{
				if(field.isBlockE(cx2,cy)){
					this.x=cx2*32-szx;
					if(foot()){
						this.direction=0;
					}
				}
			}
			if(mode==1){
				//落ちない処理
				cy=parseInt((this.y+szy)/32);
				if(this.direction==0){
					if(!field.isBlockE(cx,cy)){
						this.x=cx*32+32;
						this.direction=1;
					}
				}else{
					if(!field.isBlockE(cx2,cy)){
						this.x=cx2*32-szx;
						this.direction=0;
					}
				}
			}else{
				if(!foot()){
					//飛び出した！→マスをあわせる
					if(this.direction==0){
						//if(this.x%32){
						//	this.x=this.x-(this.x%32)+32
						//}
						this.x=Math.floor((this.x+szx-1)/32+1)*32-szx;
					}else{
						this.x=Math.floor(this.x/32)*32;

					}
				}
			}
		}
		//足元判定
		function foot(){
			var cx=parseInt(i.x/32),cx2=parseInt((i.x+szx-1)/32);
			var cy=parseInt((i.y+szy)/32);
			if(field.isBlockE(cx,cy) || field.isBlockE(cx2,cy)){
				return true;

			}

		}
	};
	_mc.Walker = Walker;
	//==========================敵たち=====================
	//亀
	function Kame(p,x,y,type){
		Walker.apply(this,arguments);

		this.type=type;
	}
	Kame.prototype = new Walker;
	Kame.prototype.speed=3;
	Kame.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;return;
		}
		if(this.moving==1){
			this.chip=this.rideGround?(this.parent.enemyAC%8>=4?141:140):140;
		}else if(this.moving==2 && this.diemode==1){
			this.chip=142;
		}
	};
	//Player pl
	Kame.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();

		this.walk(this.type);


		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,2);
		}
	};
	_mc.Kame = Kame;
	//ヒノララシ
	function Hinorarashi(p,x,y){
		Walker.apply(this,arguments);
	}
	Hinorarashi.prototype=new Walker;
	Hinorarashi.prototype.speed=4;
	Hinorarashi.prototype.dieflg=2;
	Hinorarashi.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;return;
		}
		if(this.moving==1){
			this.chip=this.rideGround?(this.parent.enemyAC%8>=4?153:152):152;
		}
	};
	//Player pl
	Hinorarashi.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();

		this.walk(1);

		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,2);
		}
	};
	_mc.Hinorarashi = Hinorarashi;

	function Flyer(p,x,y){
		Creature.apply(this,arguments);

		this.flying=true;	//飛んでいるかどうか
	}
	Flyer.prototype=new Creature;
	Flyer.prototype.speed=3;
	Flyer.prototype.dieflg=7;
	Flyer.prototype.fly=function(mode){
		//mode 1:横に飛んで反転 2:横に飛んで当たると止まる 3:ステージ端でも反転
		if(!this.flying)return;
		var field=this.parent;
		var i=this;
		var szx=this.sizex,szy=this.sizey;

		var svsp=this.mc.FPSgetV(this.speed);

		//if(mode<=2){
			//横に飛ぶ
			var yoyu=mode!=2?16:0;
			var cx;
			var cy=Math.floor(this.y/32), cy2=Math.floor((this.y+31)/32);
			if(this.direction==0){
				this.x-=svsp;

				cx=Math.floor((this.x-yoyu)/32);

				if(field.isBlockE(cx,cy) || field.isBlockE(cx,cy2) || (mode==3 && cx<0)){
					//ぶつかった
					this.x=cx*32+32+yoyu;
					if(mode==2){
						this.flying=false;
					}else{
						this.direction=1;
					}

				}
			}else{
				this.x+=svsp;
				cx=Math.floor((this.x+31+yoyu)/32);

				if(field.isBlockE(cx,cy) || field.isBlockE(cx,cy2) || (mode==3 && cx>=field.map.width)){
					//ぶつかった
					this.x=cx*32-szx-yoyu;
					if(mode==2){
						this.flying=false;
					}else{
						this.direction=0;
					}
				}
			}
		//}
	};
	_mc.Flyer = Flyer;

	function Poppie(p,x,y){
		Flyer.apply(this,arguments);
	}
	Poppie.prototype=new Flyer;
	Poppie.prototype.speed=3;
	Poppie.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;return;
		}
		if(this.moving==1){
			this.chip=this.parent.enemyAC%8>=4?148:147;
		}else if(this.moving==2 && this.diemode==1){
			this.chip=149;
		}
	};
	_mc.Poppie = Poppie;
	//横に飛ぶポッピー
	function PoppieYoko(p,x,y){
		Poppie.apply(this,arguments);
	}
	PoppieYoko.prototype=new Poppie;
	PoppieYoko.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();

		this.fly(1);

		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,2);
		}
	};
	_mc.PoppieYoko = PoppieYoko;
	//上下に動くポッピー
	function PoppieTate(p,x,y){
		Poppie.apply(this,arguments);
		this.y-=12;	//初期位置をちょっとずらす
		this.counter=0;
	}
	PoppieTate.prototype=new Poppie;
	PoppieTate.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();

		var mc=this.mc;

		if(this.counter<10){
			//上昇中
			this.y-=mc.FPSgetV(4);
		}else if(this.counter<17){
			//方向転換中
			this.y+=mc.FPSgetV(this.counter-13);
		}else if(this.counter<27){
			this.y+=mc.FPSgetV(4);
		}else if(this.counter<34){
			this.y+=mc.FPSgetV(30-this.counter);
			if(this.counter>=33)this.counter=-1;	//サイクルの最初に戻る
		}
		this.counter+=mc.FPSgetV(1);

		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,2);
		}
	};
	_mc.PoppieTate = PoppieTate;
	function Jumper(p,x,y){
		Creature.apply(this,arguments);

		this.rideGround=false;
	}
	Jumper.prototype=new Creature;
	Jumper.prototype.up_chk=true;	//天井にぶつかったのをチェックするか
	Jumper.prototype.ga=15;	//重力加速度
	Jumper.prototype.fall=function(){
		var szx=this.sizex, szy=this.sizey;
		var cx,cy, cx2,cy2, cx3;

		var field=this.parent;
		var map=field.map;


		var ret = 0;
		this.x+=this.vx/10;
		cx3 = Math.floor((this.x+szx/2)/32);
		cx=Math.floor(this.x/32),cx2=Math.floor((this.x+szx-1)/32);
		cy = Math.floor(this.y/32), cy2=Math.floor((this.y+szy-1)/32);
		//左
		if(this.vx<0 && (field.isBlockE(cx,cy) || field.isBlockE(cx,cy2))){
			this.x = cx*32 +32;


			ret|=1;
		}
		//右
		if(this.vx>0 && (field.isBlockE(cx2,cy) || field.isBlockE(cx2,cy2))){
			this.x = cx2*32 -szx;


			ret|=4;
		}

		//上
		this.y+=this.vy/10;
		cx3 = Math.floor((this.x+szx/2)/32);
		cy = Math.floor(this.y/32), cy2=Math.floor((this.y+szy-1)/32);
		if(this.up_chk && this.vy<0){
			if(field.isBlockE(cx3,cy)){
				this.y = cy*32 +32;

				ret|=2;
			}
		}
		//下
		if(this.vy>0){
			if(field.isBlockE(cx3,cy2)){
				this.y = cy2*32 -szy;

				ret|=8;
			}
		}
		if(ret&1 || ret&4){
			this.direction^=1;
			this.vx*=-1;
		}
		if(ret&2){
			this.vy=0;
		}
		if(ret&8){
			this.vy=0;
			this.rideGround=true;
		}else if(this.vy<0){
			this.rideGround=false;
		}

		return ret;
	};
	_mc.Jumper = Jumper;

	//マリリ
	function Mariri(p,x,y){
		Jumper.apply(this,arguments);

		this.vx=0,this.vy=0;
		this.counter=-15;
	}
	Mariri.prototype=new Jumper;
	Mariri.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();

		var mc=this.mc;
		this.vy+=mc.FPSgetA(this.ga);
		if(this.vy>mc.FPSgetV(170))this.vy=mc.FPSgetV(170);
		this.fall();
		if(this.rideGround){
			this.vx=0;
			if(this.counter>=0){
				if(this.direction==0){
					this.vx=mc.FPSgetV(-50);
				}else{
					this.vx=mc.FPSgetV(50);
				}
				this.vy=mc.FPSgetV(-160);
			}
			this.counter+=mc.FPSgetV(1);
		}else{
			this.counter=-10;
		}


		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,2);
		}
	};
	Mariri.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;return;
		}
		if(this.moving==1){
			this.chip= this.rideGround?154 : this.vy<0?155:156;
		}else if(this.moving==2 && this.diemode==1){
			this.chip=157;
		}
	};
	_mc.Mariri =Mariri;

	//ピカチー
	function Pikachie(p,x,y){
		Jumper.apply(this,arguments);
		this.counter=-1;
	}
	Pikachie.prototype=new Jumper;
	Pikachie.prototype.ga=10;
	Pikachie.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();

		var chk= this.vy<0;
		var mc=this.mc;
		this.vy+=mc.FPSgetA(this.ga);
		if(this.vy>mc.FPSgetV(170))this.vy=mc.FPSgetV(170);
		this.fall();
		if(chk && this.vy>=0){
			//発射
			if((Math.floor((this.x+16)/32)==Math.floor((pl.x+16)/32) && pl.y<this.y)||(Math.abs(this.x-pl.x)<=42 && pl.y<this.y+32)){
				//発射しない
			}else{
				var sp=new Spark(this.parent,this.x,this.y);
				sp.go(this.x,this.y,pl.x,pl.y);
				this.parent.addEnemy(sp);
				this.parent.parent.playSound("se_dengeki");
			}
		}

		if(Math.abs(this.x-pl.x)>240){
			//まだ離れている
			if(this.counter<0)this.counter++;
		}else{

			if(this.rideGround){
				this.vx=0;
				if(this.counter>=0){
					this.vy=mc.FPSgetV(-130);
				}
				this.counter+=mc.FPSgetV(1);
			}else{
				this.counter=-30;
			}

		}
		if(this.rideGround){
			if(this.x<pl.x){
				this.direction=1;
			}else if(this.x>pl.x){
				this.direction=0;
			}
		}


		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,2);
		}
	};
	Pikachie.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;return;
		}
		if(this.moving==1){
			this.chip= this.rideGround?143 : this.vy<0?144:145;
		}else if(this.moving==2 && this.diemode==1){
			this.chip=146;
		}
	};
	_mc.Pikachie = Pikachie;

	//ヤチャモ
	function Yachamo(p,x,y){
		Creature.apply(this,arguments);

		this.counter=-1;
	}
	Yachamo.prototype=new Creature;
	Yachamo.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();

		var mc=this.mc;
		if(this.x>pl.x){
			this.direction=0;
		}else if(this.x<pl.x){
			this.direction=1;
		}
		if(this.counter >=0 && (this.direction==0?this.x-pl.x:pl.x+32-this.x)>=96){
			//発射
			this.parent.addEnemy(new Fire(this.parent,this.x+(this.direction==0?-32:32),this.y,this.direction));
			this.counter=-40;
			this.parent.parent.playSound("se_hinoko");
		}
		this.counter+=mc.FPSgetV(1);

		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,2);
		}

	};
	Yachamo.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;return;
		}
		if(this.moving==1){
			this.chip= 158;
		}else if(this.moving==2 && this.diemode==1){
			this.chip=159;
		}
	};
	_mc.Yachamo = Yachamo;

	//ミズタロウ
	function Mizutaro(p,x,y){
		Walker.apply(this,arguments);
		this.counter=-1;
		this.walking=false;

		this.s_flg=0;	//行動カウンタ
	}
	Mizutaro.prototype=new Walker;
	Mizutaro.prototype.speed=3;
	Mizutaro.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();
		var mc=this.mc;
		if(this.counter>=0){
			if(this.s_flg==0){
				//発射
				this.direction=this.x>=pl.x?0:1;
				this.parent.addEnemy(new WaterBall(this.parent,this.x,this.y,mc.FPSgetV(this.direction==0?-80:80),mc.FPSgetV(-200)));
				this.parent.parent.playSound("se_mizudeppo");

				this.s_flg=1;
			}else if(this.s_flg==1 && this.counter>=24){
				this.direction^=1;
				this.walking=true;
				this.s_flg=2;

			}else if(this.s_flg==2 && this.counter>24 && this.counter<=24+32){
				this.walk(2);
				if(this.counter==24+32){
					this.walking=false;
					this.direction^=1;
				}
				this.s_flg=3;
			}else if(this.s_flg==3 && this.counter>=80){
				//2発め
				this.parent.addEnemy(new WaterBall(this.parent,this.x,this.y,this.direction==0?-80:80,-200));
				this.parent.parent.playSound("se_mizudekko");
				this.s_flg=4;
			}else if(this.s_flg==4 && this.counter>=115){
				this.walking=true;
				this.s_flg=5;
			}else if(this.s_flg==5 && this.counter>115 && this.counter<=115+32){
				this.walk(2);
				if(this.counter==115+32){
					this.walking=false;
				}
				this.s_flg=6;
			}else if(this.s_flg==6 && this.counter>115+32){
				this.counter=-65;
			}
			this.counter+=mc.FPSgetV(1);
		}else{
			if(Math.abs(this.x-pl.x)>240){
				if(this.counter<0)this.counter+=mc.FPSgetV(1);
			}else{
				this.counter+=mc.FPSgetV(1);
			}

		}

		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,2);
		}
	};
	Mizutaro.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;return;
		}
		if(this.moving==1){
			this.chip= this.walking==false ? 160:(this.parent.enemyAC%8)>=4?162:161;
		}else if(this.moving==2 && this.diemode==1){
			this.chip=163;
		}
	};
	_mc.Mizutaro = Mizutaro;
	function Chikorin(p,x,y){
		Creature.apply(this,arguments);

		this.counter=-1;
	}
	Chikorin.prototype=new Creature;
	Chikorin.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();

		var mc=this.mc;
		if(this.x>pl.x){
			this.direction=0;
		}else if(this.x<pl.x){
			this.direction=1;
		}
		if(this.counter >=0){
			if((this.counter%9)==0){
				//発射
				var kaku=-11*Math.PI/20-0.1*Math.random()*Math.PI;
				var svsp=mc.FPSgetV(200);
				this.parent.addEnemy(new LeafCutter(this.parent,this.x+(this.direction==0?-16:16),this.y-32,Math.cos(kaku)*svsp*(this.direction==1?-1:1),Math.sin(kaku)*svsp));
				if(this.counter==0)this.parent.parent.playSound("se_happa");

			}
			this.counter+=mc.FPSgetV(1);
			if(this.counter>=35){
				this.counter=-85;
			}
		}else{
			this.counter+=mc.FPSgetV(1);
			if(Math.abs(this.x-pl.x)>272 && this.counter>=0)this.counter=-1;
		}

		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,2);
		}

	};
	Chikorin.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;return;
		}
		if(this.moving==1){
			this.chip= 150;
		}else if(this.moving==2 && this.diemode==1){
			this.chip= 151;
		}
	};
	_mc.Chikorin = Chikorin;

	//エアームズ
	function Airms(p,x,y){
		Flyer.apply(this,arguments);

		this.counter=-1;
	}
	Airms.prototype=new Flyer;
	Airms.prototype.speed=4;
	Airms.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();

		this.fly(2);
		this.counter+=this.mc.FPSgetV(1);
		if(this.counter>=0 && this.flying){
			this.parent.addEnemy(new GravityBomb(this.parent,this.x,this.y+26,this.direction));
			this.counter=-30;
			this.parent.parent.playSound("se_bomb");
		}

		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,2);
		}
	};
	Airms.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;return;
		}
		if(this.moving==1){
			this.chip= 164;
		}else if(this.moving==2 && this.diemode==1){
			this.chip= 165;
		}
	};
	_mc.Airms;

	function RangeFlyer(p,x,y){
		Flyer.apply(this,arguments);

		this.minx=0,this.maxx=0;
	}
	RangeFlyer.prototype=new Flyer;
	RangeFlyer.prototype.fly = function(){
		Flyer.prototype.fly.call(this,3);
		if(this.x<this.minx){
			this.x=this.minx;
			this.direction=1;
		}else if(this.x>this.maxx){
			this.x=this.maxx;
			this.direction=0;
		}
	};
	_mc.RangeFlyer = RangeFlyer;

	function Taiking(p,x,y){
		RangeFlyer.apply(this,arguments);

		this.minx=this.x-240, this.maxx=this.x+16;
		this.chip=166;
	}
	Taiking.prototype=new RangeFlyer;
	Taiking.prototype.speed=3;
	Taiking.prototype.dieflg=2;
	Taiking.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();

		this.fly();

		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,2);
		}
	};
	_mc.Taiking = Taiking;

	//クラゲッソ
	function Kuragesso(p,x,y){
		Creature.apply(this,arguments);

		this.counter=-1;
		this.chip=167;
	}
	Kuragesso.prototype=new Creature;
	Kuragesso.prototype.dieflg=2;
	Kuragesso.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();

		if(this.counter >=0){
			var ax=[-4,-4,0,4,4,4,0,-4], ay=[0,-4,-4,-4,0,4,4,4];
			for(var i=0;i<8;i++){
				this.parent.addEnemy(new WaterBubble(this.parent,this.x,this.y,this.mc.FPSgetV(ax[i]),this.mc.FPSgetV(ay[i])));
			}

			this.counter=-80;
		}else{
			this.counter+=this.mc.FPSgetV(1);
			if((Math.abs(this.x-pl.x)>144 || Math.abs(this.y-pl.y)>144) && this.counter>=0)this.counter=-1;
		}

		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,2);
		}
	};
	_mc.Kuragesso = Kuragesso;

	//敵の攻撃==================================
	function EnemyShot(p,x,y){
		Enemy.apply(this,arguments);

		this.moving=1;
	}
	EnemyShot.prototype=new Enemy;
	EnemyShot.prototype.dieflg=0;
	EnemyShot.prototype.score=0;
	EnemyShot.prototype.die=function(){
		this.erase();
	};

	_mc.EnemyShot = EnemyShot;

	//まっすぐ進む電撃
	function Spark(p,x,y){
		EnemyShot.apply(this,arguments);
		this.vx=0,this.vy=0;
	}
	Spark.prototype=new EnemyShot;
	Spark.prototype.speed=16;
	//(fx,fy)から(tx,ty)へ
	Spark.prototype.go=function(fx,fy,tx,ty){
		var kak=Math.atan2(ty-fy,tx-fx);
		this.deg(kak);
	};
	//角度を直接指定
	Spark.prototype.deg=function(d){
		this.vx=Math.cos(d)*this.mc.FPSgetV(this.speed);
		this.vy=Math.sin(d)*this.mc.FPSgetV(this.speed);
	};
	Spark.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();
		var field=this.parent;

		this.x+=this.vx,this.y+=this.vy;
		var cx=Math.floor((this.x+16)/32),cy=Math.floor((this.y+16)/32);

		if(field.isBlockE(cx,cy)){
			this.erase();
			return;
		}


		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,1);
		}
	};
	Spark.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;
			return;
		}
		this.chip=(this.parent.enemyAC%8)>=4?121:120;

	};
	_mc.Spark = Spark;

	//ヤチャモの炎
	function Fire(p,x,y,d){
		EnemyShot.apply(this,arguments);

		this.direction=d;
	}
	Fire.prototype=new EnemyShot;
	Fire.prototype.speed=12;
	Fire.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();
		var field=this.parent;

		if(this.direction==0){
			this.x-=this.mc.FPSgetV(this.speed);
		}else{
			this.x+=this.mc.FPSgetV(this.speed);
		}
		var cx=Math.floor((this.x+16)/32),cy=Math.floor((this.y+16)/32);

		if(field.isBlockE(cx,cy)){
			this.erase();
			return;
		}


		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,1);
		}
	};
	Fire.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;
			return;
		}
		this.chip=(this.parent.enemyAC%8)>=4?127:126;

	};
	_mc.Fire = Fire;

	//ミズタロウの球
	function WaterBall(p,x,y,vx,vy){
		EnemyShot.apply(this,arguments);

		this.vx=vx?vx:0,this.vy=vy?vy:0;
	}
	WaterBall.prototype=new EnemyShot;
	WaterBall.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();
		var field=this.parent;

		this.vy+=this.mc.FPSgetA(25);
		var sv200=this.mc.FPSgetV(200);
		if(this.vy>sv200)this.vy=sv200;
		this.x+=this.vx/10,this.y+=this.vy/10;

		var cx=Math.floor((this.x+16)/32),cy=Math.floor((this.y+16)/32);

		if(field.isBlockE(cx,cy)){
			this.erase();
			return;
		}

		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,1);
		}
	};
	WaterBall.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;
			return;
		}
		this.chip=(this.parent.enemyAC%8)>=4?129:128;

	};
	_mc.WaterBall = WaterBall;

	//葉っぱカッター
	function LeafCutter(p,x,y,vx,vy){
		EnemyShot.apply(this,arguments);

		this.vx=vx?vx:0,this.vy=vy?vy:0;
	}
	LeafCutter.prototype=new EnemyShot;
	LeafCutter.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();
		var field=this.parent;

		this.vy+=this.mc.FPSgetA(15);
		var sv120=this.mc.FPSgetV(120);
		if(this.vy>sv120)this.vy=sv120;
		this.x+=this.vx/10,this.y+=this.vy/10;

		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,1);
		}
	};
	LeafCutter.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;
			return;
		}
		var eac=this.parent.enemyAC%8;
		this.chip=122+parseInt(eac/2);

	};
	_mc.LeafCutter = LeafCutter;

	//爆弾
	function GravityBomb(p,x,y,d){
		EnemyShot.apply(this,arguments);

		this.direction=d;

		this.vy=0;
		this.vx=this.mc? this.mc.FPSgetV(d==0?-40:40) : 0;

		this.counter=0;
	}
	GravityBomb.prototype=new EnemyShot;
	GravityBomb.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();
		var field=this.parent;
		var mc=this.mc;

		if(this.vx>0){
			this.vx-=mc.FPSgetV(3);
			if(this.vx<0)this.vx=0;
		}else if(this.vx<0){
			this.vx+=mc.FPSgetV(3);
			if(this.vx>0)this.vx=0;
		}
		this.vy+=mc.FPSgetA(10);
		var sv160=mc.FPSgetV(160);
		if(this.vy>sv160)this.vy=sv160;
		this.x+=this.vx/10,this.y+=this.vy/10;
		var cx=Math.floor((this.x+16)/32),cy=Math.floor((this.y+16)/32);

		if(field.isBlockE(cx,cy)){
			this.parent.addEnemy(new BlastWave(this.parent,this.x,this.y));
			this.erase();
			return;
		}

		this.counter+=mc.FPSgetV(1);

		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,1);
		}
	};
	GravityBomb.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;
			return;
		}
		this.chip=this.counter<6?171:170;

	};
	_mc.GravityBomb = GravityBomb;

	//爆風
	function BlastWave(p,x,y){
		EnemyShot.apply(this,arguments);

		this.counter=0;
	}
	BlastWave.prototype=new EnemyShot;
	BlastWave.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();
		var field=this.parent;

		this.counter+=this.mc.FPSgetV(1);
		if(this.counter>9){
			this.erase();
			return;
		}

		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,1);
		}
	};
	BlastWave.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;
			return;
		}
		this.chip=this.counter<3?172: this.counter<6?173:174;

	};
	_mc.BlastWave = BlastWave;

	//泡
	function WaterBubble(p,x,y,vx,vy){
		EnemyShot.apply(this,arguments);

		this.vx=vx,this.vy=vy;
	}
	WaterBubble.prototype=new EnemyShot;
	WaterBubble.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();
		var field=this.parent;

		this.x+=this.vx,this.y+=this.vy;

		var cx=Math.floor((this.x+16)/32),cy=Math.floor((this.y+16)/32);
		if(!field.isInWater(cx,cy)){
			this.erase();
			return;
		}

		if(this.diecheck(pl))return;
		if(this.hitcheck(pl)){
			pl.damage(1,1);
		}
	};
	WaterBubble.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;
			return;
		}
		this.chip=(this.parent.enemyAC%8)>=4?169:168;

	};
	_mc.WaterBubble = WaterBubble;

	//エフェクト========================================
	function Effect(p,x,y){
		Enemy.apply(this,arguments);
	}
	Effect.prototype=new Enemy;
	Effect.prototype.dieflg=16;
	Effect.prototype.score=0;

	_mc.Effect = Effect;

	//水しぶき
	function SheetOfSpray(p,x,y){
		Effect.apply(this,arguments);

		this.counter=0;
	}
	SheetOfSpray.prototype=new Effect;
	SheetOfSpray.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();
		var field=this.parent;

		this.counter+=this.mc.FPSgetV(1);
		if(this.counter>12){
			this.erase();
			return;
		}

		if(this.diecheck(pl))return;
	};
	SheetOfSpray.prototype.setChip=function(){
		if(this.moving<=0){
			this.chip=0;
			return;
		}
		this.chip=this.counter<4?80: this.counter<8?81:82;

	};
	_mc.SheetOfSpray = SheetOfSpray;

	//ブロックの破片 x,yはブロックの座標を指定すること
	function BrokenBlock(p,x,y,d){
		Effect.apply(this,arguments);

		this.direction=d;
		this.vx= this.mc?this.mc.FPSgetV(d==0?-90:90) : 0;
		this.vy= this.mc?this.mc.FPSgetV(-180) : -180;
		this.x+= d==0?-16:16;
		this.y-=16;

		this.chip=136;
	}
	BrokenBlock.prototype=new Effect;
	BrokenBlock.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		if(this.moving==2)return this.dying();
		var field=this.parent;

		var mc=this.mc;
		var sv10=mc.FPSgetV(10),sv200=mc.FPSgetV(200);
		var sa2=mc.FPSgetA(2);

		if(this.vx<-sv10){
			this.vx+=sa2;
			if(this.vx>-sv10)this.vx=-sv10;
		}else if(this.vx>sv10){
			this.vx-=sa2;
			if(this.vx<sv10)this.vx=sv10;
		}

		this.vy+=mc.FPSgetV(25);
		if(this.vy>sv200)this.vy=sv200;

		this.x+=this.vx/10,this.y+=this.vy/10;

		if(this.diecheck(pl))return;
	};
	_mc.BrokenBlock = BrokenBlock;

	//アイテム============================================
	function Item(p,x,y){
		Enemy.apply(this,arguments);

		this.shown=false;	//出現したかどうか（ブロックと同座標に置いておく）
		this.moving=1;
	}
	Item.prototype=new Enemy;
	Item.prototype.dieflg=48;
	Item.prototype.score=5;
	Item.prototype.appear=function(){
		this.parent.parent.playSound("se_item");
		this.y-=32;
		this.shown=true;
	};
		//中心のみの衝突判定
	Item.prototype.hitcheck2=function(pl){
		if(pl.living>0)return false;
		return this.x<=pl.x+15 && pl.x+17<=this.x+this.sizex-1 &&
		       this.y<=pl.y+15 && pl.y+17<=this.y+this.sizey-1;
	};
	Item.prototype.doo=function(pl){
		if(this.moving==2)return this.dying();
		if(!this.shown)return;
		var field=this.parent;

		if(this.hitcheck2(pl)){
			this.effect(pl);
			this.erase();
			return;
		}

		if(this.diecheck(pl))return;
	};
	Item.prototype.die=function(){
		this.erase();
	};
	Item.prototype.draw=function(){
		if(!this.shown)return;
		var p=this.parent;
		this.mc.drawPattern(this.x-p.scrollx,this.y-p.scrolly,this.chip,this.direction);
	};
	Item.prototype.effect_common=function(pl){
		//共通処理
		this.parent.addScore(this.score);
	};
	Item.prototype.effect=function(p1){
	};
	_mc.Item = Item;

	//コイン
	function I_coin(p,x,y,vy,maxy){
		Item.apply(this,arguments);

		this.vy=vy,this.maxy=maxy;
		this.moving=true;
	}
	I_coin.prototype=new Item;
	I_coin.prototype.score=0;
	I_coin.prototype.effect=function(pl){
		this.effect_common(pl);
		this.parent.getCoin(pl);
	};
	I_coin.prototype.doo=function(pl){
		if(this.moving==2)return this.dying();
		if(!this.shown)return;
		var field=this.parent;

		if(this.moving){
			this.vy+=this.mc.FPSgetA(25);
			this.y+=this.vy/10;
			if(this.y>=this.maxy && this.vy>=0){
				this.y=this.maxy;
				this.moving=false;
			}
		}

		if(this.hitcheck2(pl)){
			this.effect(pl);
			this.erase();
			return;
		}

		if(this.diecheck(pl))return;
	};
	I_coin.prototype.draw=function(){
		if(!this.shown)return;
		var p=this.parent;
		var acc=p.enemyAC%8;
		this.chip=acc>=6?93 : acc>=4?92 : acc>=2?91:90;
		this.mc.drawPattern(this.x-p.scrollx,this.y-p.scrolly,this.chip,this.direction);
	};
	_mc.I_coin = I_coin;

	//ファイアフラワー
	function I_FireFlower(p,x,y){
		Item.apply(this,arguments);

		this.chip=42;
	}
	I_FireFlower.prototype=new Item;
	I_FireFlower.prototype.effect=function(pl){
		this.effect_common(pl);
		pl.fire=1;
	};
	_mc.I_FireFlower = I_FireFlower;
	//バリア
	function I_Barrier(p,x,y){
		Item.apply(this,arguments);

		this.chip=43;
	}
	I_Barrier.prototype=new Item;
	I_Barrier.prototype.effect=function(pl){
		this.effect_common(pl);
		pl.barrier=150;
	};
	_mc.I_Barrier = I_Barrier;
	//タイム
	function I_Time(p,x,y){
		Item.apply(this,arguments);

		this.chip=44;
	}
	I_Time.prototype=new Item;
	I_Time.prototype.effect=function(pl){
		this.effect_common(pl);
		if(this.parent.time!=null)this.parent.time+=30;
	};
	_mc.I_Time = I_Time;

	//ジェット
	function I_Jet(p,x,y){
		Item.apply(this,arguments);

		this.chip=45;
	}
	I_Jet.prototype=new Item;
	I_Jet.prototype.effect=function(pl){
		this.effect_common(pl);
		pl.jet+=80;
	};
	_mc.I_Jet = I_Jet;
	//ヘルメット
	function I_Helmet(p,x,y){
		Item.apply(this,arguments);

		this.chip=46;
	}
	I_Helmet.prototype=new Item;
	I_Helmet.prototype.effect=function(pl){
		this.effect_common(pl);
		pl.helmet=true;
	};
	_mc.I_Helmet = I_Helmet;
	//しっぽ
	function I_Tail(p,x,y){
		Item.apply(this,arguments);

		this.chip=47;
	}
	I_Tail.prototype=new Item;
	I_Tail.prototype.effect=function(pl){
		this.effect_common(pl);
		pl.tail=true;
	};
	_mc.I_Tail = I_Tail;

	//ドリル
	function I_Drill(p,x,y){
		Item.apply(this,arguments);

		this.chip=48;
	}
	I_Drill.prototype=new Item;
	I_Drill.prototype.effect=function(pl){
		this.effect_common(pl);
		pl.drill=true;
	};
	_mc.I_Drill = I_Drill;

	//グレネード
	function I_Grenade(p,x,y){
		Item.apply(this,arguments);
		this.chip=49;
	}
	I_Grenade.prototype=new Item;
	I_Grenade.prototype.effect=function(pl){
		this.effect_common(pl);
		pl.grenade++;
	};
	_mc.I_Grenade = I_Grenade;

	//自分の攻撃
	function MyShot(p,x,y){
		Enemy.apply(this,arguments);
	}
	MyShot.prototype=new Enemy;
	_mc.MyShot = MyShot;

	//ファイヤーボール
	function FireBall(p,x,y,pl){
		MyShot.apply(this,arguments);

		this.player=pl;	//発射したプレイヤー
		this.moving=1;
		if(pl){
			pl.fireBall_count++;
		}
	}
	FireBall.prototype=new MyShot;
	FireBall.prototype.sizex=16;
	FireBall.prototype.sizey=16;
	FireBall.prototype.dieflg=48;
	FireBall.prototype.draw=function(){
		if(this.moving==2 || this.moving<0)return;
		var p=this.parent;

		this.mc.drawPattern(this.x-8-p.scrollx,this.y-8-p.scrolly,130+parseInt((p.enemyAC%8)/2),this.direction);
	};
	FireBall.prototype.erase=function(){
		this.player.fireBall_count--;
		this.moving=-1;
	};
	_mc.FireBall = FireBall;

	//跳ねるファイヤーボール
	function FireBall1(p,x,y,pl,vx){
		FireBall.apply(this,arguments);

		this.vx=vx,this.vy=this.mc?this.mc.FPSgetV(-200):-200;
	}
	FireBall1.prototype=new FireBall;
	FireBall1.prototype.doo=function(pl){
		if(this.moving==2 || this.moving<0)return this.dying();
		var field=this.parent;

		this.vy+=this.mc.FPSgetA(25);
		var vyy=this.vy;
		var ret=Jumper.prototype.fall.call(this);
		if(ret&7){
			//壁にぶつかった
			this.erase();
			return;
		}else if(ret&8){
			//跳ねた
			this.vy=this.mc.FPSgetV(-200);
		}
		if(field.destroyEnemy(this.x,this.y,this.x+this.sizex-1,this.y+this.sizey-1,this.player)>0){
			this.erase();
		}

		if(this.diecheck(pl))return;
	};
	_mc.FireBall1 = FireBall1;

	//グレネード
	function Grenade(p,x,y,pl,vx){
		MyShot.apply(this,arguments);

		this.player=pl;
		this.vx=vx,this.vy=this.mc?this.mc.FPSgetV(-250):-250;
		if(pl){
			pl.grenade_count++;
		}
	}
	Grenade.prototype=new MyShot;
	Grenade.prototype.sizex=20;
	Grenade.prototype.sizey=20;
	Grenade.prototype.doo=function(pl){
		if(this.moving==2 || this.moving<0)return this.dying();
		var field=this.parent;

		this.vy+=this.mc.FPSgetA(35);
		var vyy=this.vy;
		var ret=Jumper.prototype.fall.call(this);
		if(ret){
			//壁にぶつかった
			this.erase();
			field.addEnemy(new GrenadeWave(field,this.x+10,this.y+10,this.player));
			return;
		}
		if(field.destroyEnemy(this.x,this.y,this.x+this.sizex-1,this.y+this.sizey-1,this.player)>0){
			this.erase();
			field.addEnemy(new GrenadeWave(field,this.x+10,this.y+10,this.player));
		}

		if(this.diecheck(pl))return;
	};
	Grenade.prototype.draw=function(){
		if(this.moving==2 || this.moving<0)return;
		var p=this.parent;

		var ctx=this.mc.ctx;
		ctx.beginPath();
		ctx.arc(this.x+10-p.scrollx,this.y+10-p.scrolly,10,0,Math.PI*2,false);
		ctx.fillStyle = ((p.enemyAC%8)>=4?this.mc.config.grenade_color1 : this.mc.config.grenade_color2).toString();
		ctx.fill();
	};
	Grenade.prototype.erase=function(){
		this.player.grenade_count--;
		this.moving=-1;
	};
	_mc.Grenade = Grenade;
	//グレネード爆風 x,y:中心座標
	function GrenadeWave(p,x,y,pl){
		MyShot.apply(this,arguments);

		this.player=pl;

		this.radius=10;
	}
	GrenadeWave.prototype=new MyShot;
	GrenadeWave.prototype.sizex=0;
	GrenadeWave.prototype.sizey=0;
	GrenadeWave.prototype.doo=function(pl){
		if(this.moving==2 || this.moving<0)return this.dying();
		var field=this.parent;

		this.radius+=this.mc.FPSgetV((90-this.radius)/4);
		if(this.radius>80){
			this.erase();
		}
		field.destroyEnemyC(this.x,this.y,this.radius,this.player);

		if(this.diecheck(pl))return;
	};
	GrenadeWave.prototype.draw=function(){
		if(this.moving==2 || this.moving<0)return;
		var p=this.parent;

		var ctx=this.mc.ctx;
		ctx.beginPath();
		ctx.arc(this.x-p.scrollx,this.y-p.scrolly,this.radius,0,Math.PI*2,false);
		ctx.fillStyle = ((p.enemyAC%8)>=4?this.mc.config.grenade_color1 : this.mc.config.grenade_color2).toString();
		ctx.fill();
	};
	_mc.GrenadeWave = GrenadeWave;

	//===================================================================================
	function Athletic(p,x,y){

		this.parent=p;	//Field
		if(p)this.mc=p.parent;	//MasaoConstruction
		this.x=x,this.y=y;
		this.moving=0;
	}
	Athletic.prototype={
		doo:function(pl){

		}
	};
	_mc.Athletic = Athletic;

	function Yuka(p,x,y){
		Athletic.apply(this,arguments);

		this.ride=null;	//Player 主人公が乗っている
	}
	Yuka.prototype=new Athletic;
	//そのx座標においての乗れるy座標
	Yuka.prototype.getTop=function(x){
		return 0;
	};
	//そのx座標においての下端のy座標
	Yuka.prototype.getBottom=function(x){
		return 0;
	};
	//汎用doo
	Yuka.prototype.doocommon=function(pl){
		if(this.ride){
			if(!this.ridechk(this.ride)){
				this.ride=null;
			}
		}
	};
	//今も乗ってるかどうか調べる
	Yuka.prototype.ridechk=function(pl){
		return false;
	};
	_mc.Yuka = Yuka;

	//箱
	function RectYuka(p,x,y){
		Yuka.apply(this,arguments);
	}
	RectYuka.prototype=new Yuka;
	RectYuka.prototype.sizex=0;
	RectYuka.prototype.sizey=0;
	RectYuka.prototype.incheck=function(){
		var field=this.parent;
		var co=field.parent.config;
		if(this.x<=field.scrollx+co.c_width+32 || this.y<=field.scrolly+co.c_height+32 || field.scrollx<=this.x+this.sizex+32 || field.scrolly<=this.y+this.sizey+32){
			this.moving=1;
			return true;
		}
		return false;
	};
	RectYuka.prototype.getTop=function(x){
		return this.y;
	};
	RectYuka.prototype.getBottom=function(x){
		return this.y+this.sizey-1;
	};
	RectYuka.prototype.ridechk=function(pl){
		var x=pl.x+16,y=pl.y+32;
		return this.inarea(x,y);
	};
	RectYuka.prototype.inarea=function(x,y){
		//ある点が床と重なっているかどうか調べる
		if(this.x<=x && this.y<=y && x<=this.x+this.sizex && y<=this.y+this.sizey){
			return true;
		}
		return false;
	};
	RectYuka.prototype.move=function(vx,vy){
		//動く(絶対座標)
		var xsa=vx-this.x,ysa=vy-this.y;
		this.x=vx,this.y=vy;
		if(this.ride)this.ride.x+=xsa,this.ride.y+=ysa;
	};
	_mc.RectYuka = RectYuka;

	function Dossunsun(p,x,y){
		RectYuka.apply(this,arguments);
	}
	Dossunsun.prototype=new RectYuka;
	Dossunsun.prototype.sizex=96;
	Dossunsun.prototype.sizey=64;
	Dossunsun.prototype.draw=function(){
		if(this.moving<=0)return;
		var p=this.parent;
		var mc=p.parent;
		var ctx=mc.ctx;
		ctx.drawImage(mc.images.pattern.i,96,576,96,64,parseInt(this.x-p.scrollx),parseInt(this.y-p.scrolly),96,64);
	};
	_mc.Dossunsun = Dossunsun;

	function Dossunsun_faller(p,x,y){
		Dossunsun.apply(this,arguments);

		this.counter=-10;
		this.st_y=0;
		this.f_mode=0;
	}
	Dossunsun_faller.prototype=new Dossunsun;
	Dossunsun_faller.prototype.doo=function(pl){
		if(this.moving==0 && !this.incheck())return;
		this.doocommon(pl);
		var mc=this.mc;

		if(this.counter<0){
			var mae_c=this.counter;
			this.counter+=mc.FPSgetV(1);
			if(this.counter>=0 && (pl.x<=this.x-80 || this.x+this.sizex+80<=pl.x)){
				this.counter=mae_c;
			}
		}else{
			if(this.f_mode==0){
				//初期状態
				this.f_mode=1;
				this.st_y=this.y;
			}
			if(this.f_mode==1){
				//落ちる
				this.move(this.x,this.y+mc.FPSgetV(12));
				if(this.y >= this.st_y+128){
					this.move(this.x,this.st_y+128);
					this.f_mode=2;
				}
			}else if(this.f_mode==2){
				//登る
				this.move(this.x,this.y-mc.FPSgetV(4));
				if(this.y<=this.st_y){
					this.move(this.x,this.st_y);
					this.f_mode=0;
					this.counter=-10;
				}
			}
		}
	};
	_mc.Dossunsun_faller = Dossunsun_faller;
	 window.requestAnimationFrame = (function(){
        return  window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame   ||
        window.mozRequestAnimationFrame      ||
        window.oRequestAnimationFrame        ||
        window.msRequestAnimationFrame       ||
        function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / 60);
              };
      })();

	return _mc;
}();