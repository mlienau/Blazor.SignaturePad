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

         private int backgroundImageWidth = 192;
        
        /// <summary>
        /// Background image width (px) override. Defaults to 192px.
        /// </summary>
        [Parameter] public int BackgroundImageWidth 
        { 
            get => backgroundImageWidth; 
            set 
            { 
                if (value > 0)
                {
                    backgroundImageWidth = value;
                } 
            } 
        }

        private int backgroundImageHeight = 192;
        
        /// <summary>
        /// Background image height (px) override. Defaults to 192px.
        /// </summary>
        [Parameter] public int BackgroundImageHeight 
        { 
            get => backgroundImageHeight; 
            set 
            { 
                if (value > 0)
                {
                    backgroundImageHeight = value;
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
                    "Blazor.SignaturePad.init",
                    _objRef);
            }
        }

        /// <summary>
        /// Get signature as data url according to the supported type.
        /// </summary>
        public async ValueTask<string> ToDataURL(SupportedSaveAsTypes type) => 
            await jsRuntime.InvokeAsync<string>(
                "Blazor.SignaturePad.toDataURL",
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