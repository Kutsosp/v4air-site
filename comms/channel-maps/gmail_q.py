import sys
exec(open("gmail_find.py").read().split("Q=")[0])
for q in sys.argv[1:]:
    print("=====",q)
    r=g.users().messages().list(userId="me",q=q,maxResults=30).execute()
    for m in r.get("messages",[]):
        m=g.users().messages().get(userId="me",id=m["id"],format="metadata",metadataHeaders=["From","To","Cc","Subject","Date"]).execute()
        h={x["name"]:x["value"] for x in m["payload"]["headers"]}
        print(h.get("Date","")[:16],"|",h.get("Subject"),"\n  F:",h.get("From"),"\n  T:",h.get("To"),"\n  C:",h.get("Cc",""),"\n  >",m.get("snippet","")[:200])
