// Copyright (c) 2020 Allan Mobley. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Threading.Tasks;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace Mobsites.Blazor
{
    /// <summary>
    /// UI child component of the <see cref="SignaturePadFooter"/> component, 
    /// housing the functionality for undoing the last signature stroke
    /// from the <see cref="SignaturePad"/> component.
    /// </summary>
    public partial class SignaturePadUndo
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
        /// The foreground color for this component. Accepts any valid css color usage.
        /// </summary>
        [Parameter] public override string Color
        {
            get => base.Color ?? "black";
            set => base.Color = value;
        }

        /// <summary>
        /// Whether to inherit a parent's background colors (dark, light, or normal modes).
        /// </summary>
        [Parameter] public override bool InheritParentBackgroundColors { get; set; } = true;
        
        /// <summary>
        /// URL or URL fragment for image source.
        /// </summary>
        [Parameter] public string Image { get; set; }

        private int imageWidth = 36;
        
        /// <summary>
        /// Image width in pixels. Defaults to 36px.
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

        private int imageHeight = 36;
        
        /// <summary>
        /// Image height in pixels. Defaults to 36px.
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
        /// Undo last signature stroke.
        /// </summary>
        public Task Undo() => this.jsRuntime.InvokeVoidAsync("Mobsites.Blazor.SignaturePad.undo").AsTask();

        

        /****************************************************
        *
        *  NON-PUBLIC INTERFACE
        *
        ****************************************************/

        protected override void OnParametersSet()
        {
            // This will check for valid parent.
            base.OnParametersSet();
            base.Parent.SignaturePadUndo = this;
        }

        internal void SetOptions(SignaturePad.Options options)
        {
            options.SignaturePadUndo = new Options 
            {
                
            };

            base.SetOptions(options.SignaturePadUndo);
        }

        internal async Task<bool> CheckState(SignaturePad.Options options)
        {
            return await base.CheckState(options.SignaturePadUndo);
        }
    }
}