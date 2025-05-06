import vscode from 'vscode';
import { AppConstants } from './utilities';
import { MarkupCoordinator } from './markupCoordinator';

/**
 * Provider for a MarkupEditor custom text editor.
 * 
 * The MarkupEditorProvider holds onto the MarkupCoordinator that sets up the webview for the panel and 
 * coordinated messaging between the extension and the webview.
 */
export class MarkupEditorProvider {

    static viewType = AppConstants.viewTypeId;

    static register(context) {
        console.log("Registering MarkupEditorProvider");
        const provider = new MarkupEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(MarkupEditorProvider.viewType, provider);
        return providerRegistration;
    }

    context;
    registered = false;
    coordinator = undefined;

    constructor(context) {
        this.context = context;
    }

    /**
     * Called when the editor is opened.
     */
    async resolveCustomTextEditor(document, webviewPanel) {

        // The MarkupCoordinator sets up the webview for the webviewPanel and coordinates the 
        // messaging between the extension and the webview.
        this.coordinator = new MarkupCoordinator(this.context, document, webviewPanel)
        
        // If we are not already registered, then register the commands.
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

    }

}