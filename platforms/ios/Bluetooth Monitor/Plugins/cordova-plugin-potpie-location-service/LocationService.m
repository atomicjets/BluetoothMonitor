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
#import "LocationService.h"

@implementation LocationService

- (void)pluginInitialize {
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onPause) name:UIApplicationDidEnterBackgroundNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onResume) name:UIApplicationWillEnterForegroundNotification object:nil];

	if ([CLLocationManager locationServicesEnabled]) {
		self.locationManager = [[CLLocationManager alloc] init];
		self.locationManager.delegate = self;
		self.locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation;
		self.locationManager.distanceFilter = 50;
		self.locationManager.activityType = CLActivityTypeAutomotiveNavigation;
		[self.locationManager requestAlwaysAuthorization];
        [self.locationManager setAllowsBackgroundLocationUpdates:YES];
		[self.locationManager startUpdatingLocation];
		NSLog(@"initialized\n");
	}
}

- (void) onPause {
	self.inBackground = true;
	if ([CLLocationManager locationServicesEnabled]) {
		[self.locationManager stopUpdatingLocation];
		[self.locationManager startMonitoringSignificantLocationChanges];
	}
}

- (void) onResume {
	self.inBackground = false;
	if ([CLLocationManager locationServicesEnabled]) {
		[self.locationManager stopMonitoringSignificantLocationChanges];
		[self.locationManager startUpdatingLocation];
	}
}

- (void)listen:(CDVInvokedUrlCommand*)command {
	if ([CLLocationManager locationServicesEnabled]) {
		self.listenCommand = command;
		[self.locationManager stopUpdatingLocation];
		[self.locationManager startUpdatingLocation];
		NSLog(@"listening\n");
	}
}

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray *)locations {
	CLLocation *newLocation = [locations lastObject];
	/*
	NSLog(@"latitude %+.6f, longitude %+.6f\n",              
      	newLocation.coordinate.latitude,
		newLocation.coordinate.longitude);
	*/	
	if (self.listenCommand != nil) {
        NSMutableDictionary *jsonObj = [NSMutableDictionary dictionaryWithCapacity:8];
        NSNumber* timestamp = [NSNumber numberWithDouble:([newLocation.timestamp timeIntervalSince1970] * 1000)];
        [jsonObj setObject:timestamp forKey:@"timestamp"];
        [jsonObj setObject:[NSNumber numberWithDouble:newLocation.speed] forKey:@"velocity"];
        [jsonObj setObject:[NSNumber numberWithDouble:newLocation.verticalAccuracy] forKey:@"altitudeAccuracy"];
        [jsonObj setObject:[NSNumber numberWithDouble:newLocation.horizontalAccuracy] forKey:@"accuracy"];
        [jsonObj setObject:[NSNumber numberWithDouble:newLocation.course] forKey:@"heading"];
        [jsonObj setObject:[NSNumber numberWithDouble:newLocation.altitude] forKey:@"altitude"];
        [jsonObj setObject:[NSNumber numberWithDouble:newLocation.coordinate.latitude] forKey:@"latitude"];
        [jsonObj setObject:[NSNumber numberWithDouble:newLocation.coordinate.longitude] forKey:@"longitude"];
        [jsonObj setObject:[NSNumber numberWithBool:self.inBackground] forKey:@"inBackground"];
        		
        CDVPluginResult *pluginResult = [CDVPluginResult
                                         resultWithStatus : CDVCommandStatus_OK
                                         messageAsDictionary : jsonObj];
        [pluginResult setKeepCallbackAsBool:true];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.listenCommand.callbackId];
	}
}

- (void)locationManager:(CLLocationManager *)manager
       didFailWithError:(NSError *)error {
       
}

@end