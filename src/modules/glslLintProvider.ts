'use strict';
import * as cp from 'child_process';

import * as vscode from 'vscode';

import * as path from 'path';

export default class GLSLLintingProvider implements vscode.CodeActionProvider {
  private static commandId: string = 'shadercode.lintShader';
  private command: vscode.Disposable;
  private diagnosticCollection: vscode.DiagnosticCollection;
  private customArgumentSet: string[];

  public activate(subscriptions: vscode.Disposable[]) {
    this.command = vscode.commands.registerCommand(GLSLLintingProvider.commandId, this.runCodeAction, this);
    subscriptions.push(this);
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection();

    vscode.workspace.onDidOpenTextDocument(this.doLint, this, subscriptions);
    vscode.workspace.onDidCloseTextDocument((textDocument) => {
      this.diagnosticCollection.delete(textDocument.uri);
    }, null, subscriptions);

    vscode.workspace.onDidSaveTextDocument(this.doLint, this);
    vscode.workspace.textDocuments.forEach(this.doLint, this);
  }

  public dispose(): void {
    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();
    this.command.dispose();
  }

  private doLint(textDocument: vscode.TextDocument): any {
    if (textDocument.languageId !== 'glsl') {
      return;
    }

    const config = vscode.workspace.getConfiguration('shadercode');
    // The code you place here will be executed every time your command is
    // executed
    if (config.glslangValidatorPath === null ||
        config.glslangValidatorPath === '') {
      vscode.window.showErrorMessage(
          'GLSL Lint: config.glslangValidatorPath is empty, please set it to the executable');
      return;
    }

    // apply custom arguments for validation
    let customArgumentSet: string[] = [];
    let shaderPath = path.relative(vscode.workspace.rootPath, path.normalize(textDocument.fileName));

    if (config.lintArgTemplate && config.lintArgTemplate.length > 0) {
      for (let a of config.lintArgTemplate) {
        a = a.replace("$TARGET", shaderPath);
        customArgumentSet.push(a);
      }
    }
    
    
    let args: string[] = customArgumentSet && customArgumentSet.length > 0 ? customArgumentSet : [textDocument.fileName];
    let options = vscode.workspace.rootPath ? { cwd: vscode.workspace.rootPath, shell: true } : undefined;
    let composedOut = "";
    


    let diagnostics: vscode.Diagnostic[] = [];
    this.diagnosticCollection.set(textDocument.uri, diagnostics);

    if (config.enableLinter) {
      let spawnedProcess = cp.spawn(config.glslangValidatorPath, [...args], options);
      if (spawnedProcess.pid) {
        spawnedProcess.stdout.on('data', (data: Buffer) => {
          composedOut += data.toString('utf8');
        });

        spawnedProcess.stdout.on('end', () => {
          let lines = composedOut.toString().split(/(?:\r\n|\r|\n)/g);
          if (lines) lines.forEach(line => {
            if (line !== '') {
              
              // severity matcher 
              let severity: vscode.DiagnosticSeverity = undefined;
              if (line.startsWith('ERROR:')) { severity = vscode.DiagnosticSeverity.Error; }
              if (line.startsWith('WARNING:')) { severity = vscode.DiagnosticSeverity.Warning; }
              if (line.startsWith('INFO:')) { severity = vscode.DiagnosticSeverity.Information; }

              // decode report line
              if (severity !== undefined) {
                let matches = line.match(/^(ERROR|WARNING|INFO):\s+(.*):(\d+):\s+(.*)\s+:\s+(.*)$/mi);
                matches.splice(0,1); // 
                if (matches && matches.length == 5) {
                  let message = matches[4];
                  matches[3] = matches[3].replace(/^'(.+)?'$/,'$1'); // unquote

                  let errorline = parseInt(matches[2])-1;
                  let codeline = textDocument.getText(new vscode.Range(errorline, 0, errorline+1, 0)).split(/(?:\r\n|\r|\n)/g)[0];

                  let searchedColl = codeline.indexOf(matches[3]);
                  if (searchedColl < 0) { searchedColl = 0; matches[3] = codeline; } // unknown linter 

                  let range = new vscode.Range(errorline, searchedColl, errorline, searchedColl + Math.max(matches[3].length-1, 0));
                  let relp = path.relative(matches[1], shaderPath);
                  if ( relp.length <= 0 ) {
                    diagnostics.push(new vscode.Diagnostic(range, message, severity));
                  }
                  this.diagnosticCollection.set(vscode.Uri.file(path.resolve(vscode.workspace.rootPath, matches[1])), diagnostics);
                }
              }
            }
          });
          //this.diagnosticCollection.set(textDocument.uri, diagnostics);
          //this.diagnosticCollection.set(vscode.Uri.file(path.resolve(vscode.workspace.rootPath, shaderPath)), diagnostics);
        });
      }
    }
  }

  public provideCodeActions(
      document: vscode.TextDocument, range: vscode.Range,
      context: vscode.CodeActionContext, token: vscode.CancellationToken):
      vscode.ProviderResult<vscode.Command[]> {
    throw new Error('Method not implemented.');
  }

  private runCodeAction(
      document: vscode.TextDocument, range: vscode.Range,
      message: string): any {
    throw new Error('Method not implemented.');
  }
}