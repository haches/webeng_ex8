var widgets = require("widget");
var data = require("self").data;

var annotatorIsOn = false;

function toggleActivation() {
	annotatorIsOn = !annotatorIsOn;
	return annotatorIsOn;
}

exports.main = function() {

	var widget = widgets.Widget({
		id: "toggle-switch",
		label: "Annotator",
		contentURL: data.url("widget/pencil-off.png"),
		contentScriptWhen: "ready",
		contentScriptFile: data.url("widget/widget.js")
	});
	
	widget.port.on('left-click', function() {
		console.log("activate/deactivate");
		widget.contentURL = toggleActivation() ?
					data.url("widget/pencil-on.png") :
					data.url("widget/pencil-off.png");
	});
	
	widget.port.on("right-click", function() {
		console.log("show annotation list");
	});
}