import socket, os, re, collections
orig=socket.getaddrinfo
socket.getaddrinfo=lambda *a,**k: sorted(orig(*a,**k),key=lambda x:x[0]!=socket.AF_INET)
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
T=os.path.expanduser("~/.gcreds/petkout1-gmail-token.json")
c=Credentials.from_authorized_user_file(T)
if not c.valid: c.refresh(Request()); open(T,"w").write(c.to_json())
g=build("gmail","v1",credentials=c)
Q='V4AIR OR V4AIM OR "AI Researchers" OR "channel map" OR contactperson OR "contact person" OR meetup OR Kostelec newer_than:120d'
ids=[]; tok=None
while True:
    r=g.users().messages().list(userId="me",q=Q,pageToken=tok,maxResults=500).execute()
    ids+= [m["id"] for m in r.get("messages",[])]; tok=r.get("nextPageToken")
    if not tok: break
print(len(ids),"messages")
addr=collections.defaultdict(lambda: {"names":set(),"subjects":set(),"n":0})
for i in ids:
    m=g.users().messages().get(userId="me",id=i,format="metadata",metadataHeaders=["From","To","Cc","Subject"]).execute()
    h={x["name"]:x["value"] for x in m["payload"]["headers"]}
    for k in ("From","To","Cc"):
        for name,e in re.findall(r'(?:"?([^"<,]*)"?\s*)?<?([\w.+-]+@[\w.-]+)>?', h.get(k,"")):
            a=addr[e.lower()]; a["n"]+=1; a["subjects"].add(h.get("Subject","")[:70])
            if name.strip(): a["names"].add(name.strip())
for e,a in sorted(addr.items(),key=lambda x:-x[1]["n"]):
    print(f"{e} | {', '.join(a['names'])} | {a['n']} | {list(a['subjects'])[:3]}")
