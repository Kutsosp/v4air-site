import base64
from email.message import EmailMessage
exec(open("gmail_find.py", encoding="utf-8").read().split("Q=")[0])
body = """Hi Antek,

Thank you again for the channel map and the list of departments and speakers. Both are very helpful.

I have moved your files to our shared V4AIR Drive folder so that I have access to them as well. They are now in the folder "TORUN - REFERENCE":

https://drive.google.com/drive/folders/1TsR4aGGyGfPrLQjoycPnZDZ5gUZWLDXq

The other universities will use your files as a reference for their own channel maps. I have tidied up the formatting a little. I have also added a column for channels aimed at women in science or at gender equality. Your content has not changed.

You have edit access with your Gmail account. If you want to make any changes, please consider these versions as the canonical ones and keep working on them.

Thank you,
Peter
"""
assert "—" not in body
m = EmailMessage()
m["To"] = "Antoni Żyndul <antonizyndul@gmail.com>"
m["From"] = "Peter Koutsos <petkout1@gmail.com>"
m["Subject"] = "Your channel map is now in the shared V4AIR folder"
m.set_content(body)
r = g.users().messages().send(userId="me", body={"raw": base64.urlsafe_b64encode(m.as_bytes()).decode()}).execute()
s = g.users().messages().get(userId="me", id=r["id"], format="metadata", metadataHeaders=["To", "Subject"]).execute()
print(r["id"], s["labelIds"], {h["name"]: h["value"] for h in s["payload"]["headers"]})
