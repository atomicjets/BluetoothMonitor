#import <Cordova/CDV.h>
#import "MQTTTransport.h"
#import "MQTTCFSocketTransport.h"
#import "MQTTClientConnection.h"

@implementation MQTTClientConnection

- (id)initWithOptions:(NSString*) host
                 port:(NSInteger) port
     pluginCallbackId:(NSString*) pluginCallbackId
              options:(NSDictionary*) options
               plugin:(CDVPlugin*) plugin {

	self.pluginCallbackId = pluginCallbackId;
	self.plugin = plugin;
	
	MQTTCFSocketTransport *transport = [[MQTTCFSocketTransport alloc] init];
    transport.host = host;
    transport.port = port;
    transport.tls = [[options valueForKey:@"tls"] boolValue];
    
    if (transport.tls && [options objectForKey:@"certfile"] && [options objectForKey:@"certpwd"]) {
    	NSString *path = nil;
    	if ([options objectForKey:@"certpath"]) {
    		path = [[NSBundle mainBundle] pathForResource:[options valueForKey:@"certfile"] ofType:@"p12" inDirectory:[options valueForKey:@"certpath"]];
    	} else {
			NSString *libPath = [NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES) objectAtIndex:0];
			NSString *libPathNoSync = [libPath stringByAppendingPathComponent:@"NoCloud"];
			path = [libPathNoSync stringByAppendingPathComponent:@"cert.p12"];
    	}
    	transport.certificates = [MQTTCFSocketTransport clientCertsFromP12:path passphrase:[options valueForKey:@"certpwd"]];
	}
    
	self.session = [[MQTTSession alloc] init];
	self.session.keepAliveInterval = [[options valueForKey:@"keepalive"] intValue];
	self.session.clientId = [options valueForKey:@"clientId"];
	self.session.cleanSessionFlag = [[options valueForKey:@"clean"] boolValue];
	
	if ([options objectForKey:@"will"]) {
		NSDictionary* will = [options valueForKey:@"will"];
		self.session.willFlag = true;
		self.session.willMsg = [[will valueForKey:@"payload"] dataUsingEncoding:NSUTF8StringEncoding];
		self.session.willTopic = [will valueForKey:@"topic"];
		self.session.willRetainFlag = [[will valueForKey:@"retain"] boolValue];
		self.session.willQoS = [[will valueForKey:@"qos"] intValue];
	}
	if ([options objectForKey:@"username"] && [options objectForKey:@"password"]) {
		self.session.userName = [options valueForKey:@"username"];
		self.session.password = [options valueForKey:@"password"];
	}
    self.session.transport = transport;
	self.session.delegate = self;
	
	[self.session connectWithConnectHandler:^(NSError *error) {
 		if (error) {
			NSDictionary *jsonObj = [[NSDictionary alloc]
									 initWithObjectsAndKeys :
									 @"error", @"event",
									 error.localizedDescription, @"error",
									 nil];
			CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:jsonObj];
			[pluginResult setKeepCallbackAsBool:true];
			[self.plugin.commandDelegate sendPluginResult:pluginResult callbackId:self.pluginCallbackId];
		} else {
			NSDictionary *jsonObj = [[NSDictionary alloc]
									 initWithObjectsAndKeys :
									 @"connect", @"event",
									 nil];
			CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:jsonObj];
			[pluginResult setKeepCallbackAsBool:true];
			[self.plugin.commandDelegate sendPluginResult:pluginResult callbackId:self.pluginCallbackId];
		}
 	}];
    return self;
}

- (void)handleEvent:(MQTTSession *)session event:(MQTTSessionEvent)eventCode error:(NSError *)error {
    switch (eventCode) {
        case MQTTSessionEventConnected: {
            break;
        }
        case MQTTSessionEventConnectionClosed:
        case MQTTSessionEventConnectionClosedByBroker: {
			NSDictionary *jsonObj = [[NSDictionary alloc]
									 initWithObjectsAndKeys :
									 @"close", @"event",
									 nil];
			CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:jsonObj];
			[pluginResult setKeepCallbackAsBool:true];
			[self.plugin.commandDelegate sendPluginResult:pluginResult callbackId:self.pluginCallbackId];
            break;
        }
        case MQTTSessionEventProtocolError:
        case MQTTSessionEventConnectionRefused:
        case MQTTSessionEventConnectionError: {
			NSDictionary *jsonObj = [[NSDictionary alloc]
									 initWithObjectsAndKeys :
									 @"error", @"event",
									 error.localizedDescription, @"error",
									 nil];
			CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:jsonObj];
			[pluginResult setKeepCallbackAsBool:true];
			[self.plugin.commandDelegate sendPluginResult:pluginResult callbackId:self.pluginCallbackId];
            break;
        }
        default:
            break;
    }
}

- (void)newMessage:(MQTTSession *)session data:(NSData *)data onTopic:(NSString *)topic qos:(MQTTQosLevel)qos retained:(BOOL)retained mid:(unsigned int)mid {
	NSString *dataString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
	NSDictionary *jsonObj = [[NSDictionary alloc]
							 initWithObjectsAndKeys :
							 @"message", @"event",
							 topic, @"topic",
							 dataString, @"message",
							 nil];
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:jsonObj];
    [pluginResult setKeepCallbackAsBool:true];
    [self.plugin.commandDelegate sendPluginResult:pluginResult callbackId:self.pluginCallbackId];
}

- (void)publish:(NSData *)data
          topic: (NSString*) topic
         retain:(BOOL)retainFlag
            qos:(MQTTQosLevel)qos {
	[self.session publishData:data onTopic:topic retain:retainFlag qos:qos];
}

- (void)subscribe:(NSString*) topic
              qos:(MQTTQosLevel)qosLevel
    subscribeCallbackId:(NSString*) subscribeCallbackId {
	[self.session subscribeToTopic:topic atLevel:qosLevel subscribeHandler:^(NSError *error, NSArray<NSNumber *> *gQoss) {
		if (!error) {
			CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
			[self.plugin.commandDelegate sendPluginResult:pluginResult callbackId:subscribeCallbackId];
		} else {
			NSDictionary *jsonObj = [[NSDictionary alloc]
									 initWithObjectsAndKeys :
									 @"error", @"event",
									 error.localizedDescription, @"error",
									 nil];
			CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:jsonObj];
			[pluginResult setKeepCallbackAsBool:true];
			[self.plugin.commandDelegate sendPluginResult:pluginResult callbackId:self.pluginCallbackId];
		}
	}];
}

- (void)unsubscribe : (NSString*) topic {
	[self.session unsubscribeTopic:topic];
}

- (void)end {
	[self.session close];
}


@end
