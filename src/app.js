// Copyright (c) 2020 Allan Mobley. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import SignaturePad from 'signature_pad';

if (!window.Mobsites) {
  window.Mobsites = {
    Blazor: {

    }
  };
}

window.Mobsites.Blazor.SignaturePad = {
  init: function (options, instance) {
    window.Mobsites.Blazor.SignaturePad.options = options;
    window.Mobsites.Blazor.SignaturePad.instance = instance;
    window.Mobsites.Blazor.SignaturePad.self = new SignaturePad(document.getElementById('signature-pad--canvas'));
    window.Mobsites.Blazor.SignaturePad.self.onEnd = this.onEndCallBack;
    this.initEvents();
    this.resizeCanvas();
  },
  refresh: function (options) {
    return this.init(options);
  },
  initEvents: function () {
    window.onresize = this.resizeCanvas;

    var penColor = document.getElementById('signature-pad--pen-color');
    if (penColor) {
      penColor.addEventListener('change', this.penColorChangeEvent);
    }

    var clearButton = document.getElementById('signature-pad--clear');
    if (clearButton) {
      clearButton.addEventListener('click', this.clearClickEvent);
    }

    var undoButton = document.getElementById('signature-pad--undo');
    if (undoButton) {
      undoButton.addEventListener('click', this.undoClickEvent);
    }

    var saveButton = document.querySelector('.signature-pad--save');
    if (saveButton) {
      saveButton.addEventListener('click', this.saveClickEvent);
    }
  },
  toDataURL: function (type) {
    var dataURL = null;
    if (!window.Mobsites.Blazor.SignaturePad.self.isEmpty()) {
      switch (type) {
        case 'png':
          dataURL = window.Mobsites.Blazor.SignaturePad.self.toDataURL('image/png');
          break;
        case 'svg':
          dataURL = window.Mobsites.Blazor.SignaturePad.self.toDataURL('image/svg+xml');
          break;
        case 'jpg':
          // JPEG's are a special case.
          dataURL = window.Mobsites.Blazor.SignaturePad.toDataURL_JPEG();
          break;
        default:
          break;
      }
    }
    return dataURL;
  },
  toDataURL_JPEG: function () {
    // Save current signature.
    var data = window.Mobsites.Blazor.SignaturePad.self.toData();
    // It's necessary to use an opaque background color when saving image as JPEG.
    window.Mobsites.Blazor.SignaturePad.self.backgroundColor = 'rgb(255, 255, 255)';
    // Write signature back against opaque background.
    window.Mobsites.Blazor.SignaturePad.self.fromData(data);
    // Save data url.
    var dataURL = window.Mobsites.Blazor.SignaturePad.self.toDataURL('image/jpeg');
    // Reset background to default.
    window.Mobsites.Blazor.SignaturePad.self.backgroundColor = 'rgba(0,0,0,0)';
    // Write signature back against default background.
    window.Mobsites.Blazor.SignaturePad.self.fromData(data);
    // Return signature against opaque background.
    return dataURL;
  },
  onEndCallBack: function () {
    window.Mobsites.Blazor.SignaturePad.instance.invokeMethodAsync('OnEnd');
  },
  resizeCanvas: function () {
    var canvas = document.getElementById('signature-pad--canvas');
    if (canvas) {
      // Store signature in memory before resizing so as not to lose it.
      var data = window.Mobsites.Blazor.SignaturePad.self.toData();

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
      window.Mobsites.Blazor.SignaturePad.self.clear();

      // Write signature back.
      window.Mobsites.Blazor.SignaturePad.self.fromData(data);
    }
  },
  penColorChangeEvent: function () {
    window.Mobsites.Blazor.SignaturePad.self.penColor = document.getElementById('signature-pad--pen-color').value;
  },
  clearClickEvent: function () {
    window.Mobsites.Blazor.SignaturePad.self.clear();
    window.Mobsites.Blazor.SignaturePad.onEndCallBack();
  },
  undoClickEvent: function () {
    var data = window.Mobsites.Blazor.SignaturePad.self.toData();
    if (data) {
      data.pop(); // remove the last dot or line
      window.Mobsites.Blazor.SignaturePad.self.fromData(data);
      window.Mobsites.Blazor.SignaturePad.onEndCallBack();
    }
  },
  saveClickEvent: function () {
    switch (this.id) {
      case 'signature-pad--save-png':
        var dataURL = window.Mobsites.Blazor.SignaturePad.self.toDataURL();
        if (dataURL) {
          window.Mobsites.Blazor.SignaturePad.download(dataURL, 'signature.png');
        }
        break;
      case 'signature-pad--save-jpg':
        // JPEG's are a special case.
        var dataURL = window.Mobsites.Blazor.SignaturePad.toDataURL_JPEG();
        if (dataURL) {
          window.Mobsites.Blazor.SignaturePad.download(dataURL, 'signature.jpg');
        }
        break;
      case 'signature-pad--save-svg':
        var dataURL = window.Mobsites.Blazor.SignaturePad.self.toDataURL('image/svg+xml');
        if (dataURL) {
          window.Mobsites.Blazor.SignaturePad.download(dataURL, 'signature.svg');
        }
        break;
      default:
        break;
    }
  },
  download: function (dataURL, filename) {
    var a = document.createElement('a');
    a.style = 'display: none';
    a.href = dataURL;
    a.download = filename;
    a.target = '_blank'
    document.body.appendChild(a);
    a.click();
  },
}