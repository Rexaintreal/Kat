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
	const disposable = vscode.commands.registerCommand('kat.start', function () {
		vscode.window.showInformationMessage('Kat Started!');
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
