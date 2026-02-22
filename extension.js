const vscode = require('vscode');

/** @type {vscode.WebviewPanel | null} */
let panel = null;


/**
 * @param {number} lineCount
 * @param {number} goal
 * @returns {String}
 */

function getEncouragementMessage(lineCount, goal) {
	if (goal=== 0) return '';
	const percent = (lineCount / goal) * 100;
	if (percent >= 100) return "Daily goal Completed!! YAYAY";
	if (percent >= 75) return "Almost done! A few more lines!";
	if (percent >= 50) return "Half way there! Keep Going!!!";
	if (percent >= 25) return "Just Getting Started!";
	return "Start coding to complete your daily goal!!";
}

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
	// test case for reviving logic
	// context.globalState.update('isDead', true);
	// context.globalState.update('hearts', 0);
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
	/** @type {Object<string, {lines: number, goal: number, met: boolean}>} */
	let history = context.globalState.get('history', {});
	if (lastDate !== today) {
		history[lastDate] = {
			lines: lineCount,
			goal: goal,
			met: lineCount >= goal
		}
		if (lastDate !== ''){
			const lastDateObj = new Date(lastDate);
			const todayObj = new Date(today);
			const daysDiff = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000*60*60*24));
			for (let i =0; i < daysDiff; i++) {
				if (i===0) {
					if (lineCount >= goal && goal !== 0) {
						streaks++;
						if (streaks % 5 === 0 && hearts < 3) {
							hearts++;
						}
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
		context.globalState.update('history', history);
	}
	// live count status bar 
	const statusBarLineCount = vscode.window.createStatusBarItem();
	statusBarLineCount.text = `$(pulse) Lines today: ${lineCount}`;
	statusBarLineCount.command = 'kat.open';
	statusBarLineCount.tooltip = goal > 0 ? `Goal: ${goal} lines | ${Math.max(goal - lineCount, 0)} left` : 'No goal set';
	statusBarLineCount.show();
	const reminderInterval = setInterval(function() {
		if (panel) return;
		let currentGoal = context.globalState.get('goal', 0);
		if (currentGoal === 0 || isDead) return;
		const msg = getEncouragementMessage(lineCount, currentGoal);
		vscode.window.showInformationMessage(
			`${msg} (${lineCount}/${currentGoal} lines today)`,
			'Open Kat'
		).then(function(selection) {
			if (selection === 'Open Kat') {
				vscode.commands.executeCommand('kat.open');
			}
		});
	}, 20 * 60 * 1000);
	context.subscriptions.push({ dispose: () => clearInterval(reminderInterval) });
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
		panel.webview.onDidReceiveMessage(function(message) {
			if (message.type === 'revive') {
				hearts = 1;
				isDead = false;
				context.globalState.update('hearts', hearts);
				context.globalState.update('isDead', isDead);
				let currentGoal = context.globalState.get('goal', 0);
				if (panel) {
					panel.webview.postMessage({ lineCount: lineCount, goal: currentGoal, hearts: hearts, isDead: isDead, streaks: streaks, history: history});
				}
			}
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
			<p id="encouragement" style="font-size: 1.1rem; color: #555; margin-top: 10px;"></p>
			<p id="label" style="margin-top: 20px;">0 / 0 lines</p>
			<div style="width:300px; background:#444; border-radius:10px; height:20px; margin-top:10px;">
				<div id="progressBar" style="width:0%; background:#7cc379; height:20px; border-radius:10px; transition: width 0.3s;"></div>
			</div>
			<div style="display:flex; gap:10px; justify-content: center; margin-top: 20px;">
				<img id="heart1" src="${heartUri}" width="100">
				<img id="heart2" src="${heartUri}" width="100">
				<img id="heart3" src="${heartUri}" width="100">
			</div>
			<button id="reviveBtn" style="display:none; margin-top: 20px; padding: 10px 24px; font-size: 1rem; background: #7cc379; color: white; border: none; border-radius: 10px; cursor: pointer;">Revive Kat :3</button>
			<div style="margin-top:28px;text-align: center;">
				<p style="font-size: 0.85rem; color: #888; margin-bottom: 8px; font-weight: bold;">Last 30 Days</p>
				<div id="heatmap" style="display:flex; gap:5px; justify-content: center; flex-wrap:wrap; max-width:380px;"></div>
    			<div id="heatmap-tooltip" style="position:fixed; display:none; background:#333; color:#fff; padding:5px 10px; border-radius:6px; font-size:0.78rem; pointer-events:none; z-index:999;"></div>
			</div>
			<script>
				const vscode = acquireVsCodeApi();
				document.getElementById('reviveBtn').addEventListener('click', function() {
					vscode.postMessage({ type: 'revive' });
				});
				// heatmap
				const tooltip= document.getElementById('heatmap-tooltip');
				let context_goal = ${currentGoal};
				let context_lineCount = ${lineCount};
				function renderHeatmap(history) {
					// adding today live progress
					const today=new Date().toDateString();
					const liveGoal = context_goal;
					const merged = Object.assign({}, history);
					if (liveGoal> 0) {
						merged[today] = { lines: context_lineCount, goal: liveGoal, met: context_lineCount >= liveGoal };
					}
					const container = document.getElementById('heatmap');
					container.innerHTML = '';
					for (let i=29; i>= 0; i--) {
						const d= new Date();
						d.setDate(d.getDate() - i);
						const key = d.toDateString();
						const entry = merged ? merged[key] : undefined;

						let bg, title;
						if (!entry) {
							bg = '#ccc';
							title = key + '\\n No Data';
						} else if (entry.met) {
							// shade of green absed on goal
							const ratio = Math.min(entry.lines / entry.goal, 2);
							const brightness = Math.round(150 + (ratio - 1)*55); 
							bg = 'rgb(60,' + brightness + ',60)';
							title = key + '\\n' + entry.lines + ' / ' + entry.goal + ' lines ';
						} else {
							// shade of red for baerly codign
							const ratio = entry.goal > 0 ? entry.lines / entry.goal : 0;
							const g = Math.round(ratio * 80);
							bg = 'rgb(180,' + g + ',' + g + ')';
							title = key + '\\n' + entry.lines + ' / ' + entry.goal + ' lines ';
						}

						const cell = document.createElement('div');
						cell.style.cssText = [
							'width:20px', 'height:20px', 'border-radius:4px',
							'background:' + bg, 'cursor:default',
							'transition:transform 0.1s', 'flex-shrink:0'
						].join(';');
						cell.addEventListener('mouseenter', function(e) {
							tooltip.style.display = 'block';
							tooltip.innerHTML = title.replace('\\n', '<br>');
						});
						cell.addEventListener('mousemove', function(e) {
							tooltip.style.left = (e.clientX + 12) + 'px';
							tooltip.style.top  = (e.clientY - 28) + 'px';
						});
						cell.addEventListener('mouseleave', function() {
							tooltip.style.display = 'none';
						});
						cell.addEventListener('mouseenter', function() { cell.style.transform = 'scale(1.3)'; }, true);
						cell.addEventListener('mouseleave', function() { cell.style.transform = 'scale(1)'; }, true);

						container.appendChild(cell);
					}
				}
				// set init state 
				let count = ${lineCount};
				let goal = ${currentGoal};
				function updateDisplay(c, g, h, d, s, hist) {
					context_lineCount = c;
					context_goal = g;
					let percent = g > 0 ? Math.min((c / g) * 100, 100): 0;
					document.getElementById('progressBar').style.width = percent + '%';
					document.getElementById('label').textContent = c + ' / ' + g + ' lines';
					if (d==true) {
						document.getElementById('catImage').src = '${deadCatUri}';
					} else {
						document.getElementById('catImage').src = '${catUri}';
					}
					if (percent >= 100) {
						document.getElementById('encouragement').textContent = "Daily Goal Complete!!";
					}
					else if (percent >= 75) {
						document.getElementById('encouragement').textContent = "Almost done! a few more lines";
					}
					else if (percent >= 50) {
						document.getElementById('encouragement').textContent = "Half way there! Keep Going";
					}
					else if (percent >= 25) {
						document.getElementById('encouragement').textContent = "Just Getting Started!";
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
					document.getElementById('reviveBtn').style.display = d ? 'block' : 'none';
					if (hist !== undefined) renderHeatmap(hist);
				}

				// run on load immediately 
				updateDisplay(count, goal, ${hearts}, ${isDead}, ${streaks}, ${JSON.stringify({})});

				// listen for updates
				window.addEventListener('message', function(event) {
					updateDisplay(event.data.lineCount, event.data.goal, event.data.hearts, event.data.isDead, event.data.streaks, event.data.history);
				});
			</script>
		</body>
		</html>`
		panel.webview.postMessage({ lineCount: lineCount, goal: currentGoal, hearts: hearts, isDead: isDead, streaks: streaks, history: history});
	});
	// set goal command
	const editgoal = vscode.commands.registerCommand('kat.edit', function () {
		askForGoal(context)
	})
	// listen for typing and increment counter when pressed enter
	vscode.workspace.onDidChangeTextDocument(function(event) {
		if (event.contentChanges.length===0) return;
		let text = event.contentChanges[0].text;
		if (text.includes('\n')) {
			//counting only newlines and updating status bar and globalState
			lineCount= lineCount+1;
			context.globalState.update('lineCount', lineCount);
			statusBarLineCount.text = `$(pulse) Lines today: ${lineCount}`;
			statusBarLineCount.tooltip = goal > 0 ? `Goal: ${goal} lines | ${Math.max(goal- lineCount, 0)} left` : 'No goal set';

			if (!panel) {
				let currentGoal = context.globalState.get('goal', 0);
				if (currentGoal > 0) {
					const percent = (lineCount / currentGoal) * 100;
					const milestone = [25, 50, 75 ,100];
					for (const m of milestone) {
						//crossing a milestone
						const prev = ((lineCount - 1) / currentGoal) * 100;
						if (prev < m && percent >= m) {
							const msg = getEncouragementMessage(lineCount, currentGoal);
							vscode.window.showInformationMessage(`${msg}`);
						}
					}
				}
			}
		}
		if (panel) {
			let currentGoal = context.globalState.get('goal', 0);
			panel.webview.postMessage({ lineCount: lineCount, goal: currentGoal, hearts: hearts, isDead: isDead, streaks: streaks, history: history});
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
