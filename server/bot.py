import socket
import time
import settings

class twitch_bot:
    def __init__(self):
        print("HALLO!")
        self.HOST = settings.host
        self.PORT = settings.port

        self.NICK = settings.user
        self.PASS = settings.passwd

        self.CHANNEL = settings.channel

        self.run = True

        self.users_voted = []
        self.votes = {}
        self.prev_votes = {}

        self.match_running = False


    def OnStart(self):
        print("OnStart")
        buffer = ""
        MODT = False

        with socket.socket() as s:
            s.settimeout(1.0)
            s.connect((self.HOST, self.PORT))
            s.send(f"PASS {self.PASS}\r\n".encode("utf-8"))
            s.send(f"NICK {self.NICK}\r\n".encode("utf-8"))
            s.send(f"JOIN {self.CHANNEL}\r\n".encode("utf-8"))

            while self.run:
                try:
                    buffer = buffer + s.recv(1024).decode("utf-8")
                    if len(buffer) == 0:
                        print("disconnected..")
                        s.close()
                        s = socket.socket()
                        s.settimeout(1.0)
                        s.connect((self.HOST, self.PORT))
                        s.send(f"PASS {self.PASS}\r\n".encode("utf-8"))
                        s.send(f"NICK {self.NICK}\r\n".encode("utf-8"))
                        s.send(f"JOIN {self.CHANNEL}\r\n".encode("utf-8"))
                        MODT = False
                    else:
                        temp = buffer.split("\n")
                        buffer = temp.pop()

                        for line in temp:
                            if (line.startswith("PING")):
                                answer = " ".join(line.split(" ")[1:])
                                s.send(f"PONG {answer}\r\n".encode("utf-8"))
                            else:
                                parts = line.split(":")

                                if "QUIT" not in parts[1] and "JOIN" not in parts[1] and "PART" not in parts[1]:
                                    try:
                                        message = parts[2][:len(parts[2]) - 1]
                                    except:
                                        message = ""

                                    username  = parts[1].split("!")[0]

                                    if (MODT): print(message)

                                    if MODT and message.startswith("!") and len(message) > 2:
                                        match(message.split(" ")[0]):
                                            case "!vote":
                                                vote_for = " ".join(message.split(" ")[1:])
                                                vote_by = username.lower()

                                                if self.match_running:
                                                    if vote_by not in self.users_voted:
                                                        if vote_for not in self.votes.keys():
                                                            s.send(f"PRIVMSG {self.CHANNEL} :'{vote_for}' ist keine gültige Auswahl!\n".encode("utf-8"))
                                                        else:
                                                            self.votes[vote_for] += 1
                                                            self.users_voted.append(vote_by)
                                            
                                            case "!test":
                                                vote_for = " ".join(message.split(" ")[1:]) or "Maple-Syrup"
                                                vote_by = username.lower()

                                                if vote_for in self.votes.keys():
                                                    self.votes[vote_for] += 1
                                                else:
                                                    self.votes[vote_for] = 0

                                            case "!quit":
                                                print(f"Execution stopped by {username}")
                                                # self.run = False
                                    elif MODT and len(message) == 1:
                                        try:
                                            if self.match_running:
                                                i = int(message) - 1  # "vote for" by index
                                                vote_by = username.lower()

                                                if vote_by not in self.users_voted:
                                                    if len(self.votes.keys()) < i + 1 or i < 0:
                                                        s.send(f"PRIVMSG {self.CHANNEL} :'{vote_for}' ist keine gültige Auswahl!\n".encode("utf-8"))
                                                    else:
                                                        self.votes[list(self.votes.keys())[i]] += 1
                                                        self.users_voted.append(vote_by)
                                        except:
                                            print("not an int")

                                    for stuff in parts:
                                        if "End of /NAMES list" in stuff:
                                            MODT = True
                                            print("Connected!")

                    time.sleep(0.1)
                except TimeoutError:
                    continue

        
    def OnMatchStart(self, matchup):
        self.users_voted = []
        self.prev_votes = self.votes
        
        self.votes = {
            matchup[0]: 0,
            matchup[1]: 0
        }

        self.match_running = True

        print(f"Match zwischen \"{matchup[0]}\" and \"{matchup[1]}\" gestartet.")

    
    def OnMatchStop(self):
        self.match_running = False

        print(f"Match zwischen \"{list(self.votes.keys())[0]}\" and \"{list(self.votes.keys())[1]}\" beendet.")
        print(self.votes)


if __name__ == "__main__":
    from threading import Thread

    b = twitch_bot()
    twitch_thread = Thread(target=b.OnStart)
    print("pre run")
    twitch_thread.start()
    print("post run")
    input("PRESS ANY BUTTON TO FINISH\n")
    b.run = False
    twitch_thread.join()