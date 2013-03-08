(function($,MC){
	var options ={
		imageBasePath:"",
		filenameSelecter:"[name^=filename_]",
		filenameKeys:[
		  	{key:"filename_title",name:"title"},
			{key:"filename_ending",name:"ending"},
			{key:"filename_gameover",name:"gameover"},
			{key:"filename_pattern",name:"pattern"},
			{key:"filename_haikei",name:"haikei"},
			{key:"filename_chizu",name:"chizu"},
	  	],
	  	mapSelecter:"[name^=map]",
	  	colorSelecter:"[name$=_red],[name$=_green],[name$=_blue],[name$=_red1],[name$=_green1],[name$=_blue1],[name$=_red2],[name$=_green2],[name$=_blue2]",
	  	colorKeys:[
	  	    {r:"scorecolor_red",g:"scorecolor_green",b:"scorecolor_blue",name:"score"},
	  	    {r:"backcolor_red",g:"backcolor_green",b:"backcolor_blue",name:"back"},
	  	    {r:"grenade_red1",g:"grenade_green1",b:"grenade_blue1",name:"grenade1"},
	  	    {r:"grenade_red2",g:"grenade_green2",b:"grenade_blue2",name:"grenade2"},
	  	    {r:"mizunohadou_red",g:"mizunohadou_green",b:"mizunohadou_blue",name:"mizunohadou"},
	  	    {r:"firebar_red1",g:"firebar_green1",b:"firebar_blue1",name:"firebar1"},
	  	    {r:"firebar_red2",g:"firebar_green2",b:"firebar_blue2",name:"firebar2"},
	  	],
		mapStagesKeys:["","s","t","f"],
		mapDefaultData:"............................................................"
	};
	/**
	 * 取得したデータからparamを抜き出し、正男を設定して返す関数
	 */
	$.fn.generateMasaoConstruction = function(){
		var imagePath = options.imageBasePath;
		var _masaoData = $(this).find("param");
		var filenameData = {};

        //filaname
		var _filenameData = _masaoData.filter(options.filenameSelecter);
		_masaoData = _masaoData.not(options.filenameSelecter);

		//map
		var _mapData = _masaoData.filter(options.mapSelecter);
        _masaoData = _masaoData.not(options.mapSelecter);

        //color
        var _colorData = _masaoData.filter(options.colorSelecter);
        _masaoData = _masaoData.not(options.colorSelecter);

        //config setting start
        var config = new MC.Config();
        _masaoData.each(function(){
        	var name = $(this).attr("name");
        	var value = $(this).attr("value");
        	var num = parseInt(value);
        	if(!isNaN(num)){
        		config[name] = num;
        	}else if(value){
        		config[name] = value;
        	}
        });

        _filenameData.each(function(){
			var self = $(this);
			var name = self.attr("name");
			var value = self.attr("value");
			if(value){
				filenameData[name] = imagePath + value;
			}
		});
        var filenameKeys = options.filenameKeys;
        for(var i =0,max=filenameKeys.length;i<max;i++){
        	var filenameKey = filenameKeys[i];
        	var key = filenameKey.key;
        	var name = filenameKey.name;
        	if(key in filenameData){
        		config.filenames[name] = filenameData[key];
        	}
        }
        var colorKeys = options.colorKeys;
        for(var i=0,max = colorKeys.length;i<max;i++){
        	var colorKey = colorKeys[i];
        	var r = _colorData.filter("[name="+colorKey.r+"]").attr("value"),
        		g = _colorData.filter("[name="+colorKey.g+"]").attr("value"),
        		b = _colorData.filter("[name="+colorKey.b+"]").attr("value"),
        		name = colorKey.name;
        	if(r && g && b){
        		config.colors[name] = new MC.Color(r,g,b);
        	}
        }
        //MasaoConstruction setting start;
        var masao = new MC();
        masao.config = config;
        var mapStageKeys = options.mapStagesKeys;
        for(var a=0,max=mapStageKeys.length;a<max;a++){
        	var mapStageKey = mapStageKeys[a],array = [];
            var test = "map0-0"+(0 < mapStageKey.length?"-"+mapStageKey:"");
            if(_mapData.is("[name="+test+"]")){
	            for(var i=0,imax=3;i<imax;i++){
	                for(var j=0,jmax=30;j<jmax;j++){
	                    if(i==0){
	                        array[j]="";
	                    }
	                    var name = "map"+i+"-"+j+(0 < mapStageKey.length?"-"+mapStageKey:"");
	                    array[j] += _mapData.filter("[name="+name+"]").attr("value")
	                        || options.mapDefaultData;
	                }
	            }
	            var mymap = new MC.Map();
	            mymap.initMap(array,masao.config);
	            var mystage =new MC.Stage(mymap);
	            masao.addStage(mystage);
            }
        }
        return masao;
	};
	$.generateMasaoConstructionSetting = function(opt){
		options = $.extend(options,opt);
	};
})(jQuery,MasaoConstruction);

//実行部 src指定時に URL末尾で?以降にidを指定することで表示先のcanvasをすることが出来る
(function($,MC){
	//読み込み時に末尾のscriptからidを取得する。
    var id = $("script:last").attr("src").replace(/[^?]*\?(.*)/,"$1");
	$(document).ready(function(){
	    var href = $("link[rel=masaoConstruction]",document).attr("href");
	    var canvas = $("canvas#"+id).get(0);
	    $.ajax(href
	    ).fail(function(){
	        alert("読み込み失敗");
	    }).done(function(data){
	        var masao = $(data).generateMasaoConstruction();
	        masao.initCanvas(canvas);
	        masao.loadFiles();
	        masao.loop();
	        masao.title();
	        //window.masaoData = masao; //debug用
	    });
	});
})(jQuery,MasaoConstruction);