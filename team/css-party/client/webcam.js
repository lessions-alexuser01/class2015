
var getUserMedia = require('getusermedia');
var attachMediaStream = require('attachmediastream');

function getVideoSnapshotData (videoElem, scale) {
  var canvasElem = document.createElement('canvas');
  var context = canvasElem.getContext('2d');
  var w = videoElem.videoWidth;
  var h = videoElem.videoHeight;

  canvasElem.width = w * scale;
  canvasElem.height = h * scale;

  context.drawImage(
    videoElem,
    0, 0, w, h,
    0, 0, w * scale, h * scale);

  return canvasElem.toDataURL('image/jpg');
}

function createVideoElem () {
  var videoElem = document.createElement('video');
  videoElem.width = 200;

  return videoElem;
}

module.exports = function activateWebcam (videoElem, cb) {
  getUserMedia({video: true, audio: false}, function (err, stream) {
    if (err) {
      return cb(new Error('getUserMedia failed'));
    }

    attachMediaStream(stream, videoElem, {
      mirror: true
    });

    var takeSnapshot = function () {
      var img = new Image();

      // calculate the scale needed to make the snapshot the correct size
      var scale = videoElem.width / videoElem.videoWidth;
      img.src = getVideoSnapshotData(videoElem, scale);
      return img;
    };

    var controller = {
      videoElem: videoElem,
      takeSnapshot: takeSnapshot,
      stop: function () {
        stream.stop();
      }
    };

    cb(null, controller);
  });
};

module.exports.createVideoElem = createVideoElem;
