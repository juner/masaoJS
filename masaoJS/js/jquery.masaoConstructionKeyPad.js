(function($,MC,undefined){
	if($===undefined){
		throw "jQuery ison't loaded.";
	}
	if(MC===undefined){
		throw "MasaoConstruction isn't loaded.";
	}
	var methods ={
			setKeyEvent:function(key_code,masao,d){
				return $(this).on({
					"touchstart mousedown":function(){
						if(d){
							masao.keyDown(key_code);
							masao.keyUp(key_code);
						}
						masao.keyDown(key_code);
					},
					"touchend mouseup":function(){
						masao.keyUp(key_code);
					}
				});
			}
	};
	var options={
		className:"soft-key",
		keys:[
		      {className:"key-left",text:" ← ",keyCode:37},
		      {className:"key-right",text:" → ",keyCode:39},
		      {className:"key-up",text:" ↑ ",keyCode:38},
		      {className:"key-down",text:" ↓ ",keyCode:40},
		      {className:"key-z",text:"z[jump]",keyCode:0x5A},
		      {className:"key-x",text:"x[action]",keyCode:0x58},
		      {className:"key-t",text:"t[title]",keyCode:0x54}
		],
		css:{
			padding:"1em",
			margin:"0.5em"
		}
	};
	$.fn.addMasaoCostructionKeyPad=function(masao){
		var buttons = $("<div/>").addClass(options.className);
		var keys = options.keys;
		for(var i=0,max=keys.length;i<max;i++){
			var key = keys[i];
			var button = $("<input type='button'/>")
			.css(options.css)
			.addClass(key.className)
			.val(key.text);
			methods.setKeyEvent.call(button,key.keyCode,masao);
			buttons.append(button);
		}
		$(this).parent()
		.append(buttons);
	};
})(jQuery,MasaoConstruction);