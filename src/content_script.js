function getEmojis(){
	var json = {};
	var spans = document.querySelectorAll('.emoji_span_container');
	console.log(spans.length);
	spans.forEach(function(span, index) {
		var key = span.dataset.emojiShortcode;

		if (!key || key === ''){
			key = ':' + span.title.toLowerCase().replace(/\s/g, '_') + ':';
		}

		if (key !== '::'){
			var tags = span.dataset.emojiKeywords;
			tags = (!tags || tags === '') ? [] : tags.split(' ');

			var text = span.dataset.clipboardText;

			json[key] = {
				"key": key,
				"tags": tags,
				"value": text
			}
		}
	});

	return json;
}

chrome.runtime.onMessage.addListener(
 		function(request, sender, sendResponse) {
	if (request.message === 'get-emojis'){
		sendResponse({emojis: getEmojis()});
	}
});