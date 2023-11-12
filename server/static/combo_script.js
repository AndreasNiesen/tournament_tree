let CURRENT_ROUND = 0;
let CURRENT_MATCH = 0;
let ROUNDS = [];
let MAX_ROUNDS = 0;
let PICS = {};

let NAME_THIRDFOURTH = "";
let NAME_FOURTHTHIRD = "";

let MATCH_ACTIVE = false;
let MATCH3rdPLACE = false;

const img1 = document.getElementById("img_1");
const img2 = document.getElementById("img_2");
const name1 = document.getElementById("name_1");
const name2 = document.getElementById("name_2");

const podest = document.getElementById("placement_area");
const first = {
    img: document.getElementById("first_place_img"),
    h: document.getElementById("fp_heading"),
    name: document.getElementById("first_place_name"),
};
const second = {
    img: document.getElementById("second_place_img"),
    h: document.getElementById("sp_heading"),
    name: document.getElementById("second_place_name"),
};
const third = {
    img: document.getElementById("third_place_img"),
    h: document.getElementById("tp_heading"),
    name: document.getElementById("third_place_name"),
};
const thirdfourth = {
    img: document.getElementById("thirdfourth_place_img"),
    h: document.getElementById("tfp_heading"),
    name: document.getElementById("thirdfourth_place_name"),
};
const fourththird = {
    img: document.getElementById("fourththird_place_img"),
    h: document.getElementById("ftp_heading"),
    name: document.getElementById("fourththird_place_name"),
};

function get_matchup_strings(name1, name2, round, match_in_round) {
    if (name1.toLowerCase().startsWith("gamesbar_gaming_")) {
        name1 = `skip_${name1.split("_")[2]}`
    }

    if (name2.toLowerCase().startsWith("gamesbar_gaming_")) {
        name2 = `skip_${name2.split("_")[2]}`
    }

    let ret_string = `
<div class="round_matchup" id="match_${round}_${match_in_round}">
    <div class="matchup_player" id="${name1}">
        <div class="player_name"><p>${name1}</p></div>
        <div class="player_votes"><p>0</p></div>
    </div>
    <div class="matchup_player" id="${name2}">
        <div class="player_name"><p>${name2}</p></div>
        <div class="player_votes"><p>0</p></div>
    </div>
</div>
`;

    return ret_string;
}


function shuffle_array(arr) {
    let max_index = arr.length - 1;

    do {
        console.log("shuffling");
        for (let i = 0; i < arr.length; i++) {
            let index = Math.floor(Math.random() * max_index);
    
            let buff = arr[i];
            arr[i] = arr[index];
            arr[index] = buff;
        }
    } while (!properly_mixed(arr))

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


document.getElementById("controls_start_match").addEventListener("click", async e => {
    if (!MATCH_ACTIVE && !MATCH3rdPLACE) {
        document.getElementById(`match_${CURRENT_ROUND}_${CURRENT_MATCH}`).classList.add("active");
        
        let n1 = ROUNDS[CURRENT_ROUND][CURRENT_MATCH * 2];
        let n2 = ROUNDS[CURRENT_ROUND][(CURRENT_MATCH * 2) + 1];
    
        let p1 = PICS[n1];
        let p2 = PICS[n2];

        name1.innerText = n1 ? n1 : "";
        name2.innerText = n2 ? n2 : "";
        
        img1.src = p1 ? `./pics/${p1}` : "";
        img2.src = p2 ? `./pics/${p2}` : "";
    
        await fetch(`./start_match/${n1}/${n2}`);

        MATCH_ACTIVE = true;
    } else if (!MATCH_ACTIVE && MATCH3rdPLACE) {
        await fetch(`./start_match/${NAME_THIRDFOURTH}/${NAME_FOURTHTHIRD}`);

        MATCH_ACTIVE = true;
    } else {
        console.log("Es läuft schon ein Match!");
    }
});

document.getElementById("controls_end_match").addEventListener("click", async e => {
    if (MATCH_ACTIVE && !MATCH3rdPLACE) {
        document.getElementById(`match_${CURRENT_ROUND}_${CURRENT_MATCH}`).classList.remove("active");
    
        await fetch("./stop_match/")
        MATCH_ACTIVE = false;

        let json_resp = await fetch("./votes/").then(resp => resp.json())
    
        let setup_next_round = false;
    
        let n1 = ROUNDS[CURRENT_ROUND][CURRENT_MATCH * 2];
        let n2 = ROUNDS[CURRENT_ROUND][(CURRENT_MATCH * 2) + 1];
    
        let v1 = json_resp[n1];
        let v2 = json_resp[n2];
    
        if (!n1.toLowerCase().startsWith("gamesbar_gaming_") && !n2.toLowerCase().startsWith("gamesbar_gaming_")) {
            let vd1 = document.querySelector(`#match_${CURRENT_ROUND}_${CURRENT_MATCH} > #${n1} > .player_votes > p`);
            let vd2 = document.querySelector(`#match_${CURRENT_ROUND}_${CURRENT_MATCH} > #${n2} > .player_votes > p`);
        
            vd1.innerHTML = v1;
            vd2.innerHTML = v2;
        }
    
        if (!ROUNDS[CURRENT_ROUND + 1]) ROUNDS[CURRENT_ROUND + 1] = [];
    
        if (v1 > v2 || n2.toLowerCase().startsWith("gamesbar_gaming_")) {
            ROUNDS[CURRENT_ROUND + 1].push(n1);

            if (ROUNDS[CURRENT_ROUND].length == 4) {
                if (CURRENT_MATCH == 0) NAME_THIRDFOURTH = n2;
                else NAME_FOURTHTHIRD = n2;
            }
        } else {
            ROUNDS[CURRENT_ROUND + 1].push(n2);

            if (ROUNDS[CURRENT_ROUND].length == 4) {
                if (CURRENT_MATCH == 0) NAME_THIRDFOURTH = n1;
                else NAME_FOURTHTHIRD = n1;
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
    
        if (CURRENT_ROUND >= MAX_ROUNDS) {
            MATCH3rdPLACE = true;
            
            let name_fp = ROUNDS[CURRENT_ROUND][0];
            let pic_fp = PICS[name_fp];
            first.h.innerText = "1";
            first.img.src = pic_fp ? `./pics/${pic_fp}` : ""; 
            first.name.innerText = name_fp ? name_fp : "";

            let name_sp = ROUNDS[CURRENT_ROUND-1][0] == name_fp ? ROUNDS[CURRENT_ROUND-1][1] : ROUNDS[CURRENT_ROUND-1][0];
            let pic_sp = PICS[name_sp];
            second.h.innerText = "2";
            second.img.src = pic_sp ? `./pics/${pic_sp}` : ""; 
            second.name.innerText = name_sp ? name_sp : "";

            third.h.innerText = "3";
            third.img.src = ""; 
            third.name.innerText = "";

            let name_tfp = NAME_THIRDFOURTH;
            let pic_tfp = PICS[name_tfp];
            thirdfourth.h.innerText = "3/4";
            thirdfourth.img.src = pic_tfp ? `./pics/${pic_tfp}` : ""; 
            thirdfourth.name.innerText = name_tfp ? name_tfp : "";

            let name_ftp = NAME_FOURTHTHIRD;
            let pic_ftp = PICS[name_ftp];
            fourththird.h.innerText = "3/4";
            fourththird.img.src = pic_ftp ? `./pics/${pic_ftp}` : ""; 
            fourththird.name.innerText = name_ftp ? name_ftp : "";

            podest.classList.add("active");

            return;
        }
    
        if (setup_next_round) {
            console.log("setting up next round")
            let next_round = document.getElementById(`round_${CURRENT_ROUND}`);
    
            for (let i = 0; i < ROUNDS[CURRENT_ROUND].length; i += 2) {
                let n1 = ROUNDS[CURRENT_ROUND][i];
                let n2 = ROUNDS[CURRENT_ROUND][i + 1];
    
                next_round.innerHTML += get_matchup_strings(n1, n2, CURRENT_ROUND, i / 2);
            }
        }
    } else if (MATCH_ACTIVE && MATCH3rdPLACE) {
        await fetch("./stop_match/")
        MATCH_ACTIVE = false;

        let json_resp = await fetch("./votes/").then(resp => resp.json())
    
        let n1 = NAME_THIRDFOURTH;
        let n2 = NAME_FOURTHTHIRD;
    
        let v1 = json_resp[n1];
        let v2 = json_resp[n2];

        let name_tp;
        let pic_tp;

        if (v1 > v2) {
            name_tp = NAME_THIRDFOURTH;
            pic_tp = PICS[name_tp];
        } else {
            name_tp = NAME_FOURTHTHIRD;
            pic_tp = PICS[name_tp];
        }

        third.h.innerText = "3";
        third.img.src = pic_tp ? `./pics/${pic_tp}` : ""; 
        third.name.innerText = name_tp ? name_tp : "";

        thirdfourth.h.style.display = "none";
        thirdfourth.img.style.display = "none";
        thirdfourth.name.style.display = "none";

        fourththird.h.style.display = "none";
        fourththird.img.style.display = "none";
        fourththird.name.style.display = "none";

        podest.classList.add("final");
    } else {
        console.log("Es ist zurzeit kein Match aktiv.");
    }
});


async function main() {
    const first_round = document.getElementById("round_0");
    const json_resp = await fetch("./get_tournament_data/").then(resp => resp.json());
    
    PICS = json_resp;

    //ROUNDS[0] = shuffle_array(Object.keys(json_resp));
    ROUNDS[0] = Object.keys(json_resp);
    
    MAX_ROUNDS = Math.log2(ROUNDS[0].length);

    if (MAX_ROUNDS < 2) {
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