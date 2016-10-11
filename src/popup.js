'use strict';

function EmojiExtractor() {
	this._button = document.getElementById('button');
	this._button.addEventListener('click',
				this.getMinifiedEmojiJSON.bind(this));
}

EmojiExtractor.URL = "http://localhost:4040/build-emoji-json";

EmojiExtractor.prototype.getMinifiedEmojiJSON = function(){
	this._getEmojis();
}


EmojiExtractor.prototype._getEmojis = function(){
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {message: 'get-emojis'},
				function(response) {
			console.log(response);
			this.updateServerEmojiList(JSON.stringify(response.emojis));
		}.bind(this));
	}.bind(this));
}

EmojiExtractor.prototype.updateServerEmojiList = function(emojis){
	var req = new XMLHttpRequest();
	req.addEventListener('load', this._updateSuccess.bind(this));
	req.addEventListener('error', this._updateError.bind(this));

	req.open("POST", EmojiExtractor.URL, true);
	req.setRequestHeader("Content-Type", "text/plain");

	console.log(emojis);
	req.send(emojis);
}

EmojiExtractor.prototype._updateSuccess = function(res){
	console.log(res);
}

EmojiExtractor.prototype._updateError = function(res){
	console.error(res);
}


if (document.readyState === 'completed'){
	new EmojiExtractor();
} else {
	document.addEventListener('DOMContentLoaded', function() {
		new EmojiExtractor();
	});
}