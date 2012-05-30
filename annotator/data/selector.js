var matchedElement = null;
var originalBgColor = null;
var active = false;

function resetMatchedElement() {
	if (matchedElement) {
		$(matchedElement).css('background-color', originalBgColor);
		$(matchedElement).unbind('click.annotator');
	}
}

self.on('message', function onMessage(activation) {
	active = activation;
	if (!active) {
		resetMatchedElement();
	}
});

$('*').mouseenter(function () {	
	if (!active || $(this).hasClass('annotated')) {
		return;
	}

	resetMatchedElement();
	ancestor = $(this).closest('[id]');
	matchedElement = $(this).first();

	originalBgColor = $(matchedElement).css('background-color');
	$(matchedElement).css('background-color', 'yellow');
	$(matchedElement).bind('click.annotator', function(event) {
		event.stopPropagation();
		event.preventDefault();		
		self.port.emit('show',
			[
				document.location.toString(),
				$(ancestor).attr("id"),
				$(matchedElement).text()
			]
		);
	});
});

$('*').mouseout(function() {
	resetMachtedElement();
});