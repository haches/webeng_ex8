const widgets = require("widget");
const tabs = require("tabs");

var widget = widgets.Widget({
  id: "jquery-link",
  label: "jQuery website",
  contentURL: "http://www.jquery.com/favicon.ico",
  onClick: function() {
    tabs.open("http://www.jquery.org/");
  }
});

console.log("The add-on is running.");
