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
    init: function (dotNetObjRef, elemRefs, options) {
        try {
            if (!this.pads) {
                this.pads = [];
            }
            if (!this.pads[dotNetObjRef._id] || options.destroy) {
                this.pads[dotNetObjRef._id] = new SignaturePad(elemRefs.canvas);
                this.pads[dotNetObjRef._id].Blazor = {
                    dotNetObjRef: dotNetObjRef,
                    elemRefs: elemRefs,
                    options: options
                }
                this.pads[dotNetObjRef._id].onEnd = this.onEndSignatureChanged;
                this.initResizeEvent();
                this.resizeCanvas();
                this.pads[dotNetObjRef._id].Blazor.dotNetObjRef.invokeMethodAsync('RestoreSignatureState');
            } else {
                this.pads[dotNetObjRef._id].Blazor.options = options;
            }
            this.pads[dotNetObjRef._id].penColor = this.pads[dotNetObjRef._id].Blazor.options.color
                ? this.pads[dotNetObjRef._id].Blazor.options.color
                : "black";
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    refresh: function (dotNetObjRef, elemRefs, options) {
        return this.init(dotNetObjRef, elemRefs, options);
    },
    initResizeEvent: function () {
        window.addEventListener('resize', this.resizeCanvas);
    },
    toDataURL: function (dotNetObjRef, type) {
        var dataURL = null;
        if (!this.pads[dotNetObjRef._id].isEmpty()) {
            switch (type) {
                case 'png':
                    dataURL = this.preserveFullSignature(dotNetObjRef, 'image/png');
                    break;
                case 'svg':
                    dataURL = this.preserveFullSignature(dotNetObjRef, 'image/svg+xml');
                    break;
                case 'jpg':
                    dataURL = this.preserveFullSignature(dotNetObjRef, 'image/jpeg');
                    break;
                default:
                    break;
            }
        }
        return dataURL;
    },
    onEndSignatureChanged: function () {
        // Call back for onEnd prop of SignaturePad only!!!!
        this.Blazor.dotNetObjRef.invokeMethodAsync('SignatureChanged');
    },
    changePenColor: function (dotNetObjRef, color) {
        this.pads[dotNetObjRef._id].penColor = color;
        this.pads[dotNetObjRef._id].Blazor.dotNetObjRef.invokeMethodAsync('ChangeColor', color);
    },
    clear: function (dotNetObjRef) {
        this.pads[dotNetObjRef._id].clear();
        this.pads[dotNetObjRef._id].Blazor.dotNetObjRef.invokeMethodAsync('SignatureChanged');
    },
    undo: function (dotNetObjRef) {
        var data = this.pads[dotNetObjRef._id].toData();
        if (data) {
            data.pop(); // remove the last dot or line
            this.pads[dotNetObjRef._id].fromData(data);
            this.pads[dotNetObjRef._id].Blazor.dotNetObjRef.invokeMethodAsync('SignatureChanged');
        }
    },
    save: function (dotNetObjRef, saveAsType) {
        var dataURL = this.toDataURL(dotNetObjRef, saveAsType);
        if (dataURL) {
            this.download(dataURL, 'signature.' + saveAsType);
        }
    },
    resizeCanvas: function () {
        // Prevent window.resize event from double firing.
        clearTimeout(this.timeoutId);
        // Delay the resize handling by 200ms
        this.timeoutId = setTimeout(() => {
            window.Mobsites.Blazor.SignaturePad.pads.forEach(pad => {
                // Store signature in memory before resizing so as not to lose it.
                var data = pad.toData();

                // When zoomed out to less than 100%, for some very strange reason,
                // some browsers report devicePixelRatio as less than 1
                // and only part of the canvas is cleared then.
                var ratio = Math.max(window.devicePixelRatio || 1, 1);

                // This part causes the canvas to be cleared
                pad.canvas.width = pad.canvas.offsetWidth * ratio;
                pad.canvas.height = pad.canvas.offsetHeight * ratio;
                pad.canvas.getContext('2d').scale(ratio, ratio);

                // This library does not listen for canvas changes, so after the canvas is automatically
                // cleared by the browser, SignaturePad#isEmpty might still return false, even though the
                // canvas looks empty, because the internal data of this library wasn't cleared. To make sure
                // that the state of this library is consistent with visual state of the canvas, you
                // have to clear it manually.
                pad.clear();

                // Write signature back.
                pad.fromData(data);
            });
        }, 300);
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
    getDataSize: function (dotNetObjRef, type) {
        var dataURL = this.toDataURL(dotNetObjRef, type);
        if (dataURL == null) {
            return 0;
        }
        var dataSize = dataURL.length;
        return dataSize;
    },
    receiveSegment: function (dotNetObjRef, segmentNumber, type) {
        var dataURL = this.toDataURL(dotNetObjRef, type);
        var index = segmentNumber * 24576;
        return this.getNextChunk(dataURL, index);
    },
    getNextChunk: function (dataURL, index) {
        const length = dataURL.length - index <= 24576 ? dataURL.length - index : 24576;
        const chunk = dataURL.substring(index, index + length);
        index += length;
        return chunk;
    },
    saveSignatureState: function (dotNetObjRef, key, useSession) {
        const data = this.pads[dotNetObjRef._id].toData();
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
    restoreSignatureState: function (dotNetObjRef, key, useSession) {
        const data = useSession 
            ? sessionStorage.getItem(key)
            : localStorage.getItem(key);
        if (data) {
            var signature = JSON.parse(data);
            // Add current color to end of signature 
            // to correctly set pen color after restoring signature.
            signature.push({ color: this.pads[dotNetObjRef._id].Blazor.options.color, points: [{ time: 0, x: 0, y: 0 }]})
            // Restore signature.
            this.pads[dotNetObjRef._id].fromData(signature);
        }
    },
    preserveFullSignature: function (dotNetObjRef, type) {
        if (!this.fullSignaturePad) {
            // Create a new Signature Pad just for this purpose
            var canvas = document.createElement('canvas');
            // Max dimensions.
            canvas.width = 700;
            canvas.height = 350;
            this.fullSignaturePad = new SignaturePad(canvas);
        }
        this.fullSignaturePad.fromData(this.pads[dotNetObjRef._id].toData());
        var dataURL = type.includes('jpeg') 
            ? this.toDataURL_JPEG(this.pads[dotNetObjRef._id].Blazor.options.contrastMode)
            : this.fullSignaturePad.toDataURL(type);
        this.fullSignaturePad.clear();
        return dataURL;
    },
    toDataURL_JPEG: function (contrastMode) {
        var data = this.fullSignaturePad.toData();
        // It's necessary to use an opaque background color 
        // when saving image as JPEG and not in dark mode.
        if (!contrastMode || contrastMode != 1)
        {
            this.fullSignaturePad.backgroundColor = 'rgb(255, 255, 255)';
        }
        // Write signature back against opaque background.
        this.fullSignaturePad.fromData(data);
        // Save data url.
        var dataURL = this.fullSignaturePad.toDataURL('image/jpeg');
        // Reset background to default.
        this.fullSignaturePad.backgroundColor = 'rgba(0,0,0,0)';
        return dataURL;
    }
}