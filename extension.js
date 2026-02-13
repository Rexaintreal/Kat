const vscode = require('vscode');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Kat Started! Meow :3');
	let lineCount = context.globalState.get('lineCount', 0);
	let lastDate = context.globalState.get('lastDate', '');
	let today = new Date().toDateString();
	console.log(lineCount)
	console.log(lastDate)
	console.log(today)
	if (lastDate !== today) {
		lineCount=0;
		context.globalState.update('lastDate', today);
	}
	const statusBarLineCount = vscode.window.createStatusBarItem();
	statusBarLineCount.text = `$(pulse) Lines today: ${lineCount}`;
	const disposable = vscode.commands.registerCommand('kat.open', function () {
		const alivePath = vscode.Uri.joinPath(context.extensionUri, 'assets', 'alive.png');
		const panel = vscode.window.createWebviewPanel('katPanel', 'Kat', vscode.ViewColumn.Two, { localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'assets')] });
		const catUri = panel.webview.asWebviewUri(alivePath);
		panel.webview.html = `<!DOCTYPE html>
		<html>
		<body style="background: #1e1e1e; display:flex; justify-content:center; align-items:center; height: 100vh;">
			<img src="${catUri}" width="200">
		</body>
		</html>`
	});
	vscode.workspace.onDidChangeTextDocument(function(event) {
		let text = event.contentChanges[0].text;
		if (text.includes('\n')) {
			lineCount= lineCount+1;
			context.globalState.update('lineCount', lineCount);
			statusBarLineCount.text = `$(pulse) Lines today: ${lineCount}`;
		}
		console.log(lineCount)
	});
	statusBarLineCount.show();
	context.subscriptions.push(disposable);
	context.subscriptions.push(statusBarLineCount);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
