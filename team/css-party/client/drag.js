var lastElem;

function getScroll () {
    var doc = document;
    var doc_elem = doc.documentElement;
    var body = doc.body;
    var left = (doc_elem && doc_elem.scrollLeft) || (body && body.scrollLeft) || 0;
    var top = (doc_elem && doc_elem.scrollTop) || (body && body.scrollTop) || 0;

    return [left, top];
}

function dragOver (event) {
  event.preventDefault();
  return false;
}

function drop (event) {
  var orig = event.dataTransfer.getData("text/plain").split(',');
  var delta = [
    event.clientX - parseInt(orig[0], 10),
    event.clientY - parseInt(orig[1], 10)
  ];

  lastElem.style.left = (parseInt(lastElem.style.left, 10) + delta[0]) + 'px';
  lastElem.style.top = (parseInt(lastElem.style.top, 10) + delta[1]) + 'px';

  event.preventDefault();
  return false;
}

function dragStart (elem, event) {
  lastElem = elem;

  event.dataTransfer.setData(
    "text/plain",
    event.clientX + ',' + event.clientY
  );
}

module.exports.setup = function setupDrag () {
  var body = document.body;
  body.addEventListener('dragover', dragOver, false);
  body.addEventListener('drop', function (event) { drop(event); }, false);
};

module.exports.makeDraggable = function makeDraggable (elem) {
  if (elem.getAttribute('draggable')) { return; }

  elem.setAttribute('draggable', true);
  elem.addEventListener('dragstart', function (event) { dragStart(elem, event); }, false);
};
