// Copyright (c) 2020 Allan Mobley. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Microsoft.AspNetCore.Components;
using System.Collections.Generic;

namespace Mobsites.Blazor
{
    /// <summary>
    /// Blazor child component for saving signature of the <see cref="SignaturePad"/>.
    /// </summary>
    public partial class SignaturePadSave
    {
        /// <summary>
        /// All html attributes outside of the class attribute go here. Use the Class attribute property to add css classes.
        /// </summary>
        [Parameter(CaptureUnmatchedValues = true)] public Dictionary<string, object> ExtraAttributes { get; set; }

        /// <summary>
        /// Css classes for affecting this component go here.
        /// </summary>
        [Parameter] public string Class { get; set; }

        /// <summary>
        /// Image type to save as. Defaults to SignaturePad.SupportedImageTypes.png.
        /// </summary>
        [Parameter] public SignaturePad.SupportedImageTypes SaveAsType { get; set; }

        private string imageSource = "_content/Mobsites.Blazor.SignaturePad/save.png";
        
        /// <summary>
        /// Image source override. Defaults to '_content/Mobsites.Blazor.SignaturePad/save.png'.
        /// </summary>
        [Parameter] public string ImageSource 
        { 
            get => imageSource; 
            set 
            { 
                if (!string.IsNullOrEmpty(value))
                {
                    imageSource = value;
                } 
            } 
        }

        private int imageWidth = 36;
        
        /// <summary>
        /// Image width (px) override. Defaults to 36px.
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
        /// Image height (px) override. Defaults to 36px.
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
    }
}