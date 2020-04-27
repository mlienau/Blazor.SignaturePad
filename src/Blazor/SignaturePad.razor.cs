// Copyright (c) 2020 Allan Mobley. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Threading.Tasks;
using System;
using System.Runtime.InteropServices;

namespace Mobsites.Blazor
{
    /// <summary>
    /// UI component for smooth signature drawing on a HTML5 canvas.
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
        /// Image type to save as. Defaults to png.
        /// </summary>
        [Parameter] public SupportedSaveAsTypes SaveAsType { get; set; }

        /// <summary>
        /// Call back event for notifying another component that this property changed. 
        /// </summary>
        [Parameter] public EventCallback<SupportedSaveAsTypes> SaveAsTypeChanged { get; set; }

        /// <summary>
        /// Callback that is fired when a signature stroke finishes or is removed, or when the signature is cleared.
        /// </summary>
        [Parameter]
        public EventCallback<ChangeEventArgs> OnSignatureChange { get; set; }

        /// <summary>
        /// Clear all state for this UI component and any of its dependents from browser storage.
        /// </summary>
        public Task ClearState() => this.ClearState<SignaturePad, Options>().AsTask();

        /// <summary>
        /// Get signature as data url according to the supported type.
        /// </summary>
        public Task<string> ToDataURL(SupportedSaveAsTypes saveAsType) => isWasm
            ? ToDataURLWasm(saveAsType)
            : ToDataURLServer(saveAsType);

        /// <summary>
        /// Clear signature pad.
        /// </summary>
        public Task Clear() => this.jsRuntime.InvokeVoidAsync("Mobsites.Blazor.SignaturePad.clear").AsTask();

        /// <summary>
        /// Undo last signature stroke.
        /// </summary>
        public Task Undo() => this.jsRuntime.InvokeVoidAsync("Mobsites.Blazor.SignaturePad.undo").AsTask();

        /// <summary>
        /// Save signature to file as one of the supported image types.
        /// </summary>
        public Task Save(SupportedSaveAsTypes? saveAsType = null) => this.jsRuntime.InvokeVoidAsync(
            "Mobsites.Blazor.SignaturePad.save", 
            (saveAsType ?? SaveAsType).ToString())
            .AsTask();

        /// <summary>
        /// Change pen color.
        /// </summary>
        public Task ChangePenColor(string color) => this.jsRuntime.InvokeVoidAsync(
            "Mobsites.Blazor.SignaturePad.changePenColor", 
            color)
            .AsTask();

        /// <summary>
        /// Invoked from a javascript when pen color is changed.
        /// For internal use only. ChangePenColor() is for external use.
        /// </summary>
        [JSInvokable]
        public async Task ChangeColor(string color)
        {
            switch (ContrastMode)
            {
                case ContrastModes.Dark:
                    this.DarkModeColor = color;
                    break;
                case ContrastModes.Light:
                    this.LightModeColor = color;
                    break;
                default:
                    this.Color = color;
                    break;
            }
            await this.ColorChanged.InvokeAsync(color);
            await this.Save<SignaturePad, Options>(GetOptions());
        }

        /// <summary>
        /// Invoked from a javascript callback event when a signature changes in some way.
        /// </summary>
        [JSInvokable]
        public Task SignatureChanged()
        {
            if (KeepState)
                this.jsRuntime.InvokeVoidAsync(
                    "Mobsites.Blazor.SignaturePad.saveSignatureState",
                    $"Mobsites.Blazor.{this.GetKey<SignaturePad>()}.DataURL",
                    this.UseSessionStorageForState);

            return this.OnSignatureChange.InvokeAsync(null);
        }

        /// <summary>
        /// Invoked from a javascript callback event to signal that the signature needs to be restored.
        /// </summary>
        [JSInvokable]
        public async ValueTask RestoreSignatureState()
        {
            if (KeepState)
                await this.jsRuntime.InvokeVoidAsync(
                    "Mobsites.Blazor.SignaturePad.restoreSignatureState",
                    $"Mobsites.Blazor.{this.GetKey<SignaturePad>()}.DataURL",
                    this.UseSessionStorageForState);
        }



        /****************************************************
        *
        *  NON-PUBLIC INTERFACE
        *
        ****************************************************/

        private bool isWasm => RuntimeInformation.IsOSPlatform(OSPlatform.Create("WEBASSEMBLY"));
        
        private DotNetObjectReference<SignaturePad> self;
        protected DotNetObjectReference<SignaturePad> Self
        {
            get => self ?? (Self = DotNetObjectReference.Create(this));
            set => self = value;
        }

        protected ElementReference Canvas { get; set; }

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
            var options = await this.GetState<SignaturePad, Options>();

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
                Canvas,
                options);

            await this.Save<SignaturePad, Options>(options);
        }

        internal async Task Refresh()
        {
            var options = await this.GetState<SignaturePad, Options>();
            
            // Use current state if...
            if (this.initialized || options is null)
            {
                options = this.GetOptions();
            }

            this.initialized = await this.jsRuntime.InvokeAsync<bool>(
                "Mobsites.Blazor.SignaturePad.refresh",
                Self,
                Canvas,
                options);

            await this.Save<SignaturePad, Options>(options);
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
            bool stateChanged = false;

            if (this.SaveAsType != (options.SaveAsType ?? SupportedSaveAsTypes.png))
            {
                this.SaveAsType = options.SaveAsType ?? SupportedSaveAsTypes.png;
                await this.SaveAsTypeChanged.InvokeAsync(this.SaveAsType);
                stateChanged = true;
            }

            bool baseStateChanged = await base.CheckState(options);
            bool footerStateChanged = await this.SignaturePadFooter?.CheckState(options);

            if (stateChanged
                || baseStateChanged 
                || footerStateChanged)
                StateHasChanged();
        }


        /// <summary>
        /// Internal helper to get signature as data url according to the supported type
        /// when using Blazor Webassembly.
        /// </summary>
        internal Task<string> ToDataURLWasm(SupportedSaveAsTypes saveAsType) => this.jsRuntime.InvokeAsync<string>(
            "Mobsites.Blazor.SignaturePad.toDataURL",
            saveAsType.ToString())
            .AsTask();

        /// <summary>
        /// Internal helper to get signature as data url according to the supported type
        /// when using Blazor Server. (Thanks to Mike for this contribution!)
        /// </summary>
        public async Task<string> ToDataURLServer(SupportedSaveAsTypes saveAsType)
        {
            int _segmentSize = 24576;

            var fileSize = await jsRuntime.InvokeAsync<int>("Mobsites.Blazor.SignaturePad.getDataSize", saveAsType.ToString());

            string rtnData = "";

            var numberOfSegments = Math.Floor(fileSize / (double)_segmentSize) + 1;
            string segmentData;

            for (var i = 0; i < numberOfSegments; i++)
            {
                try
                {
                    segmentData = await jsRuntime.InvokeAsync<string>(
                            "Mobsites.Blazor.SignaturePad.receiveSegment", i, saveAsType.ToString());

                }
                catch
                {
                    return null;
                }
                rtnData += segmentData;
            }
            return rtnData;
        }

        public override void Dispose()
        {
            self?.Dispose();
            base.Dispose();
        }
    }
}