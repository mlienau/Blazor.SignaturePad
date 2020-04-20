// Copyright (c) 2020 Allan Mobley. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Microsoft.AspNetCore.Components;

namespace Mobsites.Blazor
{
    /// <summary>
    /// Subcomponent for adding a footer to the <see cref="SignaturePad"/> component.
    /// </summary>
    public partial class SignaturePadFooter
    {
        /// <summary>
        /// Content to render.
        /// </summary>
        [Parameter] public RenderFragment ChildContent { get; set; }
        
        /// <summary>
        /// Directive text place directly below signature pad.
        /// </summary>
        [Parameter] public string FooterDirective { get; set; }

        protected override void OnParametersSet()
        {
            // This will check for valid parent.
            base.OnParametersSet();
            base.Parent.SignaturePadFooter = this;
        }
    }
}