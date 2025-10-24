/**
 * Copyright © 2024-2025 Steven G. Harris. All rights reserved.
 *
 * A script that is loaded into the WebView in markupEditorProvider.js to 
 * populate the HTML that will be edited using the MarkupEditor and to 
 * respond to messages from the extension.
 *
 */

/** Set up message listeners used in the VSCode extension */
bootstrapVsCode()

/**
 * Set up the vscode api global and the window callbacks to receive messages from the VSCode extension.
 */
async function bootstrapVsCode() {

    // Assign vscode so we can send messages
    vscode = acquireVsCodeApi();
    
    // Listen for messages coming from the extension.js code.
    // To state what may be obvious, the message received here is passed via JSON, so
    // cannot contain a reference to an object held by the sender. This also means that 
    // we cannot invoke methods on an object that was passed by the sender, because here 
    // it's a deserialized JSON object, not the one from the sender. The properties of 
    // an object passed by the sender are generally available, since they are properly 
    // serialized and deserialized via JSON.
    window.addEventListener('message', handleMessage);

    // We want vscode to receive the callbacks from the MarkupEditor, which are handled in 
    // markupEditorProvider.js. We do that by telling the MarkupEditor to use `vscode` as 
    // its `messageHandler` when we instantiate the MarkupEditor.
    new MU.MarkupEditor(
        document.querySelector('#editor'), { messageHandler: vscode }
    )
};

/**
 * Handle the MessageEvents coming from the extension in extension.js.
 * 
 * @param {HTML MessageEvent} event The MessageEvent being listened for
 */
async function handleMessage(event) {
    const message = event.data;
    switch (message.type) {
       case 'update':
           populateHTML(message.contents, message.uriPath);
           return;
       default:
           console.log('Unknown message type: ' + message.type);
           return;
    };
}

/**
 * Populate the HTML to be edited.
 */
function populateHTML(contents, uriPath) {
    if (!contents) return;
    const template = document.createElement('template');
    template.innerHTML = contents;
    // Patch up the image src pointers that are relative to document dir
    const images = template.content.querySelectorAll('img');
    for (const image of images) {
        const src = image.src;
        const srcComponents = src.split('/');
        // For vscode, path has a prefix that allows it to be loaded in an extension.
        // That prefix looks something like: https://file%2B.vscode-resource.vscode-cdn.net/, an 
        // implementation detail hidden behind asWebviewUri(). To load an image, its src has to 
        // include this prefix, but the image.src is always relative to the document.
        if ((srcComponents.length > 0) && (srcComponents[0] != 'https:')) { // The image source is at or below
            image.src = uriPath + '/' + image.src;
        };
    };
    MU.setHTML(template.innerHTML);
};