from flask import Flask, render_template, send_file
from bot import twitch_bot
from threading import Thread
import math
import os

ACCEPTED_PIC_FORMATS = ["jpg", "jpeg", "png", "bmp"]
MAX_TEILNEHMER = 32

cur_tournament = {}
cur_tournament_runden = 0

twitch = twitch_bot()
app = Flask(__name__)


@app.route("/")
def tournament_tree():
    print(cur_tournament_runden)
    return render_template("index.html", tournament_count=cur_tournament_runden)


@app.route("/votes/")
def get_votes():
    return twitch.votes


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
    return cur_tournament


@app.route("/start_match/<string:name1>/<string:name2>")
def start_match(name1, name2):
    twitch.OnMatchStart([name1, name2])
    return "1"


@app.route("/stop_match/")
def stop_match():
    twitch.OnMatchStop()
    return "1"


@app.route("/pics/<string:pic_name>")
def get_pics(pic_name):
    path = "content\\" + pic_name

    valid_path = os.path.exists(path) and os.path.isfile(path)
    
    if not valid_path:
        return "Bad Path"
    
    return send_file(path, mimetype=f"image/{path.split('.')[-1]}")


def load_tournament(path="./content"):
    global cur_tournament_runden
    global cur_tournament

    path = path.rstrip("/") + "/"
    info_txt = path + "info.csv"
    
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
    #             print("Maximal mögliche Teilnehmerzahl überschritten, daher wird niemand mehr hinzugefügt.")
    #             break

    c = 0
    print(os.listdir(path))
    for file in os.listdir(path):
        parts = file.split(".")
        if parts[-1].lower() in ACCEPTED_PIC_FORMATS:
            pic = file.strip()
            insta = ".".join(parts[:-1]).strip()

            if insta not in cur_tournament.keys():
                cur_tournament[insta] = pic
            else:
                print(f"WARNUNG: Der Instagramname '{insta}' ist mehrfach in der Liste vorhanden.")

            c += 1

            if c >= MAX_TEILNEHMER:
                print("Maximal mögliche Teilnehmerzahl überschritten, daher wird niemand mehr hinzugefügt.")
                break


    teilnehmer_zahl = len(cur_tournament.keys())
    print(f"Anzahl Teilnehmer: {teilnehmer_zahl}")

    fill_to = teilnehmer_zahl
    while not math.log(fill_to, 2).is_integer():
        fill_to += 1
    print(f"Auffüllen auf: {fill_to}")

    to_create = fill_to - teilnehmer_zahl
    while to_create > 0:
        cur_tournament[f"gamesbar_gaming_{to_create}"] = ""
        to_create -= 1

    cur_tournament_runden = math.ceil(math.log(teilnehmer_zahl, 2))
    # print(f"Anzahl Runden: {cur_tournament_runden}")

    # print(cur_tournament)



load_tournament()

twitch_thread = Thread(target=twitch.OnStart)
twitch_thread.start()

app.config["TEMPLATES_AUTO_RELOAD"] = True
app.run(debug=False, use_reloader=False)

print("Stopping Twitch bot...")
twitch.run = False
print("Twitch Bot stopped.")

twitch_thread.join()