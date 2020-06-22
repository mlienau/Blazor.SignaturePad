// Copyright (c) 2020 Allan Mobley. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import SignaturePad from 'signature_pad';

if (!window.Mobsites) {
    window.Mobsites = {
        Blazor: {

        }
    };
}

window.Mobsites.Blazor.SignaturePads = {
    store: [],
    init: function (dotNetObjRef, elemRefs, options) {
        try {
            const index = this.add(new Mobsites_Blazor_SignaturePad(dotNetObjRef, elemRefs, options));
            dotNetObjRef.invokeMethodAsync('SetIndex', index);
            
            this.store[index].resizeCanvas();
            this.initResizeEvent();
            dotNetObjRef.invokeMethodAsync('RestoreSignatureState');
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    add: function (signaturePad) {
        for (let i = 0; i < this.store.length; i++) {
            if (this.store[i] == null) {
                this.store[i] = signaturePad;
                return i;
            }
        }
        const index = this.store.length;
        this.store[index] = signaturePad;
        return index;
    },
    update: function (index, options) {
        this.store[index].update(options);
    },
    destroy: function (index) {
        this.store[index] = null;
    },
    initResizeEvent: function () {
        if (this.store.length == 1)
            window.addEventListener('resize', this.resizeCanvas);
    },
    resizeCanvas: function () {
        // Prevent window.resize event from double firing.
        clearTimeout(this.timeoutId);
        // Delay the resize handling by 200ms
        this.timeoutId = setTimeout(() => {
            window.Mobsites.Blazor.SignaturePads.store.forEach(pad => {
                if (pad)
                    pad.resizeCanvas();
            });
        }, 300);
    },
    toDataURL: function (index, type) {
        return this.store[index]._toDataURL(type);
    },
    fromDataURL: function (index, dataURL) {
        return this.store[index]._fromDataURL(dataURL);
    },
    changePenColor: function (index, color) {
        this.store[index].changePenColor(color);
    },
    clear: function (index) {
        this.store[index]._clear();
    },
    undo: function (index) {
        this.store[index].undo();
    },
    save: function (index, saveAsType) {
        this.store[index].save(saveAsType);
    },
    getDataSize: function (index, type) {
        const dataURL = this.store[index]._toDataURL(type);
        if (dataURL == null) {
            return 0;
        }
        const dataSize = dataURL.length;
        return dataSize;
    },
    receiveSegment: function (index, segmentNumber, type) {
        const dataURL = this.store[index]._toDataURL(type);
        return this.getNextChunk(dataURL, segmentNumber * 24576);
    },
    getNextChunk: function (dataURL, index) {
        const length = dataURL.length - index <= 24576 ? dataURL.length - index : 24576;
        const chunk = dataURL.substring(index, index + length);
        index += length;
        return chunk;
    },
    saveSignatureState: function (index, key, useSession) {
        this.store[index].saveSignatureState(key, useSession);
    },
    restoreSignatureState: function (index, key, useSession) {
        this.store[index].restoreSignatureState(key, useSession);
    }
}

class Mobsites_Blazor_SignaturePad extends SignaturePad {
    constructor(dotNetObjRef, elemRefs, options) {
        super(elemRefs.canvas, { penColor: options.color ? options.color : 'black' });
        this.dotNetObjRef = dotNetObjRef;
        this.elemRefs = elemRefs;
        this.dotNetObjOptions = options;
        this.onEnd = function () {
            this.dotNetObjRef.invokeMethodAsync('SignatureChanged');
        };
    }
    resizeCanvas() {
        // Store signature in memory before resizing so as not to lose it.
        const dataURL = this.toDataURL();

        // When zoomed out to less than 100%, for some very strange reason,
        // some browsers report devicePixelRatio as less than 1
        // and only part of the canvas is cleared then.
        const ratio = Math.max(window.devicePixelRatio || 1, 1);

        // This part causes the canvas to be cleared
        this.canvas.width = this.canvas.offsetWidth * ratio;
        this.canvas.height = this.canvas.offsetHeight * ratio;
        this.canvas.getContext('2d').scale(ratio, ratio);

        // This library does not listen for canvas changes, so after the canvas is automatically
        // cleared by the browser, SignaturePad#isEmpty might still return false, even though the
        // canvas looks empty, because the internal data of this library wasn't cleared. To make sure
        // that the state of this library is consistent with visual state of the canvas, you
        // have to clear it manually.
        // this.clear();

        // Write signature back.
        this.fromDataURL(dataURL);
    }
    update(options) {
        this.dotNetObjOptions = options;
        this.penColor = options.color ? options.color : 'black';
    }
    _toDataURL(type) {
        var dataURL = null;
        if (!this.isEmpty()) {
            switch (type) {
                case 'png':
                    dataURL = this.toDataURL('image/png');
                    break;
                case 'svg':
                    dataURL = this.toDataURL('image/svg+xml');
                    break;
                case 'jpg':
                    dataURL = this.toDataURL_JPEG(this.dotNetObjOptions.contrastMode);
                    break;
                default:
                    break;
            }
        }
        return dataURL;
    }
    _fromDataURL(dataURL) {
        this.fromDataURL(dataURL, { 
            ratio: Math.max(window.devicePixelRatio || 1, 1),
            width: this.dotNetObjOptions.maxWidth, 
            height: this.dotNetObjOptions.maxHeight 
        });
    }
    toDataURL_JPEG(contrastMode) {
        var dataURL = '';
        // It's necessary to use an opaque background color 
        // when saving image as JPEG and not in dark mode.
        if (!contrastMode || contrastMode != 1) {
            var newCanvas = this.canvas.cloneNode(true);
            var ctx = newCanvas.getContext('2d');
            ctx.fillStyle = "#FFF";
            ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
            ctx.drawImage(this.canvas, 0, 0);
            dataURL = newCanvas.toDataURL("image/jpeg");
        } else {
            dataURL = this.toDataURL('image/jpeg');
        }
        return dataURL;
    }
    changePenColor(color) {
        this.penColor = color;
        this.dotNetObjRef.invokeMethodAsync('ChangeColor', color);
    }
    _clear() {
        this.clear();
        this.dotNetObjRef.invokeMethodAsync('SignatureChanged');
    }
    undo() {
        const data = this.toData();
        if (data) {
            data.pop(); // remove the last dot or line
            this.fromData(data);
            this.dotNetObjRef.invokeMethodAsync('SignatureChanged');
        }
    }
    save(saveAsType) {
        const dataURL = this._toDataURL(saveAsType);
        if (dataURL) {
            this.download(dataURL, 'signature.' + saveAsType);
        }
    }
    download(dataURL, filename) {
        const a = document.createElement('a');
        a.style = 'display: none';
        a.href = dataURL;
        a.download = filename;
        a.target = '_blank'
        document.body.appendChild(a);
        a.click();
    }
    saveSignatureState(key, useSession) {
        const dataURL = this.toDataURL();
        if (dataURL) {
            if (useSession)
                sessionStorage.setItem(key, dataURL);
            else
                localStorage.setItem(key, dataURL);
        } else {
            if (useSession)
                sessionStorage.removeItem(key);
            else
                localStorage.removeItem(key);
        }
    }
    restoreSignatureState(key, useSession) {
        const dataURL = useSession
            ? sessionStorage.getItem(key)
            : localStorage.getItem(key);
        if (dataURL) {
            this.fromDataURL(dataURL, { 
                ratio: Math.max(window.devicePixelRatio || 1, 1),
                width: this.canvas.width, 
                height: this.canvas.height 
            });
        }
    }
}