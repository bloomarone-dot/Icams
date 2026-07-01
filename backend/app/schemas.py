from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


EntityCode = Literal["AFKOT", "BOSCAM", "CTC"]
ProductFamily = Literal["CIGARETTE", "GADGET", "VAPE"]
UserRole = Literal["ADMIN", "DIRECTION", "CONTROLEUR"]
MissionStatus = Literal["BROUILLON", "EN_COURS", "SOUMIS", "VALIDE", "EXPORTE"]
SyncStatus = Literal["LOCAL", "PENDING", "SYNCED"]


class ZoneSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    active: bool = True


class SiteSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    zoneId: str = Field(validation_alias="zone_id")
    name: str
    active: bool = True


class StoreSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    siteId: str = Field(validation_alias="site_id")
    name: str
    odooLocationCode: str | None = Field(default=None, validation_alias="odoo_location_code")
    active: bool = True


class EntitySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    code: EntityCode
    name: str
    active: bool = True


class ProductSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    entityId: str = Field(validation_alias="entity_id")
    family: ProductFamily
    code: str
    designation: str
    brand: str | None = None
    packaging: str | None = None
    odooProductCode: str | None = Field(default=None, validation_alias="odoo_product_code")
    unitPrice: float | None = Field(default=None, validation_alias="unit_price")
    packPrice: float | None = Field(default=None, validation_alias="pack_price")
    active: bool = True


class ProfileSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    name: str
    email: str | None = None
    role: UserRole
    entityIds: list[str] = Field(default_factory=list)
    zoneIds: list[str] = Field(default_factory=list)
    passwordHash: str = Field(default="", validation_alias="password_hash")
    active: bool = True


class MissionCadenceSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    name: str
    intervalDays: int = Field(validation_alias="interval_days")
    description: str | None = None
    active: bool = True
    sortOrder: int = Field(default=0, validation_alias="sort_order")


class ThemeSettings(BaseModel):
    primaryColor: str
    accentColor: str
    backgroundColor: str
    logoDataUrl: str | None = None


class ConversionRules(BaseModel):
    cigaretteCartonToCartouches: int
    gadgetBalotToUnits: int
    vapeCartonToPieces: int
    vapePaquetToPieces: int


class OdooColumnMapping(BaseModel):
    productCode: str
    productName: str
    location: str
    quantity: str
    uom: str


class AppSettingsSchema(BaseModel):
    id: Literal["global"] = "global"
    companyName: str
    currency: str
    theme: ThemeSettings
    conversionRules: ConversionRules
    odooImportMapping: OdooColumnMapping
    odooExportPrefix: str
    observationTemplates: list[str]
    missionStatuses: list[MissionStatus]
    syncRetryMinutes: int
    allowOfflineMode: bool
    requireOdooSnapshotBeforeCount: bool
    authSetupVersion: int | None = None


class PackCount(BaseModel):
    cartons: float = 0
    cartouches: float = 0
    paquets: float = 0
    pieces: float = 0
    balots: float = 0
    unites: float = 0


class ImageCountBlock(BaseModel):
    bonEtat: PackCount
    avarie: PackCount


class CigaretteCount(BaseModel):
    type: Literal["CIGARETTE"] = "CIGARETTE"
    nouvelleImage: ImageCountBlock
    ancienneImage: ImageCountBlock


class GadgetCount(BaseModel):
    type: Literal["GADGET"] = "GADGET"
    balots: float = 0
    unites: float = 0


class VapeCount(BaseModel):
    type: Literal["VAPE"] = "VAPE"
    bonEtat: PackCount
    avarie: PackCount


CountData = CigaretteCount | GadgetCount | VapeCount


class OdooSnapshotLineSchema(BaseModel):
    productId: str
    productCode: str
    designation: str
    systemQty: float
    uom: str | None = None


class OdooSnapshotSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    storeId: str = Field(validation_alias="store_id")
    fileName: str = Field(validation_alias="file_name")
    importedAt: str = Field(validation_alias="imported_at")
    importedBy: str | None = Field(default=None, validation_alias="imported_by")
    lines: list[OdooSnapshotLineSchema] = Field(default_factory=list)


class InventoryLineSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    missionId: str = Field(validation_alias="mission_id")
    productId: str = Field(validation_alias="product_id")
    countData: dict[str, Any]
    physicalQty: float = Field(validation_alias="physical_qty")
    systemQty: float = Field(validation_alias="system_qty")
    ecart: float
    avarieQty: float = Field(validation_alias="avarie_qty")
    ecartValue: float = Field(validation_alias="ecart_value")
    observation: str = ""
    updatedAt: str = Field(validation_alias="updated_at")


class MissionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    name: str
    storeId: str = Field(validation_alias="store_id")
    entityId: str = Field(validation_alias="entity_id")
    family: ProductFamily
    cadenceId: str = Field(validation_alias="cadence_id")
    isPermanent: bool = Field(default=False, validation_alias="is_permanent")
    assignedControllerIds: list[str] = Field(default_factory=list)
    controllerId: str = Field(default="", validation_alias="controller_id")
    createdByProfileId: str | None = Field(default=None, validation_alias="created_by_profile_id")
    snapshotId: str | None = Field(default=None, validation_alias="snapshot_id")
    status: MissionStatus
    syncStatus: SyncStatus = Field(default="LOCAL", validation_alias="sync_status")
    startedAt: str = Field(validation_alias="started_at")
    submittedAt: str | None = Field(default=None, validation_alias="submitted_at")
    nextDueDate: str | None = Field(default=None, validation_alias="next_due_date")
    notes: str | None = None


class SyncQueueItemSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    missionId: str = Field(validation_alias="mission_id")
    payload: str
    createdAt: str = Field(validation_alias="created_at")
    attempts: int = 0
    status: Literal["PENDING", "DONE", "FAILED"]


class BootstrapResponse(BaseModel):
    zones: list[ZoneSchema]
    sites: list[SiteSchema]
    stores: list[StoreSchema]
    entities: list[EntitySchema]
    products: list[ProductSchema]
    profiles: list[ProfileSchema]
    cadences: list[MissionCadenceSchema]
    settings: AppSettingsSchema
    missions: list[MissionSchema]
    snapshots: list[OdooSnapshotSchema]
    lines: list[InventoryLineSchema]
    syncQueue: list[SyncQueueItemSchema]


class LoginRequest(BaseModel):
    profileId: str
    password: str


class LoginResponse(BaseModel):
    ok: bool
    error: str | None = None
    profileId: str | None = None


class SaveInventoryLineRequest(BaseModel):
    missionId: str
    productId: str
    countData: dict[str, Any]
    observation: str = ""


class CreateMissionRequest(BaseModel):
    name: str
    storeId: str
    entityId: str
    family: ProductFamily
    cadenceId: str
    isPermanent: bool = False
    assignedControllerIds: list[str] = Field(default_factory=list)
    controllerId: str | None = None
    createdByProfileId: str | None = None
    snapshotId: str | None = None
    status: MissionStatus = "BROUILLON"
    notes: str | None = None


class ClaimMissionRequest(BaseModel):
    controllerId: str
