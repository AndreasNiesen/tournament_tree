let CURRENT_ROUND = 0;
let CURRENT_MATCH = 0;
let ROUNDS = [];
let MAX_ROUNDS_INDEX = 0;
let PICS = {};

let NAME_THIRDFOURTH = "";
let NAME_FOURTHTHIRD = "";

let FIRST_PLACE = "";
let SECOND_PLACE = "";
let THIRD_PLACE = "";

let MATCH_ACTIVE = false;
let FINAL_MATCH_DONE = false;


function get_matchup_strings(name1, name2, round, match_in_round) {
    let dp_name1 = name1;
    let dp_name2 = name2;

    if (name1.toLowerCase().startsWith("gamesbar_gaming_")) {
        dp_name1 = `skip_${name1.split("_")[2]}`
    }

    if (name2.toLowerCase().startsWith("gamesbar_gaming_")) {
        dp_name2 = `skip_${name2.split("_")[2]}`
    }

    let ret_string = `
<div class="round_matchup" id="match_${round}_${match_in_round}">
    <div class="matchup_player" data-fighter="${name1}" data-matchup="${name1}-VERSUS-${name2}">
        <div class="player_name"><p>${dp_name1}</p></div>
        <div class="player_votes"><p>0</p></div>
    </div>
    <div class="matchup_player" data-fighter="${name2}" data-matchup="${name1}-VERSUS-${name2}">
        <div class="player_name"><p>${dp_name2}</p></div>
        <div class="player_votes"><p>0</p></div>
    </div>
</div>
`;


    return ret_string;
}


function shuffle_array(arr) {
    let max_index = arr.length - 1;

    do {
        console.log("shuffling...");
        for (let i = 0; i < arr.length; i++) {
            let index = Math.floor(Math.random() * max_index);
    
            let buff = arr[i];
            arr[i] = arr[index];
            arr[index] = buff;
        }
    } while (!properly_mixed(arr))

    console.log("properly shuffled!");
    return arr;
}

function properly_mixed(arr) {
    // TODO: find a better way to prevent a "dead" match

    for (let i = 0; i < arr.length; i += 2) {
        let n1 = arr[i];
        let n2 = arr[i + 1];

        if (n1.startsWith("gamesbar_gaming_") && n2.startsWith("gamesbar_gaming_")) return false;
    }

    return true;
}


document.getElementById("controls_prepare_match").addEventListener("click", async e => {
    if (!MATCH_ACTIVE && !FINAL_MATCH_DONE) {
        document.getElementById(`match_${CURRENT_ROUND}_${CURRENT_MATCH}`).classList.add("active");
        
        let n1 = ROUNDS[CURRENT_ROUND][CURRENT_MATCH * 2];
        let n2 = ROUNDS[CURRENT_ROUND][(CURRENT_MATCH * 2) + 1];
    
        await fetch(`/prepare_match/${n1}/${n2}`);

        MATCH_ACTIVE = true;
    } else {
        console.log(FINAL_MATCH_DONE ? "Das Turnier ist schon abgeschlossen!" : "Es läuft schon ein Match!");
    }
});


function push_n1_winner(n1, n2) {
    ROUNDS[CURRENT_ROUND + 1].push(n1);

    if (CURRENT_ROUND == MAX_ROUNDS_INDEX - 1) {
        if (CURRENT_MATCH == 0) NAME_THIRDFOURTH = n2;
        else NAME_FOURTHTHIRD = n2;
    } else if (CURRENT_ROUND == MAX_ROUNDS_INDEX) {
        if (CURRENT_MATCH == 0) {
            THIRD_PLACE = n1;
        } else if (CURRENT_MATCH == 1) {
            FIRST_PLACE = n1;
            SECOND_PLACE = n2;
        }
    }

    document.querySelector(`[data-fighter="${n2}"][data-matchup="${n1}-VERSUS-${n2}"]`).classList.add("lost_match");
}


function push_n2_winner(n1, n2) {
    ROUNDS[CURRENT_ROUND + 1].push(n2);

    if (CURRENT_ROUND == MAX_ROUNDS_INDEX - 1) {
        if (CURRENT_MATCH == 0) NAME_THIRDFOURTH = n1;
        else NAME_FOURTHTHIRD = n1;
    } else if (CURRENT_ROUND == MAX_ROUNDS_INDEX) {
        if (CURRENT_MATCH == 0) {
            THIRD_PLACE = n2;
        } else if (CURRENT_MATCH == 1) {
            FIRST_PLACE = n2;
            SECOND_PLACE = n1;
        }
    }

    document.querySelector(`[data-fighter="${n1}"][data-matchup="${n1}-VERSUS-${n2}"]`).classList.add("lost_match");
}


document.getElementById("controls_end_match").addEventListener("click", async e => {
    if (MATCH_ACTIVE) {
        document.getElementById(`match_${CURRENT_ROUND}_${CURRENT_MATCH}`).classList.remove("active");
    
        const match_running = await fetch("/match_running/").then(resp => resp.json());

        if(match_running["match_running"])
            await fetch("/stop_match/")
        
        MATCH_ACTIVE = false;

        let json_resp = await fetch("/votes/").then(resp => resp.json())
    
        let setup_next_round = false;
    
        let n1 = ROUNDS[CURRENT_ROUND][CURRENT_MATCH * 2];
        let n2 = ROUNDS[CURRENT_ROUND][(CURRENT_MATCH * 2) + 1];
    
        let v1 = json_resp[n1];
        let v2 = json_resp[n2];
    
        if (!n1.toLowerCase().startsWith("gamesbar_gaming_") && !n2.toLowerCase().startsWith("gamesbar_gaming_")) {
            let vd1 = document.querySelector(`[data-fighter="${n1}"][data-matchup="${n1}-VERSUS-${n2}"] > .player_votes > p`);
            let vd2 = document.querySelector(`[data-fighter="${n2}"][data-matchup="${n1}-VERSUS-${n2}"] > .player_votes > p`);
        
            vd1.innerHTML = v1;
            vd2.innerHTML = v2;
        }
    
        if (!ROUNDS[CURRENT_ROUND + 1]) ROUNDS[CURRENT_ROUND + 1] = [];
    
        if (v1 > v2 || n2.toLowerCase().startsWith("gamesbar_gaming_")) {
            push_n1_winner(n1, n2);
        } else if (v1 < v2 || n1.toLowerCase().startsWith("gamesbar_gaming_")) {
            push_n2_winner(n1, n2);
        } else {
            let even = Math.floor(Math.random() * 100) % 2 == 0;

            if (even) {
                push_n1_winner(n1, n2);
            } else {
                push_n2_winner(n1, n2);
            }
        }
    
        if (CURRENT_MATCH >= (ROUNDS[CURRENT_ROUND].length / 2) - 1) {
            CURRENT_ROUND += 1;
            CURRENT_MATCH = 0;
            setup_next_round = true;
        }
        else {
            CURRENT_MATCH += 1;
        }
    
        if (CURRENT_ROUND > MAX_ROUNDS_INDEX) {
            FINAL_MATCH_DONE = true;
            
            document.getElementById("first_place_img").src = `/pics/${PICS[FIRST_PLACE]}`;
            document.getElementById("second_place_img").src = `/pics/${PICS[SECOND_PLACE]}`;
            document.getElementById("third_place_img").src = `/pics/${PICS[THIRD_PLACE]}`;

            document.getElementById("first_place_name").src = `/pics/${FIRST_PLACE}`;
            document.getElementById("second_place_name").src = `/pics/${SECOND_PLACE}`;
            document.getElementById("third_place_name").src = `/pics/${THIRD_PLACE}`;

            document.getElementById("final_podest").classList.add("active");

            return;
        }
    
        if (setup_next_round) {
            console.log("setting up next round")

            if (CURRENT_ROUND == MAX_ROUNDS_INDEX) {
                ROUNDS[CURRENT_ROUND].unshift(NAME_FOURTHTHIRD);
                ROUNDS[CURRENT_ROUND].unshift(NAME_THIRDFOURTH);
            }

            let next_round = document.getElementById(`round_${CURRENT_ROUND}`);
    
            for (let i = 0; i < ROUNDS[CURRENT_ROUND].length; i += 2) {
                let n1 = ROUNDS[CURRENT_ROUND][i];
                let n2 = ROUNDS[CURRENT_ROUND][i + 1];
    
                next_round.innerHTML += get_matchup_strings(n1, n2, CURRENT_ROUND, i / 2);
            }
        }
    } else {
        console.log("Es ist zurzeit kein Match aktiv.");
    }
});


document.getElementById("controls_update_standings").addEventListener("click", async e => {
    if (MATCH_ACTIVE) {
        let json_resp = await fetch("/votes/").then(resp => resp.json());
    
        let n1 = ROUNDS[CURRENT_ROUND][CURRENT_MATCH * 2];
        let n2 = ROUNDS[CURRENT_ROUND][(CURRENT_MATCH * 2) + 1];
    
        let v1 = json_resp[n1];
        let v2 = json_resp[n2];
    
        if (!n1.toLowerCase().startsWith("gamesbar_gaming_") && !n2.toLowerCase().startsWith("gamesbar_gaming_")) {
            let vd1 = document.querySelector(`[data-fighter="${n1}"][data-matchup="${n1}-VERSUS-${n2}"] > .player_votes > p`);
            let vd2 = document.querySelector(`[data-fighter="${n2}"][data-matchup="${n1}-VERSUS-${n2}"] > .player_votes > p`);
        
            vd1.innerHTML = v1;
            vd2.innerHTML = v2;
        }
    }
});


async function main() {
    const first_round = document.getElementById("round_0");
    const json_resp = await fetch("/get_tournament_data/").then(resp => resp.json());
    
    PICS = json_resp;

    ROUNDS[0] = shuffle_array(Object.keys(json_resp));
    
    MAX_ROUNDS_INDEX = Math.log2(ROUNDS[0].length) - 1;

    if (MAX_ROUNDS_INDEX < 1) {
        alert("Nicht genug Teilnehmer für ein Turnier!");
        return;
    }
    
    for (let i = 0; i < ROUNDS[0].length; i += 2) {
        let n1 = ROUNDS[0][i];
        let n2 = ROUNDS[0][i + 1];
        
        first_round.innerHTML += get_matchup_strings(n1, n2, 0, i / 2);
    }

    console.log(json_resp)
    console.log(ROUNDS)
}


await main();