//実行部 実際は表示したい場所に設g置
(function($,MC){
$(document).ready(function(){
	var imagePath = "image/";
    var href = $("link[rel=masaoConstruction]",document).attr("href");
    var id = $("script:last").attr("src").replace(/[^?]*\?(.*)/,"$1");
    var canvas = $("canvas#"+id).get(0);
    $.ajax({
        url:href,
        dataType:"XML"
    }).fail(function(){
        alert("読み込み失敗");
    }).done(function(data){
        var masaoData = $("param",data);
        var config = new MC.Config();
        config.filename_title = imagePath+ masaoData.filter("[name=filename_title]").attr("value");
        config.filename_ending = imagePath+masaoData.filter("[name=filename_ending]").attr("value");
        config.filename_gameover = imagePath+masaoData.filter("[name=filename_gameover]").attr("value");
        config.filename_pattern = imagePath+masaoData.filter("[name=filename_pattern]").attr("value");
        config.filename_haikei = masaoData.filter("[name=filename_haikei]").attr("value") || "";
        config.filename_haikei = config.filename_haikei===""?null:imagePath+config.filename_haikei;
        config.moji_score = masaoData.filter("[name=moji_score]").attr("value") || "SCORE";
        config.moji_highscore = masaoData.filter("[name=moji_highscore]").attr("value") || "HIGHSCORE";
        config.moji_time = masaoData.filter("[name=moji_time]").attr("value") || "TIME";
        config.moji_jet = masaoData.filter("[name=moji_jet]").attr("value") || "JET";
        config.moji_grenade = masaoData.filter("[name=moji_grenade]").attr("value") || "GRENADE";
        config.moji_left = masaoData.filter("[name=moji_left]").attr("value") || "LEFT";
        config.moji_size = parseInt(masaoData.filter("[name=moji_size]").attr("value") || "14",10);
        var masao = new MC();
        masao.config = config;
        masao.initCanvas(canvas);
        var mymap = new MC.Map();
        var array = [];
        for(var i=0,imax=3;i<imax;i++){
            for(var j=0,jmax=30;j<jmax;j++){
                if(i==0){
                    array[j]="";
                }
                array[j] += masaoData.filter("[name=map"+i+"-"+j+"]").attr("value")
                    || "............................................................";
            }
        }
        mymap.initMap(array,masao.config);
        var mystage =new MC.Stage(mymap);
        masao.addStage(mystage);
        masao.loadFiles();
        masao.loop();
        masao.title();
        window.masaoData = masao;
    });
});
})(jQuery,MasaoConstruction);