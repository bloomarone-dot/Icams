import json
from typing import Any

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
    BootstrapResponse,
    EntitySchema,
    InventoryLineSchema,
    MissionCadenceSchema,
    MissionSchema,
    OdooSnapshotSchema,
    ProductSchema,
    ProfileSchema,
    SiteSchema,
    StoreSchema,
    SyncQueueItemSchema,
    ZoneSchema,
)
from app.seed import DEFAULT_SETTINGS


def _loads_list(raw: str) -> list[str]:
    try:
        data = json.loads(raw or "[]")
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []


def profile_to_schema(row: Profile) -> ProfileSchema:
    return ProfileSchema(
        id=row.id,
        name=row.name,
        email=row.email,
        role=row.role,  # type: ignore[arg-type]
        entityIds=_loads_list(row.entity_ids),
        zoneIds=_loads_list(row.zone_ids),
        passwordHash=row.password_hash,
        active=row.active,
    )


def site_to_schema(row: Site) -> SiteSchema:
    return SiteSchema.model_validate(row)


def store_to_schema(row: Store) -> StoreSchema:
    return StoreSchema.model_validate(row)


def product_to_schema(row: Product) -> ProductSchema:
    return ProductSchema.model_validate(row)


def cadence_to_schema(row: MissionCadence) -> MissionCadenceSchema:
    return MissionCadenceSchema.model_validate(row)


def mission_to_schema(row: Mission) -> MissionSchema:
    return MissionSchema(
        id=row.id,
        name=row.name,
        storeId=row.store_id,
        entityId=row.entity_id,
        family=row.family,  # type: ignore[arg-type]
        cadenceId=row.cadence_id,
        isPermanent=row.is_permanent,
        assignedControllerIds=_loads_list(row.assigned_controller_ids),
        controllerId=row.controller_id,
        createdByProfileId=row.created_by_profile_id,
        snapshotId=row.snapshot_id,
        status=row.status,  # type: ignore[arg-type]
        syncStatus=row.sync_status,  # type: ignore[arg-type]
        startedAt=row.started_at,
        submittedAt=row.submitted_at,
        nextDueDate=row.next_due_date,
        notes=row.notes,
    )


def snapshot_to_schema(row: OdooSnapshot) -> OdooSnapshotSchema:
    lines = json.loads(row.lines or "[]")
    return OdooSnapshotSchema(
        id=row.id,
        storeId=row.store_id,
        fileName=row.file_name,
        importedAt=row.imported_at,
        importedBy=row.imported_by,
        lines=lines,
    )


def inventory_line_to_schema(row: InventoryLine) -> InventoryLineSchema:
    return InventoryLineSchema(
        id=row.id,
        missionId=row.mission_id,
        productId=row.product_id,
        countData=json.loads(row.count_data or "{}"),
        physicalQty=row.physical_qty,
        systemQty=row.system_qty,
        ecart=row.ecart,
        avarieQty=row.avarie_qty,
        ecartValue=row.ecart_value,
        observation=row.observation,
        updatedAt=row.updated_at,
    )


def sync_item_to_schema(row: SyncQueueItem) -> SyncQueueItemSchema:
    return SyncQueueItemSchema.model_validate(row)


def get_settings(db) -> AppSettingsSchema:
    row = db.query(AppSettingsRow).filter(AppSettingsRow.id == "global").first()
    if not row:
        return DEFAULT_SETTINGS
    data = json.loads(row.data)
    return AppSettingsSchema.model_validate({**DEFAULT_SETTINGS.model_dump(), **data})


def save_settings(db, settings: AppSettingsSchema) -> AppSettingsSchema:
    payload = settings.model_dump()
    row = db.query(AppSettingsRow).filter(AppSettingsRow.id == "global").first()
    if row:
        row.data = json.dumps(payload)
    else:
        db.add(AppSettingsRow(id="global", data=json.dumps(payload)))
    db.commit()
    return settings


def build_bootstrap(db) -> BootstrapResponse:
    zones = [ZoneSchema.model_validate(z) for z in db.query(Zone).all()]
    sites = [site_to_schema(s) for s in db.query(Site).all()]
    stores = [store_to_schema(s) for s in db.query(Store).all()]
    entities = [EntitySchema.model_validate(e) for e in db.query(Entity).all()]
    products = [product_to_schema(p) for p in db.query(Product).all()]
    profiles = [profile_to_schema(p) for p in db.query(Profile).all()]
    cadences = sorted(
        [cadence_to_schema(c) for c in db.query(MissionCadence).all()],
        key=lambda c: c.sortOrder,
    )
    missions = [mission_to_schema(m) for m in db.query(Mission).all()]
    snapshots = [snapshot_to_schema(s) for s in db.query(OdooSnapshot).all()]
    lines = [inventory_line_to_schema(l) for l in db.query(InventoryLine).all()]
    sync_queue = [sync_item_to_schema(s) for s in db.query(SyncQueueItem).all()]
    settings = get_settings(db)

    return BootstrapResponse(
        zones=zones,
        sites=sites,
        stores=stores,
        entities=entities,
        products=products,
        profiles=profiles,
        cadences=cadences,
        settings=settings,
        missions=missions,
        snapshots=snapshots,
        lines=lines,
        syncQueue=sync_queue,
    )


def apply_zone(db, data: dict[str, Any]) -> ZoneSchema:
    row = Zone(id=data["id"], name=data["name"], active=data.get("active", True))
    db.merge(row)
    db.commit()
    return ZoneSchema.model_validate(row)


def apply_site(db, data: dict[str, Any]) -> SiteSchema:
    row = Site(
        id=data["id"],
        zone_id=data["zoneId"],
        name=data["name"],
        active=data.get("active", True),
    )
    db.merge(row)
    db.commit()
    return site_to_schema(row)


def apply_store(db, data: dict[str, Any]) -> StoreSchema:
    row = Store(
        id=data["id"],
        site_id=data["siteId"],
        name=data["name"],
        odoo_location_code=data.get("odooLocationCode"),
        active=data.get("active", True),
    )
    db.merge(row)
    db.commit()
    return store_to_schema(row)


def apply_product(db, data: dict[str, Any]) -> ProductSchema:
    row = Product(
        id=data["id"],
        entity_id=data["entityId"],
        family=data["family"],
        code=data["code"],
        designation=data["designation"],
        brand=data.get("brand"),
        packaging=data.get("packaging"),
        odoo_product_code=data.get("odooProductCode"),
        unit_price=data.get("unitPrice"),
        pack_price=data.get("packPrice"),
        active=data.get("active", True),
    )
    db.merge(row)
    db.commit()
    return product_to_schema(row)


def apply_profile(db, data: dict[str, Any]) -> ProfileSchema:
    existing = db.query(Profile).filter(Profile.id == data["id"]).first()
    password_hash = data.get("passwordHash", existing.password_hash if existing else "")
    row = Profile(
        id=data["id"],
        name=data["name"],
        email=data.get("email"),
        role=data["role"],
        entity_ids=json.dumps(data.get("entityIds", [])),
        zone_ids=json.dumps(data.get("zoneIds", [])),
        password_hash=password_hash,
        active=data.get("active", True),
    )
    db.merge(row)
    db.commit()
    return profile_to_schema(row)


def apply_cadence(db, data: dict[str, Any]) -> MissionCadenceSchema:
    row = MissionCadence(
        id=data["id"],
        name=data["name"],
        interval_days=data["intervalDays"],
        description=data.get("description"),
        active=data.get("active", True),
        sort_order=data.get("sortOrder", 0),
    )
    db.merge(row)
    db.commit()
    return cadence_to_schema(row)


def apply_snapshot(db, data: dict[str, Any]) -> OdooSnapshotSchema:
    row = OdooSnapshot(
        id=data["id"],
        store_id=data["storeId"],
        file_name=data["fileName"],
        imported_at=data["importedAt"],
        imported_by=data.get("importedBy"),
        lines=json.dumps(data.get("lines", [])),
    )
    db.merge(row)
    db.commit()
    return snapshot_to_schema(row)


def apply_mission(db, data: dict[str, Any]) -> MissionSchema:
    row = Mission(
        id=data["id"],
        name=data["name"],
        store_id=data["storeId"],
        entity_id=data["entityId"],
        family=data["family"],
        cadence_id=data["cadenceId"],
        is_permanent=data.get("isPermanent", False),
        assigned_controller_ids=json.dumps(data.get("assignedControllerIds", [])),
        controller_id=data.get("controllerId", ""),
        created_by_profile_id=data.get("createdByProfileId"),
        snapshot_id=data.get("snapshotId"),
        status=data["status"],
        sync_status=data.get("syncStatus", "LOCAL"),
        started_at=data["startedAt"],
        submitted_at=data.get("submittedAt"),
        next_due_date=data.get("nextDueDate"),
        notes=data.get("notes"),
    )
    db.merge(row)
    db.commit()
    return mission_to_schema(row)
