from typing import Any

from app.schemas import AppSettingsSchema, ConversionRules, CountData, ProductFamily, ProductSchema


def _pack_total(p: dict[str, float], rules: dict[str, float], mode: str) -> float:
    if mode == "cigarette":
        return p.get("cartons", 0) * rules["cartonMul"] + p.get("cartouches", 0)
    if mode == "vape":
        return (
            p.get("cartons", 0) * rules["cartonMul"]
            + p.get("paquets", 0) * rules["paquetMul"]
            + p.get("pieces", 0)
        )
    return p.get("balots", 0) * rules["balotMul"] + p.get("unites", 0)


def _image_block_total(block: dict[str, Any], rules: dict[str, float], mode: str) -> tuple[float, float]:
    bon = _pack_total(block.get("bonEtat", {}), rules, mode)
    av = _pack_total(block.get("avarie", {}), rules, mode)
    return bon + av, av


def compute_physical_qty(
    family: ProductFamily,
    data: dict[str, Any],
    settings: AppSettingsSchema,
) -> tuple[float, float]:
    r = settings.conversionRules
    cigarette_rules = {"cartonMul": r.cigaretteCartonToCartouches, "paquetMul": 0, "balotMul": 0}
    vape_rules = {"cartonMul": r.vapeCartonToPieces, "paquetMul": r.vapePaquetToPieces, "balotMul": 0}
    gadget_rules = {"cartonMul": 0, "paquetMul": 0, "balotMul": r.gadgetBalotToUnits}

    if family == "CIGARETTE" and data.get("type") == "CIGARETTE":
        n_total, n_av = _image_block_total(data.get("nouvelleImage", {}), cigarette_rules, "cigarette")
        a_total, a_av = _image_block_total(data.get("ancienneImage", {}), cigarette_rules, "cigarette")
        return n_total + a_total, n_av + a_av

    if family == "VAPE" and data.get("type") == "VAPE":
        bon = _pack_total(data.get("bonEtat", {}), vape_rules, "vape")
        av = _pack_total(data.get("avarie", {}), vape_rules, "vape")
        return bon + av, av

    if family == "GADGET" and data.get("type") == "GADGET":
        pack = {
            "cartons": 0,
            "cartouches": 0,
            "paquets": 0,
            "pieces": 0,
            "balots": data.get("balots", 0),
            "unites": data.get("unites", 0),
        }
        return _pack_total(pack, gadget_rules, "gadget"), 0.0

    return 0.0, 0.0


def compute_ecart_value(
    ecart: float,
    product: ProductSchema | Any,
    family: ProductFamily,
    settings: AppSettingsSchema,
) -> float:
    abs_ecart = abs(ecart)
    if abs_ecart == 0:
        return 0.0

    unit = getattr(product, "unitPrice", None) or getattr(product, "unit_price", None) or 0
    pack = getattr(product, "packPrice", None) or getattr(product, "pack_price", None) or 0
    rules: ConversionRules = settings.conversionRules

    pack_size = 1
    if family == "CIGARETTE":
        pack_size = rules.cigaretteCartonToCartouches
    elif family == "GADGET":
        pack_size = rules.gadgetBalotToUnits
    elif family == "VAPE":
        pack_size = rules.vapeCartonToPieces

    if pack > 0 and pack_size > 1:
        full_packs = int(abs_ecart // pack_size)
        remainder = abs_ecart % pack_size
        unit_price = unit if unit > 0 else pack / pack_size
        return full_packs * pack + remainder * unit_price

    effective_unit = unit if unit > 0 else (pack / pack_size if pack > 0 and pack_size > 0 else 4500)
    return abs_ecart * effective_unit
