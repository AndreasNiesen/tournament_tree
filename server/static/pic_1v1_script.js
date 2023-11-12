let MATCH_RUNNING = false;
let MAX_ROUNDS = 0;
let CUR_ROUND = 0;
let CUR_MATCH = 0;
let PICS = {};
let TIMER_TIME_MAX = 60;
let TIMER_START = undefined;

let cur_n1 = "";
let cur_n2 = "";

let get_cur_match = document.getElementById("get_cur_match");
let countdown_timer = document.getElementById("remaining_time");
let pic1 = document.getElementById("pic1");
let pic2 = document.getElementById("pic2");
let name1 = document.getElementById("name1");
let name2 = document.getElementById("name2");

let ROUNDS = [];

function counting_down() {
    if (TIMER_START == undefined) {
        TIMER_START = performance.now();
    }

    let dtime = Math.round((performance.now() - TIMER_START) / 1000);

    if (TIMER_TIME_MAX - dtime > 0) {
        countdown_timer.innerText = TIMER_TIME_MAX - dtime;
        setTimeout(counting_down, 10);
    } else {
        countdown_timer.innerText = 0;
        TIMER_START = undefined;
    }
}


async function start_match() {
    if (MATCH_RUNNING) return;

    const json_resp = await fetch("/matchup_players/").then(resp => resp.json());

    let n1 = cur_n1 = json_resp["1"];
    let n2 = cur_n2 = json_resp["2"];

    let p1 = PICS[n1];
    let p2 = PICS[n2];

    pic1.src = `/pics/${p1}`;
    pic2.src = `/pics/${p2}`;

    name1.innerText = n1;
    name2.innerText = n2;

    await fetch(`/start_match/${n1}/${n2}`);

    countdown_timer.innerText = TIMER_TIME_MAX;
    MATCH_RUNNING = true;

    setTimeout(counting_down, 10);
    setTimeout(stop_match, TIMER_TIME_MAX * 1000);
}


async function stop_match() {
    if (!MATCH_RUNNING) return;

    await fetch("/stop_match/");

    MATCH_RUNNING = false;

    alert("MATCH OVER");
}


get_cur_match.addEventListener("click", start_match);

async function main() {
    const tournament_data = await fetch("/get_tournament_data/").then(resp => resp.json());

    PICS = tournament_data;

    console.log(tournament_data);
    console.log(Object.keys(tournament_data));
}

await main();