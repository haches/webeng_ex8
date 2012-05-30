var widgets = require("widget");
var pageMod = require("page-mod");
var data = require("self").data;
var selectors = [];

var annotatorIsOn = false;

function activateSelectors() {
	selectors.forEach(
		function (selector) {
			selector.postMessage(annotatorIsOn);
	});
}

function toggleActivation() {
	annotatorIsOn = !annotatorIsOn;
	activateSelectors();
	return annotatorIsOn;
}

function detachWorker(worker, workerArray) {
	var index = workerArray.indexOf(worker);
	if(index != -1) {
		workerArray.splice(index, 1);
	}
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
	
	var selector = pageMod.PageMod({
	  include: ['*'],
	  contentScriptWhen: 'ready',
	  contentScriptFile: [data.url('jquery-1.7.2.min.js'),
	                      data.url('selector.js')],
	  onAttach: function(worker) {
	    worker.postMessage(annotatorIsOn);
	    selectors.push(worker);
	    worker.port.on('show', function(data) {
	      console.log(data);
	    });
	    worker.on('detach', function () {
	      detachWorker(this, selectors);
	    });
	  }
	});
}