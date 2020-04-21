// Copyright (c) 2020 Allan Mobley. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Threading.Tasks;

namespace Mobsites.Blazor
{
    /// <summary>
    /// UI component that utilizes the Signature Pad javascript library to implement smooth signature drawing on a HTML5 canvas.
    /// </summary>
    public partial class SignaturePad
    {
        /****************************************************
        *
        *  PUBLIC INTERFACE
        *
        ****************************************************/

        /// <summary>
        /// Content to render.
        /// </summary>
        [Parameter] public RenderFragment ChildContent { get; set; }

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
        public EventCallback<ChangeEventArgs> OnSignatureChange { get; set; }

        /// <summary>
        /// Get signature as data url according to the supported type.
        /// </summary>
        public async ValueTask<string> ToDataURL(SupportedSaveAsTypes type) => 
            await jsRuntime.InvokeAsync<string>(
                "Mobsites.Blazor.SignaturePad.toDataURL",
                type.ToString());

        /// <summary>
        /// Invoked from a javascript callback event when a signature changes in some way.
        /// </summary>
        [JSInvokable]
        public async Task SignatureChanged()
        {
            await OnSignatureChange.InvokeAsync(null);
        }

        /// <summary>
        /// Clear signature pad.
        /// </summary>
        public async Task Clear()
        {
            await this.jsRuntime.InvokeVoidAsync("Mobsites.Blazor.SignaturePad.clear");
        }

        /// <summary>
        /// Undo last signature stroke.
        /// </summary>
        public async Task Undo()
        {
            await this.jsRuntime.InvokeVoidAsync("Mobsites.Blazor.SignaturePad.undo");
        }

        /// <summary>
        /// Save signature to file as one of the supported image types.
        /// </summary>
        public async Task Save(SignaturePad.SupportedSaveAsTypes saveAsType)
        {
            await this.jsRuntime.InvokeVoidAsync("Mobsites.Blazor.SignaturePad.save", saveAsType.ToString());
        }



        /****************************************************
        *
        *  NON-PUBLIC INTERFACE
        *
        ****************************************************/
        
        private DotNetObjectReference<SignaturePad> self;
        protected DotNetObjectReference<SignaturePad> Self
        {
            get => self ?? (Self = DotNetObjectReference.Create(this));
            set => self = value;
        }

        /// <summary>
        /// Child reference. (Assigned by child.)
        /// </summary>
        internal SignaturePadFooter SignaturePadFooter { get; set; }

        protected async override Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                await Initialize();
            }
            else
            {
                await Refresh();
            }
        }

        internal async Task Initialize()
        {
            string key = GetKey(nameof(SignaturePad));

            var options = this.KeepState 
                ? this.UseSessionStorageForState
                    ? await this.Storage.Session.GetAsync<Options>(key)
                    : await this.Storage.Local.GetAsync<Options>(key)
                : null;

            if (options is null)
            {
                options = this.GetOptions();
            }
            else
            {
                await this.CheckState(options);
            }

            // Destroy any lingering js representation.
            options.Destroy = true;

            this.initialized = await this.jsRuntime.InvokeAsync<bool>(
                "Mobsites.Blazor.SignaturePad.init",
                Self,
                options);
            
            await Save(options, key);
        }

        internal async Task Refresh()
        {
            string key = GetKey(nameof(SignaturePad));

            var options = this.KeepState 
                ? this.UseSessionStorageForState
                    ? await this.Storage.Session.GetAsync<Options>(key)
                    : await this.Storage.Local.GetAsync<Options>(key)
                : null;
            
            // Use current state if...
            if (this.initialized || options is null)
            {
                options = this.GetOptions();
            }

            this.initialized = await this.jsRuntime.InvokeAsync<bool>(
                "Mobsites.Blazor.SignaturePad.refresh",
                Self,
                options);
            
            await Save(options, key);
        }

        internal Options GetOptions()
        {
            var options = new Options 
            {
                
            };

            base.SetOptions(options);
            this.SignaturePadFooter?.SetOptions(options);

            return options;
        }

        internal async Task CheckState(Options options)
        {
            bool baseStateChanged = await base.CheckState(options);
            bool footerStateChanged = await this.SignaturePadFooter?.CheckState(options);

            if (baseStateChanged || footerStateChanged)
                StateHasChanged();
        }

        internal async Task Save(Options options, string key)
        {
            // Clear destory before saving.
            options.Destroy = false;

            if (this.KeepState)
            {
                if (this.UseSessionStorageForState)
                {
                    await this.Storage.Session.SetAsync(key, options);
                }
                else
                {
                    await this.Storage.Local.SetAsync(key, options);
                }
            }
            else
            {
                await this.Storage.Session.RemoveAsync<Options>(key);
                await this.Storage.Local.RemoveAsync<Options>(key);
            }
        }

        /// <summary>
        /// Internal helper only. 
        /// User can externally change pen color via the Color property.
        /// </summary>
        internal async Task ChangePenColor(string color)
        {
            Color = color;
            await this.ColorChanged.InvokeAsync(color);
            await Save(GetOptions(), GetKey(nameof(SignaturePad)));
        }

        public override void Dispose()
        {
            self?.Dispose();
            this.initialized = false;
        }
    }
}