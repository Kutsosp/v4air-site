"""Create the contact-person draft (create) or send it (send <draftId>)."""
import base64, sys, datetime
from email.message import EmailMessage
exec(open(__file__.replace("contact_mail.py", "gmail_find.py"), encoding="utf-8").read().split("Q=")[0])
TO = ["antonizyndul@gmail.com", "anna.kusztal@phd.uwr.edu.pl", "domonkos@inf.elte.hu",
      "daniela.olejarova@fmph.uniba.sk", "homola57@uniba.sk",
      "a.jurczak@doctoral.uj.edu.pl", "natalia.jaguszewska@doctoral.uj.edu.pl"]
CC = ["petr.chlup@natur.cuni.cz"]
BODY = """Dear all,

Thank you again for agreeing to help promote our meetup. We know you are doing this in your own time and on top of your own work, and we are very grateful. With your help, PhD students and early-career researchers at your universities will learn about the call early enough to apply.

If you have not done so yet, please fill in the channel map for your university by Friday, 9 October. Each university has its own folder inside our shared Google Drive folder:

https://drive.google.com/drive/folders/1IGG6_qt1dK6iKH7l7Y38dBuL5LbsBiD3

We would like to start planning the promotion the following week.

The folder titled TORUN - REFERENCE contains the channel map that Antoni, our contact person in Toruń, has put together. It also contains his list of relevant departments at his university and his suggestions for invited speakers. Please feel free to use these documents as a reference.

If anything is unclear or you get stuck, please write to me at any time. I am happy to help or to have a quick call. Thank you all for your time and support. We could not run this meetup without you.

Best regards,
Peter
"""
LOG = __file__.replace("contact_mail.py", "contact_mail.log")
def log(s):
    open(LOG, "a", encoding="utf-8").write(f"{datetime.datetime.now():%d.%m.%Y %H:%M:%S} {s}\n"); print(s)
if sys.argv[1] == "create":
    assert "—" not in BODY
    m = EmailMessage()
    m["From"] = "Peter Koutsos <petkout1@gmail.com>"
    m["To"] = ", ".join(TO); m["Cc"] = ", ".join(CC)
    m["Subject"] = "V4AIR channel maps: please fill in by Friday, 9 October"
    m.set_content(BODY)
    d = g.users().drafts().create(userId="me", body={"message": {"raw": base64.urlsafe_b64encode(m.as_bytes()).decode()}}).execute()
    log(f"draft created {d['id']}")
elif sys.argv[1] == "send":
    did = sys.argv[2]
    try:
        g.users().drafts().get(userId="me", id=did, format="minimal").execute()
    except Exception as e:
        log(f"draft {did} not found, nothing sent ({e.__class__.__name__})"); sys.exit(0)
    r = g.users().drafts().send(userId="me", body={"id": did}).execute()
    log(f"sent draft {did} as message {r['id']} labels {r.get('labelIds')}")
