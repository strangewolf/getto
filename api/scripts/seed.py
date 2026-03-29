"""
Deterministic dev seed: fixed RNG seed, idempotent via TRUNCATE CASCADE.
Run from api/:  python -m scripts.seed
Requires DATABASE_URL or default postgres.
"""
from __future__ import annotations

import os
import random
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import text

from app.database import SessionLocal
from app.models import (
    Batch,
    Driver,
    InventoryBalance,
    Location,
    Order,
    OrderLine,
    Org,
    Role,
    SKU,
    User,
    UserRole,
    Vehicle,
)
from app.models.enums import RoleName
from app.security import hash_password


SEED = 42
NUM_RETAILERS = 120
NUM_SKUS = 40
NUM_VEHICLES = 100
NUM_DRIVERS = 100


def truncate_all(db) -> None:
    db.execute(
        text(
            """
            TRUNCATE TABLE
              events,
              trip_costs,
              stop_deliveries,
              trip_stops,
              trips,
              allocations,
              order_lines,
              orders,
              inventory_balances,
              batches,
              user_roles,
              users,
              drivers,
              vehicles,
              locations,
              skus,
              roles,
              orgs
            RESTART IDENTITY CASCADE;
            """
        )
    )


def run() -> None:
    random.seed(SEED)
    rng = random.Random(SEED)

    db = SessionLocal()
    try:
        truncate_all(db)
        db.commit()
    except Exception:
        db.rollback()
        raise

    org = Org(name="Getto Demo Org")
    db.add(org)
    db.flush()

    roles: dict[str, Role] = {}
    for rn in RoleName:
        r = Role(name=rn.value)
        db.add(r)
        db.flush()
        roles[rn.value] = r

    def add_user(email: str, name: str, pwd: str, role_names: list[str]) -> User:
        u = User(
            org_id=org.id,
            email=email,
            password_hash=hash_password(pwd),
            full_name=name,
        )
        db.add(u)
        db.flush()
        for rn in role_names:
            db.add(UserRole(user_id=u.id, role_id=roles[rn].id))
        return u

    add_user("admin@getto.demo", "Admin User", "admin123", ["admin"])
    add_user("warehouse@getto.demo", "Warehouse Manager", "warehouse123", ["warehouse_manager"])
    add_user("dispatcher@getto.demo", "Dispatcher", "dispatcher123", ["dispatcher"])
    driver_user = add_user("driver@getto.demo", "Driver One", "driver123", ["driver"])
    add_user("retailer@getto.demo", "Retailer User", "retailer123", ["retailer"])

    factory = Location(
        org_id=org.id,
        type="factory",
        name="Amul Factory",
        address="Mira Bhayandar",
        lat=19.295,
        lng=72.877,
    )
    dairy = Location(
        org_id=org.id,
        type="dairy",
        name="Amul Dairy Staging",
        address="Mira Bhayandar",
        lat=19.30,
        lng=72.88,
    )
    db.add_all([factory, dairy])
    db.flush()

    warehouses: list[Location] = []
    areas = [("Kandivali West", 19.20, 72.85), ("Kandivali East", 19.21, 72.87), ("Bandra", 19.06, 72.83)]
    for i in range(20):
        a = areas[i % 3]
        lat = a[1] + rng.uniform(-0.02, 0.02)
        lng = a[2] + rng.uniform(-0.02, 0.02)
        w = Location(
            org_id=org.id,
            type="warehouse",
            name=f"WH-{i+1:02d} {a[0]}",
            address=f"{a[0]} warehouse",
            lat=lat,
            lng=lng,
        )
        warehouses.append(w)
        db.add(w)
    db.flush()

    retailers: list[Location] = []
    for i in range(NUM_RETAILERS):
        lat = 19.05 + rng.random() * 0.25
        lng = 72.80 + rng.random() * 0.12
        r = Location(
            org_id=org.id,
            type="retailer",
            name=f"Retailer {i+1:04d}",
            address=f"Store {i+1}",
            lat=lat,
            lng=lng,
        )
        retailers.append(r)
        db.add(r)
    db.flush()

    skus: list[SKU] = []
    for i in range(NUM_SKUS):
        s = SKU(
            sku_code=f"SKU-{i+1:04d}",
            name=f"Product {i+1}",
            uom="unit",
            weight_kg=rng.uniform(0.1, 5.0),
            volume_m3=rng.uniform(0.001, 0.05),
        )
        skus.append(s)
        db.add(s)
    db.flush()

    for sku in skus:
        b = Batch(
            sku_id=sku.id,
            batch_code=f"B-{sku.sku_code}",
            qty_produced=rng.uniform(500, 2000),
        )
        db.add(b)
    db.flush()

    for w in warehouses:
        for sku in skus:
            inv = InventoryBalance(
                location_id=w.id,
                sku_id=sku.id,
                on_hand=rng.uniform(200, 2000),
                reserved=0,
            )
            db.add(inv)
    db.flush()

    for i in range(NUM_VEHICLES):
        v = Vehicle(
            org_id=org.id,
            reg_number=f"MH-XX-{i+1:04d}",
            capacity_kg=rng.uniform(800, 3500),
            capacity_m3=rng.uniform(10, 40),
        )
        db.add(v)
    db.flush()

    for i in range(NUM_DRIVERS):
        d = Driver(
            org_id=org.id,
            user_id=driver_user.id if i == 0 else None,
            name=f"Driver {i+1}",
            phone=f"98{rng.randint(10000000, 99999999)}",
        )
        db.add(d)
    db.flush()

    for _ in range(80):
        w = rng.choice(warehouses)
        r = rng.choice(retailers)
        nlines = rng.randint(1, 4)
        o = Order(
            org_id=org.id,
            retailer_location_id=r.id,
            warehouse_location_id=w.id,
            status="pending_allocation",
            priority=rng.randint(0, 3),
        )
        db.add(o)
        db.flush()
        for _ in range(nlines):
            sku = rng.choice(skus)
            db.add(
                OrderLine(
                    order_id=o.id,
                    sku_id=sku.id,
                    qty_requested=rng.uniform(5, 120),
                    qty_allocated=0,
                    status="pending",
                )
            )

    db.commit()
    print("Seed complete: org, roles, users, locations, skus, inventory, vehicles, drivers, orders.")


if __name__ == "__main__":
    run()
