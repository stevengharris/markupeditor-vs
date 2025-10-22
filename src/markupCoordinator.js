import vscode from 'vscode';
import { getNonce, pathToDocument } from './utilities';

/**
 * The MarkupCoordinator set up the webview when it is instantiated and coordinates messaging 
 * between the extension and the webview. 
 * 
 * The MarkupCoordinator uses `webview.postMessage` to send a message to the webview, which is handled 
 * in `handleMessage` defined in `markupeditor_vs.js`. The webview uses `messageHandler?.postMessage` 
 * to send a message to the MarkupCoordinator, which is handled here in the MarkupCoordinator in the 
 * `handleMessage` method. FWIW the MarkupCoordinator here plays a similar role to the 
 * MarkupCoordinator in the Swift version of MarkupEditor.
 */
export class MarkupCoordinator {

    currentPanel;
    extensionUri;

    constructor(context, document, webviewPanel) {
        this.extensionUri = context.extensionUri;
        this.currentPanel = webviewPanel;

        // Add directories holding css and scripts to localResourceRoots so we can load them,
        // and allow content in the document's directory to load (e.g., images), or below 
        // the document's directory when image.src has a relative path (e.g., 'resources/foo.png').
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'styles'),
                vscode.Uri.joinPath(this.extensionUri, 'scripts'),
                vscode.Uri.file(pathToDocument(document))
            ]
        };
    
        // Load the initial html with scripts and css. The actual html content to be edited
        // is loaded later by calling `updateWebview`.
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
    
        // Track changes to the panel
        webviewPanel.onDidChangeViewState(e => {
            this.currentPanel = e.webviewPanel;
        });

        webviewPanel.onDidDispose(() => {
            this.changeDocumentSubscription.dispose();
        });

        // Set up the message handler for messages coming from the webview
        webviewPanel.webview.onDidReceiveMessage(this.handleMessage.bind(this));

        // We're all set up, so update the webview.
        this.updateWebview(document);

    };

    /**
     * Use the vscode `onDidChangeTextDocument function to change the document subscription.
     */
    changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
        if (e.document.uri.toString() === document.uri.toString()) {
            updateWebview(e.document);
        }
    });

    /**
     * Update the contents of the panel's webview by posting a message with its contents and the info needed 
     * to identify resources referenced in the HTML.
     * 
     * The message is received by the webview in markupeditor_vs.js in `handleMessage`.
     */
    async updateWebview(document) {
        const contents = await document.getText();
        const webview = this.currentPanel.webview
        const documentPath = pathToDocument(document);
        const uriPath = vscode.Uri.joinPath(webview.asWebviewUri(vscode.Uri.file('')), documentPath).toString();
        webview.postMessage({
            type: 'update',
            contents: contents,
            uriPath: uriPath
        });
    };

    /**
     * Handle messages from the webview.
     * 
     * To state what may be obvious, the message received here is passed via JSON, so
     * cannot contain a reference to an object held by the sender. This also means that 
     * we cannot invoke methods on an object that was passed by the sender, because here 
     * it's a deserialized JSON object, not the one from the sender. The properties of 
     * an object passed by the sender are generally available, since they are properly 
     * serialized and deserialized via JSON.
     * 
     * @param {object} message A serialized object sent from the webview. The `command` property
     *                          tells what kind of message it us.
     */
    handleMessage(message) {
        switch (message.command) {
            case 'alert':
                vscode.window.showErrorMessage(message.text);
                return;
            default:
                this.handleMUCallback(message);
                return;
        }
    }

    /**
     * Something happened in the MarkupEditor webview. Take action as-needed based on the callback.
     * 
     * @param {string} callback The type of notification/callback received from the webview.
     */
    handleMUCallback(callback) {
        if (callback && (callback.substring(0, 5) === 'input')) {
            console.log('input in ' + callback.substring(5));
            return;
        };
        switch (callback) {
            case 'ready':
                console.log('MarkupEditor is ready');
                return;
            default:
                console.log('Unknown message: ' + callback);
                return;
        };
    };    

    getHtmlForWebview(webview) {

        const markupConfig = JSON.stringify(vscode.workspace.getConfiguration().markupEditor);

        // Local paths to scripts run in the webview
        const scriptMarkupPath = vscode.Uri.joinPath(this.extensionUri, 'scripts', 'markupeditor.js');
        const scriptMarkupBootstrapPath = vscode.Uri.joinPath(this.extensionUri, 'scripts', 'markupeditor_vs.js');
    
        // And the uris we use to load scripts in the webview
        const scriptMarkupUri = webview.asWebviewUri(scriptMarkupPath);
        const scriptMarkupBootstrapUri = webview.asWebviewUri(scriptMarkupBootstrapPath);
    
        // Local path to css styles
        // Note that mirror.css, markup.css, and codelog.css are unmodified copies from MarkupEditor and CodeLog.
        const styleMirrorPath = vscode.Uri.joinPath(this.extensionUri, 'styles', 'mirror.css');
        const styleMarkupPath = vscode.Uri.joinPath(this.extensionUri, 'styles', 'markup.css');
        const styleToolbarPath = vscode.Uri.joinPath(this.extensionUri, 'styles', 'toolbar.css');
        const styleMarkupVSPath = vscode.Uri.joinPath(this.extensionUri, 'styles', 'markup_vs.css');
        const styleCodiconsPath = vscode.Uri.joinPath(this.extensionUri, 'styles', 'codicon.css');
    
        // Uri to load styles into webview
        const styleMirrorUri = webview.asWebviewUri(styleMirrorPath);
        const styleMarkupUri = webview.asWebviewUri(styleMarkupPath);
        const styleToolbarUri = webview.asWebviewUri(styleToolbarPath);
        const styleMarkupVSUri = webview.asWebviewUri(styleMarkupVSPath);
        const styleCodiconsUri = webview.asWebviewUri(styleCodiconsPath);
    
        // Use a nonce to only allow specific scripts to be run and images to load.
        const nonce = getNonce();
    
        //TODO: I had to include style-src 'unsafe-inline' to get some images to load, but I'm not sure why.
        return `<!DOCTYPE html>
                <html lang="${vscode.env.language}">
                    <head>
                        <!-- meta charset="UTF-8" -->
                        <title>MarkupEditor Document</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
            
                        <!--
                            Use a content security policy to only allow loading images from https or from our extension directory,
                            and only allow scripts that have a specific nonce.
                        -->
                        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; img-src *; script-src 'nonce-${nonce}';">
            
                        <link href="${styleMirrorUri}" rel="stylesheet">
                        <link href="${styleMarkupUri}" rel="stylesheet">
                        <link href="${styleToolbarUri}" rel="stylesheet">
                        <link href="${styleMarkupVSUri}" rel="stylesheet">
                        <link href="${styleCodiconsUri}" rel="stylesheet">
                    </head>
                    <body>
                        <div id="editor"></div>
                        <script nonce="${nonce}">let markupConfig = ${markupConfig}</script>
                        <script nonce="${nonce}" src="${scriptMarkupUri}"></script>
                        <script nonce="${nonce}" src="${scriptMarkupBootstrapUri}"></script>
                    </body>
                </html>`;
    };

}