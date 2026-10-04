from drive import *
sid="1NHt0VGDmFiiHDC4-hIOBpbYClbpshpfPoJ0vS5Tqouw"
s=sheets.spreadsheets().get(spreadsheetId=sid, includeGridData=True).execute()
json.dump(s, open("torun-sheet.json","w"), indent=1)
for sh in s["sheets"]:
    p=sh["properties"]; print("=== SHEET", p["title"], p["gridProperties"], "merges:", len(sh.get("merges",[])), "cf:", len(sh.get("conditionalFormats",[])), "dv?", "banded:", len(sh.get("bandedRanges",[])))
    for g in sh["data"]:
        for i,row in enumerate(g.get("rowData",[])):
            vals=[(c.get("formattedValue") or "") for c in row.get("values",[])]
            if any(vals): print(i+1, " | ".join(vals))
d=docs.documents().get(documentId="1FpzX18rmoh4bEoOODkFXoELLpmlI8MkQJI7vEupkBuY").execute()
json.dump(d, open("torun-doc.json","w"), indent=1)
print("=== DOC", d["title"])
for el in d["body"]["content"]:
    if "paragraph" in el:
        p=el["paragraph"]; t="".join(r.get("textRun",{}).get("content","") for r in p["elements"])
        print(f"[{p['paragraphStyle'].get('namedStyleType')}{' •' if 'bullet' in p else ''}] {t.rstrip()}")
    elif "table" in el:
        print("[TABLE]")
        for r in el["table"]["tableRows"]:
            print(" | ".join("".join(x.get("textRun",{}).get("content","") for c2 in c["content"] if "paragraph" in c2 for x in c2["paragraph"]["elements"]).strip() for c in r["tableCells"]))
