/** 
 * This file has the code for:
 */

// get the DOM element named "annotation-box" and store it
var textArea = document.getElementById('annotation-box');

// define the action for the "onkeyup" event of the textArea
textArea.onkeyup = function(event) {
	// check for the return key
	if (event.keyCode == 13) {
		
		// send content of textArea to the add-on
		self.postMessage(textArea.value);
		
		// empty the textArea
		textArea.value = '';	
	}
};

// handle a message from the add-on code by giving the text area focus
self.on('message', function(){
	var textArea = document.getElementById('annotation-box');
	textArea.value = '';
	textArea.focus();
});