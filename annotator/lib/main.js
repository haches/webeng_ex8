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
/**
 * The simple-storage module lets you easily and persistently store data across application
 * restarts. If you're familiar with DOM storage on the Web, it's kind of like that, but for
 * add-ons.
 * https://addons.mozilla.org/en-US/developers/docs/sdk/1.0/packages/addon-kit/docs/simple-storage.html
 */
const simpleStorage = require('simple-storage');
/**
 * The notifications module allows you to display transient,
 * toaster-style desktop messages to the user.
 * https://addons.mozilla.org/en-US/developers/docs/sdk/1.1/packages/addon-kit/docs/notifications.htm 
 */
const notifications = require("notifications");

const privateBrowsing = require('private-browsing');

var data = require("self").data;
var selectors = [];
var annotatorIsOn = false;

// initalize and array which will contain the stored annotations
if (!simpleStorage.storage.annotations)
	simpleStorage.storage.annotations = [];
  
function canEnterAnnotations() {
	return (annotatorIsOn && !privateBrowsing.isActive);
}

function activateSelectors() {
	selectors.forEach(
		function (selector) {
			selector.postMessage(canEnterAnnotations());
	});
}

function toggleActivation() {
	if (privateBrowsing.isActive) {
		return false;
	}
	annotatorIsOn = !annotatorIsOn;
	activateSelectors();
	return canEnterAnnotations();
}

function detachWorker(worker, workerArray) {
	var index = workerArray.indexOf(worker);
	if(index != -1) {
		workerArray.splice(index, 1);
	}
}

/** 
 * Function to deal with annotation. An annotation is composed of the text the user enters
 * and the annotation anchor (i.e. URL, element ID and element content).
 */
function handleNewAnnotation(annotationText, anchor) {
  	var newAnnotation = new Annotation(annotationText, anchor);
  	simpleStorage.storage.annotations.push(newAnnotation);
}

function Annotation(annotationText, anchor) {
	this.annotationText = annotationText;
	this.url = anchor[0];
	this.ancestorId = anchor[1];
	this.anchorText = anchor[2];
}

exports.main = function() {

	var widget = widgets.Widget({
		id: "toggle-switch",
		label: "Annotator",
		contentURL: data.url("widget/pencil-off.png"),
		contentScriptWhen: 'ready',
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
		annotationList.show();
	});
	
	var selector = pageMod.PageMod({
	  include: ['*'],
	  contentScriptWhen: 'ready',
	  contentScriptFile: [data.url('jquery-1.7.2.min.js'),
	                      data.url('selector.js')],
	  onAttach: function(worker) {
	    worker.postMessage(canEnterAnnotations());
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
		  	handleNewAnnotation(annotationText, this.annotationAnchor);
		    
		    // TODO: this is just for debugging
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
	
	var annotationList = panels.Panel({
		width: 420,
		height: 200,
		contentURL: data.url('list/annotation-list.html'),
		contentScriptFile: [data.url('jquery-1.7.2.min.js'),
							data.url('list/annotation-list.js')],
		contentScriptWhen: 'ready',
		onShow: function() {
			this.postMessage(simpleStorage.storage.annotations);
		},
		onMessage: function(message) {
			require('tabs').open(message)
		}				
		
	});
	
	simpleStorage.on("OverQuota", function() {
		notifications.notify({
			title: 'Storage space exceeded',
			text: 'Removiing recent annotations'
		});
		while (simpleStorage.quotaUsage > 1)
			simpleStorage.storage.annotations.pop();
	});
	
	privateBrowsing.on('start', function() {
		widget.contentURL = data.url('widget/pencil-off.png');
		activateSelectors();
	});
 
	privateBrowsing.on('stop', function() {
		if (canEnterAnnotations()) {
		widget.contentURL = data.url('widget/pencil-on.png');
	activateSelectors();
	}
});
}