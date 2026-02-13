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
	const disposable = vscode.commands.registerCommand('kat.start', function () {
		vscode.window.showInformationMessage('Kat Started!');
	});
	vscode.workspace.onDidChangeTextDocument(function(event) {
		let text = event.contentChanges[0].text;
		if (text.includes('\n')) {
			lineCount= lineCount+1;
			context.globalState.update('lineCount', lineCount);
		}
		console.log(lineCount)
	});
	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
