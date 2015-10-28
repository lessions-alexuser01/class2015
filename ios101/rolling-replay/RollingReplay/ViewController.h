//
//  ViewController.h
//  RollingReplay
//
//  Created by Michael Nutt on 4/26/15.
//  Copyright (c) 2015 Michael Nutt. All rights reserved.
//

#import <UIKit/UIKit.h>

#import <AVFoundation/AVFoundation.h>
#import <AVFoundation/AVCaptureSession.h>

@interface ViewController : UIViewController

@property (strong, nonatomic) AVCaptureSession *avsession;
@property (strong, nonatomic) AVCaptureDevice *camera;
@property (weak, nonatomic) IBOutlet UIView *previewView;

@end

