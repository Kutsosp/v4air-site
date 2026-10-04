"""Channel-map folders in Drive: format Toruń reference, build city templates, share.
Usage: python build.py torun | templates | share | verify
"""
import sys
from drive import *

ROOT = "1IGG6_qt1dK6iKH7l7Y38dBuL5LbsBiD3"
TORUN_FOLDER = "1TsR4aGGyGfPrLQjoycPnZDZ5gUZWLDXq"
TORUN_SHEET = "1NHt0VGDmFiiHDC4-hIOBpbYClbpshpfPoJ0vS5Tqouw"
TORUN_DOC_OLD = "1FpzX18rmoh4bEoOODkFXoELLpmlI8MkQJI7vEupkBuY"
STYLE_TEMPLATE = "1zG6bTQ33cdo-aGlzOM5xPZ3njgEGgs_Q0CU8PeGk9_Q"  # "V4AIR document template"
CITIES = {  # folder name: (folder id, display name)
    "KRAKOW": ("12HH8toXmkM8pH2JruXgxb4_WYQqefm1U", "Kraków"),
    "BRATISLAVA": ("1l9vQIrVgcvmxZllyF_l5psKhDgEMgdTi", "Bratislava"),
    "BUDAPEST": ("1rmzH2uzCXW4Sga46_dtHyzi8CAAh9BjO", "Budapest"),
    "WROCLAW": ("1A2Ky6WfqnmRwcrUwtZ8SN-suVC_VRI-E", "Wrocław"),
}
CONTACTS = {  # folder id -> contact person e-mails (writer on own folder)
    TORUN_FOLDER: ["antonizyndul@gmail.com"],
    CITIES["BUDAPEST"][0]: ["domonkos@inf.elte.hu"],
    CITIES["BRATISLAVA"][0]: ["daniela.olejarova@fmph.uniba.sk", "homola57@uniba.sk"],
    CITIES["WROCLAW"][0]: ["anna.kusztal@phd.uwr.edu.pl", "annakusztal2@gmail.com"],
    CITIES["KRAKOW"][0]: ["a.jurczak@doctoral.uj.edu.pl", "natalia.jaguszewska@doctoral.uj.edu.pl"],
}
NROWS = 50
INK, RUST, GREY = "161616", "b35c1f", "52564a"


def rgb(h):
    h = h.lstrip("#")
    return {"red": int(h[0:2], 16) / 255, "green": int(h[2:4], 16) / 255, "blue": int(h[4:6], 16) / 255}


# ---------------- sheet ----------------
NOTES = [
    "Type of channel, e.g. Instagram, Facebook, Web, Newsletter, Email, Posters.",
    "Name or handle of the specific account, page, mailing list or group.",
    "Who reads it, how active it is, follower or member count if known, and how it could be used.",
    "Your estimate of how many relevant people it reaches: Low, Mid, Mid/High or High.",
    "Who it mostly reaches: students, PhD students, researchers, or an equal mix.",
    "URL of the channel, if it is public.",
    "Who can post there or whom to ask: name or e-mail.",
]
PLATFORMS = ["Web", "Facebook", "Instagram", "X", "LinkedIn", "Newsletter", "Email",
             "Paper Advertising", "Face-to-face", "Calendar", "Podcast"]
OUTREACH = ["Low", "Mid", "Mid/High", "High"]
AUDIENCE = ["Leans Student", "Leans PhD Student", "Leans Researcher", "Leans Student/Graduates",
            "Equal Mix", "Not Sure"]


def format_sheet(sid):
    s = sheets.spreadsheets().get(spreadsheetId=sid, fields="sheets(properties,bandedRanges,conditionalFormats)").execute()["sheets"][0]
    SID = s["properties"]["sheetId"]
    g = s["properties"]["gridProperties"]
    rng = lambda r0, r1, c0, c1: {"sheetId": SID, "startRowIndex": r0, "endRowIndex": r1, "startColumnIndex": c0, "endColumnIndex": c1}
    R = []
    if g["columnCount"] > 7:
        R.append({"deleteDimension": {"range": {"sheetId": SID, "dimension": "COLUMNS", "startIndex": 7, "endIndex": g["columnCount"]}}})
    if g["rowCount"] > NROWS:
        R.append({"deleteDimension": {"range": {"sheetId": SID, "dimension": "ROWS", "startIndex": NROWS, "endIndex": g["rowCount"]}}})
    R.append({"updateSheetProperties": {"properties": {"sheetId": SID, "title": "Channels", "gridProperties": {"frozenRowCount": 1}},
                                        "fields": "title,gridProperties.frozenRowCount"}})
    for b in s.get("bandedRanges", []):
        R.append({"deleteBanding": {"bandedRangeId": b["bandedRangeId"]}})
    for _ in s.get("conditionalFormats", []):
        R.append({"deleteConditionalFormatRule": {"sheetId": SID, "index": 0}})
    R.append({"addBanding": {"bandedRange": {"range": rng(0, NROWS, 0, 7), "rowProperties": {
        "headerColor": rgb("356854"), "firstBandColor": rgb("ffffff"), "secondBandColor": rgb("f6f8f9")}}}})
    R.append({"repeatCell": {"range": rng(1, NROWS, 0, 7), "cell": {"userEnteredFormat": {
        "wrapStrategy": "WRAP", "verticalAlignment": "TOP", "textFormat": {"fontFamily": "Arial", "fontSize": 10}}},
        "fields": "userEnteredFormat(wrapStrategy,verticalAlignment,textFormat.fontFamily,textFormat.fontSize)"}})
    R.append({"repeatCell": {"range": rng(0, 1, 0, 7), "cell": {"userEnteredFormat": {
        "wrapStrategy": "WRAP", "verticalAlignment": "MIDDLE",
        "textFormat": {"bold": True, "fontFamily": "Arial", "fontSize": 10, "foregroundColor": rgb("ffffff")}}},
        "fields": "userEnteredFormat(wrapStrategy,verticalAlignment,textFormat)"}})
    R.append({"updateDimensionProperties": {"range": {"sheetId": SID, "dimension": "ROWS", "startIndex": 0, "endIndex": 1},
                                            "properties": {"pixelSize": 36}, "fields": "pixelSize"}})
    for i, w in enumerate([120, 200, 430, 120, 160, 260, 190]):
        R.append({"updateDimensionProperties": {"range": {"sheetId": SID, "dimension": "COLUMNS", "startIndex": i, "endIndex": i + 1},
                                                "properties": {"pixelSize": w}, "fields": "pixelSize"}})
    R.append({"updateCells": {"range": rng(0, 1, 0, 7), "rows": [{"values": [{"note": n} for n in NOTES]}], "fields": "note"}})
    for col, vals in [(0, PLATFORMS), (3, OUTREACH), (4, AUDIENCE)]:
        R.append({"setDataValidation": {"range": rng(1, NROWS, col, col + 1), "rule": {
            "condition": {"type": "ONE_OF_LIST", "values": [{"userEnteredValue": v} for v in vals]},
            "strict": False, "showCustomUi": True}}})
    for val, col in [("High", "b7e1cd"), ("Mid/High", "d9f0e3"), ("Mid", "fff2cc"), ("Low", "eeeeee")]:
        R.append({"addConditionalFormatRule": {"index": 0, "rule": {"ranges": [rng(1, NROWS, 3, 4)], "booleanRule": {
            "condition": {"type": "TEXT_EQ", "values": [{"userEnteredValue": val}]},
            "format": {"backgroundColor": rgb(col)}}}}})
    R.append({"setBasicFilter": {"filter": {"range": rng(0, NROWS, 0, 7)}}})
    sheets.spreadsheets().batchUpdate(spreadsheetId=sid, body={"requests": R}).execute()
    return SID


def normalize_torun_values(sid):
    vals = sheets.spreadsheets().values().get(spreadsheetId=sid, range="Channels!A2:A50").execute().get("values", [])
    fix = {"Website": "Web", "Linkedin": "LinkedIn"}
    data = [{"range": f"Channels!A{i+2}", "values": [[fix[r[0]]]]} for i, r in enumerate(vals) if r and r[0] in fix]
    if data:
        sheets.spreadsheets().values().batchUpdate(spreadsheetId=sid, body={"valueInputOption": "RAW", "data": data}).execute()
    print("normalized", [d["range"] for d in data])


# ---------------- docs ----------------
def u16(s):
    return len(s.encode("utf-16-le")) // 2


def new_doc_from_template(name, folder):
    return drive.files().copy(fileId=STYLE_TEMPLATE, body={"name": name, "parents": [folder]}, fields="id").execute()["id"]


def write_doc(did, blocks):
    """blocks: (kind, text). kinds: TITLE SUBTITLE H1 H2 P B LINK LABEL PH PHB"""
    d = docs.documents().get(documentId=did).execute()
    end = d["body"]["content"][-1]["endIndex"]
    if end > 2:
        docs.documents().batchUpdate(documentId=did, body={"requests": [
            {"deleteContentRange": {"range": {"startIndex": 1, "endIndex": end - 1}}}]}).execute()
    text = "".join(t + "\n" for _, t in blocks)
    total = 1 + u16(text)
    R = [{"insertText": {"location": {"index": 1}, "text": text}},
         {"deleteParagraphBullets": {"range": {"startIndex": 1, "endIndex": total}}},
         {"updateParagraphStyle": {"range": {"startIndex": 1, "endIndex": total},
                                   "paragraphStyle": {"namedStyleType": "NORMAL_TEXT"}, "fields": "namedStyleType"}},
         {"updateTextStyle": {"range": {"startIndex": 1, "endIndex": total}, "textStyle": {},
                              "fields": "bold,italic,link,underline,foregroundColor,fontSize,weightedFontFamily"}}]
    styles = {"TITLE": "TITLE", "SUBTITLE": "SUBTITLE", "H1": "HEADING_1", "H2": "HEADING_2"}
    i, bul = 1, []
    for kind, t in blocks:
        a, b = i, i + u16(t)
        i = b + 1
        if kind in styles:
            R.append({"updateParagraphStyle": {"range": {"startIndex": a, "endIndex": b + 1},
                                               "paragraphStyle": {"namedStyleType": styles[kind]}, "fields": "namedStyleType"}})
        if kind == "LABEL" and b > a:
            R.append({"updateTextStyle": {"range": {"startIndex": a, "endIndex": b}, "textStyle": {"bold": True}, "fields": "bold"}})
        if kind in ("PH", "PHB") and b > a:
            R.append({"updateTextStyle": {"range": {"startIndex": a, "endIndex": b}, "textStyle": {
                "italic": True, "foregroundColor": {"color": {"rgbColor": rgb(GREY)}}}, "fields": "italic,foregroundColor"}})
        if kind == "LINK" and b > a:
            R.append({"updateTextStyle": {"range": {"startIndex": a, "endIndex": b}, "textStyle": {
                "link": {"url": t}, "foregroundColor": {"color": {"rgbColor": rgb(RUST)}}}, "fields": "link,foregroundColor"}})
        if kind in ("B", "LINK", "PHB"):
            bul.append((a, b + 1))
    # merge consecutive bullet paragraphs into one list
    groups = []
    for a, b in bul:
        if groups and groups[-1][1] == a:
            groups[-1][1] = b
        else:
            groups.append([a, b])
    for a, b in groups:
        R.append({"createParagraphBullets": {"range": {"startIndex": a, "endIndex": b}, "bulletPreset": "BULLET_DISC_CIRCLE_SQUARE"}})
    docs.documents().batchUpdate(documentId=did, body={"requests": R}).execute()


def torun_blocks():
    d = json.load(open("torun-doc.json", encoding="utf-8"))
    paras = []
    for el in d["body"]["content"]:
        if "paragraph" in el:
            p = el["paragraph"]
            paras.append(("".join(r.get("textRun", {}).get("content", "") for r in p["elements"]).strip(), "bullet" in p))
    B = [("TITLE", "Toruń: departments and speaker suggestions"), ("SUBTITLE", "V4 AI Researchers Meetup · channel map")]
    sec = None
    for s, isb in paras:
        if not s:
            continue
        if s == "NCU Faculties":
            B.append(("H1", "NCU faculties")); continue
        if s.startswith("Higher Priority"):
            B.append(("H2", "Higher priority faculties")); continue
        if s.startswith("Lower Priority"):
            B.append(("H2", "Lower priority faculties")); continue
        if s == "Experts":
            B.append(("H1", "Experts")); sec = "exp"; continue
        if sec != "exp":
            B.append(("B", s)); continue
        if s.startswith("Two people"):
            B.append(("P", "People who may be worth considering as invited “experts” (importantly, they are all friends of the lab, meaning that they should be trustworthy :))"))
            continue
        if isb:
            B.append(("H2", s.rstrip("."))); continue
        if s == "Links:":
            B.append(("LABEL", "Links")); continue
        if s.startswith("http"):
            B.append(("LINK", s)); continue
        B.append(("P", s))
    return B


def template_blocks(city):
    return [("TITLE", f"{city}: departments and speaker suggestions"), ("SUBTITLE", "V4 AI Researchers Meetup · channel map"),
            ("H1", "Faculties"),
            ("H2", "Higher priority faculties"), ("PHB", "Faculty name"), ("PHB", "Faculty name"),
            ("H2", "Lower priority faculties"), ("PHB", "Faculty name"),
            ("H1", "Experts"),
            ("H2", "Name"), ("PH", "Current role, AI-related work, and connection to your university or group."),
            ("LABEL", "Links"), ("PHB", "https://")]


def names_in(fid):
    return {f["name"]: f["id"] for f in ls(fid)}


if __name__ == "__main__":
    step = sys.argv[1]
    if step == "torun":
        format_sheet(TORUN_SHEET)
        normalize_torun_values(TORUN_SHEET)
        name = "TORUN Departments/Speakers Suggestions"
        new = new_doc_from_template(name, TORUN_FOLDER)
        write_doc(new, torun_blocks())
        print("new torun doc", new)
    if step == "trash-old-torun":
        drive.files().update(fileId=TORUN_DOC_OLD, body={"trashed": True}).execute()
        print("trashed old doc", TORUN_DOC_OLD)
    if step == "templates":
        for folder, (fid, city) in CITIES.items():
            have = names_in(fid)
            sname, dname = f"{folder} Communication Channels", f"{folder} Departments/Speakers Suggestions"
            if sname not in have:
                c = drive.files().copy(fileId=TORUN_SHEET, body={"name": sname, "parents": [fid]}, fields="id").execute()["id"]
                sheets.spreadsheets().values().clear(spreadsheetId=c, range="Channels!A2:G50").execute()
                print(folder, "sheet", c)
            if dname not in have:
                did = new_doc_from_template(dname, fid)
                write_doc(did, template_blocks(city))
                print(folder, "doc", did)
    if step == "share":
        from googleapiclient.errors import HttpError
        notified = set()
        failed = set()
        def grant(fid, e, role):
            try:
                drive.permissions().create(fileId=fid, sendNotificationEmail=False, fields="id",
                                           body={"type": "user", "role": role, "emailAddress": e}).execute()
            except HttpError as err:
                if "cannotInviteNonGoogleUser" not in str(err):
                    raise
                failed.add(e)
        everyone = sorted({e for v in CONTACTS.values() for e in v})
        for e in everyone:
            grant(ROOT, e, "reader")
        for fid, emails in CONTACTS.items():
            for e in emails:
                grant(fid, e, "writer")
        print("shared; no Google account, skipped:", sorted(failed))
    if step == "verify":
        def tree(fid, ind=0):
            for f in ls(fid):
                perms = drive.permissions().list(fileId=f["id"], fields="permissions(emailAddress,role)").execute()["permissions"]
                print("  " * ind + f["name"], "|", ", ".join(f"{p.get('emailAddress')}:{p['role']}" for p in perms if p.get("emailAddress") not in ("petkout1@gmail.com",)))
                if f["mimeType"].endswith("folder"):
                    tree(f["id"], ind + 1)
        tree(ROOT)


GENDER_HEADER = "Women in science / gender equality"
GENDER_NOTE = ("Yes if the channel is a women-in-science or women-in-AI network or group, "
               "or the university's gender-equality office or contact.")


def add_gender_column(sid):
    s = sheets.spreadsheets().get(spreadsheetId=sid, fields="sheets(properties)").execute()["sheets"][0]
    SID = s["properties"]["sheetId"]
    head = sheets.spreadsheets().values().get(spreadsheetId=sid, range="Channels!A1:H1").execute()["values"][0]
    if GENDER_HEADER in head:
        return "already"
    rng = lambda r0, r1, c0, c1: {"sheetId": SID, "startRowIndex": r0, "endRowIndex": r1, "startColumnIndex": c0, "endColumnIndex": c1}
    R = [{"insertDimension": {"range": {"sheetId": SID, "dimension": "COLUMNS", "startIndex": 5, "endIndex": 6}, "inheritFromBefore": True}},
         {"updateDimensionProperties": {"range": {"sheetId": SID, "dimension": "COLUMNS", "startIndex": 5, "endIndex": 6},
                                        "properties": {"pixelSize": 150}, "fields": "pixelSize"}},
         {"updateCells": {"range": rng(0, 1, 5, 6), "rows": [{"values": [{"userEnteredValue": {"stringValue": GENDER_HEADER}, "note": GENDER_NOTE}]}],
                          "fields": "userEnteredValue,note"}},
         {"setDataValidation": {"range": rng(1, NROWS, 5, 6), "rule": {
             "condition": {"type": "ONE_OF_LIST", "values": [{"userEnteredValue": "Yes"}, {"userEnteredValue": "No"}]},
             "strict": True, "showCustomUi": True}}},
         {"setBasicFilter": {"filter": {"range": rng(0, NROWS, 0, 8)}}}]
    sheets.spreadsheets().batchUpdate(spreadsheetId=sid, body={"requests": R}).execute()
    return "added"


if __name__ == "__main__" and sys.argv[1] == "addcol":
    ids = [TORUN_SHEET] + [names_in(fid)[f"{k} Communication Channels"] for k, (fid, _) in CITIES.items()]
    for i in ids:
        print(i, add_gender_column(i))
