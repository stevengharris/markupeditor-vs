export class AppConstants {
    static viewTypeId = 'markupeditor.editor';
    static openInTextEditorCommand = 'markupeditor.openInTextEditor';
    static openInMarkupEditorCommand = 'markupeditor.openInMarkupEditor';
};

export function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

/**
 * Return the path of the directory containing `document`.
 * 
 * @param {TextDocument} document   A TextDocument; e.g., used for a CustomTextEditor
 * @returns {string}                The directory path to the `document`
 */
export function pathToDocument(document) {
    const pathComponents = document.fileName.split('/');
    pathComponents.splice(pathComponents.length - 1, 1);
    return pathComponents.join('/');
};