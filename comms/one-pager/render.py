import weasyprint, fitz, os
here = os.path.dirname(os.path.abspath(__file__))
html = os.path.join(here, __import__("sys").argv[1] if len(__import__("sys").argv)>1 else "onepager.html")
out = os.path.join(here, os.path.splitext(os.path.basename(html))[0] + ".pdf")
weasyprint.HTML(filename=html, base_url=here).write_pdf(out)
d = fitz.open(out); print("pages:", len(d))
d[0].get_pixmap(dpi=90).save(os.path.join(here, os.path.splitext(os.path.basename(html))[0] + "-preview.png"))
