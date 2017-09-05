(function(window) 
{
    'use strict';
    class MqttBroker 
    {
        constructor( cockpit )
        {
            console.log('MqttBroker Plugin running');

            var self = this;
            self.cockpit = cockpit;

            self.settings = null;     // These get sent by the local model

            //Set up actions associated with this plugin
            this.actions = 
            {
                "plugin.mqtt-broker.sayHello":
                {
                    description: "Say Hello!",
                    controls:
                    {
                        button:
                        {
                            down: function() {
                                cockpit.emit('plugin.mqtt-broker.sayHello');
                            }
                        }
                    }
                }
            };

            // Setup input handlers
            this.inputDefaults =
            {
                keyboard:
                {
                    "alt+0": { type: "button",
                               action: "plugin.mqtt-broker.sayHello"}
                }
            };
        };

        sayHello()
        {
          // Send the sayHello command to the node plugin
          this.cockpit.rov.emit( 'plugin.mqtt-broker.sayHello' );
        }

        getTelemetryDefinitions()
        {
            return [{
                name: 'mqtt-broker.message',
                description: 'The message sent from the mqtt-broker module in the MCU'
            }]
        };

        // This pattern will hook events in the cockpit and pull them all back
        // so that the reference to this instance is available for further processing
        listen() 
        {
            var self = this;

            // Listen for settings from the node plugin
            this.cockpit.rov.withHistory.on('plugin.mqtt-broker.settingsChange', function(settings)
            {
                // Copy settings
                self.settings = settings;

                // Re-emit on cockpit
                self.cockpit.emit( 'plugin.mqtt-broker.settingsChange', settings );
            });

            // Listen for response messages from the Node plugin
            this.cockpit.rov.withHistory.on('plugin.mqtt-broker.message', function( message )
            {
                // Log the message!
                console.log( "MqttBroker Plugin says: " + message );

                // Rebroadcast for other plugins and widgets in the browser
                self.cockpit.emit( 'plugin.mqtt-broker.message', message );
            });

            // Listen for sayHello requests from other plugins and widgets
            this.cockpit.on('plugin.mqtt-broker.sayHello', function()
            {
                self.sayHello();
            });
        };
    };

    // Add plugin to the window object and add it to the plugins list
    var plugins = namespace('plugins');
    plugins.MqttBroker = MqttBroker;
    window.Cockpit.plugins.push( plugins.MqttBroker );

}(window));