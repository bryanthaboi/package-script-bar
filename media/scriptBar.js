(function () {
	const vscode = acquireVsCodeApi();
	document.querySelectorAll(".script-btn").forEach(function (btn) {
		btn.addEventListener("click", function () {
			vscode.postMessage({ command: "run", scriptName: btn.dataset.script });
		});
	});
})();
