// Copyright (c) 2020 Allan Mobley. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import SignaturePad from 'signature_pad';

window.Blazor.SignaturePad = {
  init: function (instance) {
    window.Blazor.SignaturePad.instance = instance;
    window.Blazor.SignaturePad.self = new SignaturePad(document.getElementById('signature-pad--canvas'));
    window.Blazor.SignaturePad.self.onEnd = OnEndCallBack;
    initEvents();
    resizeCanvas();
  },
  toDataURL: function (type) {
    var dataURL = null;
    switch (type) {
      case 'png':
        dataURL = toDataURL('image/png');
        break;
      case 'svg':
        dataURL = toDataURL('image/svg+xml');
        break;
      case 'jpg':
        dataURL = toDataURL_JPEG();
        break;
      default:
        break;
    }
    return dataURL;
  }
}

const OnEndCallBack = () => {
  window.Blazor.SignaturePad.instance.invokeMethodAsync('OnEnd');
}

const initEvents = () => {
  initResizeEvent();
  initPenClickEvent();
  initClearClickEvent();
  initUndoClickEvent();
  initSaveClickEvent();
}

const toDataURL = (type) => window.Blazor.SignaturePad.self.isEmpty()
  ? null
  : window.Blazor.SignaturePad.self.toDataURL(type)

// JPEG's are a special case.
const toDataURL_JPEG = () => {
  if (window.Blazor.SignaturePad.self.isEmpty()) {
    return null;
  } else {
    // Save current signature.
    var data = window.Blazor.SignaturePad.self.toData();
    // It's necessary to use an opaque background color when saving image as JPEG.
    window.Blazor.SignaturePad.self.backgroundColor = 'rgb(255, 255, 255)';
    // Write signature back against opaque background.
    window.Blazor.SignaturePad.self.fromData(data);
    // Save data url.
    var dataURL = toDataURL('image/jpeg');
    // Reset background to default.
    window.Blazor.SignaturePad.self.backgroundColor = 'rgba(0,0,0,0)';
    // Write signature back against default background.
    window.Blazor.SignaturePad.self.fromData(data);
    // Return signature against opaque background.
    return dataURL;
  }
}

const initResizeEvent = () => {
  window.onresize = resizeCanvas;
}

const initPenClickEvent = () => {
  var pen = document.getElementById('signature-pad--pen');
  if (pen) {
    var penColor = document.getElementById('signature-pad--pen-color');
    // pen.addEventListener('click', function (event) {
    //   penColor.click(); 
    // });
    penColor.addEventListener('change', function (event) {
      window.Blazor.SignaturePad.self.penColor = penColor.value;
    });
  }
}

const initClearClickEvent = () => {
  var clearButton = document.getElementById('signature-pad--clear');
  if (clearButton) {
    clearButton.addEventListener('click', function (event) {
      window.Blazor.SignaturePad.self.clear();
      OnEndCallBack();
    });
  }
}

const initUndoClickEvent = () => {
  var undoButton = document.getElementById('signature-pad--undo');
  if (undoButton) {
    undoButton.addEventListener('click', function (event) {
      var data = window.Blazor.SignaturePad.self.toData();

      if (data) {
        data.pop(); // remove the last dot or line
        window.Blazor.SignaturePad.self.fromData(data);
        OnEndCallBack();
      }
    });
  }
}

const initSaveClickEvent = () => {
  var element = document.querySelector('.signature-pad--save');
  if (element) {
    element.addEventListener('click', function (event) {
      switch (this.id) {
        case 'signature-pad--save-png':
          var dataURL = toDataURL();
          if (dataURL) {
            download(dataURL, 'signature.png');
          }
          break;
        case 'signature-pad--save-jpg':
          var dataURL = toDataURL_JPEG();  // JPEG's are a special case.
          if (dataURL) {
            download(dataURL, 'signature.jpg');
          }
          break;
        case 'signature-pad--save-svg':
          var dataURL = toDataURL('image/svg+xml');
          if (dataURL) {
            download(dataURL, 'signature.svg');
          }
          break;
        default:
          break;
      }
      
    });
  }
}


// Adjust canvas coordinate space taking into account pixel ratio, to make it look crisp on mobile devices.
// This also causes canvas to be cleared.
function resizeCanvas() {

  var canvas = document.getElementById('signature-pad--canvas');

  if (canvas) {
    // Store signature in memory before resizing so as not to lose it.
    var data = window.Blazor.SignaturePad.self.toData();

    // When zoomed out to less than 100%, for some very strange reason,
    // some browsers report devicePixelRatio as less than 1
    // and only part of the canvas is cleared then.
    var ratio = Math.max(window.devicePixelRatio || 1, 1);

    

    // This part causes the canvas to be cleared
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);

    // This library does not listen for canvas changes, so after the canvas is automatically
    // cleared by the browser, SignaturePad#isEmpty might still return false, even though the
    // canvas looks empty, because the internal data of this library wasn't cleared. To make sure
    // that the state of this library is consistent with visual state of the canvas, you
    // have to clear it manually.
    window.Blazor.SignaturePad.self.clear();

    // Write signature back.
    window.Blazor.SignaturePad.self.fromData(data);
  }
}

function download(dataURL, filename) {
  var blob = dataURLToBlob(dataURL);
  var url = window.URL.createObjectURL(blob);

  var a = document.createElement('a');
  a.style = 'display: none';
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  window.URL.revokeObjectURL(url);
}

// One could simply use Canvas#toBlob method instead, but it's just to show
// that it can be done using result of SignaturePad#toDataURL.
function dataURLToBlob(dataURL) {
  // Code taken from https://github.com/ebidel/filer.js
  var parts = dataURL.split(';base64,');
  var contentType = parts[0].split(':')[1];
  var raw = window.atob(parts[1]);
  var rawLength = raw.length;
  var uInt8Array = new Uint8Array(rawLength);

  for (var i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}