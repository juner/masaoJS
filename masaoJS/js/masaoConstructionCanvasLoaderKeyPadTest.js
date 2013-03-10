//実行部 src指定時に URL末尾で?以降にidを指定することで表示先のcanvasを指定することが出来る
(function($){
	//初期設定
	$.generateMasaoConstruction.setSetting({imageBasePath:"image/"});
	//読み込み時に末尾のscriptからidを取得する。
    var id = $("script:last").attr("src").replace(/[^?]*\?(.*)/,"$1");
    $.generateMasaoConstruction.autoLoader("canvas#"+id)
    .fail(function(txt,dest){
    	//エラー処理
    	if("load error"===txt){
    		//dest instanceof XHR
    		alert(txt+":"+dest.statusText);
    	}else{
    		//typeof dest === "string"
    		alert(txt+":"+dest);
    	}
    }).done(function(txt,masao,canvas){
    	$(canvas).addMasaoCostructionKeyPad(masao);
    	//成功時処理
    	window.masaoData = masao;//debug用
    });
})(jQuery);