from io import BytesIO

from docx import Document
from fpdf import FPDF

from app.models.schemas import ResumeSections


def _contact_line(sections: ResumeSections) -> str:
    contact = sections.contact
    parts = [contact.name, contact.email, contact.phone, contact.location, *contact.links]
    return " | ".join(part for part in parts if part)


def _body_blocks(sections: ResumeSections) -> list[tuple[str, list[str]]]:
    blocks: list[tuple[str, list[str]]] = []
    contact = _contact_line(sections)
    if contact:
        blocks.append(("Contact", [contact]))
    if sections.summary:
        blocks.append(("Summary", [sections.summary]))
    if sections.skills:
        blocks.append(("Skills", [", ".join(sections.skills)]))
    if sections.experience:
        lines: list[str] = []
        for item in sections.experience:
            heading = " | ".join(part for part in (item.title, item.employer) if part)
            dates = " - ".join(part for part in (item.startDate, item.endDate) if part)
            if heading or dates:
                lines.append(" ".join(part for part in (heading, dates) if part))
            lines.extend(f"• {bullet}" for bullet in item.bullets)
        blocks.append(("Experience", lines or [""]))
    if sections.education:
        lines = []
        for item in sections.education:
            lines.append(
                " | ".join(part for part in (item.school, item.credential, item.startDate, item.endDate) if part)
            )
        blocks.append(("Education", [line for line in lines if line]))
    if sections.extras:
        blocks.append(("Additional", [sections.extras]))
    if not blocks:
        blocks.append(("Resume", ["No content provided."]))
    return blocks


def render_docx(sections: ResumeSections) -> bytes:
    document = Document()
    core = document.core_properties
    core.author = ""
    core.last_modified_by = ""
    core.comments = ""

    for heading, lines in _body_blocks(sections):
        document.add_heading(heading, level=1)
        for line in lines:
            document.add_paragraph(line)

    buffer = BytesIO()
    document.save(buffer)
    data = buffer.getvalue()
    # Strip leftover identity if the XML still carries a default creator.
    return data.replace(b"python-docx", b"ats-assistant")


def _pdf_text(value: str) -> str:
    return value.encode("latin-1", "replace").decode("latin-1")


def render_pdf(sections: ResumeSections) -> bytes:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()
    pdf.set_creator("")
    pdf.set_author("")
    pdf.set_title("Resume")
    usable_width = pdf.w - pdf.l_margin - pdf.r_margin

    for heading, lines in _body_blocks(sections):
        pdf.set_x(pdf.l_margin)
        pdf.set_font("Helvetica", "B", 13)
        pdf.multi_cell(usable_width, 8, _pdf_text(heading))
        pdf.set_font("Helvetica", "", 11)
        for line in lines:
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(usable_width, 6, _pdf_text(line))
        pdf.ln(3)

    output = pdf.output()
    return bytes(output) if isinstance(output, (bytes, bytearray)) else output.encode("latin-1")


def render(sections: ResumeSections, fmt: str) -> tuple[bytes, str, str]:
    if fmt == "pdf":
        return render_pdf(sections), "application/pdf", "resume.pdf"
    return render_docx(sections), (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ), "resume.docx"
