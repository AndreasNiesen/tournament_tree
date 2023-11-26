from flask import Flask, render_template, send_file
from bot import twitch_bot
from threading import Thread
import random
import json
import math
import os

ACCEPTED_PIC_FORMATS = ["jpg", "jpeg", "png", "bmp"]
MAX_TEILNEHMER = 32

cur_tournament = {}
cur_tournament_runden = 0

twitch = twitch_bot()
app = Flask(__name__)


@app.route("/")
def combo():
    print(cur_tournament_runden)
    return render_template("combo_index.html", tournament_count=cur_tournament_runden)


@app.route("/tree_only/")
def tourney_tree():
    print(cur_tournament_runden)
    return render_template("tourney_tree_index.html", tournament_count=cur_tournament_runden)


@app.route("/pics_only/")
def pics_1v1():
    return render_template("pic_1v1.html")


@app.route("/votes/")
def get_votes():
    return twitch.votes


@app.route("/prev_votes/")
def get_prev_votes():
    return twitch.prev_votes


@app.route("/match_running/")
def is_match_running():
    return { "match_running": twitch.match_running }


@app.route("/matchup_players/")
def get_matchup_players():
    return {
            "1": list(twitch.votes.keys())[0],
            "2": list(twitch.votes.keys())[1]
        }


@app.route("/reload/")
def do_reload():
    global cur_tournament_runden
    global cur_tournament

    cur_tournament = {}
    cur_tournament_runden = 0

    load_tournament()
    
    return "Reloaded"


@app.route("/get_tournament_data/")
def get_tournament_data():
    print(json.dumps(cur_tournament))
    return json.dumps(cur_tournament)


@app.route("/start_match/<string:name1>/<string:name2>")
def start_match(name1, name2):
    twitch.OnMatchStart([name1, name2])
    return "1"


@app.route("/prepare_match/<string:name1>/<string:name2>")
def prepare_match(name1, name2):
    twitch.OnPrepareMatch([name1, name2])
    return "1"


@app.route("/stop_match/")
def stop_match():
    twitch.OnMatchStop()
    return "1"


@app.route("/pics/<string:insta_name>/<string:pic_name>")
@app.route("/pics/<string:pic_name>")
def get_pics(pic_name, insta_name=""):
    path = ""
    
    if (insta_name != ""):
        path = "content\\" + insta_name + "\\" + pic_name
    else:
        path = path = "content\\" + pic_name

    valid_path = os.path.exists(path) and os.path.isfile(path)
    
    if not valid_path:
        return "Bad Path"
    
    return send_file(path, mimetype=f"image/{path.split('.')[-1]}")


def is_randomization_okay(arr):
    for i in range(0, len(arr), 2):
        print(i)
        print(arr[i])
        print(arr[i+1])
        if arr[i].startswith("gamesbar_gaming_") and arr[i+1].startswith("gamesbar_gaming_"):
            return False
        
    return True


def randomize_order():
    global cur_tournament
    keys = list(cur_tournament.keys())
    
    while True:
        random.shuffle(keys)

        if (is_randomization_okay(keys)):
            break

        print("re-randomizing")

    buff = {}
    for k in keys:
        buff[k] = cur_tournament[k]
    
    cur_tournament = buff


def load_tournament(path="./content"):
    global cur_tournament_runden
    global cur_tournament

    path = path.rstrip("/") + "/"
    ########## CSV iteration
    # info_txt = path + "info.csv"
    
    # # info_txt => InstaName;BildDatei
    # with open(info_txt, "r", encoding="utf-8") as infos:
    #     c = 0
    #     for info in infos:
    #         (insta, pic) = info.split(";")
    #         if insta not in cur_tournament.keys():
    #             cur_tournament[insta] = pic.rstrip("\n")
    #         else:
    #             print(f"WARNUNG: Der Instagramname '{insta}' ist mehrfach in der Liste vorhanden.")

    #         c += 1

    #         if c >= MAX_TEILNEHMER:
    #             print("Maximal mögliche Teilnehmerzahl erreicht, daher wird niemand mehr hinzugefügt.")
    #             break

    ########## Pic per Instauser iteration
    # c = 0
    # print(os.listdir(path))
    # for file in os.listdir(path):
    #     parts = file.split(".")
    #     if parts[-1].lower() in ACCEPTED_PIC_FORMATS:
    #         pic = file.strip()
    #         insta = ".".join(parts[:-1]).strip()

    #         if insta not in cur_tournament.keys():
    #             cur_tournament[insta] = pic
    #         else:
    #             print(f"WARNUNG: Der Instagramname '{insta}' ist mehrfach in der Liste vorhanden.")

    #         c += 1

    #         if c >= MAX_TEILNEHMER:
    #             print("Maximal mögliche Teilnehmerzahl erreicht, daher wird niemand mehr hinzugefügt.")
    #             break

    ########## Insteruser-Folder mit ein oder mehreren Pics
    c = 0
    for folder in [p for p in os.listdir(path) if os.path.isdir(path + p) and not p.startswith(".")]:
        if folder not in cur_tournament.keys():
            cur_tournament[folder] = []
        else:
            print(f"WARNUNG: Der Instagramname '{folder}' ist mehrfach in der Liste vorhanden.")

        for file in [f for f in os.listdir(path + folder) if os.path.isfile(path + folder + "/" + f)]:
            if file.split(".")[-1].lower() in ACCEPTED_PIC_FORMATS:
                cur_tournament[folder].append(file)

        c += 1

        if c >= MAX_TEILNEHMER:
            print("Maximal mögliche Teilnehmerzahl erreicht, daher wird niemand mehr hinzugefügt.")
            break


    teilnehmer_zahl = len(cur_tournament.keys())
    print(f"Anzahl Teilnehmer: {teilnehmer_zahl}")

    fill_to = teilnehmer_zahl
    while not math.log(fill_to, 2).is_integer():
        fill_to += 1
    print(f"Auffüllen auf: {fill_to}")

    to_create = fill_to - teilnehmer_zahl
    while to_create > 0:
        print("adding to cur_tourna")
        cur_tournament[f"gamesbar_gaming_{to_create}"] = []
        to_create -= 1

    cur_tournament_runden = math.ceil(math.log(teilnehmer_zahl, 2))
    # print(f"Anzahl Runden: {cur_tournament_runden}")
    # randomize_order()
    # print("Reihenfolge:")
    # print(cur_tournament)


if __name__ == "__main__":
    load_tournament()

    twitch_thread = Thread(target=twitch.OnStart)
    twitch_thread.start()

    app.config["TEMPLATES_AUTO_RELOAD"] = True
    app.run(debug=False, use_reloader=False)

    print("Stopping Twitch bot...")
    twitch.run = False
    print("Twitch Bot stopped.")

    twitch_thread.join()