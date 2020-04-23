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
        this.instance = instance;
        this.options = options;
        if (!this.initialized || this.options.destroy) {
            this.self = new SignaturePad(document.getElementById('signature-pad--canvas'));
            this.self.onEnd = this.signatureChanged;
            this.initialized = true;
            this.initResizeEvent();
            this.resizeCanvas();
        }
        if (this.options.color) {
            this.self.penColor = this.options.color;
        }
        this.instance.invokeMethodAsync('RestoreSignatureState');
        return this.initialized;
    },
    refresh: function (instance, options) {
        return this.init(instance, options);
    },
    initResizeEvent: function () {
        window.addEventListener('resize', this.resizeCanvas);
    },
    toDataURL: function (type) {
        var dataURL = null;
        if (!this.self.isEmpty()) {
            switch (type) {
                case 'png':
                    dataURL = this.self.toDataURL('image/png');
                    break;
                case 'svg':
                    dataURL = this.self.toDataURL('image/svg+xml');
                    break;
                case 'jpg':
                    // JPEG's are a special case.
                    dataURL = this.toDataURL_JPEG();
                    break;
                default:
                    break;
            }
        }
        return dataURL;
    },
    toDataURL_JPEG: function () {
        // Save current signature.
        var data = this.self.toData();
        // It's necessary to use an opaque background color 
        // when saving image as JPEG and not in dark mode.
        if (this.options.contrastMode && this.options.contrastMode != 1)
        {
            this.self.backgroundColor = 'rgb(255, 255, 255)';
        }
        // Write signature back against opaque background.
        this.self.fromData(data);
        // Save data url.
        var dataURL = this.self.toDataURL('image/jpeg');
        // Reset background to default.
        this.self.backgroundColor = 'rgba(0,0,0,0)';
        // Write signature back against default background.
        this.self.fromData(data);
        // Return signature against opaque background.
        return dataURL;
    },
    signatureChanged: function () {
        window.Mobsites.Blazor.SignaturePad.instance.invokeMethodAsync('SignatureChanged');
    },
    changeColor: function (color) {
        this.self.penColor = color;
    },
    clear: function () {
        this.self.clear();
        this.signatureChanged();
    },
    undo: function () {
        var data = this.self.toData();
        if (data) {
            data.pop(); // remove the last dot or line
            this.self.fromData(data);
            this.signatureChanged();
        }
    },
    save: function (saveAsType) {
        switch (saveAsType) {
            case 'png':
                var dataURL = this.self.toDataURL();
                if (dataURL) {
                    this.download(dataURL, 'signature.png');
                }
                break;
            case 'jpg':
                // JPEG's are a special case.
                var dataURL = this.toDataURL_JPEG();
                if (dataURL) {
                    this.download(dataURL, 'signature.jpg');
                }
                break;
            case 'svg':
                var dataURL = this.self.toDataURL('image/svg+xml');
                if (dataURL) {
                    this.download(dataURL, 'signature.svg');
                }
                break;
            default:
                break;
        }
    },
    resizeCanvas: function () {
        // Prevent window.resize event from double firing.
        clearTimeout(this.timeoutId);
        // Delay the resize handling by 200ms
        this.timeoutId = setTimeout(() => {
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
    },
    saveSignatureState: function (key, useSession) {
        const data = this.self.toData();
        if (data && data.length > 0) {
            if (useSession)
                sessionStorage.setItem(key, JSON.stringify(data));
            else
                localStorage.setItem(key, JSON.stringify(data));
        } else {
            if (useSession)
                sessionStorage.removeItem(key);
            else
                localStorage.removeItem(key);
        }
        
    },
    restoreSignatureState: function (key, useSession) {
        const data = useSession 
            ? sessionStorage.getItem(key)
            : localStorage.getItem(key);
        if (data) {
            this.self.fromData(JSON.parse(data));
        }
    },
}