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
	"id": "s_0",
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
	"id": "t_0",
	"action": "terminate",
	"terminateId": "s_0"
};

let ping = {
	"id": "p_0",
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
	if (o.version) {
		setTimeout(pinger, 1000);						// Queue another "ping" a second from now just to see if the engine is still alive.
	}
});

err_scanner.on("line", (line) => {
	console.log("!   " + line);
	if (line.includes("ready to begin handling requests")) {
		pinger();
		sender();												// Send the first messages to KataGo.
	}
});

// ------------------------

let send = (msg) => {
	console.log(">   " + msg);
	exe.stdin.write(msg + "\n");
}

let sender = () => {

	search.id = "s_" + (sid++).toString();
	terminate.id = "t_" + (tid++).toString();			// The id of the terminate message, not the search message.
	terminate.terminateId = search.id;					// The id of the search to terminate. Matches search.id.

	send(JSON.stringify(search));
	send(JSON.stringify(terminate));					// The point is to send the terminate immediately, this seems to cause trouble.

};

let pinger = () => {
	ping.id = "p_" + (pid++).toString();
	send(JSON.stringify(ping));
};

