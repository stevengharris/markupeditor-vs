import vscode from 'vscode';
import { AppConstants, getNonce, pathToDocument } from './utilities';

/**
 * Provider for a MarkupEditor.
 */
export class MarkupEditorProvider {

    static viewType = AppConstants.viewTypeId;

    static register(context) {
        console.log("Registering MarkupEditorProvider");
        const provider = new MarkupEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(MarkupEditorProvider.viewType, provider);
        return providerRegistration;
    }

    registered = false;
    fileName = undefined;
    currentPanel = undefined;

    constructor(context) {
        this.context = context;
    }

    /**
     * Called when the editor is opened.
     */
    async resolveCustomTextEditor(document, webviewPanel) {
        this.fileName = document.fileName;
        this.currentPanel = webviewPanel;
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'styles'),
                vscode.Uri.joinPath(this.context.extensionUri, 'scripts'),
                vscode.Uri.file(pathToDocument(document))
            ]
        };
        webviewPanel.webview.html = this._getHtmlForWebview(webviewPanel.webview);
        webviewPanel.onDidChangeViewState(e => {
            this.currentPanel = e.webviewPanel;
        });

        try {
            if (!this.registered) {
                this.registered = true;
                let openInTextEditorCommand = vscode.commands.registerCommand(AppConstants.openInTextEditorCommand, () => {
                    vscode.commands.executeCommand('workbench.action.reopenTextEditor', document?.uri);
                });

                this.context.subscriptions.push(openInTextEditorCommand);
            }
        } catch (e) {
            console.log(e);
        }

        async function updateWebview() {
            const contents = await document.getText();
            const webview = webviewPanel.webview
            const uriPrefix = webview.asWebviewUri(vscode.Uri.file('')).toString();
            const path = pathToDocument(document);
            webview.postMessage({
                type: 'update',
                contents: contents,
                uriPrefix: uriPrefix,
                path: path
            });
        }

        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                updateWebview();
            }
        });

        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        webviewPanel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    return;
                default:
                    this.handleMUCallback(message);
                    return;
            }
        });
        updateWebview();
    }

    _getHtmlForWebview(webview) {
        // Local paths to scripts run in the webview
        const extensionUri = this.context.extensionUri;
        const scriptMarkupConfigPath = vscode.Uri.joinPath(extensionUri, 'scripts', 'markupeditor_config.js');
        const scriptMarkupPath = vscode.Uri.joinPath(extensionUri, 'scripts', 'markupeditor.js');
        const scriptMarkupBootstrapPath = vscode.Uri.joinPath(extensionUri, 'scripts', 'markupeditor_vs.js');

        // And the uris we use to load scripts in the webview
        const scriptMarkupConfigUri = webview.asWebviewUri(scriptMarkupConfigPath);
        const scriptMarkupUri = webview.asWebviewUri(scriptMarkupPath);
        const scriptMarkupBootstrapUri = webview.asWebviewUri(scriptMarkupBootstrapPath);

        // Local path to css styles
        // Note that mirror.css, markup.css, and codelog.css are unmodified copies from MarkupEditor and CodeLog.
        const styleResetPath = vscode.Uri.joinPath(extensionUri, 'styles', 'reset.css');
        const styleMainPath = vscode.Uri.joinPath(extensionUri, 'styles', 'vscode.css');
        const styleMirrorPath = vscode.Uri.joinPath(extensionUri, 'styles', 'mirror.css');
        const styleMarkupPath = vscode.Uri.joinPath(extensionUri, 'styles', 'markup.css');
        const styleMarkupVSPath = vscode.Uri.joinPath(extensionUri, 'styles', 'markup_vs.css');
        const styleCodiconsPath = vscode.Uri.joinPath(extensionUri, 'styles', 'codicon.css');

        // Uri to load styles into webview
        const styleResetUri = webview.asWebviewUri(styleResetPath);
        const styleMainUri = webview.asWebviewUri(styleMainPath);
        const styleMirrorUri = webview.asWebviewUri(styleMirrorPath);
        const styleMarkupUri = webview.asWebviewUri(styleMarkupPath);
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
            
                        <link href="${styleResetUri}" rel="stylesheet">
                        <link href="${styleMainUri}" rel="stylesheet">
                        <link href="${styleMirrorUri}" rel="stylesheet">
                        <link href="${styleMarkupUri}" rel="stylesheet">
                        <link href="${styleMarkupVSUri}" rel="stylesheet">
                        <link href="${styleCodiconsUri}" rel="stylesheet">
                    </head>
                    <body>
                        <div id="editor"></div>
                        <script nonce="${nonce}" src="${scriptMarkupConfigUri}"></script>
                        <script nonce="${nonce}" src="${scriptMarkupUri}"></script>
                        <script nonce="${nonce}" src="${scriptMarkupBootstrapUri}"></script>
                    </body>
                </html>`;
    };

    /** Something happened in the MarkupEditor. Take action as-needed based on the callback. */
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

}