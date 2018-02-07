'use strict';
import * as cp from 'child_process';

import * as vscode from 'vscode';

// TODO for implement
export default class GLSLTaskProvider implements vscode.CodeActionProvider {
    private static commandId: string = 'shadercode.taskShader';
    private command: vscode.Disposable;
    private diagnosticCollection: vscode.DiagnosticCollection;

    public provideCodeActions(
        document: vscode.TextDocument, range: vscode.Range,
        context: vscode.CodeActionContext, token: vscode.CancellationToken):
        vscode.ProviderResult<vscode.Command[]> 
    {
      throw new Error('Method not implemented.');
    }
  
    private runCodeAction(document: vscode.TextDocument, range: vscode.Range, message: string): any 
    {
      throw new Error('Method not implemented.');
    }
};