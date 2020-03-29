[![Build Status](https://dev.azure.com/allanmobleyjr/Blazor%20Signature%20Pad/_apis/build/status/Mobsites.Blazor.SignaturePad?branchName=master)](https://dev.azure.com/allanmobleyjr/Blazor%20Signature%20Pad/_build/latest?definitionId=6&branchName=master)

# Blazor Signature Pad
A Blazor component library that utilizes [Szymon Nowak](https://github.com/szimek)'s javascript library [Signature Pad](https://github.com/szimek/signature_pad) to implement smooth signature drawing on a HTML5 canvas.

***Don't worry! You don't have to touch any javascript to make use of this library. Blazor Signature Pad abstracts all of that away for you. Just plug and play, baby.***

#### [Go to live Demo](https://mobsites.github.io/Blazor.SignaturePad/)

![Gif of Demo](src/assets/demo.gif)

## For
* Blazor WebAssembly
* Blazor Server

## Dependencies

###### .NETStandard 2.0
* Microsoft.AspNetCore.Components (>= 3.1.2)
* Microsoft.AspNetCore.Components.Web (>= 3.1.2)

## Design and Development
The design and development of this component library was heavily influenced by Steve Sanderson's [talk](https://youtu.be/QnBYmTpugz0) and [example](https://github.com/SteveSandersonMS/presentation-2020-01-NdcBlazorComponentLibraries), in which he outlines the best approach to building and deploying a reusable component library.

As for the non-C# implementation of this component library, obviously Nowak's [docs](https://github.com/szimek/signature_pad) were consulted carefully. And it goes without saying (but I'm going to say it anyway), that Blazor Signature Pad would not be what it is...were it not for that library author's hard work beforehand.

Now, not every aspect of that awesome javascript library has been ported over, and I can't say that it ever will. I am still considering a few aspects as well as possible extensions to it (in C#, mind you). If you are familiar with said javascript library and have any suggestions, feel free to chime in and contribute.

## Getting Started
1. Install [Nuget](https://www.nuget.org/packages/Mobsites.Blazor.SignaturePad/):

```shell
dotnet add package Mobsites.Blazor.SignaturePad --version 1.0.0-preview1
```

2. Add the following link tag to `index.html` (WebAssembly) or `_Host.cshtml` (Server) just above the closing `</head>` tag, along with your other link tags:

```html
<!-- The order of your style links obviously matters, so reorder them if any conflicts arise -->
<link href="_content/Mobsites.Blazor.SignaturePad/bundle.css" rel="stylesheet" />
```

3. Add the following script tag to `index.html` (WebAssembly) or `_Host.cshtml` (Server) just above the closing `</body>` tag, along with your other script tags:

```html
<!-- Place this below any _framework scripts! -->
<script src="_content/Mobsites.Blazor.SignaturePad/bundle.js"></script>
```

4. Add the following using statement to the `_Imports.razor` file:

```html
@using Mobsites.Blazor
```

5. Add the following markup to whatever Blazor page or component you like:

```html
<SignaturePad />
```

That's it. You should now have a functioning signature pad. No javascript required (on your part, of course). Now, I dare say, you are going to want to liven things up a bit. Throw a little C# at it, eh? Well, feast yer eyes below, mate.

## C# Only
The best way to explain is sometimes through an example:

```html
@page "/"

<h1>Blazor Signature Pad Demo</h1>
<!-- Wire up a C# ref and callback function using tag attributes -->
<SignaturePad @ref="signaturePad" OnChangeCallback="OnSignatureChange">
    <SignaturePadPen />
    <SignaturePadClear />
    <SignaturePadUndo />
    <!-- Here we bind the value to the attribute -->
    <SignaturePadSave SaveAsType="signatureType" />
</SignaturePad>
<br />
<h4>Below image and data url are captured using SignaturePad onchange callback event:</h4>
<!-- Here we wire up the same callback function (defined below) 
     to give the user a way of dynamically changing the image type.
     This will populate the ChangeEventArgs with the needed value -->
<select @onchange="OnSignatureChange">
    <option value="@SignaturePad.SupportedImageTypes.png">PNG</option>
    <option value="@SignaturePad.SupportedImageTypes.jpg">JPEG</option>
    <option value="@SignaturePad.SupportedImageTypes.svg">SVG</option>
</select>
<br />
<br />
<!-- Show results from onchange event -->
<textarea rows="10" class="w-50">@dataURL</textarea>
<img src="@dataURL" style="vertical-align: unset;" class="img-fluid"/>
```
```c#
@code {
    SignaturePad signaturePad;
    SignaturePad.SupportedImageTypes signatureType;
    string dataURL;

    private async Task OnSignatureChange(ChangeEventArgs eventArgs)
    {
        // The library does not populate the eventArgs.
        // But the html select tag above will.
        // Here we check it, and if so, we set the image type, causing a change in the library as well.
        if (eventArgs?.Value != null)
        {
            signatureType = Enum.Parse<SignaturePad.SupportedImageTypes>(eventArgs.Value as string);
        }

        // Use @ref to call library method to get a data url representing the current state of the signature.
        // Here we just display it above, but this could be stored in a database for later retrieval.
        dataURL = await signaturePad.ToDataURL(signatureType);
    }
}
```

## Signature Pad Attributes
Below highlights the built-in C# attributes and their defaults (if any). Use intellisense to get more details:

```html
<SignaturePad Class="null"
              ExtraAttributes="null" 
              OnChangeCallback="Assign a C# function to get notified when changes occur"
              FooterDirective="Sign above"
              HideFooterDirective="false"
              UseBackgroundImage="false"
              BackgroundImage="_content/Mobsites.Blazor.SignaturePad/blazor.png"
              BackgroundImageWidth="192"
              BackgroundImageHeight="192" />
```

## Signature Pad Actions
Out of the box, Blazor Signature Pad comes with a few helper components*:

```html
<SignaturePad>
    <SignaturePadPen />
    <SignaturePadClear />
    <SignaturePadUndo />
    <SignaturePadSave  />
</SignaturePad>
```

Use as many of them as you want, in which ever order you wish. Embedding them as children of the `<SignaturePad>` tag, keeps them in a tidy spot in the Blazor Signature Pad's footer.

**You can also bring your own markup actions, such as buttons or whatnot, by simply using a special id or class in your markup. See each action type below for specific details.*

#### Signature Pad Pen*
Below highlights the built-in C# attributes and their defaults (if any). Use intellisense to get more details:

```html
<SignaturePadPen Class="null"
                 ExtraAttributes="null" 
                 ImageSource="_content/Mobsites.Blazor.SignaturePad/pen.png" 
                 ImageWidth="36" 
                 ImageHeight="36" />
```

These attributes allows for flexible customization. But if you want to bring your own, well you can do that as well:

```html
<!-- Use a button or whatever for the event trigger -->
<button id="signature-pad--pen"></button>
<!-- The below markup is required -->
<input type="color" class="signature-pad--pen-color" id="signature-pad--pen-color" />
```

**There can only be one event trigger for this action; i.e., the first one found by the library will have the event trigger attached to it.*

#### Signature Pad Clear*
Below highlights the built-in C# attributes and their defaults (if any). Use intellisense to get more details:

```html
<SignaturePadClear Class="null"
                   ExtraAttributes="null" 
                   ImageSource="_content/Mobsites.Blazor.SignaturePad/clear.png" 
                   ImageWidth="36" 
                   ImageHeight="36" />
```

These attributes allows for flexible customization. But if you want to bring your own, well you can do that as well:

```html
<!-- Use a button or whatever for the event trigger -->
<button id="signature-pad--clear"></button>
```

**There can only be one event trigger for this action; i.e., the first one found by the library will have the event trigger attached to it.*

#### Signature Pad Undo*
Below highlights the built-in C# attributes and their defaults (if any). Use intellisense to get more details:

```html
<SignaturePadUndo Class="null"
                  ExtraAttributes="null" 
                  ImageSource="_content/Mobsites.Blazor.SignaturePad/undo.png" 
                  ImageWidth="36" 
                  ImageHeight="36" />
```

These attributes allows for flexible customization. But if you want to bring your own, well you can do that as well:

```html
<!-- Use a button or whatever for the event trigger -->
<button id="signature-pad--undo"></button>
```

**There can only be one event trigger for this action; i.e., the first one found by the library will have the event trigger attached to it.*

#### Signature Pad Save*
Below highlights the built-in C# attributes and their defaults (if any). Use intellisense to get more details:

```html
<SignaturePadSave Class="null"
                  ExtraAttributes="null" 
                  SaveAsType="SignaturePad.SupportedImageTypes.png"
                  ImageSource="_content/Mobsites.Blazor.SignaturePad/save.png" 
                  ImageWidth="36" 
                  ImageHeight="36" />
```

These attributes allows for flexible customization. But if you want to bring your own, well you can do that as well:

```html
<!-- Use a button or whatever for the event trigger -->
<!-- Must have the below class. Also the id must specify a save type. -->
<!-- Since there can only be one of these triggers, 
     you will have to devise a way to dynamically change the id to support 
     multiple save types on the trigger -->
<button id="signature-pad--save-png" class="signature-pad--save"></button>
```

**There can only be one event trigger for this action; i.e., the first one found by the library will have the event trigger attached to it.*
