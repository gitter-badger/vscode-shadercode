'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const vscode = require("vscode");
const path = require("path");
class HLSLLintingProvider {
    activate(subscriptions) {
        this.command = vscode.commands.registerCommand(HLSLLintingProvider.commandId, this.runCodeAction, this);
        subscriptions.push(this);
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
        vscode.workspace.onDidOpenTextDocument(this.doLint, this, subscriptions);
        vscode.workspace.onDidCloseTextDocument((textDocument) => {
            this.diagnosticCollection.delete(textDocument.uri);
        }, null, subscriptions);
        vscode.workspace.onDidSaveTextDocument(this.doLint, this);
        vscode.workspace.textDocuments.forEach(this.doLint, this);
    }
    dispose() {
        this.diagnosticCollection.clear();
        this.diagnosticCollection.dispose();
        this.command.dispose();
    }
    parseErrorReport(line) {
        let matches = line.match(/^(ERROR|WARNING|INFO):\s+(.*):(\d+):\s+(.*)\s+:\s+(.*)$/mi);
        matches.splice(0, 1);
        return matches;
    }
    doLint(textDocument) {
        if (textDocument.languageId !== 'hlsl') {
            return;
        }
        const config = vscode.workspace.getConfiguration('shadercode');
        if (config.glslangValidatorPath === null || config.glslangValidatorPath === '') {
            vscode.window.showErrorMessage('GLSL Lint: config.glslangValidatorPath is empty, please set it to the executable');
            return;
        }
        // apply custom arguments for validation
        let customArgumentSet = [];
        let shaderPath = path.relative(vscode.workspace.rootPath, path.normalize(textDocument.fileName));
        if (config.lintArgTemplate && config.lintArgTemplate.length > 0) {
            for (let a of config.lintArgTemplate) {
                a = a.replace("$TARGET", shaderPath);
                customArgumentSet.push(a);
            }
        }
        let args = customArgumentSet && customArgumentSet.length > 0 ? customArgumentSet : [textDocument.fileName];
        let options = vscode.workspace.rootPath ? { cwd: vscode.workspace.rootPath, shell: true } : undefined;
        let composedOut = "";
        let diagnostics = [];
        this.diagnosticCollection.set(textDocument.uri, diagnostics);
        if (config.enableLinter) {
            let spawnedProcess = cp.spawn(config.glslangValidatorPath, [...args], options);
            if (spawnedProcess.pid) {
                spawnedProcess.stdout.on('data', (data) => { composedOut += data.toString('utf8'); });
                spawnedProcess.stdout.on('end', () => {
                    let lines = composedOut.toString().split(/(?:\r\n|\r|\n)/g);
                    if (lines)
                        lines.forEach(line => {
                            if (line !== '') {
                                // severity matcher 
                                let severity = undefined;
                                if (line.startsWith('ERROR:')) {
                                    severity = vscode.DiagnosticSeverity.Error;
                                }
                                if (line.startsWith('WARNING:')) {
                                    severity = vscode.DiagnosticSeverity.Warning;
                                }
                                if (line.startsWith('INFO:')) {
                                    severity = vscode.DiagnosticSeverity.Information;
                                }
                                // decode report line
                                if (severity !== undefined) {
                                    let matches = this.parseErrorReport(line);
                                    if (matches && matches.length == 5) {
                                        let message = matches[4], errcode = matches[3].replace(/^'(.+)?'$/, '$1'); // unquote
                                        let errorline = parseInt(matches[2]) - 1;
                                        let documentcode = textDocument.getText(new vscode.Range(errorline, 0, errorline + 1, 0)).split(/(?:\r\n|\r|\n)/g)[0];
                                        let searchedColl = documentcode.indexOf(errcode);
                                        if (searchedColl < 0) {
                                            searchedColl = 0;
                                            errcode = documentcode;
                                        } // unknown linter 
                                        let hilrange = new vscode.Range(errorline, searchedColl, errorline, searchedColl + Math.max(errcode.length - 1, 0));
                                        if (path.relative(matches[1], shaderPath).length <= 0)
                                            diagnostics.push(new vscode.Diagnostic(hilrange, message, severity));
                                        this.diagnosticCollection.set(vscode.Uri.file(path.resolve(vscode.workspace.rootPath, matches[1])), diagnostics);
                                    }
                                }
                            }
                        });
                });
            }
        }
    }
    provideCodeActions(document, range, context, token) { throw new Error('Method not implemented.'); }
    runCodeAction(document, range, message) { throw new Error('Method not implemented.'); }
}
HLSLLintingProvider.commandId = 'shadercode.lintShader';
exports.default = HLSLLintingProvider;
//# sourceMappingURL=hlslLintProvider.js.map