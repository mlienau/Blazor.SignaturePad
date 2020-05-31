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
            dotNetObjRef.invokeMethodAsync('RestoreSignatureState');
            this.store[index].resizeCanvas();
            this.initResizeEvent();
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
        super(elemRefs.canvas, { penColor: options.color ? options.color : null });
        this.dotNetObjRef = dotNetObjRef;
        this.elemRefs = elemRefs;
        this.dotNetObjOptions = options;
        // Create a second Signature Pad just to help preserve signature when saving.
        const canvas = document.createElement('canvas');
        canvas.width = options.maxWidth;
        canvas.height = options.maxHeight;
        this.fullSignaturePad = new SignaturePad(canvas);
        this.onEnd = function () {
            this.dotNetObjRef.invokeMethodAsync('SignatureChanged');
        };
    }
    resizeCanvas() {
        // Store signature in memory before resizing so as not to lose it.
        const data = this.toData();

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
        this.clear();

        // Write signature back.
        this.fromData(data);
    }
    update(options) {
        this.dotNetObjOptions = options;
        this.penColor = options.color ? options.color : null;
    }
    _toDataURL(type) {
        var dataURL = null;
        if (!this.isEmpty()) {
            switch (type) {
                case 'png':
                    dataURL = this.preserveFullSignature('image/png');
                    break;
                case 'svg':
                    dataURL = this.preserveFullSignature('image/svg+xml');
                    break;
                case 'jpg':
                    dataURL = this.preserveFullSignature('image/jpeg');
                    break;
                default:
                    break;
            }
        }
        return dataURL;
    }
    preserveFullSignature(type) {
        this.fullSignaturePad.fromData(this.toData());
        const dataURL = type.includes('jpeg')
            ? this.toDataURL_JPEG(this.dotNetObjOptions.contrastMode)
            : this.fullSignaturePad.toDataURL(type);
        this.fullSignaturePad.clear();
        return dataURL;
    }
    toDataURL_JPEG(contrastMode) {
        const data = this.fullSignaturePad.toData();
        // It's necessary to use an opaque background color 
        // when saving image as JPEG and not in dark mode.
        if (!contrastMode || contrastMode != 1) {
            this.fullSignaturePad.backgroundColor = 'rgb(255, 255, 255)';
        }
        // Write signature back against opaque background.
        this.fullSignaturePad.fromData(data);
        // Save data url.
        const dataURL = this.fullSignaturePad.toDataURL('image/jpeg');
        // Reset background to default.
        this.fullSignaturePad.backgroundColor = 'rgba(0,0,0,0)';
        return dataURL;
    }
    changePenColor(color) {
        this.penColor = color;
        this.dotNetObjRef.invokeMethodAsync('ChangeColor', color);
    }
    _clear() {
        super.clear();
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
        const data = this.toData();
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
    }
    restoreSignatureState(key, useSession) {
        const data = useSession
            ? sessionStorage.getItem(key)
            : localStorage.getItem(key);
        if (data) {
            const signature = JSON.parse(data);
            // Add current color to end of signature 
            // to correctly set pen color after restoring signature.
            signature.push({ color: this.dotNetObjOptions.color, points: [{ time: 0, x: 0, y: 0 }] })
            // Restore signature.
            this.fromData(signature);
        }
    }
}