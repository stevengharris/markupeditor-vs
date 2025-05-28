// The module 'vscode' contains the VS Code extensibility API
import vscode from 'vscode';

import { MarkupEditorProvider } from './markupEditorProvider';
import { AppConstants } from './utilities';

/**
 * This method is called when the extension is activated.
 * 
 * The extension is activated the very first time the command is executed.
 * 
 * @param {vscode.ExtensionContext} context
 */
export function activate(context) {

	// Executed once when the extension is activated
	console.log('Activating MarkupEditor extension...');

	let openInMarkupEditor = vscode.commands.registerCommand(AppConstants.openInMarkupEditorCommand, () => {

		const editor = vscode.window.activeTextEditor;

		vscode.commands.executeCommand('vscode.openWith',
			editor?.document?.uri,
			AppConstants.viewTypeId,
			{
				preview: false,
				viewColumn: vscode.ViewColumn.Active
			});
	});

	context.subscriptions.push(openInMarkupEditor);
	context.subscriptions.push(MarkupEditorProvider.register(context));

	// Detect changes to MarkupEditor configuration and react accordingly.
	// TODO: Do something more than logging to the console.
	vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration("markupEditor")) {
			if (event.affectsConfiguration("markupEditor.visibility")) {
				if (event.affectsConfiguration("markupEditor.visibility.toolbar")) {
					console.log("Toolbar visibility changed.")
				} else if (event.affectsConfiguration("markupEditor.visibility.formatBar")) {
					console.log("Format bar visibility changed.")
				} else if (event.affectsConfiguration("markupEditor.visibility.styleMenu")) {
					console.log("Style menu visibility changed.")
				}
			} else if (event.affectsConfiguration("markupEditor.formatBar")) {
				console.log("Format bar contents changed.")
			} else if (event.affectsConfiguration("markupEditor.styleMenu")) {
				console.log("Style menu contents changed.")
			}
        }
    })

	console.log("MarkupEditor extension is activated.")
}

/** Called when the extension is deactivated */ 
export function deactivate() {}