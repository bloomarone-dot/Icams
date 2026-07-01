from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Zone(Base):
    __tablename__ = "zones"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Site(Base):
    __tablename__ = "sites"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    zone_id: Mapped[str] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(255))
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Store(Base):
    __tablename__ = "stores"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    site_id: Mapped[str] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(255))
    odoo_location_code: Mapped[str | None] = mapped_column(String(255), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Entity(Base):
    __tablename__ = "entities"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    code: Mapped[str] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(255))
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Product(Base):
    __tablename__ = "products"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    entity_id: Mapped[str] = mapped_column(String(32), index=True)
    family: Mapped[str] = mapped_column(String(32), index=True)
    code: Mapped[str] = mapped_column(String(64), index=True)
    designation: Mapped[str] = mapped_column(String(512))
    brand: Mapped[str | None] = mapped_column(String(255), nullable=True)
    packaging: Mapped[str | None] = mapped_column(String(255), nullable=True)
    odoo_product_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    unit_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    pack_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Profile(Base):
    __tablename__ = "profiles"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(32), index=True)
    entity_ids: Mapped[str] = mapped_column(Text, default="[]")
    zone_ids: Mapped[str] = mapped_column(Text, default="[]")
    password_hash: Mapped[str] = mapped_column(String(128), default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class MissionCadence(Base):
    __tablename__ = "mission_cadences"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    interval_days: Mapped[int] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(String(512), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class AppSettingsRow(Base):
    __tablename__ = "settings"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    data: Mapped[str] = mapped_column(Text)


class OdooSnapshot(Base):
    __tablename__ = "odoo_snapshots"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    store_id: Mapped[str] = mapped_column(String(32), index=True)
    file_name: Mapped[str] = mapped_column(String(512))
    imported_at: Mapped[str] = mapped_column(String(64), index=True)
    imported_by: Mapped[str | None] = mapped_column(String(32), nullable=True)
    lines: Mapped[str] = mapped_column(Text, default="[]")


class Mission(Base):
    __tablename__ = "missions"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(512))
    store_id: Mapped[str] = mapped_column(String(32), index=True)
    entity_id: Mapped[str] = mapped_column(String(32), index=True)
    family: Mapped[str] = mapped_column(String(32))
    cadence_id: Mapped[str] = mapped_column(String(32), index=True)
    is_permanent: Mapped[bool] = mapped_column(Boolean, default=False)
    assigned_controller_ids: Mapped[str] = mapped_column(Text, default="[]")
    controller_id: Mapped[str] = mapped_column(String(32), default="", index=True)
    created_by_profile_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    snapshot_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(32), index=True)
    sync_status: Mapped[str] = mapped_column(String(32), default="LOCAL")
    started_at: Mapped[str] = mapped_column(String(64))
    submitted_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    next_due_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class InventoryLine(Base):
    __tablename__ = "inventory_lines"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    mission_id: Mapped[str] = mapped_column(String(32), index=True)
    product_id: Mapped[str] = mapped_column(String(32), index=True)
    count_data: Mapped[str] = mapped_column(Text)
    physical_qty: Mapped[float] = mapped_column(Float, default=0)
    system_qty: Mapped[float] = mapped_column(Float, default=0)
    ecart: Mapped[float] = mapped_column(Float, default=0)
    avarie_qty: Mapped[float] = mapped_column(Float, default=0)
    ecart_value: Mapped[float] = mapped_column(Float, default=0)
    observation: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[str] = mapped_column(String(64))


class SyncQueueItem(Base):
    __tablename__ = "sync_queue"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    mission_id: Mapped[str] = mapped_column(String(32), index=True)
    payload: Mapped[str] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(String(64), index=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), index=True)
