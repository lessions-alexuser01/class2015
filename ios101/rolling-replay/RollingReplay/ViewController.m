//
//  ViewController.m
//  RollingReplay
//
//  Created by Michael Nutt on 4/26/15.
//  Copyright (c) 2015 Michael Nutt. All rights reserved.
//

#import "ViewController.h"

@interface ViewController ()

@end

@implementation ViewController

@synthesize avsession;
@synthesize camera;

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view, typically from a nib.
    
    //----- SHOW LIVE CAMERA PREVIEW -----
    avsession = [[AVCaptureSession alloc] init];
    avsession.sessionPreset = AVCaptureSessionPresetMedium;
    
    CALayer *viewLayer = self.previewView.layer;
    NSLog(@"viewLayer = %@", viewLayer);
    
    AVCaptureVideoPreviewLayer *captureVideoPreviewLayer = [[AVCaptureVideoPreviewLayer alloc] initWithSession:avsession];
    
    //captureVideoPreviewLayer.frame = CGRectMake(self.previewView.frame.origin.x, self.previewView.frame.origin.y - 100, self.previewView.frame.size.width, self.previewView.frame.size.height + 200);
    [self.previewView.layer addSublayer:captureVideoPreviewLayer];
    
    // Get all cameras in the application and find the frontal camera
    NSArray *allCameras = [AVCaptureDevice devicesWithMediaType:AVMediaTypeVideo];
    
    NSLog(@"%d", allCameras.count);
    // Find the back camera.
    for ( int i = 0; i < allCameras.count; i++ ) {
        AVCaptureDevice *_camera = [allCameras objectAtIndex:i];
        
        if ( _camera.position == AVCaptureDevicePositionBack ) {
            camera = _camera;
        }
    }
    
    if ( camera != nil ) {
        NSError *error = nil;
        AVCaptureDeviceInput *input = [AVCaptureDeviceInput deviceInputWithDevice:camera error:&error];
        if (!input) {
            // Handle the error appropriately.
            NSLog(@"ERROR: trying to open camera: %@", error);
        }
        [avsession addInput:input];
        
        [avsession startRunning];
    }

}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

@end
