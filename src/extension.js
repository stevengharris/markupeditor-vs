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

	// MU commands are for the MarkupEditor. They are mapped to hotkeys in the package.json file 
	// and invoke some action in the MarkupEditor hosted in the MarkupEditorPanel.
	registerMUCommands();

	console.log("MarkupEditor extension is activated.")
}

/** Called when the extension is deactivated */ 
export function deactivate() {}

/**
 * The MUCommands invoke a MarkupEditor editing action in the MarkupEditorPanel.
 */
function registerMUCommands() {
	vscode.commands.registerCommand('markupeditor.toggleBold', () => {
		MarkupEditorProvider.currentPanel.webview.postMessage({
			command: 'toggleBold'
		});
	});
	vscode.commands.registerCommand('markupeditor.toggleItalic', () => {
		MarkupEditorProvider.currentPanel.webview.postMessage({
			command: 'toggleItalic'
		});
	});
	vscode.commands.registerCommand('markupeditor.toggleUnderline', () => {
		MarkupEditorProvider.currentPanel.webview.postMessage({
			command: 'toggleUnderline'
		});
	});
	vscode.commands.registerCommand('markupeditor.toggleCode', () => {
		MarkupEditorProvider.currentPanel.webview.postMessage({
			command: 'toggleCode'
		});
	});
	vscode.commands.registerCommand('markupeditor.indent', () => {
		MarkupEditorProvider.currentPanel.webview.postMessage({
			command: 'indent'
		});
	});
	vscode.commands.registerCommand('markupeditor.outdent', () => {
		MarkupEditorProvider.currentPanel.webview.postMessage({
			command: 'outdent'
		});
	});
};
