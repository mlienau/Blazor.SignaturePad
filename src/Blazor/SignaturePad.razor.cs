// Copyright (c) 2020 Allan Mobley. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Threading.Tasks;

namespace Mobsites.Blazor
{
    /// <summary>
    /// Component that utilizes the Signature Pad javascript library to implement smooth signature drawing on a HTML5 canvas.
    /// </summary>
    public partial class SignaturePad
    {
        private DotNetObjectReference<SignaturePad> _objRef;

        /// <summary>
        /// Content to render.
        /// </summary>
        [Parameter] public RenderFragment ChildContent { get; set; }

        /// <summary>
        /// Child reference. (Assigned by child.)
        /// </summary>
        internal SignaturePadFooter SignaturePadFooter { get; set; }

        /// <summary>
        /// URL or URL fragment for image source to displayed as a backdrop inside drawing area.
        /// </summary>
        [Parameter] public string Image { get; set; }

        private int imageWidth = 192;
        
        /// <summary>
        /// Image width in pixels. Defaults to 192px.
        /// </summary>
        [Parameter] public int ImageWidth 
        { 
            get => imageWidth; 
            set 
            { 
                if (value > 0)
                {
                    imageWidth = value;
                } 
            } 
        }

        private int imageHeight = 192;
        
        /// <summary>
        /// Image height in pixels. Defaults to 192px.
        /// </summary>
        [Parameter] public int ImageHeight 
        { 
            get => imageHeight; 
            set 
            { 
                if (value > 0)
                {
                    imageHeight = value;
                } 
            } 
        }

        /// <summary>
        /// Callback that is fired when a signature stroke finishes or is removed, or when the signature is cleared.
        /// </summary>
        [Parameter]
        public EventCallback<ChangeEventArgs> OnChangeCallback { get; set; }

        protected async override Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                _objRef = DotNetObjectReference.Create(this);

                await jsRuntime.InvokeVoidAsync(
                    "Mobsites.Blazor.SignaturePad.init",
                    null,
                    _objRef);
            }
        }

        /// <summary>
        /// Get signature as data url according to the supported type.
        /// </summary>
        public async ValueTask<string> ToDataURL(SupportedSaveAsTypes type) => 
            await jsRuntime.InvokeAsync<string>(
                "Mobsites.Blazor.SignaturePad.toDataURL",
                type.ToString());

        /// <summary>
        /// Invoked from a javascript callback event when a signature stroke finishes or is removed, or when the signature is cleared.
        /// </summary>
        [JSInvokable]
        public async Task OnEnd()
        {
            await OnChangeCallback.InvokeAsync(null);
        }

        public override void Dispose()
        {
            _objRef?.Dispose();
        }
    }
}