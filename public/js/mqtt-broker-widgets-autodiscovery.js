/*
  Running this within a function prevents leaking variables
  in to the global namespace.
*/
(function (window) {
  'use strict';
  var widgets = namespace('widgets');
  widgets['orov-mqtt-broker'] = {
    name: 'orov-mqtt-broker',
    defaultUISymantic: 'data-control-unit',
    url: 'mqtt-broker/mqtt-broker.html'
  };
}  // The line below both ends the anonymous function and then calls
   // it passing in the required depenencies.
(window));