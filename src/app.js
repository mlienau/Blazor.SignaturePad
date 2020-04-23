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
  init: function (instance, options) {
    window.Mobsites.Blazor.SignaturePad.instance = instance;
    window.Mobsites.Blazor.SignaturePad.options = options;
    if (!window.Mobsites.Blazor.SignaturePad.initialized || window.Mobsites.Blazor.SignaturePad.options.destroy) {
      window.Mobsites.Blazor.SignaturePad.self = new SignaturePad(document.getElementById('signature-pad--canvas'));
      window.Mobsites.Blazor.SignaturePad.self.onEnd = this.signatureChanged;
      window.Mobsites.Blazor.SignaturePad.initialized = true;
      this.initResizeEvent();
      this.resizeCanvas();
    }
    if (window.Mobsites.Blazor.SignaturePad.options.color && window.Mobsites.Blazor.SignaturePad.self)
    {
      window.Mobsites.Blazor.SignaturePad.self.penColor = window.Mobsites.Blazor.SignaturePad.options.color;
    }
    return window.Mobsites.Blazor.SignaturePad.initialized;
  },
  refresh: function (instance, options) {
    return this.init(instance, options);
  },
  initResizeEvent: function () {
    window.addEventListener('resize', this.resizeCanvas);
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
  signatureChanged: function () {
    window.Mobsites.Blazor.SignaturePad.instance.invokeMethodAsync('SignatureChanged');
  },
  changeColor: function (color) {
    window.Mobsites.Blazor.SignaturePad.self.penColor = color;
  },
  clear: function () {
    window.Mobsites.Blazor.SignaturePad.self.clear();
    window.Mobsites.Blazor.SignaturePad.signatureChanged();
  },
  undo: function () {
    var data = window.Mobsites.Blazor.SignaturePad.self.toData();
    if (data) {
      data.pop(); // remove the last dot or line
      window.Mobsites.Blazor.SignaturePad.self.fromData(data);
      window.Mobsites.Blazor.SignaturePad.signatureChanged();
    }
  },
  save: function (saveAsType) {
    switch (saveAsType) {
      case 'png':
        var dataURL = window.Mobsites.Blazor.SignaturePad.self.toDataURL();
        if (dataURL) {
          window.Mobsites.Blazor.SignaturePad.download(dataURL, 'signature.png');
        }
        break;
      case 'jpg':
        // JPEG's are a special case.
        var dataURL = window.Mobsites.Blazor.SignaturePad.toDataURL_JPEG();
        if (dataURL) {
          window.Mobsites.Blazor.SignaturePad.download(dataURL, 'signature.jpg');
        }
        break;
      case 'svg':
        var dataURL = window.Mobsites.Blazor.SignaturePad.self.toDataURL('image/svg+xml');
        if (dataURL) {
          window.Mobsites.Blazor.SignaturePad.download(dataURL, 'signature.svg');
        }
        break;
      default:
        break;
    }
  },
  resizeCanvas: function () {
    // Prevent window.resize event from double firing.
    clearTimeout(window.Mobsites.Blazor.SignaturePad.timeoutId);
    // Delay the resize handling by 200ms
    window.Mobsites.Blazor.SignaturePad.timeoutId = setTimeout(() => {
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
    }, 200);
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
  getDataSize: function (type) {
    var dataURL = this.toDataURL(type);
    if (dataURL == null) {
        return 0;
    }
    var dataSize = dataURL.length;
    return dataSize;
    },
  receiveSegment: function (segmentNumber, type) {
    var dataURL = this.toDataURL(type);
    var index = segmentNumber * 24576;
    return this.getNextChunk(dataURL, index);
    },
  getNextChunk: function (dataURL, index) {
    const length = dataURL.length - index <= 24576 ? dataURL.length - index : 24576;
    const chunk = dataURL.substring(index, index + length);
    index += length;
    return chunk;
    }
}

