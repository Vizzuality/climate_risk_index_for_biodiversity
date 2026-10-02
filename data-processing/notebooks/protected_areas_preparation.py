import marimo

__generated_with = "0.24.1"
app = marimo.App()


@app.cell
def _():
    import marimo as mo

    return (mo,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Protected Areas Preparation

    Combine multiple marine conservation datasets (links provided by Oceans North) into a unified GeoPackage:

    - **[Canadian Protected and Conserved Areas Database (CPCAD)](https://data-donnees.az.ec.gc.ca/api/file?path=%2Fspecies%2Fprotectrestore%2Fcanadian-protected-conserved-areas-database%2FDatabases%2FProtectedConservedArea_2025.zip)** — Conglomerate of all legally protected areas. Use just marine subset.
    - **[DFO MPA](https://api-proxy.edh-cde.dfo-mpo.gc.ca/catalogue/records/a1e18963-25dd-4219-a33f-1a38c4971250/attachments/DFO_MPA_MPO_ZPM_SHP.zip)** - Marine Protected Areas (which are designated by DFO under the Oceans Act). Get features missing from CPCAD.
    - **[OECM](https://api-proxy.edh-cde.dfo-mpo.gc.ca/catalogue/records/44769543-7a23-4991-a53f-c2cf7c7a946f/attachments/DFO_OECM_MPO_AMCEZ_SHP.zip)** — Marine Refuges or OECMs (which are designated by DFO under the Fisheries Act). Get features missing from CPCAD.
    - **[EBSAs](https://api-proxy.edh-cde.dfo-mpo.gc.ca/catalogue/records/d2d6057f-d7c4-45d9-9fd9-0a58370577e0/attachments/DFO_EBSA.zip)** — Ecologically and Biologically Significant Areas (advisory, not regulatory).
    - **[Conservation Network](https://api-proxy.edh-cde.dfo-mpo.gc.ca/catalogue/records/bb048082-bc05-4588-b4f0-492b1f1b8737/attachments/ConservationNetwork_ReseauDeConservation_Shapefile2025.zip)** —  Scotian Shelf-Bay of Fundy Bioregion (Atlantic/Nova Scotia area) is the only area that has an MPA network plan - meaning they include public draft areas of consideration that have not yet been approved.
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Setup
    """)
    return


@app.cell
def _():
    # Imports
    import unicodedata
    from difflib import SequenceMatcher
    from pathlib import Path

    import geopandas as gpd
    import pandas as pd
    import requests
    from bs4 import BeautifulSoup

    return BeautifulSoup, Path, SequenceMatcher, gpd, pd, requests, unicodedata


@app.cell
def _(Path):
    # File paths and constants for all source datasets and output
    DATA_DIR = Path("../data")

    # CPCAD
    CPCAD_PATH = DATA_DIR / "01_raw" / "ProtectedConservedArea_2025.zip"
    CPCAD_LAYER = "ProtectedConservedArea_2025"
    CPCAD_MARINE_PATH = (
        DATA_DIR / "01_raw" / "ProtectedConservedArea_2025_Marine.geojson"
    )

    # DFO MPA & OECM
    DFO_MPA_PATH = DATA_DIR / "01_raw" / "DFO_MPA_MPO_ZPM_SHP.zip"
    DFO_OECM_PATH = DATA_DIR / "01_raw" / "DFO_OECM_MPO_AMCEZ_SHP.zip"

    # DFO website
    DFO_URL = "https://www.dfo-mpo.gc.ca/oceans/conservation/areas-zones/index-eng.html"
    DFO_CSV_PATH = DATA_DIR / "01_raw" / "dfo_website_conservation_areas.csv"

    # EBSA
    EBSA_PATH = DATA_DIR / "01_raw" / "DFO_EBSA.zip"

    # Conservation Network
    CN_PATH = (
        DATA_DIR
        / "01_raw"
        / "ConservationNetwork_ReseauDeConservation_Shapefile2025.zip"
    )
    CN_SHP = "ConservationNetwork_ReseauDeConservation_2025.shp"

    # Marine Administrative Boundaries
    BIOREGIONS_GDB_PATH = DATA_DIR / "01_raw" / "FederalMarineBioregions_GDB.zip"
    EASTERN_CANADA_PATH = (
        DATA_DIR / "01_raw" / "EasternCanadaMarineSpatialPlanningAreas_shp.zip"
    )

    # Output
    MERGED_OUTPUT_PATH = (
        DATA_DIR / "02_intermediate" / "marine_conservation_areas_merged.gpkg"
    )
    BOUNDARIES_OUTPUT_PATH = (
        DATA_DIR / "03_primary" / "marine_administrative_boundaries.gpkg"
    )
    MERGED_WITH_REGIONS_PATH = (
        DATA_DIR / "03_primary" / "marine_conservation_areas_with_regions.gpkg"
    )
    return (
        BIOREGIONS_GDB_PATH,
        BOUNDARIES_OUTPUT_PATH,
        CN_PATH,
        CN_SHP,
        CPCAD_LAYER,
        CPCAD_MARINE_PATH,
        CPCAD_PATH,
        DFO_CSV_PATH,
        DFO_MPA_PATH,
        DFO_OECM_PATH,
        DFO_URL,
        EASTERN_CANADA_PATH,
        EBSA_PATH,
        MERGED_OUTPUT_PATH,
        MERGED_WITH_REGIONS_PATH,
    )


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Protected Areas
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ### 1. CPCAD — Canadian Protected and Conserved Areas Database
    """)
    return


@app.cell
def _(CPCAD_LAYER, CPCAD_MARINE_PATH, CPCAD_PATH, gpd):
    # Load CPCAD geodatabase and extract marine-only features
    gdb_path = f"/vsizip/{CPCAD_PATH}/{CPCAD_LAYER}.gdb"
    gdf = gpd.read_file(gdb_path, layer=CPCAD_LAYER)
    gdf_marine = gdf[gdf["BIOME"] == "M"].copy()
    gdf_marine.to_file(CPCAD_MARINE_PATH, driver="GeoJSON")
    return (gdf_marine,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ### 2. DFO MPA & OECM

    Load DFO Marine Protected Areas and OECM datasets. Features already in CPCAD are excluded during the merge step.
    """)
    return


@app.cell
def _(DFO_MPA_PATH, DFO_OECM_PATH, gpd):
    # Load DFO MPA and OECM shapefiles
    gdf_dfo_mpa = gpd.read_file(
        f"/vsizip/{DFO_MPA_PATH}/DFO_MPA_MPO_ZPM_SHP/DFO_MPA_MPO_ZPM.shp"
    )
    gdf_dfo_oecm = gpd.read_file(
        f"/vsizip/{DFO_OECM_PATH}/DFO_OECM_MPO_AMCEZ_SHP/DFO_OECM_MPO_AMCEZ.shp"
    )
    return gdf_dfo_mpa, gdf_dfo_oecm


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ### 3. DFO website cross-reference

    Scrape the [DFO conservation areas page](https://www.dfo-mpo.gc.ca/oceans/conservation/areas-zones/index-eng.html) to get the list of existing and proposed MPAs/Refuges and their URLs.
    """)
    return


@app.cell
def _(BeautifulSoup, DFO_CSV_PATH, DFO_URL, pd, requests):
    # Scrape DFO website tables for existing/proposed conservation areas
    DFO_BASE_URL = "https://www.dfo-mpo.gc.ca"
    EXPECTED_COLUMNS = 6
    response = requests.get(DFO_URL, timeout=30)
    response.raise_for_status()
    response.encoding = "utf-8"
    soup = BeautifulSoup(response.text, "html.parser")
    tables = soup.find_all("table")
    table_labels = {0: "Proposed", 1: "Existing"}
    rows = []
    for table_idx, _status in table_labels.items():
        table = tables[table_idx]
        tbody = table.find("tbody")
        if not tbody:
            continue
        for tr in tbody.find_all("tr"):
            cells = tr.find_all("td")
            if len(cells) < EXPECTED_COLUMNS:
                continue
            link = cells[1].find("a", href=True)
            url = ""
            if link:
                href = str(link["href"])
                url = DFO_BASE_URL + href if href.startswith("/") else href
            rows.append(
                {
                    "name": cells[1].get_text(strip=True),
                    "ocean": cells[0].get_text(strip=True),
                    "type": cells[2].get_text(strip=True),
                    "size_km2": cells[3].get_text(strip=True).replace(",", ""),
                    "status": _status,
                    "url": url,
                }
            )
    df_website = pd.DataFrame(rows)
    DFO_CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    df_website.to_csv(DFO_CSV_PATH, index=False)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ### 4. Ecologically and Biologically Significant Areas (EBSAs)

    EBSAs are areas identified through scientific assessment as having special biological significance. They are **not a protection designation** — they inform spatial planning and prioritization.
    """)
    return


@app.cell
def _(EBSA_PATH, gpd):
    # Load EBSA shapefile and summarize contents
    gdf_ebsa = gpd.read_file(f"/vsizip/{EBSA_PATH}/DFO_EBSA/DFO_EBSA.shp")
    return (gdf_ebsa,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ### 5. Scotian Shelf-Bay of Fundy Conservation Network

    The only Canadian bioregion with a public MPA network plan. Includes existing designated sites, proposed AOIs, and draft Tier 1/2 network sites.
    """)
    return


@app.cell
def _(CN_PATH, CN_SHP, gpd):
    # Load Conservation Network shapefile and summarize contents
    gdf_cn = gpd.read_file(f"/vsizip/{CN_PATH}/{CN_SHP}")
    return (gdf_cn,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ### Merge all datasets

    | Field | Description |
    |-------|-------------|
    | `name` | English name |
    | `name_fr` | French name |
    | `source` | `CPCAD`, `DFO_MPA`, `DFO_OECM`, `EBSA`, `Conservation_Network` |
    | `source_url` | Download URL of the source dataset |
    | `layer_type` | `MPA`, `OECM`, `AOI`, `Network Site`, `EBSA` |
    | `status` | `Designated`, `Proposed`, `Draft`, `Identified`, `Other` |
    | `designation_type` | Marine Protected Area, Ecological Reserve, Migratory Bird Sanctuary, etc. |
    | `iucn_category` | IUCN category (from CPCAD only) |
    | `year_established` | Year designated/identified (from CPCAD only) |
    | `manager` | Managing body |
    | `url` | Link to area page or report |
    | `area_km2` | Area in km² |
    | `region` | Marine bioregion(s) the geometry intersects (comma-separated if multiple) |
    | `geometry` | Polygon |
    """)
    return


@app.cell
def _(
    DFO_CSV_PATH,
    SequenceMatcher,
    gdf_dfo_mpa,
    gdf_dfo_oecm,
    gdf_ebsa,
    gdf_marine,
    pd,
    unicodedata,
):
    # Lookups and helpers
    IUCN_LABELS = {
        1: "Ia",
        2: "Ib",
        3: "II",
        4: "III",
        5: "IV",
        6: "V",
        7: "VI",
        8: "Not Reported",
        9: "Not Applicable",
    }
    PA_OECM_LAYER = {1: "MPA", 2: "OECM", 3: "MPA", 4: "OECM", 5: "MPA"}
    CPCAD_STATUS = {1: "Designated", 2: "Proposed", 3: "Other"}
    SOURCE_URL = {
        "CPCAD": "https://www.canada.ca/en/environment-climate-change/services/national-wildlife-areas/protected-conserved-areas-database.html",
        "DFO_MPA": "https://open.canada.ca/data/en/dataset/a1e18963-25dd-4219-a33f-1a38c4971250",
        "DFO_OECM": "https://open.canada.ca/data/en/dataset/44769543-7a23-4991-a53f-c2cf7c7a946f",
        "EBSA": "https://open.canada.ca/data/en/dataset/d2d6057f-d7c4-45d9-9fd9-0a58370577e0",
        "Conservation_Network": "https://open.canada.ca/data/en/dataset/bb048082-bc05-4588-b4f0-492b1f1b8737/resource/a690056f-2c96-4e0e-9f74-8eb8331a5ac9",
    }

    # PA_OECM_DF: 1=PA, 2=OECM, 3=Interim PA, 4=Interim OECM, 5=Not Applicable
    def _normalize_name(name):
        return unicodedata.normalize("NFC", str(name)).lower().strip()

    def _best_fuzzy_match(query, candidates, threshold=0.55):
        norm_q = _normalize_name(query)
        best_score, best = (0.0, None)
        for c in candidates:
            norm_c = _normalize_name(c)
            # STATUS: 1=Designated, 2=Proposed, 3=Other
            if norm_q == norm_c:
                return (c, 1.0)
            if norm_q in norm_c or norm_c in norm_q:
                return (c, 0.95)
            score = SequenceMatcher(None, norm_q, norm_c).ratio()
            if score > best_score:
                # Open Canada catalogue page for each source dataset
                best_score, best = (score, c)
        return (best, best_score) if best_score >= threshold else (None, best_score)

    def match_website_url(name, df_web):
        match, _ = _best_fuzzy_match(name, df_web["name"].tolist())
        if match:
            return str(df_web[df_web["name"] == match].iloc[0]["url"])
        return ""

    gdf_dfo_mpa_1 = gdf_dfo_mpa.to_crs(gdf_marine.crs)
    gdf_dfo_oecm_1 = gdf_dfo_oecm.to_crs(gdf_marine.crs)
    gdf_ebsa_1 = gdf_ebsa.to_crs(gdf_marine.crs)
    # Reproject source datasets to CPCAD CRS
    df_website_1 = pd.read_csv(DFO_CSV_PATH)  # type: ignore[assignment]
    return (
        CPCAD_STATUS,
        IUCN_LABELS,
        PA_OECM_LAYER,
        SOURCE_URL,
        df_website_1,
        gdf_dfo_mpa_1,
        gdf_dfo_oecm_1,
        gdf_ebsa_1,
        match_website_url,
    )


@app.cell
def _(
    CPCAD_STATUS,
    IUCN_LABELS,
    PA_OECM_LAYER,
    SOURCE_URL,
    gdf_marine,
    gpd,
    pd,
):
    # Harmonize CPCAD marine
    cpcad_rows = []
    for _, _r in gdf_marine.iterrows():
        cpcad_rows.append(
            {
                "name": _r["NAME_E"],
                "name_fr": _r["NAME_F"],
                "source": "CPCAD",
                "source_url": SOURCE_URL["CPCAD"],
                "layer_type": PA_OECM_LAYER.get(_r["PA_OECM_DF"], "MPA"),
                "status": CPCAD_STATUS.get(_r["STATUS"], ""),
                "designation_type": _r["TYPE_E"],
                "iucn_category": IUCN_LABELS.get(_r["IUCN_CAT"], ""),
                "year_established": int(_r["ESTYEAR"])
                if pd.notna(_r["ESTYEAR"])
                else None,
                "manager": _r["MGMT_E"],
                "url": "",
                "area_km2": _r["O_AREA_HA"] / 100
                if pd.notna(_r["O_AREA_HA"])
                else None,
                "geometry": _r.geometry,
            }
        )
    gdf_cpcad = gpd.GeoDataFrame(cpcad_rows, crs=gdf_marine.crs)
    return (gdf_cpcad,)


@app.cell
def _(SOURCE_URL, gdf_dfo_mpa_1, gdf_dfo_oecm_1, gdf_marine, gpd):
    cpcad_names = set(gdf_marine["NAME_E"].unique())
    mpa_missing = gdf_dfo_mpa_1[~gdf_dfo_mpa_1["NAME_E"].isin(cpcad_names)]
    mpa_rows = []
    for name in mpa_missing["NAME_E"].unique():
        subset = mpa_missing[mpa_missing["NAME_E"] == name]
        geom = subset.geometry.union_all()
        row = subset.iloc[0]
        mpa_rows.append(
            {
                "name": row["NAME_E"],
                "name_fr": row["NAME_F"],
                "source": "DFO_MPA",
                "source_url": SOURCE_URL["DFO_MPA"],
                "layer_type": "MPA",
                "status": "Designated",
                "designation_type": "Marine Protected Area",
                "iucn_category": "",
                "year_established": None,
                "manager": "Fisheries and Oceans Canada",
                "url": row.get("URL_E", "") or "",
                "area_km2": row["KM2"],
                "geometry": geom,
            }
        )
    gdf_mpa_add = gpd.GeoDataFrame(mpa_rows, crs=gdf_marine.crs)
    oecm_missing = gdf_dfo_oecm_1[~gdf_dfo_oecm_1["NAME_E"].isin(cpcad_names)]
    oecm_rows = []
    for _, _r in oecm_missing.iterrows():
        oecm_rows.append(
            {
                "name": _r["NAME_E"],
                "name_fr": _r["NAME_F"],
                "source": "DFO_OECM",
                "source_url": SOURCE_URL["DFO_OECM"],
                "layer_type": "OECM",
                "status": "Designated",
                "designation_type": "Other Effective Area-Based Conservation Measure",
                "iucn_category": "",
                "year_established": None,
                "manager": "Fisheries and Oceans Canada",
                "url": _r.get("URL_E", "") or "",
                "area_km2": _r["KM2"],
                "geometry": _r.geometry,
            }
        )
    gdf_oecm_add = gpd.GeoDataFrame(oecm_rows, crs=gdf_marine.crs)
    return gdf_mpa_add, gdf_oecm_add


@app.cell
def _(SOURCE_URL, gdf_cn, gdf_ebsa_1, gdf_marine, gpd, pd):
    cn_class_map = {
        "Areas of Interest (AOI)": ("AOI", "Proposed"),
        "Tier 1 Network Site": ("Network Site", "Draft"),
        "Tier 1 Network Site - to be evaluated by Unama'ki Institute of Natural Resources": (
            "Network Site",
            "Draft",
        ),
        "Tier 2 Network Site": ("Network Site", "Draft"),
    }
    cn_filtered = gdf_cn[gdf_cn["Class_E"].isin(cn_class_map.keys())].copy()
    cn_filtered = cn_filtered.to_crs(gdf_marine.crs)
    cn_rows = []
    for _, _r in cn_filtered.iterrows():
        layer_type, _status = cn_class_map[_r["Class_E"]]
        cn_rows.append(
            {
                "name": _r["Name_E"],
                "name_fr": _r["Name_F"],
                "source": "Conservation_Network",
                "source_url": SOURCE_URL["Conservation_Network"],
                "layer_type": layer_type,
                "status": _status,
                "designation_type": _r["Class_E"],
                "iucn_category": "",
                "year_established": None,
                "manager": _r["Agency_E"] if pd.notna(_r["Agency_E"]) else "",
                "url": _r["URL_E"] if pd.notna(_r["URL_E"]) else "",
                "area_km2": _r["Km2"],
                "geometry": _r.geometry,
            }
        )
    gdf_cn_add = gpd.GeoDataFrame(cn_rows, crs=gdf_marine.crs)
    ebsa_rows = []
    for _, _r in gdf_ebsa_1.iterrows():
        ebsa_rows.append(
            {
                "name": _r["Name"],
                "name_fr": _r["Nom"],
                "source": "EBSA",
                "source_url": SOURCE_URL["EBSA"],
                "layer_type": "EBSA",
                "status": "Identified",
                "designation_type": "Ecologically and Biologically Significant Area",
                "iucn_category": "",
                "year_established": None,
                "manager": "",
                "url": _r["Report_URL"] if pd.notna(_r["Report_URL"]) else "",
                "area_km2": _r["Area_Km2"],
                "geometry": _r.geometry,
            }
        )
    gdf_ebsa_add = gpd.GeoDataFrame(ebsa_rows, crs=gdf_marine.crs)
    return gdf_cn_add, gdf_ebsa_add


@app.cell
def _(
    MERGED_OUTPUT_PATH,
    df_website_1,
    gdf_cn_add,
    gdf_cpcad,
    gdf_ebsa_add,
    gdf_marine,
    gdf_mpa_add,
    gdf_oecm_add,
    gpd,
    match_website_url,
    pd,
):
    # Concatenate and fill missing URLs from DFO website scrape
    gdf_merged = pd.concat(
        [gdf_cpcad, gdf_mpa_add, gdf_oecm_add, gdf_cn_add, gdf_ebsa_add],
        ignore_index=True,
    )
    gdf_merged = gpd.GeoDataFrame(gdf_merged, crs=gdf_marine.crs)
    missing_url = gdf_merged["url"].fillna("").eq("")
    gdf_merged.loc[missing_url, "url"] = gdf_merged.loc[missing_url, "name"].apply(
        lambda n: match_website_url(n, df_website_1)
    )
    gdf_merged.to_file(MERGED_OUTPUT_PATH, driver="GPKG")
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Marine Administrative Boundaries

    Build a unified marine bioregions layer for spatial joins:

    - **Pacific & Arctic**: [Federal Marine Bioregions](https://open.canada.ca/data/en/dataset/23eb8b56-dac8-4efc-be7c-b8fa11ba62e9) (DFO)
    - **Atlantic**: [Eastern Canada Marine Spatial Planning Areas](https://open.canada.ca/data/en/dataset/4cba3249-e227-4c4e-a40a-acb1cde0aabd) — replaces the Atlantic bioregions from the federal dataset, which don't align well with MPA boundaries (the federal boundaries bisect the Saint-Pierre-et-Miquelon keyhole).
    """)
    return


@app.cell
def _(
    BIOREGIONS_GDB_PATH,
    BOUNDARIES_OUTPUT_PATH,
    EASTERN_CANADA_PATH,
    MERGED_OUTPUT_PATH,
    gpd,
    pd,
):
    # Load merged protected areas from intermediate output
    gdf_merged_1 = gpd.read_file(MERGED_OUTPUT_PATH)
    bioregions_gdb = f"/vsizip/{BIOREGIONS_GDB_PATH}/FederalMarineBioregions_GDB/FederalMarineBioregions.gdb"
    # Load Federal Marine Bioregions — keep Pacific & Arctic only
    gdf_bioregions = gpd.read_file(bioregions_gdb, layer="FederalMarineBioregions")
    gdf_pac_arctic = gdf_bioregions[
        gdf_bioregions["OCEAN_E"].isin(["Pacific", "Arctic"])
    ].copy()
    gdf_eastern = gpd.read_file(f"/vsizip/{EASTERN_CANADA_PATH}")
    gdf_eastern = gdf_eastern.to_crs(gdf_pac_arctic.crs)
    # Load Eastern Canada Marine Spatial Planning areas (Atlantic replacement)
    gdf_boundaries = pd.concat(
        [
            gdf_pac_arctic[["NAME_E", "OCEAN_E", "geometry"]].rename(
                columns={"NAME_E": "region"}
            ),
            gdf_eastern[["NAME_E", "geometry"]]
            .rename(columns={"NAME_E": "region"})
            .assign(OCEAN_E="Atlantic"),
        ],
        ignore_index=True,
    )
    gdf_boundaries = gpd.GeoDataFrame(gdf_boundaries, crs=gdf_pac_arctic.crs)  # type: ignore[assignment]
    # Merge into unified marine boundaries
    gdf_boundaries.to_file(BOUNDARIES_OUTPUT_PATH, driver="GPKG")
    return gdf_boundaries, gdf_merged_1


@app.cell
def _(MERGED_WITH_REGIONS_PATH, gdf_boundaries, gdf_merged_1, gpd):
    # Assign marine bioregion(s) to each feature via spatial join
    gdf_bounds_proj = gdf_boundaries.to_crs(gdf_merged_1.crs)  # type: ignore[assignment]
    joined = gpd.sjoin(
        gdf_merged_1,
        gdf_bounds_proj[["region", "geometry"]],
        how="left",
        predicate="intersects",
    )
    region_agg = joined.groupby(joined.index)["region"].apply(
        lambda x: ", ".join(sorted(x.dropna().unique()))
    )
    gdf_merged_1["region"] = region_agg
    gdf_merged_1["region"] = gdf_merged_1["region"].fillna("")
    gdf_merged_1.to_file(MERGED_WITH_REGIONS_PATH, driver="GPKG")
    return


if __name__ == "__main__":
    app.run()
