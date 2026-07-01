import json
import uuid
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models import (
    AppSettingsRow,
    Entity,
    InventoryLine,
    Mission,
    MissionCadence,
    OdooSnapshot,
    Product,
    Profile,
    Site,
    Store,
    SyncQueueItem,
    Zone,
)
from app.schemas import (
    AppSettingsSchema,
    ConversionRules,
    OdooColumnMapping,
    ThemeSettings,
)

DEFAULT_SETTINGS = AppSettingsSchema(
    companyName="ATG — Inventory Control & Audit",
    currency="FCFA",
    theme=ThemeSettings(
        primaryColor="#4f46e5",
        accentColor="#818cf8",
        backgroundColor="#020617",
    ),
    conversionRules=ConversionRules(
        cigaretteCartonToCartouches=50,
        gadgetBalotToUnits=100,
        vapeCartonToPieces=100,
        vapePaquetToPieces=10,
    ),
    odooImportMapping=OdooColumnMapping(
        productCode="default_code",
        productName="name",
        location="location",
        quantity="quantity",
        uom="uom",
    ),
    odooExportPrefix="ICAMS_AJUSTEMENT",
    observationTemplates=[
        "RAS",
        "manquant constaté",
        "excédent constaté",
        "à régulariser",
        "confusion de parfum",
        "confusion nouvelle/ancienne image",
        "écart non livré",
    ],
    missionStatuses=["BROUILLON", "EN_COURS", "SOUMIS", "VALIDE", "EXPORTE"],
    syncRetryMinutes=5,
    allowOfflineMode=True,
    requireOdooSnapshotBeforeCount=False,
)

DEFAULT_CADENCES = [
    {"name": "Journalier", "intervalDays": 1, "description": "Contrôle quotidien", "sortOrder": 1},
    {"name": "Mensuel", "intervalDays": 30, "description": "Inventaire mensuel", "sortOrder": 2},
    {"name": "Bimensuel", "intervalDays": 60, "description": "Tous les deux mois", "sortOrder": 3},
    {"name": "Trimestriel", "intervalDays": 90, "description": "Inventaire trimestriel", "sortOrder": 4},
    {"name": "Annuel", "intervalDays": 365, "description": "Inventaire annuel", "sortOrder": 5},
]

ENTITIES = [
    {"code": "AFKOT", "name": "AFKOT"},
    {"code": "BOSCAM", "name": "BOSCAM"},
    {"code": "CTC", "name": "CTC"},
]

ZONES = ["ZONNE EST-SUD", "ZONNE LITTORAL-OUEST", "ZONNE GRAND NORD"]

SITES = [
    {"zone": "ZONNE EST-SUD", "name": "GAROUA BOULAI"},
    {"zone": "ZONNE EST-SUD", "name": "BERTOUA"},
    {"zone": "ZONNE LITTORAL-OUEST", "name": "DOUALA"},
    {"zone": "ZONNE LITTORAL-OUEST", "name": "KUMBA"},
    {"zone": "ZONNE LITTORAL-OUEST", "name": "BAMENDA"},
    {"zone": "ZONNE LITTORAL-OUEST", "name": "BAFOUSSAM"},
    {"zone": "ZONNE GRAND NORD", "name": "MAROUA"},
    {"zone": "ZONNE GRAND NORD", "name": "GAROUA"},
    {"zone": "ZONNE GRAND NORD", "name": "NGAOUNDERE"},
]


def uid(prefix: str = "") -> str:
    return f"{prefix}{uuid.uuid4().hex[:8].upper()}"


def seed_database(db: Session) -> None:
    if db.query(Zone).count() > 0:
        return

    zones = [Zone(id=uid("ZON-"), name=name, active=True) for name in ZONES]
    zone_by_name = {z.name: z.id for z in zones}
    db.add_all(zones)

    sites = [
        Site(id=uid("SITE-"), zone_id=zone_by_name[s["zone"]], name=s["name"], active=True)
        for s in SITES
    ]
    db.add_all(sites)
    site_by_id = {s.id: s for s in sites}

    stores: list[Store] = []
    for site in sites:
        for ent in ENTITIES:
            stores.append(
                Store(
                    id=uid("MAG-"),
                    site_id=site.id,
                    name=f"{ent['code']} — {site.name}",
                    odoo_location_code=f"{ent['code']}/{site.name}",
                    active=True,
                )
            )
    db.add_all(stores)

    entities = [Entity(id=uid("ENT-"), code=e["code"], name=e["name"], active=True) for e in ENTITIES]
    db.add_all(entities)
    entity_by_code = {e.code: e.id for e in entities}

    products: list[Product] = []

    afkot_cig = [
        "Esse change 4mg", "Esse change plus", "Time change simple", "Time change plus",
        "Time apple V", "Time tropic V", "Time gold V", "Time red", "Time strawberry V",
    ]
    for i, d in enumerate(afkot_cig):
        products.append(
            Product(
                id=uid("PRD-"),
                entity_id=entity_by_code["AFKOT"],
                family="CIGARETTE",
                code=f"AFK-C{i + 1:03d}",
                designation=d,
                brand="Esse" if d.startswith("Esse") else "Time",
                packaging="Carton/Cartouche",
                unit_price=90,
                pack_price=4500,
                active=True,
            )
        )

    afkot_gadget = [
        "Affiches Time", "Affiches A3", "Caisses", "Casquettes", "Presentoirs",
        "Parassols", "Polos", "Sacs plastiques",
    ]
    for i, d in enumerate(afkot_gadget):
        products.append(
            Product(
                id=uid("PRD-"),
                entity_id=entity_by_code["AFKOT"],
                family="GADGET",
                code=f"AFK-G{i + 1:03d}",
                designation=d,
                brand="Time",
                packaging="Balot/Unité",
                unit_price=500,
                pack_price=50000,
                active=True,
            )
        )

    bos_vapes = [
        "vega str watermelon 0,8p", "vega blueberry ice 0,8p", "vega banana ice 0,8p",
        "vega str ice 0,8p", "vega menthol ice 0,8p", "vega str banana 1,5p",
        "vega grape-ICE 1,5p", "vega str ice 1,5p",
    ]
    for i, d in enumerate(bos_vapes):
        products.append(
            Product(
                id=uid("PRD-"),
                entity_id=entity_by_code["BOSCAM"],
                family="VAPE",
                code=f"BOS-V{i + 1:03d}",
                designation=d,
                brand="Vega",
                packaging="Carton/Paquet/Pièce",
                unit_price=3500,
                pack_price=350000,
                active=True,
            )
        )

    bos_cig = ["vega b10 v", "vega b10 sv", "vega b20sv", "vega m10 v", "vega ks apple mint 20 v", "vega ks ice 20 v"]
    for i, d in enumerate(bos_cig):
        products.append(
            Product(
                id=uid("PRD-"),
                entity_id=entity_by_code["BOSCAM"],
                family="CIGARETTE",
                code=f"BOS-C{i + 1:03d}",
                designation=d,
                brand="Vega",
                packaging="Carton/Cartouche",
                unit_price=120,
                pack_price=6000,
                active=True,
            )
        )

    ctc_cig = ["GOLD SEAL B10 SV", "GOLD SEAL B20 V", "D&J M20 SV", "ORIS PULSE YELLOW FIZZ SS 20"]
    for i, d in enumerate(ctc_cig):
        brand = "Gold Seal" if "GOLD" in d else "Oris" if "ORIS" in d else "D&J"
        products.append(
            Product(
                id=uid("PRD-"),
                entity_id=entity_by_code["CTC"],
                family="CIGARETTE",
                code=f"CTC-C{i + 1:03d}",
                designation=d,
                brand=brand,
                packaging="Carton/Cartouche",
                unit_price=100,
                pack_price=5000,
                active=True,
            )
        )

    db.add_all(products)

    all_entity_ids = [e.id for e in entities]
    all_zone_ids = [z.id for z in zones]
    profiles = [
        Profile(
            id=uid("USR-"),
            name="Contrôleur Terrain",
            role="CONTROLEUR",
            entity_ids=json.dumps(all_entity_ids),
            zone_ids=json.dumps(all_zone_ids),
            password_hash="",
            active=True,
        ),
        Profile(
            id=uid("USR-"),
            name="Direction CDG ATG",
            role="DIRECTION",
            entity_ids=json.dumps(all_entity_ids),
            zone_ids=json.dumps(all_zone_ids),
            password_hash="",
            active=True,
        ),
        Profile(
            id=uid("USR-"),
            name="Administrateur ICAMS",
            role="ADMIN",
            entity_ids=json.dumps(all_entity_ids),
            zone_ids=json.dumps(all_zone_ids),
            password_hash="",
            active=True,
        ),
    ]
    db.add_all(profiles)

    cadences = [
        MissionCadence(
            id=uid("CAD-"),
            name=c["name"],
            interval_days=c["intervalDays"],
            description=c.get("description"),
            active=True,
            sort_order=c["sortOrder"],
        )
        for c in DEFAULT_CADENCES
    ]
    db.add_all(cadences)

    db.add(AppSettingsRow(id="global", data=DEFAULT_SETTINGS.model_dump_json()))
    db.commit()
