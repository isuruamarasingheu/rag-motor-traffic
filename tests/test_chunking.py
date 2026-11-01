"""Unit tests for structure-aware statute chunking and parser."""

from src.chunking.parser import (
    extract_defined_terms_from_text,
    find_cross_references,
    find_definitions_used,
    parse_consolidated_act,
    parse_gazette,
    parse_procedural_guide,
)


def test_definitions_extraction_and_attachment():
    """Verify that interpretation terms are extracted and attached to units."""
    sample_definitions = """
    'motor vehicle' means any mechanically propelled vehicle;
    'driver' means any person who drives a motor vehicle;
    'accident' means any collision on a road;
    """
    defs_dict = extract_defined_terms_from_text(sample_definitions)
    assert "motor vehicle" in defs_dict
    assert "driver" in defs_dict
    assert "accident" in defs_dict

    sample_clause = (
        "No driver shall operate a motor vehicle while under the influence of liquor."
    )
    used = find_definitions_used(sample_clause, defs_dict)
    assert "driver" in used
    assert "motor vehicle" in used
    assert "accident" not in used


def test_cross_references_detection():
    """Verify detection of section and regulation cross-references."""
    sample_clause = (
        "Subject to the provisions of section 20 and section 112A, "
        "and as prescribed under regulation 4 of the noise regulations."
    )
    refs = find_cross_references(sample_clause)
    assert "MTA-1951-s20" in refs
    assert "MTA-1951-s112A" in refs
    assert "reg-4" in refs


def test_parse_consolidated_act_hierarchy():
    """Verify that the parser correctly preserves hierarchy and parent context."""
    synthetic_act = """
    PART I
    REGISTRATION OF VEHICLES

    Registration required 2.
    [3, 8 of 2009]
    (1) No person shall possess or use a motor vehicle unless registered.
    (2) Dealers may hold unregistered vehicles for sale.

    Distinctive numbers 3.
    (1) Every vehicle shall carry distinctive identification plates.
    """
    records = parse_consolidated_act(synthetic_act, source_file="data/raw/test.pdf")
    assert len(records) >= 2
    rec2 = next(r for r in records if "s2" in r.id)
    assert rec2.section == "2"
    assert rec2.part == "PART I"
    assert "REGISTRATION OF VEHICLES" in rec2.parent_context
    assert "Registration required" in rec2.heading
    assert not rec2.id.endswith(" ")
    assert len(rec2.text) > 20


def test_parse_gazette_regulations():
    """Verify parsing of gazette regulations into individual citable units."""
    synthetic_gazette = """
    cited as the National Environmental (Vehicle Horns) Regulations, No. 1 of 2011.
    1. These Regulations may be cited as the Vehicle Horns Regulations.
    2. These Regulations shall apply to warning devices.
    3. No person shall use any horn exceeding 105 dB(A).

    SCHEDULE
    Maximum permissible noise level is 105 dB(A) at 2m.
    """
    records = parse_gazette(
        "Gazette_1738-37_2011", synthetic_gazette, "data/raw/gaz.pdf"
    )
    assert len(records) >= 3
    reg3 = next(r for r in records if "reg-3" in r.id)
    assert reg3.section == "3"
    assert "105 dB(A)" in reg3.text
    assert "Gazette No. 1738/37" in reg3.citation

    sched = next(r for r in records if "sched" in r.id)
    assert "SCHEDULE" in sched.text.upper()


def test_parse_procedural_guide():
    """Verify parsing of procedural markdown into procedural section units."""
    synthetic_guide = """
    ## Section PG-DMT-1: First Registration of Motor Vehicles
    Submit Form M.T.A. 2 with Customs declaration.

    ## Section PG-DMT-2: Transfer of Vehicle Ownership
    Submit Form M.T.A. 6 within 14 days of transfer.
    """
    records = parse_procedural_guide("DMT_Guide", synthetic_guide, "data/raw/guide.md")
    assert len(records) == 2
    rec_trans = next(r for r in records if "PG-DMT-2" in r.id)
    assert "Transfer of Vehicle Ownership" in rec_trans.heading
    assert "within 14 days" in rec_trans.text
    assert rec_trans.regulation_category == "procedure"
