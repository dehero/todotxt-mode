import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { Helpers } from './helpers';
import { Settings } from './settings';

export namespace Files {

    export function archiveTasks() {

        const editor = vscode.window.activeTextEditor;
        let window = vscode.window;
        let currDoc = editor.document;
        let destinationPathName = path.dirname(currDoc.fileName) + path.sep + Settings.DoneFilename;
        let lineDeletes = [];

        if (path.basename(currDoc.fileName) != Settings.TodoFilename) {
            vscode.window.showInformationMessage("Archive only available for the " + Settings.TodoFilename + " file");
            return;
        }

        if (window.activeTextEditor != undefined) {
            let eol = vscode.window.activeTextEditor.document.eol == vscode.EndOfLine.CRLF ? '\r\n' : '\n';
            let lastLine = Helpers.getLastTodoLineInDocument();
            for (var i = 0; i <= lastLine; i++) {
                let lineObject = window.activeTextEditor.document.lineAt(i);
                if (currDoc.lineAt(i).text.startsWith("x ")) {
                    fs.appendFileSync(destinationPathName, lineObject.text + eol);
                    lineDeletes.push(i);
                }
            }
            deleteLines(lineDeletes, editor, currDoc);
        }
    }
    export function moveTasks(destinationFileName: string) {
        const editor = vscode.window.activeTextEditor;
        let window = vscode.window;
        let currDoc = editor.document;
        let lineDeletes = [];
        let destinationPathName = path.dirname(currDoc.fileName) + path.sep + destinationFileName;

        if (window.activeTextEditor != undefined) {
            let eol = vscode.window.activeTextEditor.document.eol == vscode.EndOfLine.CRLF ? '\r\n' : '\n';
            let [startLine, endLine] = Helpers.getSelectedLineRange(false);
            for (var i = startLine; i <= endLine; i++) {
                let lineObject = window.activeTextEditor.document.lineAt(i);
                fs.appendFileSync(destinationPathName, lineObject.text + eol);
                lineDeletes.push(i);
            }
            deleteLines(lineDeletes, editor, currDoc);
        }
    }

    function deleteLines(lines: Number[], editor: vscode.TextEditor, document: vscode.TextDocument) {
        if (lines.length > 0) {
            lines = lines.reverse();
            editor.edit(builder => {
                lines.forEach(a => {
                    builder.delete(document.lineAt(a.valueOf()).rangeIncludingLineBreak);
                })
            }).then(() => { });
        }
        Helpers.triggerSelectionChange();
    }
};