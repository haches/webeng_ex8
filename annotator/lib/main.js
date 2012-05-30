/** 
 * import the panel module; The panel module creates floating modal "popup dialogs"
 * that appear on top of web content and browser chrome and persist until dismissed
 * by users or programs.
 * https://addons.mozilla.org/en-US/developers/docs/sdk/1.0/packages/addon-kit/docs/panel.html
 */
const panels = require('panel');
/**
 * The widget module provides your add-on with a simple user interface that is consistent with
 * other add-ons and blends in well with Firefox.
 * https://addons.mozilla.org/en-US/developers/docs/sdk/1.0/packages/addon-kit/docs/widget.html
 */
var widgets = require("widget");
/**
 * The page-mod module enables add-on developers to execute scripts in the context of
 * specific web pages. Most obviously you could use page-mod to dynamically modify the
 * content of certain pages.
 *https://addons.mozilla.org/en-US/developers/docs/sdk/1.5/packages/addon-kit/docs/page-mod.html
 */
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
	      // link the editor to the selector
	      annotationEditor.annotationAnchor = data;
	      annotationEditor.show();
	    });
	    worker.on('detach', function () {
	      detachWorker(this, selectors);
	    });
	  }
	});
	
	var annotationEditor = panels.Panel({
		width: 220,
		height: 220,
		contentURL: data.url('editor/annotation-editor.html'),
		contentScriptFile: data.url('editor/annotation-editor.js'),
		
		// when the editor panel sends us its message we log the message
		// and hide the panel
		onMessage: function(annotationText) {
		  if (annotationText) {
		    console.log(this.annotationAnchor);
		    console.log(annotationText);
		  }
		  annotationEditor.hide();
		},
		
		// we will send the editor panel the focus message when it's shown
		// so it will give the text area focus
		onShow: function() {
		  this.postMessage('focus');
		}					
	});
}