(function() 
{
    const Broker = require( 'mosca' );
    const Listener = require( 'Listener' );

    class MqttBroker
    {
        constructor(name, deps)
        {
            deps.logger.debug( 'MQTT broker plugin loaded!' );

            this.globalBus  = deps.globalEventLoop;   // This is the server-side messaging bus. The MCU sends messages to server plugins over this
            this.cockpitBus = deps.cockpit;           // This is the server<->client messaging bus. This is how the server talks to the browser

            this.hasSaidHello = false;

            var self = this;
            
            // Mosca objects
            this.broker = {};
            this.moscaSettings = {
                host: '0.0.0.0',
                port: 1883,
                logger: {
                  childOf: deps.logger
                },
                http: {
                  port: 3000,
                  bundle: true, // serve the bundled mqtt client
                  static: './',
                  stats: true // publish the stats every 10s
                }
            };

            // Pre-define all of the event listeners here. We defer enabling them until later.
            // Look at src/libs/Listener.js to see how these work.
            this.listeners = 
            {
                // Listener for Settings updates
                settings: new Listener( self.globalBus, 'settings-change.mqtt-broker', true, function( settings )
                {
                    // Apply settings
                    self.settings = settings.mqtt-broker;

                    // Emit settings update to cockpit
                    self.cockpitBus.emit( 'plugin.mqtt-broker.settingsChange', self.settings );
                }),

                // Listener for MCU status messages
                mcuStatus: new Listener( self.globalBus, 'mcu.status', false, function( data )
                {
                    // Check for the mqtt-broker field name in the MCU's status update
                    if( 'mqtt-broker' in data ) 
                    {
                        // Get the message that the MCU sent to us
                        var message = data.mqtt-broker;

                        // Re-emit the message on the cockpit messaging bus (talks to the browser)
                        self.cockpitBus.emit( 'plugin.mqtt-broker.message', message );
                    }
                }),

                sayHello: new Listener( self.cockpitBus, 'plugin.mqtt-broker.sayHello', false, function( powerIn )
                {
                    var command;

                    // Create a command in the format "command( parameters )"
                    if( self.hasSaidHello )
                    {
                      command = 'ex_hello(' + 0 + ')';
                      self.hasSaidHello = false;
                    }
                    else
                    {
                      command = 'ex_hello(' + 1 + ')';
                      self.hasSaidHello = true;
                    }
                    
                    // Send command to mcu
                    self.globalBus.emit( 'mcu.SendCommand', command );
                })
            }
        }
        
        // This is automatically called when cockpit loads all of the plugins, and when a plugin is enabled
        start()
        {
          // Enable the listeners!
          this.listeners.settings.enable();
          this.listeners.mcuStatus.enable();
          this.listeners.sayHello.enable();

          // Start the mosca MQTT and websocket servers
          this.broker = new Broker.Server(this.moscaSettings);
          this.broker.on('ready', () => {
            deps.logger.debug('MQTT: Servers ready for connections');
          });

          this.broker.on('clientConnected', (client) => {
            deps.logger.debug(`MQTT: Client ${client} connected`);
          });
          this.broker.on('clientDisconnecting', (client) => {
            deps.logger.debug(`MQTT: Client ${client} disconnecting`);
          });
          this.broker.on('clientDisconnected', (client) => {
            deps.logger.debug(`MQTT: Client ${client} disconnected`);
          });
          this.broker.on('clientError', (err, client) => {
            deps.logger.debug(`MQTT: Client ${client} error ${err}`);
          });
          this.broker.on('published', (packet, client) => {
            deps.logger.debug(`MQTT: Client ${client} published packet ${packet}`);
          });
          this.broker.on('subscribed', (topic, client) => {
            deps.logger.debug(`MQTT: Client ${client} subscribed to topic ${topic}`);
          });
          this.broker.on('unsubscribed', (topic, client) => {
            deps.logger.debug(`MQTT: Client ${client} unsubscribed from topic ${topic}`);
          });

        }

        // This is called when the plugin is disabled
        stop()
        {
          // Disable listeners
          this.listeners.settings.disable();
          this.listeners.mcuStatus.disable();
          this.listeners.sayHello.disable();
          
          // Stop Mosca servers
          this.broker.close(() => {
            deps.logger.debug('Mosca MQTT and websocket servers closed');
          });
        }

        // This is used to define user settings for the plugin. We populated some example properties below.
        // The UI for changing the settings is automatically generated in the Settings applet.
        getSettingSchema()
        {
            //from http://json-schema.org/examples.html
            return [{
                'title': 'MQTT Broker Plugin',
                'type': 'object',
                'id': 'mqtt-broker',
                'properties': {
                  'firstName': {
                    'type': 'string',
                    'default': 'Open'
                  },
                  'lastName': {
                    'type': 'string',
                    'default': 'Rov'
                  },
                  'age': {
                    'description': 'Age in years',
                    'type': 'integer',
                    'minimum': 0
                  }
                },
                'required': [
                  'firstName',
                  'lastName'
                ]
            }];
        }
    }

    module.exports = function(name, deps) 
    {
        return new MqttBroker(name, deps);
    };
}());