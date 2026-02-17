const vscode = require('vscode');

/** @type {vscode.WebviewPanel | null} */
let panel = null;

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {

	console.log('Kat Started! Meow :3');
	// loading today's progress from storage (0 if first run)
	let goal = context.globalState.get('goal', 0);
	if(goal === 0 ){
		askForGoal(context)
	}
	let streaks = context.globalState.get('streaks', 0);
	let lineCount = context.globalState.get('lineCount', 0);
	let lastDate = context.globalState.get('lastDate', '');
	let today = new Date().toDateString();
	let hearts = context.globalState.get('hearts', 3);
	let isDead = context.globalState.get('isDead', false);
	// new day - reset line counter 
	if (lastDate !== today) {
		if (lastDate !== ''){
			const lastDateObj = new Date(lastDate);
			const todayObj = new Date(today);
			const daysDiff = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000*60*60*24));
			for (let i =0; i < daysDiff; i++) {
				if (i===0) {
					if (lineCount >= goal && goal !== 0) {
						streaks++;
					} else {
						streaks = 0;
					}
					if (lineCount < goal && goal !== 0) {
						hearts--;
					}
				} else {
					streaks=0;
					hearts--;
				}
				if (hearts <= 0) {
					hearts = 0;
					isDead= true;
					streaks = 0;
					break;
				}
				lineCount =0;
			}
		}
		lineCount = 0;
		context.globalState.update('lineCount', lineCount);
		context.globalState.update('lastDate', today);
		context.globalState.update('hearts', hearts);
		context.globalState.update('streaks', streaks);
		context.globalState.update('isDead', isDead);
	}
	// live count status bar 
	const statusBarLineCount = vscode.window.createStatusBarItem();
	statusBarLineCount.text = `$(pulse) Lines today: ${lineCount}`;
	statusBarLineCount.command = 'kat.open';
	statusBarLineCount.show();
	// Kat panel with webview
	const disposable = vscode.commands.registerCommand('kat.open', function () {
		if(panel!=null) {
			return panel.reveal();
		}
		// local asset to webview sage uri
		const alivePath = vscode.Uri.joinPath(context.extensionUri, 'assets', 'alive.png');
		const deadPath = vscode.Uri.joinPath(context.extensionUri, 'assets', 'dead.png');
		const heart = vscode.Uri.joinPath(context.extensionUri, 'assets', 'heart.png');
		const heartEmpty = vscode.Uri.joinPath(context.extensionUri, 'assets', 'heart-empty.png');
		panel = vscode.window.createWebviewPanel('katPanel', 'Kat', vscode.ViewColumn.Two, { localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'assets')], enableScripts: true });	
		panel.onDidDispose(function() {
			panel = null;
		})
		const catUri = panel.webview.asWebviewUri(alivePath);
		const deadCatUri = panel.webview.asWebviewUri(deadPath);
		const heartUri = panel.webview.asWebviewUri(heart);
		const heartEmptyUri = panel.webview.asWebviewUri(heartEmpty);
		let currentGoal = context.globalState.get('goal', 0);
		panel.webview.html = `<!DOCTYPE html>
		<html>
		<body style="background: #f2e8e4; color: #333; display:flex; flex-direction:column; justify-content:center; align-items:center; height: 100vh; font-family: sans-serif;">
			<div id="streakLabel" style="position:absolute; top: 20px; left: 20px; font-weight: bold; font-size: 1.2rem;">
				Streaks: 0 Days
			</div>
			<img id="catImage" src="${catUri}" width="500">
			<p id="label" style="margin-top: 20px;">0 / 0 lines</p>
			<div style="width:300px; background:#444; border-radius:10px; height:20px; margin-top:10px;">
				<div id="progressBar" style="width:0%; background:#7cc379; height:20px; border-radius:10px; transition: width 0.3s;"></div>
			</div>
				<div style="display:flex; gap:10px; justify-content: center; margin-top: 20px;">
					<img id="heart1" src="${heartUri}" width="100">
					<img id="heart2" src="${heartUri}" width="100">
					<img id="heart3" src="${heartUri}" width="100">
				</div>
			<script>
				// set init state 
				let count = ${lineCount};
				let goal = ${currentGoal};
				function updateDisplay(c, g, h, d, s) {
					let percent = g > 0 ? Math.min((c / g) * 100, 100): 0;
					document.getElementById('progressBar').style.width = percent + '%';
					document.getElementById('label').textContent = c + ' / ' + g + ' lines';
					if (d==true) {
						document.getElementById('catImage').src = '${deadCatUri}';
					} else {
						document.getElementById('catImage').src = '${catUri}';
					}
					for (let i = 1; i<=3; i++) {
						const heartElement = document.getElementById('heart' + i);
						if (i <= h) {
						heartElement.src = '${heartUri}';
						} else {
							heartElement.src = '${heartEmptyUri}';
						}
					}
					document.getElementById('streakLabel').textContent = "Streak: " + s + " days";
				}

				// run on load immediately 
				updateDisplay(count, goal, ${hearts}, ${isDead}, ${streaks});

				// listen for updates
				window.addEventListener('message', function(event) {
					updateDisplay(event.data.lineCount, event.data.goal, event.data.hearts, event.data.isDead, event.data.streaks);
				});
			</script>
		</body>
		</html>`
		panel.webview.postMessage({ lineCount: lineCount, goal: currentGoal, hearts: hearts, isDead: isDead, streaks: streaks});
	});
	// set goal command
	const editgoal = vscode.commands.registerCommand('kat.edit', function () {
		askForGoal(context)
	})
	// listen for typing and increment counter when pressed enter
	vscode.workspace.onDidChangeTextDocument(function(event) {
		let text = event.contentChanges[0].text;
		if (text.includes('\n')) {
			//counting only newlines and updating status bar and globalState
			lineCount= lineCount+1;
			context.globalState.update('lineCount', lineCount);
			statusBarLineCount.text = `$(pulse) Lines today: ${lineCount}`;
		}
		if (panel) {
			let currentGoal = context.globalState.get('goal', 0);
			panel.webview.postMessage({ lineCount: lineCount, goal: currentGoal, hearts: hearts, isDead: isDead, streaks: streaks});
		}
	});
	context.subscriptions.push(editgoal);
	context.subscriptions.push(disposable);
	context.subscriptions.push(statusBarLineCount);
}

/**
 * @param {vscode.ExtensionContext} context
 */
function askForGoal(context) {
	vscode.window.showInputBox({
		prompt: 'Enter Your daily line goal',
		placeHolder: 'e.g. 1000'
	}).then(function(value) {
		if (value === undefined || value === '') {
			return;
		}
		let newGoal = parseInt(value, 10);
		if (isNaN(newGoal) || newGoal <= 0) {
			vscode.window.showErrorMessage('Please enter a valid number greater than 0');
			return;
		}
		context.globalState.update('goal', newGoal);
	})
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
