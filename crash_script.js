"use strict";

// REPLACE THESE WITH THE RIGHT PATHS...

const engine = "C:\\Programs (self-installed)\\KataGo-opencl\\katago.exe";
const weights = "C:\\Programs (self-installed)\\KataGo-opencl\\kata1-b40c256-s8993043968-d2186961495.bin.gz";
const config = "C:\\Users\\Owner\\Desktop\\katago_config.cfg";

// ------------------------

const child_process = require("child_process");
const path = require("path");
const readline = require("readline");

let exe = child_process.spawn(
	engine,
	["analysis", "-config", config, "-model", weights],
	{cwd: path.dirname(engine)}
);

exe.on("error", (err) => {
	console.log("ENGINE CRASHED! " + err.toString());
	process.exit();
});

exe.stdin.on("error", (err) => {
	console.log("ENGINE CRASHED! " + err.toString());
	process.exit();
});

let scanner = readline.createInterface({
	input: exe.stdout,
	output: undefined,
	terminal: false
});

let err_scanner = readline.createInterface({
	input: exe.stderr,
	output: undefined,
	terminal: false
});

// ------------------------

let search = {
	"id": "s_0",					// Gets incremented each time we send it.
	"rules": "Japanese",
	"komi": 5.5,
	"boardXSize": 19,
	"boardYSize": 19,
	"maxVisits": 1000000,
	"reportDuringSearchEvery": 0.1,
	"includeOwnership": true,
	"includeMovesOwnership": true,
	"overrideSettings": {
		"reportAnalysisWinratesAs": "SIDETOMOVE",
		"wideRootNoise": 0.05
	},
	"initialStones": [],
	"moves": [],
	"initialPlayer": "B"
};

let terminate = {
	"id": "t_0",					// Gets incremented each time we send it.
	"action": "terminate",
	"terminateId": "s_0"			// Is adjusted to match the search.id.
};

let ping = {
	"id": "p_0",					// Gets incremented each time we send it.
	"action": "query_version",
};

let sid = 0;
let tid = 0;
let pid = 0;

// ------------------------

scanner.on("line", (line) => {
	console.log("<== " + line);
	let o = JSON.parse(line);
	if (o.id === search.id && o.isDuringSearch === false) {
		sender();
	}
	setTimeout(pinger, 1000);						// Queue a message a second from now just to see if the engine is still alive.
});

err_scanner.on("line", (line) => {
	console.log("!   " + line);
	if (line.includes("ready to begin handling requests")) {
		sender();									// Send the first messages to KataGo.
	}
});

// ------------------------

let sender = () => {

	search.id = "s_" + (sid++).toString();
	terminate.id = "t_" + (tid++).toString();		// The id of the terminate message, not the search message.
	terminate.terminateId = search.id;

	console.log(">   " + JSON.stringify(search));
	exe.stdin.write(JSON.stringify(search));
	exe.stdin.write("\n");

	console.log(">   " + JSON.stringify(terminate));
	exe.stdin.write(JSON.stringify(terminate));
	exe.stdin.write("\n");

};

let pinger = () => {
	ping.id = "p_" + (pid++).toString();
	exe.stdin.write(JSON.stringify(ping));
	exe.stdin.write("\n");
};
