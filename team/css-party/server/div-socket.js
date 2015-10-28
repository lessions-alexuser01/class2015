var Minipipe = require('minipipe');

function ObjSocket (db) {
  this.db = db;
  this.minipipe = new Minipipe(this.receive.bind(this));
  this.errorpipe = new Minipipe();
}

ObjSocket.prototype.receive = function (msg) {
  var self = this;
  var divs = this.db.divs;
  var images = this.db.images;

  if (!msg) { return; }

  switch (msg.cmd) {
  case 'patch':
    divs.patch(msg.type, msg.key, msg.val);
    break;

  case 'patchesSince':
    divs.getPatchesSince(msg.rev, function (err, items) {
      if (err) {
        self.errorpipe.emit(err);
        return;
      }

      if (items && items.length) {
        self.minipipe.emit({
          type: 'patches',
          items: items
        });
      }
    });
    break;

  case 'saveChanges':
    try {
      self.db.setDivs(msg.key, msg.changes);
    }
    catch (e) {
      console.error('Failed saving changes:', e.message);
      self.minipipe.emit({
        type: 'saveFail',
        error: e.message
      });
    }
    break;

  case 'saveImage':
    try {
      self.db.setImage(msg.key, msg.i, msg.img);
    }
    catch (e) {
      console.error('Failed saving image:', e.message);
      self.minipipe.emit({
        type: 'saveFail',
        error: e.message
      });
    }
    break;

  default:
    this.errorpipe.emit(new Error('unknown cmd', msg));
  }
};

ObjSocket.prototype.connect = function (inpipe) {
  this.minipipe.to(inpipe);
};

ObjSocket.prototype.setup = function () {
  var divs = this.db.divs;

  // send a refresh to begin
  this.minipipe.emit({
    type: 'refresh',
    state: divs.getState(),
    rev: divs.getHeadRev()
  });
};

module.exports = ObjSocket;
