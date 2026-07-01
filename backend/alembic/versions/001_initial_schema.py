"""Schéma initial ICAMS."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "zones",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "entities",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_entities_code", "entities", ["code"])

    op.create_table(
        "sites",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("zone_id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sites_zone_id", "sites", ["zone_id"])

    op.create_table(
        "stores",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("site_id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("odoo_location_code", sa.String(length=255), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_stores_site_id", "stores", ["site_id"])

    op.create_table(
        "products",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("entity_id", sa.String(length=32), nullable=False),
        sa.Column("family", sa.String(length=32), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("designation", sa.String(length=512), nullable=False),
        sa.Column("brand", sa.String(length=255), nullable=True),
        sa.Column("packaging", sa.String(length=255), nullable=True),
        sa.Column("odoo_product_code", sa.String(length=64), nullable=True),
        sa.Column("unit_price", sa.Float(), nullable=True),
        sa.Column("pack_price", sa.Float(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_products_entity_id", "products", ["entity_id"])
    op.create_index("ix_products_family", "products", ["family"])
    op.create_index("ix_products_code", "products", ["code"])

    op.create_table(
        "profiles",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("entity_ids", sa.Text(), nullable=False),
        sa.Column("zone_ids", sa.Text(), nullable=False),
        sa.Column("password_hash", sa.String(length=128), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_profiles_role", "profiles", ["role"])

    op.create_table(
        "mission_cadences",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("interval_days", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(length=512), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "settings",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("data", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "odoo_snapshots",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("store_id", sa.String(length=32), nullable=False),
        sa.Column("file_name", sa.String(length=512), nullable=False),
        sa.Column("imported_at", sa.String(length=64), nullable=False),
        sa.Column("imported_by", sa.String(length=32), nullable=True),
        sa.Column("lines", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_odoo_snapshots_store_id", "odoo_snapshots", ["store_id"])
    op.create_index("ix_odoo_snapshots_imported_at", "odoo_snapshots", ["imported_at"])

    op.create_table(
        "missions",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=512), nullable=False),
        sa.Column("store_id", sa.String(length=32), nullable=False),
        sa.Column("entity_id", sa.String(length=32), nullable=False),
        sa.Column("family", sa.String(length=32), nullable=False),
        sa.Column("cadence_id", sa.String(length=32), nullable=False),
        sa.Column("is_permanent", sa.Boolean(), nullable=False),
        sa.Column("assigned_controller_ids", sa.Text(), nullable=False),
        sa.Column("controller_id", sa.String(length=32), nullable=False),
        sa.Column("created_by_profile_id", sa.String(length=32), nullable=True),
        sa.Column("snapshot_id", sa.String(length=32), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("sync_status", sa.String(length=32), nullable=False),
        sa.Column("started_at", sa.String(length=64), nullable=False),
        sa.Column("submitted_at", sa.String(length=64), nullable=True),
        sa.Column("next_due_date", sa.String(length=32), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_missions_store_id", "missions", ["store_id"])
    op.create_index("ix_missions_entity_id", "missions", ["entity_id"])
    op.create_index("ix_missions_cadence_id", "missions", ["cadence_id"])
    op.create_index("ix_missions_controller_id", "missions", ["controller_id"])
    op.create_index("ix_missions_status", "missions", ["status"])

    op.create_table(
        "inventory_lines",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("mission_id", sa.String(length=32), nullable=False),
        sa.Column("product_id", sa.String(length=32), nullable=False),
        sa.Column("count_data", sa.Text(), nullable=False),
        sa.Column("physical_qty", sa.Float(), nullable=False),
        sa.Column("system_qty", sa.Float(), nullable=False),
        sa.Column("ecart", sa.Float(), nullable=False),
        sa.Column("avarie_qty", sa.Float(), nullable=False),
        sa.Column("ecart_value", sa.Float(), nullable=False),
        sa.Column("observation", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.String(length=64), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_inventory_lines_mission_id", "inventory_lines", ["mission_id"])
    op.create_index("ix_inventory_lines_product_id", "inventory_lines", ["product_id"])

    op.create_table(
        "sync_queue",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("mission_id", sa.String(length=32), nullable=False),
        sa.Column("payload", sa.Text(), nullable=False),
        sa.Column("created_at", sa.String(length=64), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sync_queue_mission_id", "sync_queue", ["mission_id"])
    op.create_index("ix_sync_queue_created_at", "sync_queue", ["created_at"])
    op.create_index("ix_sync_queue_status", "sync_queue", ["status"])


def downgrade() -> None:
    op.drop_table("sync_queue")
    op.drop_table("inventory_lines")
    op.drop_table("missions")
    op.drop_table("odoo_snapshots")
    op.drop_table("settings")
    op.drop_table("mission_cadences")
    op.drop_table("profiles")
    op.drop_table("products")
    op.drop_table("stores")
    op.drop_table("sites")
    op.drop_table("entities")
    op.drop_table("zones")
