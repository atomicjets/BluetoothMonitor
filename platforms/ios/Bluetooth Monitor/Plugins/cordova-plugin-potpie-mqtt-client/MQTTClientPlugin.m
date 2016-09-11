/*
* The MIT License (MIT)
* 
* Copyright (c) 2016 Richard Backhouse
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
* to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
* and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*/

#import "MQTTClientPlugin.h"

@implementation MQTTClientPlugin

- (void)pluginInitialize {
    self.connections = [[NSMutableDictionary alloc] init];
}

- (void)connect:(CDVInvokedUrlCommand*)command {

    NSString* jsonStr = [command.arguments objectAtIndex:0];
    NSError *e;
    NSDictionary *json = [NSJSONSerialization JSONObjectWithData: [jsonStr dataUsingEncoding:NSUTF8StringEncoding]
                                                         options: NSJSONReadingMutableContainers
                                                           error: &e];

	MQTTClientConnection* connection = [[MQTTClientConnection alloc] initWithOptions:[json valueForKey:@"host"]
		port: [[json valueForKey:@"port"] intValue]
		pluginCallbackId : [command.callbackId copy]
		options: [json valueForKey:@"options"]
		plugin: self];
	
	[self.connections setObject:connection forKey:jsonStr];
	
}

- (void)publish:(CDVInvokedUrlCommand*)command {
    NSString* key = [command.arguments objectAtIndex:0];
    NSString* topic = [command.arguments objectAtIndex:1];
    NSString* message = [command.arguments objectAtIndex:2];
    NSString* optionsStr = [command.arguments objectAtIndex:3];
    NSError *e;
    NSDictionary *options = [NSJSONSerialization JSONObjectWithData: [optionsStr dataUsingEncoding:NSUTF8StringEncoding]
                                                         options: NSJSONReadingMutableContainers
                                                           error: &e];
    
    MQTTClientConnection* connection = [self.connections valueForKey:key];
    MQTTQosLevel qos = [[options valueForKey:@"qos"] intValue];
    [connection publish:[message dataUsingEncoding:NSUTF8StringEncoding]
            topic:topic
            retain:[[options valueForKey:@"retain"] boolValue]
            qos:qos];
}

- (void)subscribe:(CDVInvokedUrlCommand*)command {
    NSString* key = [command.arguments objectAtIndex:0];
    NSString* topic = [command.arguments objectAtIndex:1];
    NSString* optionsStr = [command.arguments objectAtIndex:2];
    NSError *e;
    NSDictionary *options = [NSJSONSerialization JSONObjectWithData: [optionsStr dataUsingEncoding:NSUTF8StringEncoding]
                                                         options: NSJSONReadingMutableContainers
                                                           error: &e];
    
    MQTTClientConnection* connection = [self.connections valueForKey:key];
    MQTTQosLevel qos = [[options valueForKey:@"qos"] intValue];
    
    [connection subscribe:topic
        qos:qos
        subscribeCallbackId:[command.callbackId copy]];
}

- (void)unsubscribe:(CDVInvokedUrlCommand*)command {
    NSString* key = [command.arguments objectAtIndex:0];
    NSString* topic = [command.arguments objectAtIndex:1];
    MQTTClientConnection* connection = [self.connections valueForKey:key];
    [connection unsubscribe:topic];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"unsubscribed"];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)end:(CDVInvokedUrlCommand*)command {
    NSString* key = [command.arguments objectAtIndex:0];
    MQTTClientConnection* connection = [self.connections valueForKey:key];
    [connection end];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"closed"];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

@end
