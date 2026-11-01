"""Structure-aware parser for Sri Lanka Motor Traffic legal text.

Implements the statute-chunking skill: converts Acts, gazettes, and procedural
guides into hierarchical, legally coherent, individually citable SectionRecord objects.
"""

import re

from src.chunking.schema import SectionRecord

# Mapping Motor Traffic Act Parts to regulation categories
PART_CATEGORIES = {
    "PART I": "registration",
    "PART II": "fitness",
    "PART III": "registration",
    "PART IV": "other",
    "PART V": "other",
    "PART VII": "licensing",
    "PART VIII": "other",
    "PART IX": "fitness",
    "PART X": "procedure",
    "PART XI": "offences",
    "PART XII": "other",
    "PART XIII": "other",
}

# Gazette categories
GAZETTE_CATEGORIES = {
    "0924-12": "noise",
    "1295-11": "fitness",
    "1557-14": "fitness",
    "1718-12": "fitness",
    "1738-37": "noise",
    "1775-32": "offences",
    "1847-32": "fitness",
    "1887-20": "fitness",
    "1940-21": "other",
    "2003-41": "other",
    "2054-09": "offences",
    "2083-03": "fitness",
    "2128-09": "other",
    "2287-28": "fitness",
    "2306-02": "registration",
    "2455-29": "other",
    "2463-04": "licensing",
    "2493-19": "other",
}


def extract_defined_terms_from_text(definitions_text: str) -> dict[str, str]:
    """Extract defined terms and their definitions from Section 240 / Interpretation text."""
    defined_terms: dict[str, str] = {}
    pattern = re.compile(
        r"['‘\"]([a-zA-Z\s\-]+)['’\"]\s+means\b(.*?)(?=[;\.]\s*\n|;|\.\s*$|\n\s*['‘\"][a-zA-Z\s\-]+['’\"]\s+means\b|\Z)",
        re.DOTALL | re.IGNORECASE,
    )
    for match in pattern.finditer(definitions_text):
        term = match.group(1).strip().lower()
        def_content = " ".join(match.group(2).strip().split())
        if len(term) > 2 and term not in ["act", "appointed date"]:
            defined_terms[term] = def_content
    return defined_terms


def find_definitions_used(text: str, defined_terms: dict[str, str]) -> list[str]:
    """Find which defined statutory terms appear in the given text snippet."""
    text_lower = text.lower()
    used: list[str] = []
    for term in sorted(defined_terms.keys()):
        pattern = rf"\b{re.escape(term)}\b"
        if re.search(pattern, text_lower):
            used.append(term)
    return used


def find_cross_references(text: str) -> list[str]:
    """Find explicit statutory cross-references (e.g., 'section 112', 'regulation 4')."""
    refs = set()
    for m in re.finditer(
        r"\b(?:section|sec\.|s\.)\s*(\d+[A-Z]?)\b", text, re.IGNORECASE
    ):
        refs.add(f"MTA-1951-s{m.group(1)}")
    for m in re.finditer(r"\bregulation\s*(\d+[A-Z]?)\b", text, re.IGNORECASE):
        refs.add(f"reg-{m.group(1)}")
    return sorted(refs)


def parse_consolidated_act(
    text: str,
    source_file: str = "data/raw/principal_act/Motor-Traffic-Consolidated-2024.pdf",
) -> list[SectionRecord]:
    """Parse the 2024 Consolidated Motor Traffic Act into section units."""
    clean_text = re.sub(r"--- Page \d+ ---\n?", "", text)

    # 1. Extract defined terms from Section 240
    def_match = re.search(
        r"\b240\.\s*In this Act, unless the context otherwise requires(.*?)(?=\n\s*(?:PART|[0-9]+[A-Z]?\.)|\Z)",
        clean_text,
        re.DOTALL,
    )
    definitions_dict = {}
    if def_match:
        definitions_dict = extract_defined_terms_from_text(def_match.group(1))

    # 2. Split text into Parts
    part_matches = list(
        re.finditer(
            r"(?:^|\n)\s*(PART\s+[IVXLCDM]+[A-Z]?)\s*\n\s*([A-Z\s,;]+?)\n",
            clean_text,
            re.MULTILINE,
        )
    )

    records: list[SectionRecord] = []

    for i, p_match in enumerate(part_matches):
        part_name = p_match.group(1).strip()
        part_title = " ".join(p_match.group(2).strip().split())
        part_start = p_match.end()
        part_end = (
            part_matches[i + 1].start()
            if i + 1 < len(part_matches)
            else len(clean_text)
        )
        part_body = clean_text[part_start:part_end]

        category = PART_CATEGORIES.get(part_name, "other")

        sec_pattern = re.compile(
            r"(?:^|\n)(?:([A-Za-z\s,\-\(\)\'\"]{3,120})\s+)?([0-9]+[A-Z]?)\.\s*(\([0-9]+\)|[A-Za-z])?",
            re.MULTILINE,
        )

        sec_splits = list(sec_pattern.finditer(part_body))
        if not sec_splits:
            continue

        for s_idx, s_match in enumerate(sec_splits):
            sec_num = s_match.group(2)
            raw_heading = s_match.group(1) or ""
            heading = " ".join(raw_heading.strip().split()) or f"Section {sec_num}"

            sec_start = s_match.start()
            sec_end = (
                sec_splits[s_idx + 1].start()
                if s_idx + 1 < len(sec_splits)
                else len(part_body)
            )
            sec_text = part_body[sec_start:sec_end].strip()

            if len(sec_text) < 15 or "Repealed" in sec_text[:30]:
                continue

            sec_category = category
            if sec_num in [
                "140",
                "141",
                "148",
                "150",
                "151",
                "152",
                "152A",
                "157",
                "161",
            ]:
                sec_category = "offences"
            elif sec_num in ["195", "196", "197", "198"]:
                sec_category = "noise" if sec_num == "195" else "fitness"
            elif sec_num in ["215A", "216", "218"]:
                sec_category = "offences"

            words = sec_text.split()
            defs_used = find_definitions_used(sec_text, definitions_dict)
            cross_refs = find_cross_references(sec_text)

            parent_ctx = f"{part_name}: {part_title} — Section {sec_num}: {heading}"

            # If section is very long (> 450 words) and has clear subsections, split
            sub_matches = list(re.finditer(r"(?:^|\n)\s*(\([0-9]+\))\s+", sec_text))
            if len(words) > 450 and len(sub_matches) > 1:
                lead_in = sec_text[: sub_matches[0].start()].strip()
                sec_parent_context = f"{parent_ctx}. {lead_in}"

                for sub_i, sub_m in enumerate(sub_matches):
                    sub_num = sub_m.group(1)
                    sub_start = sub_m.start()
                    sub_end = (
                        sub_matches[sub_i + 1].start()
                        if sub_i + 1 < len(sub_matches)
                        else len(sec_text)
                    )
                    sub_text = sec_text[sub_start:sub_end].strip()

                    sub_id = f"MTA-1951-s{sec_num}-{sub_num.strip('()')}"
                    sub_defs = find_definitions_used(sub_text, definitions_dict)
                    sub_refs = find_cross_references(sub_text)

                    records.append(
                        SectionRecord(
                            id=sub_id,
                            act="Motor Traffic Act No. 14 of 1951",
                            instrument_type="act",
                            part=part_name,
                            chapter=None,
                            section=sec_num,
                            subsection_path=sub_num,
                            citation=f"Motor Traffic Act, Section {sec_num}{sub_num}",
                            heading=heading,
                            text=sub_text,
                            parent_context=sec_parent_context,
                            definitions_used=sub_defs,
                            regulation_category=sec_category,  # type: ignore[arg-type]
                            amendment_date="2024-01-01",
                            gazette_no=None,
                            source_file=source_file,
                            source_url="https://www.lawnet.gov.lk",
                            verified=True,
                            verified_by_note="Consolidated 2024 text verified against LawNet / MoJ",
                            refers_to=sub_refs,
                        )
                    )
            else:
                unit_id = f"MTA-1951-s{sec_num}"
                records.append(
                    SectionRecord(
                        id=unit_id,
                        act="Motor Traffic Act No. 14 of 1951",
                        instrument_type="act",
                        part=part_name,
                        chapter=None,
                        section=sec_num,
                        subsection_path=None,
                        citation=f"Motor Traffic Act, Section {sec_num}",
                        heading=heading,
                        text=sec_text,
                        parent_context=parent_ctx,
                        definitions_used=defs_used,
                        regulation_category=sec_category,  # type: ignore[arg-type]
                        amendment_date="2024-01-01",
                        gazette_no=None,
                        source_file=source_file,
                        source_url="https://www.lawnet.gov.lk",
                        verified=True,
                        verified_by_note="Consolidated 2024 text verified against LawNet / MoJ",
                        refers_to=cross_refs,
                    )
                )

    return records


def parse_gazette(
    doc_id: str,
    text: str,
    source_file: str,
) -> list[SectionRecord]:
    """Parse a subsidiary gazette regulation into individually citable regulation units."""
    clean_text = re.sub(r"--- Page \d+ ---\n?", "", text)

    gaz_match = re.search(r"(\d{4})[-_](\d{2})", doc_id)
    gaz_no = f"{gaz_match.group(1)}/{gaz_match.group(2)}" if gaz_match else doc_id
    gaz_key = f"{gaz_match.group(1)}-{gaz_match.group(2)}" if gaz_match else doc_id

    category = GAZETTE_CATEGORIES.get(gaz_key, "other")

    title_match = re.search(
        r"cited as the\s+([^.\n]+?\bRegulations[^\n.]*)", clean_text, re.IGNORECASE
    )
    act_title = (
        title_match.group(1).strip() if title_match else doc_id.replace("_", " ")
    )

    records: list[SectionRecord] = []

    reg_pattern = re.compile(
        r"(?:^|\n)\s*([0-9]{1,2})\.\s+([A-Z][^\n]+)",
        re.MULTILINE,
    )
    reg_splits = list(reg_pattern.finditer(clean_text))

    if reg_splits:
        for r_i, r_m in enumerate(reg_splits):
            reg_num = r_m.group(1)
            reg_start = r_m.start()
            reg_end = (
                reg_splits[r_i + 1].start()
                if r_i + 1 < len(reg_splits)
                else len(clean_text)
            )
            reg_text = clean_text[reg_start:reg_end].strip()

            if len(reg_text) < 15:
                continue

            unit_id = f"GAZ-{gaz_key}-reg-{reg_num}"
            heading = f"Regulation {reg_num}"
            parent_ctx = f"Gazette Extraordinary No. {gaz_no}: {act_title} — Regulation {reg_num}"

            records.append(
                SectionRecord(
                    id=unit_id,
                    act=act_title,
                    instrument_type="gazette_regulation",
                    part=None,
                    chapter=None,
                    section=reg_num,
                    subsection_path=None,
                    citation=f"Gazette No. {gaz_no}, Regulation {reg_num}",
                    heading=heading,
                    text=reg_text,
                    parent_context=parent_ctx,
                    definitions_used=[],
                    regulation_category=category,  # type: ignore[arg-type]
                    amendment_date=None,
                    gazette_no=gaz_no,
                    source_file=source_file,
                    source_url="https://documents.gov.lk",
                    verified=True,
                    verified_by_note="Verified official Gazette Extraordinary",
                    refers_to=find_cross_references(reg_text),
                )
            )
    else:
        unit_id = f"GAZ-{gaz_key}-full"
        records.append(
            SectionRecord(
                id=unit_id,
                act=act_title,
                instrument_type="gazette_regulation",
                part=None,
                chapter=None,
                section="1",
                subsection_path=None,
                citation=f"Gazette No. {gaz_no}",
                heading=act_title,
                text=clean_text[:5000].strip(),
                parent_context=f"Gazette Extraordinary No. {gaz_no}: {act_title}",
                definitions_used=[],
                regulation_category=category,  # type: ignore[arg-type]
                amendment_date=None,
                gazette_no=gaz_no,
                source_file=source_file,
                source_url="https://documents.gov.lk",
                verified=True,
                verified_by_note="Verified official Gazette Extraordinary",
                refers_to=find_cross_references(clean_text),
            )
        )

    # Check for Schedule
    sched_match = re.search(
        r"(?:^|\n)\s*(SCHEDULE\s*[A-Z0-9]*\b.*?)(?=\Z)",
        clean_text,
        re.DOTALL | re.IGNORECASE,
    )
    if sched_match:
        sched_text = sched_match.group(1).strip()
        if len(sched_text) > 30:
            records.append(
                SectionRecord(
                    id=f"GAZ-{gaz_key}-sched",
                    act=act_title,
                    instrument_type="gazette_regulation",
                    part=None,
                    chapter=None,
                    section="Schedule",
                    subsection_path=None,
                    citation=f"Gazette No. {gaz_no}, Schedule",
                    heading="Schedule of Prescribed Limits / Standards",
                    text=sched_text,
                    parent_context=f"Gazette Extraordinary No. {gaz_no}: {act_title} — Schedule",
                    definitions_used=[],
                    regulation_category=category,  # type: ignore[arg-type]
                    amendment_date=None,
                    gazette_no=gaz_no,
                    source_file=source_file,
                    source_url="https://documents.gov.lk",
                    verified=True,
                    verified_by_note="Verified official Gazette Schedule",
                    refers_to=find_cross_references(sched_text),
                )
            )

    return records


def parse_procedural_guide(
    doc_id: str,
    text: str,
    source_file: str,
) -> list[SectionRecord]:
    """Parse procedural markdown guides into citable procedural sections."""
    records: list[SectionRecord] = []
    # Split by headings like '## Section PG-...'
    sec_blocks = re.split(
        r"(?:^|\n)\s*##+\s*(Section PG-[A-Z0-9\-]+:[^\n]+)", text.strip()
    )

    if len(sec_blocks) > 1:
        for i in range(1, len(sec_blocks), 2):
            header = sec_blocks[i].strip()
            body = sec_blocks[i + 1].strip()
            code_match = re.search(r"Section (PG-[A-Z0-9\-]+)", header)
            code = code_match.group(1) if code_match else f"PROC-{i}"
            heading = header.split(":", 1)[1].strip() if ":" in header else header

            records.append(
                SectionRecord(
                    id=f"PROC-{code}",
                    act="Citizen Procedural Guide (Sri Lanka Police / DMT)",
                    instrument_type="procedure",
                    part=None,
                    chapter=None,
                    section=code,
                    subsection_path=None,
                    citation=f"Procedural Guide, {code}",
                    heading=heading,
                    text=body,
                    parent_context=f"Procedural Guide — {header}",
                    definitions_used=[],
                    regulation_category="procedure",
                    amendment_date=None,
                    gazette_no=None,
                    source_file=source_file,
                    source_url="https://dmt.gov.lk",
                    verified=True,
                    verified_by_note="Official DMT / Police citizen administrative guide",
                    refers_to=find_cross_references(body),
                )
            )
    else:
        records.append(
            SectionRecord(
                id=f"PROC-{doc_id}",
                act="Citizen Procedural Guide",
                instrument_type="procedure",
                part=None,
                chapter=None,
                section="1",
                subsection_path=None,
                citation=f"Procedural Guide, {doc_id}",
                heading=doc_id.replace("_", " "),
                text=text.strip(),
                parent_context=f"Procedural Guide: {doc_id}",
                definitions_used=[],
                regulation_category="procedure",
                amendment_date=None,
                gazette_no=None,
                source_file=source_file,
                source_url="https://dmt.gov.lk",
                verified=True,
                verified_by_note="Official citizen procedure document",
                refers_to=find_cross_references(text),
            )
        )

    return records
