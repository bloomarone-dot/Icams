import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth_utils import has_password, hash_password, verify_password
from app.database import get_db
from app.models import InventoryLine, Mission, MissionCadence, OdooSnapshot, Product, Profile, Site, Store, SyncQueueItem, Zone
from app.schemas import (
    AppSettingsSchema,
    ClaimMissionRequest,
    CreateMissionRequest,
    LoginRequest,
    LoginResponse,
    MissionSchema,
    SaveInventoryLineRequest,
)
from app.seed import uid
from app.serializers import (
    apply_cadence,
    apply_mission,
    apply_product,
    apply_profile,
    apply_site,
    apply_snapshot,
    apply_store,
    apply_zone,
    build_bootstrap,
    get_settings,
    inventory_line_to_schema,
    mission_to_schema,
    save_settings,
    snapshot_to_schema,
)
from app.services.conversions import compute_ecart_value, compute_physical_qty
from app.types import can_access_desk

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/bootstrap")
def bootstrap(db: Session = Depends(get_db)):
    return build_bootstrap(db)


@router.post("/auth/mobile", response_model=LoginResponse)
def login_mobile(body: LoginRequest, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == body.profileId).first()
    if not profile or not profile.active:
        return LoginResponse(ok=False, error="Profil introuvable")
    if not has_password(profile.password_hash):
        return LoginResponse(ok=False, error="Mot de passe non configuré — demandez à l'administrateur")
    if not verify_password(body.password, profile.password_hash):
        return LoginResponse(ok=False, error="Mot de passe incorrect")
    return LoginResponse(ok=True, profileId=profile.id)


@router.post("/auth/desk", response_model=LoginResponse)
def login_desk(body: LoginRequest, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == body.profileId).first()
    if not profile or not profile.active:
        return LoginResponse(ok=False, error="Profil introuvable")
    if not can_access_desk(profile.role):
        return LoginResponse(ok=False, error="Accès bureau réservé à la Direction et Admin")
    if not has_password(profile.password_hash):
        return LoginResponse(ok=False, error="Mot de passe non configuré — contactez l'administrateur")
    if not verify_password(body.password, profile.password_hash):
        return LoginResponse(ok=False, error="Mot de passe incorrect")
    return LoginResponse(ok=True, profileId=profile.id)


@router.post("/auth/desk/setup", response_model=LoginResponse)
def setup_desk(body: LoginRequest, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == body.profileId).first()
    if not profile or not profile.active:
        return LoginResponse(ok=False, error="Profil introuvable")
    if profile.role != "ADMIN":
        return LoginResponse(ok=False, error="Seul un administrateur peut effectuer la configuration initiale")
    if len(body.password) < 4:
        return LoginResponse(ok=False, error="Mot de passe trop court (4 caractères minimum)")
    profile.password_hash = hash_password(body.password)
    db.commit()
    return LoginResponse(ok=True, profileId=profile.id)


@router.put("/settings")
def update_settings(body: AppSettingsSchema, db: Session = Depends(get_db)):
    return save_settings(db, body)


@router.put("/zones/{zone_id}")
def save_zone(zone_id: str, body: dict, db: Session = Depends(get_db)):
    body["id"] = zone_id
    return apply_zone(db, body)


@router.delete("/zones/{zone_id}")
def delete_zone(zone_id: str, db: Session = Depends(get_db)):
    row = db.query(Zone).filter_by(id=zone_id).first()
    if row:
        row.active = False
        db.commit()
    return {"ok": True}


@router.put("/sites/{site_id}")
def save_site(site_id: str, body: dict, db: Session = Depends(get_db)):
    body["id"] = site_id
    return apply_site(db, body)


@router.delete("/sites/{site_id}")
def delete_site(site_id: str, db: Session = Depends(get_db)):
    row = db.query(Site).filter_by(id=site_id).first()
    if row:
        row.active = False
        db.commit()
    return {"ok": True}


@router.put("/stores/{store_id}")
def save_store(store_id: str, body: dict, db: Session = Depends(get_db)):
    body["id"] = store_id
    return apply_store(db, body)


@router.delete("/stores/{store_id}")
def delete_store(store_id: str, db: Session = Depends(get_db)):
    row = db.query(Store).filter_by(id=store_id).first()
    if row:
        row.active = False
        db.commit()
    return {"ok": True}


@router.put("/products/{product_id}")
def save_product(product_id: str, body: dict, db: Session = Depends(get_db)):
    body["id"] = product_id
    return apply_product(db, body)


@router.delete("/products/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)):
    row = db.query(Product).filter_by(id=product_id).first()
    if row:
        row.active = False
        db.commit()
    return {"ok": True}


@router.put("/profiles/{profile_id}")
def save_profile(profile_id: str, body: dict, db: Session = Depends(get_db)):
    body["id"] = profile_id
    plain = body.pop("plainPassword", None)
    if plain:
        body["passwordHash"] = hash_password(plain)
    return apply_profile(db, body)


@router.delete("/profiles/{profile_id}")
def delete_profile(profile_id: str, db: Session = Depends(get_db)):
    row = db.query(Profile).filter_by(id=profile_id).first()
    if row:
        row.active = False
        db.commit()
    return {"ok": True}


@router.put("/cadences/{cadence_id}")
def save_cadence(cadence_id: str, body: dict, db: Session = Depends(get_db)):
    body["id"] = cadence_id
    return apply_cadence(db, body)


@router.delete("/cadences/{cadence_id}")
def delete_cadence(cadence_id: str, db: Session = Depends(get_db)):
    row = db.query(MissionCadence).filter_by(id=cadence_id).first()
    if row:
        row.active = False
        db.commit()
    return {"ok": True}


@router.post("/snapshots")
def create_snapshot(body: dict, db: Session = Depends(get_db)):
    return apply_snapshot(db, body)


@router.post("/missions", response_model=MissionSchema)
def create_mission(body: CreateMissionRequest, db: Session = Depends(get_db)):
    cadence = db.query(MissionCadence).filter(MissionCadence.id == body.cadenceId).first()
    next_due = None
    if cadence:
        next_due = (datetime.utcnow() + timedelta(days=cadence.interval_days)).date().isoformat()

    mission_data = {
        "id": uid("MISS-"),
        "name": body.name,
        "storeId": body.storeId,
        "entityId": body.entityId,
        "family": body.family,
        "cadenceId": body.cadenceId,
        "isPermanent": body.isPermanent,
        "assignedControllerIds": body.assignedControllerIds,
        "controllerId": body.controllerId or "",
        "createdByProfileId": body.createdByProfileId,
        "snapshotId": body.snapshotId,
        "status": body.status,
        "syncStatus": "LOCAL",
        "startedAt": datetime.utcnow().isoformat(),
        "nextDueDate": next_due,
        "notes": body.notes,
    }
    return apply_mission(db, mission_data)


@router.put("/missions/{mission_id}", response_model=MissionSchema)
def update_mission(mission_id: str, body: dict, db: Session = Depends(get_db)):
    body["id"] = mission_id
    return apply_mission(db, body)


@router.post("/missions/{mission_id}/claim", response_model=MissionSchema)
def claim_mission(mission_id: str, body: ClaimMissionRequest, db: Session = Depends(get_db)):
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission introuvable")
    data = mission_to_schema(mission).model_dump()
    data["controllerId"] = body.controllerId
    if mission.status == "BROUILLON":
        data["status"] = "EN_COURS"
    return apply_mission(db, data)


@router.post("/missions/{mission_id}/submit", response_model=MissionSchema)
def submit_mission(mission_id: str, db: Session = Depends(get_db)):
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission introuvable")

    data = mission_to_schema(mission).model_dump()
    data["status"] = "SOUMIS"
    data["syncStatus"] = "PENDING"
    data["submittedAt"] = datetime.utcnow().isoformat()
    result = apply_mission(db, data)

    db.add(
        SyncQueueItem(
            id=uid("SYNC-"),
            mission_id=mission_id,
            payload=json.dumps(data),
            created_at=datetime.utcnow().isoformat(),
            attempts=0,
            status="PENDING",
        )
    )
    db.commit()
    return result


@router.post("/missions/{mission_id}/validate", response_model=MissionSchema)
def validate_mission(mission_id: str, db: Session = Depends(get_db)):
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission introuvable")

    cadence = db.query(MissionCadence).filter(MissionCadence.id == mission.cadence_id).first()
    data = mission_to_schema(mission).model_dump()

    if mission.is_permanent:
        db.query(InventoryLine).filter(InventoryLine.mission_id == mission_id).delete()
        next_due = None
        if cadence:
            next_due = (datetime.utcnow() + timedelta(days=cadence.interval_days)).date().isoformat()
        data.update({
            "status": "BROUILLON",
            "controllerId": "",
            "submittedAt": None,
            "syncStatus": "LOCAL",
            "nextDueDate": next_due,
        })
    else:
        data["status"] = "VALIDE"

    return apply_mission(db, data)


@router.put("/inventory-lines")
def save_inventory_line(body: SaveInventoryLineRequest, db: Session = Depends(get_db)):
    mission = db.query(Mission).filter(Mission.id == body.missionId).first()
    product = db.query(Product).filter(Product.id == body.productId).first()
    if not mission or not product:
        raise HTTPException(status_code=404, detail="Mission ou produit introuvable")

    settings = get_settings(db)
    system_qty = 0.0
    if mission.snapshot_id:
        snap = db.query(OdooSnapshot).filter(OdooSnapshot.id == mission.snapshot_id).first()
        if snap:
            lines = json.loads(snap.lines or "[]")
            for line in lines:
                if line.get("productId") == body.productId:
                    system_qty = float(line.get("systemQty", 0))
                    break

    physical_qty, avarie_qty = compute_physical_qty(mission.family, body.countData, settings)
    ecart = physical_qty - system_qty
    ecart_value = compute_ecart_value(ecart, product, mission.family, settings)

    existing = (
        db.query(InventoryLine)
        .filter(InventoryLine.mission_id == body.missionId, InventoryLine.product_id == body.productId)
        .first()
    )
    line_id = existing.id if existing else uid("LINE-")
    row = InventoryLine(
        id=line_id,
        mission_id=body.missionId,
        product_id=body.productId,
        count_data=json.dumps(body.countData),
        physical_qty=physical_qty,
        system_qty=system_qty,
        ecart=ecart,
        avarie_qty=avarie_qty,
        ecart_value=ecart_value,
        observation=body.observation,
        updated_at=datetime.utcnow().isoformat(),
    )
    db.merge(row)

    if mission.status == "BROUILLON":
        mission.status = "EN_COURS"
    db.commit()
    return inventory_line_to_schema(row)
