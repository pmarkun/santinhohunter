import json
from pathlib import Path
from zipfile import ZipFile

from santinho_hunter_api.tse.candidates import build_candidate_catalog, write_candidate_catalog


def write_candidates_zip(path: Path) -> None:
    header = (
        "ANO_ELEICAO;NR_TURNO;SG_UF;DS_CARGO;SQ_CANDIDATO;NR_CANDIDATO;"
        "NM_URNA_CANDIDATO;NM_CANDIDATO;SG_PARTIDO\n"
    )
    with ZipFile(path, "w") as archive:
        archive.writestr(
            "consulta_cand_2026_SP.csv",
            header
            + "2026;1;SP;DEPUTADO FEDERAL;250000000001;1234;FULANA;FULANA DA SILVA;REDE\n"
            + "2026;2;SP;DEPUTADO FEDERAL;250000000002;5678;IGNORAR TURNO;IGNORAR;REDE\n"
            + "2026;1;SP;VEREADOR;250000000003;99999;IGNORAR CARGO;IGNORAR;REDE\n",
        )
        archive.writestr(
            "consulta_cand_2026_BRASIL.csv",
            header + "2026;1;BR;PRESIDENTE;280000000001;80;PRESIDENTA;PRESIDENTA TESTE;PDT\n",
        )


def test_build_candidate_catalog_filters_general_election_offices(tmp_path: Path) -> None:
    zip_path = tmp_path / "consulta_cand_2026.zip"
    write_candidates_zip(zip_path)

    catalog = build_candidate_catalog(candidates_zip_path=zip_path, year=2026, ufs=["SP"])

    assert catalog["metadata"]["count"] == 2
    candidates = catalog["candidates"]
    assert candidates[0]["id"] == "280000000001"
    assert candidates[0]["uf"] == "BR"
    assert candidates[0]["office"] == "president"
    assert candidates[1]["id"] == "250000000001"
    assert candidates[1]["office"] == "federal_deputy"


def test_write_candidate_catalog_outputs_json(tmp_path: Path) -> None:
    zip_path = tmp_path / "consulta_cand_2026.zip"
    output_path = tmp_path / "candidates.json"
    write_candidates_zip(zip_path)

    count = write_candidate_catalog(
        candidates_zip_path=zip_path,
        output_path=output_path,
        year=2026,
        ufs=["SP"],
    )

    payload = json.loads(output_path.read_text(encoding="utf-8"))
    assert count == 2
    assert payload["metadata"]["source"] == "Tribunal Superior Eleitoral"
    assert len(payload["candidates"]) == 2
