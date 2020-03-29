// Copyright (c) 2020 Allan Mobley. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Mobsites.Blazor
{
    /// <summary>
    /// Blazor component library that utilizes Szymon Nowak's javascript library Signature Pad to implement smooth signature drawing on a HTML5 canvas.
    /// </summary>
    public partial class SignaturePad : IDisposable
    {
        private DotNetObjectReference<SignaturePad> _objRef;
        [Inject] protected IJSRuntime jsRuntime { get; set; }

        /// <summary>
        /// All html attributes outside of the class attribute go here. Use the Class attribute property to add css classes.
        /// </summary>
        [Parameter(CaptureUnmatchedValues = true)] public Dictionary<string, object> ExtraAttributes { get; set; }

        /// <summary>
        /// The signature pad actions or custom footer content (optional).
        /// </summary>
        [Parameter] public RenderFragment ChildContent { get; set; }

        /// <summary>
        /// Css classes for affecting this component go here.
        /// </summary>
        [Parameter] public string Class { get; set; }

        /// <summary>
        /// Whether to hide the footer directive below the canvas.
        /// </summary>
        [Parameter] public bool HideFooterDirective { get; set; }

        private string footerDirective = "Sign above";
        
        /// <summary>
        /// Footer directive override. Defaults to 'Sign above'.
        /// </summary>
        [Parameter] public string FooterDirective 
        { 
            get => footerDirective; 
            set 
            { 
                if (!string.IsNullOrEmpty(value))
                {
                    footerDirective = value;
                } 
            } 
        }

        /// <summary>
        /// Whether to show a background image on the canvas.
        /// </summary>
        [Parameter] public bool UseBackgroundImage { get; set; }

        private string backgroundImage = "_content/Mobsites.Blazor.SignaturePad/blazor.png";
        
        /// <summary>
        /// Background image override. Defaults to '_content/Mobsites.Blazor.SignaturePad/blazor.png'.
        /// </summary>
        [Parameter] public string BackgroundImage 
        { 
            get => backgroundImage; 
            set 
            { 
                if (!string.IsNullOrEmpty(value))
                {
                    backgroundImage = value;
                } 
            } 
        }

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
        /// The supported image types.
        /// </summary>
        public enum SupportedImageTypes
        {
            png,
            jpg,
            svg
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
        public async ValueTask<string> ToDataURL(SupportedImageTypes type) => 
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

        public void Dispose()
        {
            _objRef?.Dispose();
        }
    }
}