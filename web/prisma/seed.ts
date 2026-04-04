/**
 * Dev seed — same shape as the former Python seed (smaller optional tweaks via constants).
 * Run: npm run db:seed (from web/)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SEED = 42;
const NUM_RETAILERS = 120;
const NUM_SKUS = 40;
const NUM_VEHICLES = 100;
const NUM_DRIVERS = 100;

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function clearAll() {
  await prisma.stopDelivery.deleteMany();
  await prisma.tripCost.deleteMany();
  await prisma.tripStop.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockTransferLine.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.inventoryBalance.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.businessEvent.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();
  await prisma.sKU.deleteMany();
  await prisma.role.deleteMany();
  await prisma.org.deleteMany();
}

async function main() {
  const rng = mulberry32(SEED);

  await clearAll();

  const org = await prisma.org.create({ data: { name: "Smart Login Portal Demo" } });

  const roleNames = [
    "admin",
    "factory_ops",
    "dairy_ops",
    "warehouse_manager",
    "dispatcher",
    "driver",
    "retailer",
    "customer",
  ] as const;
  const roles: Record<string, { id: string }> = {};
  for (const name of roleNames) {
    const r = await prisma.role.create({ data: { name } });
    roles[name] = r;
  }

  async function addUser(
    email: string,
    fullName: string,
    password: string,
    roleKeys: (typeof roleNames)[number][],
  ) {
    const passwordHash = await bcrypt.hash(password, 12);
    const u = await prisma.user.create({
      data: {
        orgId: org.id,
        email,
        passwordHash,
        fullName,
      },
    });
    for (const rn of roleKeys) {
      await prisma.userRole.create({
        data: { userId: u.id, roleId: roles[rn].id },
      });
    }
    return u;
  }

  await addUser("admin@getto.demo", "Admin User", "admin123", ["admin"]);
  await addUser("warehouse@getto.demo", "Warehouse Manager", "warehouse123", ["warehouse_manager"]);
  await addUser("dispatcher@getto.demo", "Dispatcher", "dispatcher123", ["dispatcher"]);
  const driverUser = await addUser("driver@getto.demo", "Driver One", "driver123", ["driver"]);
  await addUser("retailer@getto.demo", "Retailer User", "retailer123", ["retailer"]);

  await prisma.location.create({
    data: {
      orgId: org.id,
      type: "factory",
      name: "Amul Factory",
      address: "Mira Bhayandar",
      lat: 19.295,
      lng: 72.877,
    },
  });
  await prisma.location.create({
    data: {
      orgId: org.id,
      type: "dairy",
      name: "Amul Dairy Staging",
      address: "Mira Bhayandar",
      lat: 19.3,
      lng: 72.88,
    },
  });

  const warehouses: { id: string }[] = [];
  const areas = [
    { name: "Kandivali West", lat: 19.2, lng: 72.85 },
    { name: "Kandivali East", lat: 19.21, lng: 72.87 },
    { name: "Bandra", lat: 19.06, lng: 72.83 },
  ];
  for (let i = 0; i < 20; i++) {
    const a = areas[i % 3];
    const w = await prisma.location.create({
      data: {
        orgId: org.id,
        type: "warehouse",
        name: `WH-${String(i + 1).padStart(2, "0")} ${a.name}`,
        address: `${a.name} warehouse`,
        lat: a.lat + (rng() * 0.04 - 0.02),
        lng: a.lng + (rng() * 0.04 - 0.02),
      },
    });
    warehouses.push(w);
  }

  const retailers: { id: string }[] = [];
  for (let i = 0; i < NUM_RETAILERS; i++) {
    const r = await prisma.location.create({
      data: {
        orgId: org.id,
        type: "retailer",
        name: `Retailer ${String(i + 1).padStart(4, "0")}`,
        address: `Store ${i + 1}`,
        lat: 19.05 + rng() * 0.25,
        lng: 72.8 + rng() * 0.12,
      },
    });
    retailers.push(r);
  }

  const skus: { id: string; skuCode: string }[] = [];
  for (let i = 0; i < NUM_SKUS; i++) {
    const code = `SKU-${String(i + 1).padStart(4, "0")}`;
    const s = await prisma.sKU.create({
      data: {
        skuCode: code,
        name: `Product ${i + 1}`,
        uom: "unit",
        weightKg: 0.1 + rng() * 4.9,
        volumeM3: 0.001 + rng() * 0.049,
      },
    });
    skus.push(s);
  }

  for (const sku of skus) {
    await prisma.batch.create({
      data: {
        skuId: sku.id,
        batchCode: `B-${sku.skuCode}`,
        qtyProduced: 500 + rng() * 1500,
      },
    });
  }

  for (const w of warehouses) {
    for (const sku of skus) {
      await prisma.inventoryBalance.create({
        data: {
          locationId: w.id,
          skuId: sku.id,
          onHand: 200 + rng() * 1800,
          reserved: 0,
        },
      });
    }
  }

  for (let i = 0; i < NUM_VEHICLES; i++) {
    await prisma.vehicle.create({
      data: {
        orgId: org.id,
        regNumber: `MH-XX-${String(i + 1).padStart(4, "0")}`,
        capacityKg: 800 + rng() * 2700,
        capacityM3: 10 + rng() * 30,
      },
    });
  }

  for (let i = 0; i < NUM_DRIVERS; i++) {
    await prisma.driver.create({
      data: {
        orgId: org.id,
        userId: i === 0 ? driverUser.id : undefined,
        name: `Driver ${i + 1}`,
        phone: `98${String(Math.floor(10000000 + rng() * 89999999))}`,
      },
    });
  }

  for (let o = 0; o < 80; o++) {
    const w = warehouses[Math.floor(rng() * warehouses.length)]!;
    const r = retailers[Math.floor(rng() * retailers.length)]!;
    const nlines = 1 + Math.floor(rng() * 4);
    const order = await prisma.order.create({
      data: {
        orgId: org.id,
        retailerLocationId: r.id,
        warehouseLocationId: w.id,
        status: "pending_allocation",
        priority: Math.floor(rng() * 4),
      },
    });
    for (let l = 0; l < nlines; l++) {
      const sku = skus[Math.floor(rng() * skus.length)]!;
      await prisma.orderLine.create({
        data: {
          orderId: order.id,
          skuId: sku.id,
          qtyRequested: 5 + rng() * 115,
          qtyAllocated: 0,
          status: "pending",
        },
      });
    }
  }

  console.log("Seed complete: org, roles, users, locations, skus, inventory, vehicles, drivers, orders.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
