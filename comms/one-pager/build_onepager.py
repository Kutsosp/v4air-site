import sys, io
sys.path.insert(0, r"C:\Users\petko\projects\Dump\v4air-site\comms\channel-maps")
from drive import *
from build import write_doc, new_doc_from_template
from pypdf import PdfReader
COMMS = "1So6eguRdoosoqj2-R4ze-VKa-L0ES3NZ"
B = [
 ("TITLE", "V4AIR"),
 ("SUBTITLE", "Researchers from Czechia, Hungary, Poland and Slovakia who use AI methods meet for three days in April 2027. We invite companies, investors and former researchers to take part."),
 ("H2", "Why this meetup"),
 ("P", "Researchers in many fields now use the same AI methods. An ecologist counting insects in video and a transport researcher tracking cyclists at a crossing solve the same problem, yet they rarely meet. V4AIR brings PhD students and early-career researchers together by the method they use, across disciplines, and selects participants so that each person meets the right people."),
 ("P", "Many participants want to know where their skills can take them, in research or outside it. People who have made that move, and organisations that need these skills, can answer that in person. We expect most participants from [FIELDS: to be confirmed]."),
 ("H2", "Ways to take part"),
 ("P", "Give a talk. Show how your team uses AI methods, or how you moved from research into industry. We are planning a programme block on careers alongside and after research."),
 ("P", "Meet participants at the expo. Participants present their work at an expo instead of a poster session. Partners can have a stand there or join the conversations."),
 ("P", "Run a session. Lead a workshop on a method or tool your team works with."),
 ("H2", "Key facts"),
 ("B", "28–30 April 2027, Kostelec Castle, 30 minutes from Prague"),
 ("B", "Organised by Charles University with ČVUT Prague, Comenius University Bratislava, ELTE Budapest, Nicolaus Copernicus University in Toruń and the University of Wrocław"),
 ("B", "Funded by the International Visegrad Fund"),
 ("H2", "Interested?"),
 ("P", "Write to Peter Kutsos, project coordinator, at kutsosp@natur.cuni.cz. Partners who want to support the meetup financially are welcome; a call for sponsors will follow. Everything here is preliminary and commits neither side."),
]
text = " ".join(t for _, t in B)
assert "\u2014" not in text
print("words:", len(text.split()))
did = open(r"C:\Users\petko\projects\Dump\v4air-site\comms\one-pager\doc_id.txt").read().strip()
write_doc(did, B)
# style the deck sentence block: make e-mail and site links
d = docs.documents().get(documentId=did).execute()
R = []
for el in d["body"]["content"]:
    if "paragraph" not in el: continue
    for r in el["paragraph"]["elements"]:
        t = r.get("textRun", {}).get("content", ""); s = r["startIndex"]
        for lead in ("Give a talk.", "Meet participants at the expo.", "Run a session."):
            if t.startswith(lead):
                R.append({"updateTextStyle": {"range": {"startIndex": s, "endIndex": s+len(lead)}, "textStyle": {"bold": True}, "fields": "bold"}})
        for needle, url in [("kutsosp@natur.cuni.cz", "mailto:kutsosp@natur.cuni.cz"), ("v4air.eu", "https://v4air.eu")]:
            i = t.find(needle)
            if i >= 0:
                R.append({"updateTextStyle": {"range": {"startIndex": s+i, "endIndex": s+i+len(needle)}, "textStyle": {"link": {"url": url}, "foregroundColor": {"color": {"rgbColor": {"red": 0xb3/255, "green": 0x5c/255, "blue": 0x1f/255}}}}, "fields": "link,foregroundColor"}})
if R: docs.documents().batchUpdate(documentId=did, body={"requests": R}).execute()
pdf = drive.files().export(fileId=did, mimeType="application/pdf").execute()
open(r"C:\Users\petko\projects\Dump\v4air-site\comms\one-pager\one-pager-draft.pdf", "wb").write(pdf)
print("pages:", len(PdfReader(io.BytesIO(pdf)).pages))
print("https://docs.google.com/document/d/" + did)
open(r"C:\Users\petko\projects\Dump\v4air-site\comms\one-pager\doc_id.txt", "w").write(did)
