import * as vscode from 'vscode';

import { Patterns } from './patterns';
import { Settings } from './settings';
import { Helpers } from './helpers';

export namespace Sorting {

    export function sortLinesByField(fieldName: string) {
        let [startLine, endLine] = Helpers.getSelectedLineRange(true);
        let regex = Patterns.FieldRegex[fieldName];
        let lineObjects = getLineObjects(vscode.window.activeTextEditor.document, startLine, endLine, fieldName, regex, parseField);
        sort(lineObjects, startLine, endLine);
    }

    export function sortLinesByTagValue(tagName: string) {
        let [startLine, endLine] = Helpers.getSelectedLineRange(true);
        let regex = Patterns.TagValueRegex;
        let lineObjects = getLineObjects(vscode.window.activeTextEditor.document, startLine, endLine, tagName, regex, parseTagValue);
        sort(lineObjects, startLine, endLine);
    }

    // get the lines of the document as objects with the text, field value and line number
    function getLineObjects(doc: vscode.TextDocument, startLine: number, endLine: number, fieldOrTagName: string, regex: RegExp, 
        fieldParser: (line: string, fieldOrTagName: string, regex: RegExp) => string): object[] {
        var lineObjects: object[] = [];

        for (var i = startLine; i <= endLine; i++) {
            let text = doc.lineAt(i).text;
            let value = "";
            if (Settings.SortCompletedTasksToEnd && text.startsWith("x ")) {
                // force to very bottom, include date for sorting
                value = "z " + text.substr(2, 10);
            } else {
                value = fieldParser(text, fieldOrTagName, regex);
            }
            lineObjects.push({ text: text, value: value, line: i });
        }
        return lineObjects;
    }

    // return the first matching portion of a regex in a line
    // replace with patterns.parseTask?
    function parseField(line: string, field: string, regex: RegExp): string {
        let response = regex.exec(line);
        if (response != null) {
            regex.lastIndex = 0;
            return response.pop();
        }
        // force to bottom
        return "y";
    }

    function parseTagValue(line: string, tagName: string, regex: RegExp): string {
        let response = regex.exec(line);
        if (response != null) {
            regex.lastIndex = 0;
            if (response.length > 2) {
                if (tagName == response[1]) {
                    return response[2];
                }
            }
        }
        // force to bottom
        return "y";
    }

    function sort(lineObjects: object[], startLine, endLine) {
        let editor = vscode.window.activeTextEditor;
        //let selectionLine = editor.selection.start.line;

        // sort the lines by the values of byField. leave lines without a field
        // in their existing order (i.e. a stable sort)
        lineObjects.sort((obja, objb) => {
            if (obja["value"] > objb["value"]) {
                return 1;
            }
            if (obja["value"] < objb["value"]) {
                return -1;
            }
            // for lines with equal field values, use the line number to make the sort stable
            return obja["line"] - objb["line"];
        })
        let sortedLines: string[] = [];
        for (var i = 0; i < lineObjects.length; i++) {
            sortedLines.push(lineObjects[i]["text"]);
        }
        // replace all the lines in the editor with the new sorted lines
        editor.edit(editBuilder => {
            const range = new vscode.Range(startLine, 0, endLine, editor.document.lineAt(endLine).text.length);
            editBuilder.replace(range, sortedLines.join('\n'));
        });
        Helpers.triggerSelectionChange();
    }
};