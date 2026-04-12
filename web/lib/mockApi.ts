"use client";

type MockUser = {
  id: string;
  email: string;
  password: string;
  full_name: string;
  org_id: string;
  roles: string[];
  is_active: boolean;
};

type MockLocation = {
  id: string;
  org_id: string;
  type: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

type MockSku = {
  id: string;
  sku_code: string;
  name: string;
  uom: string;
  weight_kg: number | null;
  volume_m3: number | null;
};

type MockInventory = {
  id: string;
  location_id: string;
  sku_id: string;
  on_hand: number;
  reserved: number;
};

type MockOrderLine = {
  id: string;
  sku_id: string;
  qty_requested: number;
  qty_allocated: number;
  status: string;
};

type MockOrder = {
  id: string;
  org_id: string;
  retailer_location_id: string;
  warehouse_location_id: string;
  status: string;
  priority: number;
  requested_window_start: string | null;
  requested_window_end: string | null;
  created_at: string;
  lines: MockOrderLine[];
};

type MockVehicle = {
  id: string;
  org_id: string;
  reg_number: string;
  capacity_kg: number | null;
  capacity_m3: number | null;
};

type MockDriver = {
  id: string;
  org_id: string;
  name: string;
  phone: string | null;
  user_id: string | null;
  onboarded_at: string;
};

type MockStopDelivery = {
  id: string;
  order_line_id: string;
  qty_planned: number;
  qty_delivered: number;
  status: string;
  reason_code: string | null;
};

type MockTripStop = {
  id: string;
  sequence: number;
  location_id: string;
  status: string;
  eta: string | null;
  arrived_at: string | null;
  deliveries: MockStopDelivery[];
};

type MockTrip = {
  id: string;
  org_id: string;
  warehouse_location_id: string;
  status: string;
  vehicle_id: string | null;
  driver_id: string | null;
  planned_start: string | null;
  dispatched_at: string | null;
  completed_at: string | null;
  created_at: string;
  stops: MockTripStop[];
};

type MockTransferLine = {
  id: string;
  sku_id: string;
  qty_requested: number;
  qty_shipped: number;
  qty_received: number;
};

type MockTransfer = {
  id: string;
  org_id: string;
  from_location_id: string;
  to_location_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  lines: MockTransferLine[];
};

type MockState = {
  version: 2;
  org: { id: string; name: string };
  users: MockUser[];
  locations: MockLocation[];
  skus: MockSku[];
  inventory: MockInventory[];
  orders: MockOrder[];
  vehicles: MockVehicle[];
  drivers: MockDriver[];
  trips: MockTrip[];
  transfers: MockTransfer[];
};

type ApiOptions = RequestInit & { json?: unknown };

const STORE_KEY = "getto_mock_state_v2";
const TOKEN_PREFIX = "mock-token:";
let memoryState: MockState | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  try {
    return `${prefix}_${globalThis.crypto.randomUUID().slice(0, 8)}`;
  } catch {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function sortByCreatedDesc<T extends { created_at: string }>(rows: T[]) {
  return [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function seedState(): MockState {
  return {
    version: 2,
    org: { id: "org_demo", name: "Getto Mira-Bhayandar POC" },
    users: [
      {
        id: "usr_admin",
        email: "admin@getto.demo",
        password: "admin123",
        full_name: "POC Admin",
        org_id: "org_demo",
        roles: ["admin", "warehouse_manager", "dispatcher"],
        is_active: true,
      },
      {
        id: "usr_warehouse",
        email: "warehouse@getto.demo",
        password: "warehouse123",
        full_name: "Warehouse Lead",
        org_id: "org_demo",
        roles: ["warehouse_manager"],
        is_active: true,
      },
      {
        id: "usr_dispatcher",
        email: "dispatcher@getto.demo",
        password: "dispatcher123",
        full_name: "Route Dispatcher",
        org_id: "org_demo",
        roles: ["dispatcher"],
        is_active: true,
      },
      {
        id: "usr_driver",
        email: "driver@getto.demo",
        password: "driver123",
        full_name: "Driver Captain",
        org_id: "org_demo",
        roles: ["driver"],
        is_active: true,
      },
      {
        id: "usr_retailer",
        email: "retailer@getto.demo",
        password: "retailer123",
        full_name: "Retail Partner",
        org_id: "org_demo",
        roles: ["retailer"],
        is_active: true,
      },
    ],
    locations: [
      {
        id: "loc_wh_mre",
        org_id: "org_demo",
        type: "warehouse",
        name: "Mira Road East Distribution Hub",
        address: "Mira Road East, Mira Bhayandar, Maharashtra 401107",
        lat: 19.285504,
        lng: 72.869271,
      },
      {
        id: "loc_wh_mrw",
        org_id: "org_demo",
        type: "warehouse",
        name: "Mira Road West Transit Hub",
        address: "Near Mira Road Station, Mira Road West, Mira Bhayandar, Maharashtra 401107",
        lat: 19.2815564,
        lng: 72.8578612,
      },
      {
        id: "loc_wh_bhe",
        org_id: "org_demo",
        type: "warehouse",
        name: "Bhayandar East Fulfillment Hub",
        address: "Navghar Road, Bhayandar East, Mira Bhayandar, Maharashtra 401105",
        lat: 19.305601,
        lng: 72.859375,
      },
      {
        id: "loc_wh_bhw",
        org_id: "org_demo",
        type: "warehouse",
        name: "Bhayandar West Cross-Dock",
        address: "Bhayandar West, Mira Bhayandar, Maharashtra 401101",
        lat: 19.3114478,
        lng: 72.8526514,
      },
      {
        id: "loc_rt_shanti",
        org_id: "org_demo",
        type: "retailer",
        name: "Shanti Park Retail Cluster",
        address: "Shanti Park, Mira Road East, Mira Bhayandar, Maharashtra 401107",
        lat: 19.2841,
        lng: 72.8712,
      },
      {
        id: "loc_rt_naya",
        org_id: "org_demo",
        type: "retailer",
        name: "Naya Nagar Grocery Cluster",
        address: "Naya Nagar, Mira Road, Mira Bhayandar, Maharashtra 401107",
        lat: 19.2896,
        lng: 72.8614,
      },
      {
        id: "loc_rt_navghar",
        org_id: "org_demo",
        type: "retailer",
        name: "Navghar Market Cluster",
        address: "Navghar Road, Bhayandar East, Mira Bhayandar, Maharashtra 401105",
        lat: 19.308972,
        lng: 72.860607,
      },
      {
        id: "loc_rt_maxus",
        org_id: "org_demo",
        type: "retailer",
        name: "Maxus Retail Strip",
        address: "Bhayandar West, Mira Bhayandar, Maharashtra 401101",
        lat: 19.309981,
        lng: 72.85284,
      },
    ],
    skus: [
      {
        id: "sku_rice",
        sku_code: "RICE-25",
        name: "Rice Bag 25kg",
        uom: "bag",
        weight_kg: 25,
        volume_m3: 0.04,
      },
      {
        id: "sku_oil",
        sku_code: "OIL-5L",
        name: "Sunflower Oil 5L",
        uom: "can",
        weight_kg: 5,
        volume_m3: 0.01,
      },
      {
        id: "sku_biscuit",
        sku_code: "BISC-BOX",
        name: "Biscuit Carton",
        uom: "box",
        weight_kg: 2,
        volume_m3: 0.008,
      },
      {
        id: "sku_water",
        sku_code: "WATER-12",
        name: "Packaged Water Case 12x1L",
        uom: "case",
        weight_kg: 12,
        volume_m3: 0.018,
      },
    ],
    inventory: [
      { id: "inv_1", location_id: "loc_wh_mre", sku_id: "sku_rice", on_hand: 220, reserved: 24 },
      { id: "inv_2", location_id: "loc_wh_mre", sku_id: "sku_oil", on_hand: 180, reserved: 40 },
      { id: "inv_3", location_id: "loc_wh_mre", sku_id: "sku_biscuit", on_hand: 140, reserved: 12 },
      { id: "inv_4", location_id: "loc_wh_mre", sku_id: "sku_water", on_hand: 160, reserved: 18 },
      { id: "inv_5", location_id: "loc_wh_mrw", sku_id: "sku_rice", on_hand: 120, reserved: 0 },
      { id: "inv_6", location_id: "loc_wh_mrw", sku_id: "sku_oil", on_hand: 90, reserved: 0 },
      { id: "inv_7", location_id: "loc_wh_mrw", sku_id: "sku_biscuit", on_hand: 110, reserved: 0 },
      { id: "inv_8", location_id: "loc_wh_bhe", sku_id: "sku_rice", on_hand: 150, reserved: 0 },
      { id: "inv_9", location_id: "loc_wh_bhe", sku_id: "sku_oil", on_hand: 130, reserved: 0 },
      { id: "inv_10", location_id: "loc_wh_bhe", sku_id: "sku_water", on_hand: 95, reserved: 12 },
      { id: "inv_11", location_id: "loc_wh_bhw", sku_id: "sku_rice", on_hand: 100, reserved: 0 },
      { id: "inv_12", location_id: "loc_wh_bhw", sku_id: "sku_biscuit", on_hand: 125, reserved: 20 },
      { id: "inv_13", location_id: "loc_wh_bhw", sku_id: "sku_water", on_hand: 150, reserved: 0 },
    ],
    orders: [
      {
        id: "ord_1",
        org_id: "org_demo",
        retailer_location_id: "loc_rt_shanti",
        warehouse_location_id: "loc_wh_mre",
        status: "in_fulfillment",
        priority: 2,
        requested_window_start: "2026-04-13T04:30:00.000Z",
        requested_window_end: "2026-04-13T07:00:00.000Z",
        created_at: "2026-04-10T09:00:00.000Z",
        lines: [
          {
            id: "ol_1",
            sku_id: "sku_rice",
            qty_requested: 24,
            qty_allocated: 24,
            status: "allocated",
          },
          {
            id: "ol_1b",
            sku_id: "sku_water",
            qty_requested: 18,
            qty_allocated: 18,
            status: "allocated",
          },
        ],
      },
      {
        id: "ord_2",
        org_id: "org_demo",
        retailer_location_id: "loc_rt_navghar",
        warehouse_location_id: "loc_wh_bhe",
        status: "pending_allocation",
        priority: 3,
        requested_window_start: "2026-04-13T05:00:00.000Z",
        requested_window_end: "2026-04-13T08:00:00.000Z",
        created_at: "2026-04-11T08:45:00.000Z",
        lines: [
          {
            id: "ol_2",
            sku_id: "sku_oil",
            qty_requested: 60,
            qty_allocated: 0,
            status: "pending",
          },
          {
            id: "ol_2b",
            sku_id: "sku_water",
            qty_requested: 20,
            qty_allocated: 0,
            status: "pending",
          },
        ],
      },
      {
        id: "ord_3",
        org_id: "org_demo",
        retailer_location_id: "loc_rt_maxus",
        warehouse_location_id: "loc_wh_bhw",
        status: "in_fulfillment",
        priority: 1,
        requested_window_start: "2026-04-12T06:00:00.000Z",
        requested_window_end: "2026-04-12T09:00:00.000Z",
        created_at: "2026-04-11T10:15:00.000Z",
        lines: [
          {
            id: "ol_3",
            sku_id: "sku_biscuit",
            qty_requested: 20,
            qty_allocated: 20,
            status: "allocated",
          },
        ],
      },
      {
        id: "ord_4",
        org_id: "org_demo",
        retailer_location_id: "loc_rt_navghar",
        warehouse_location_id: "loc_wh_mrw",
        status: "delivered",
        priority: 0,
        requested_window_start: "2026-04-09T04:00:00.000Z",
        requested_window_end: "2026-04-09T07:00:00.000Z",
        created_at: "2026-04-09T07:00:00.000Z",
        lines: [
          {
            id: "ol_4",
            sku_id: "sku_oil",
            qty_requested: 10,
            qty_allocated: 10,
            status: "delivered",
          },
        ],
      },
      {
        id: "ord_5",
        org_id: "org_demo",
        retailer_location_id: "loc_rt_navghar",
        warehouse_location_id: "loc_wh_mre",
        status: "in_fulfillment",
        priority: 2,
        requested_window_start: "2026-04-13T07:30:00.000Z",
        requested_window_end: "2026-04-13T10:30:00.000Z",
        created_at: "2026-04-11T13:30:00.000Z",
        lines: [
          {
            id: "ol_5",
            sku_id: "sku_oil",
            qty_requested: 40,
            qty_allocated: 40,
            status: "allocated",
          },
          {
            id: "ol_5b",
            sku_id: "sku_biscuit",
            qty_requested: 12,
            qty_allocated: 12,
            status: "allocated",
          },
        ],
      },
      {
        id: "ord_6",
        org_id: "org_demo",
        retailer_location_id: "loc_rt_navghar",
        warehouse_location_id: "loc_wh_bhe",
        status: "ready_to_ship",
        priority: 1,
        requested_window_start: "2026-04-13T08:00:00.000Z",
        requested_window_end: "2026-04-13T10:00:00.000Z",
        created_at: "2026-04-12T06:20:00.000Z",
        lines: [
          {
            id: "ol_6",
            sku_id: "sku_water",
            qty_requested: 12,
            qty_allocated: 12,
            status: "allocated",
          },
        ],
      },
    ],
    vehicles: [
      {
        id: "veh_1",
        org_id: "org_demo",
        reg_number: "MH58AB1234",
        capacity_kg: 2400,
        capacity_m3: 12,
      },
      {
        id: "veh_2",
        org_id: "org_demo",
        reg_number: "MH58CD5678",
        capacity_kg: 1800,
        capacity_m3: 10,
      },
      {
        id: "veh_3",
        org_id: "org_demo",
        reg_number: "MH58EF9012",
        capacity_kg: 1200,
        capacity_m3: 7,
      },
    ],
    drivers: [
      {
        id: "drv_1",
        org_id: "org_demo",
        name: "Rahul Patil",
        phone: "+91-9000000001",
        user_id: "usr_driver",
        onboarded_at: "2025-10-14T00:00:00.000Z",
      },
      {
        id: "drv_2",
        org_id: "org_demo",
        name: "Asha Shaikh",
        phone: "+91-9000000002",
        user_id: null,
        onboarded_at: "2026-02-18T00:00:00.000Z",
      },
      {
        id: "drv_3",
        org_id: "org_demo",
        name: "Nilesh More",
        phone: "+91-9000000003",
        user_id: null,
        onboarded_at: "2026-04-08T00:00:00.000Z",
      },
    ],
    trips: [
      {
        id: "trip_1",
        org_id: "org_demo",
        warehouse_location_id: "loc_wh_bhw",
        status: "planned",
        vehicle_id: "veh_1",
        driver_id: "drv_1",
        planned_start: "2026-04-12T06:30:00.000Z",
        dispatched_at: null,
        completed_at: null,
        created_at: "2026-04-12T05:45:00.000Z",
        stops: [
          {
            id: "stop_1",
            sequence: 1,
            location_id: "loc_rt_maxus",
            status: "pending",
            eta: "2026-04-12T07:15:00.000Z",
            arrived_at: null,
            deliveries: [
              {
                id: "sd_1",
                order_line_id: "ol_3",
                qty_planned: 20,
                qty_delivered: 0,
                status: "pending",
                reason_code: null,
              },
            ],
          },
        ],
      },
      {
        id: "trip_2",
        org_id: "org_demo",
        warehouse_location_id: "loc_wh_mrw",
        status: "completed",
        vehicle_id: "veh_2",
        driver_id: "drv_2",
        planned_start: "2026-04-08T06:30:00.000Z",
        dispatched_at: "2026-04-08T06:45:00.000Z",
        completed_at: "2026-04-08T08:10:00.000Z",
        created_at: "2026-04-08T05:50:00.000Z",
        stops: [
          {
            id: "stop_2",
            sequence: 1,
            location_id: "loc_rt_navghar",
            status: "completed",
            eta: "2026-04-08T07:35:00.000Z",
            arrived_at: "2026-04-08T07:28:00.000Z",
            deliveries: [
              {
                id: "sd_2",
                order_line_id: "ol_4",
                qty_planned: 10,
                qty_delivered: 10,
                status: "delivered",
                reason_code: null,
              },
            ],
          },
        ],
      },
      {
        id: "trip_3",
        org_id: "org_demo",
        warehouse_location_id: "loc_wh_mre",
        status: "planned",
        vehicle_id: "veh_3",
        driver_id: "drv_3",
        planned_start: "2026-04-13T05:30:00.000Z",
        dispatched_at: null,
        completed_at: null,
        created_at: "2026-04-12T07:10:00.000Z",
        stops: [
          {
            id: "stop_3",
            sequence: 1,
            location_id: "loc_rt_shanti",
            status: "pending",
            eta: "2026-04-13T06:10:00.000Z",
            arrived_at: null,
            deliveries: [
              {
                id: "sd_3",
                order_line_id: "ol_1",
                qty_planned: 24,
                qty_delivered: 0,
                status: "pending",
                reason_code: null,
              },
              {
                id: "sd_4",
                order_line_id: "ol_1b",
                qty_planned: 18,
                qty_delivered: 0,
                status: "pending",
                reason_code: null,
              },
            ],
          },
          {
            id: "stop_4",
            sequence: 2,
            location_id: "loc_rt_navghar",
            status: "pending",
            eta: "2026-04-13T07:00:00.000Z",
            arrived_at: null,
            deliveries: [
              {
                id: "sd_5",
                order_line_id: "ol_5",
                qty_planned: 40,
                qty_delivered: 0,
                status: "pending",
                reason_code: null,
              },
              {
                id: "sd_6",
                order_line_id: "ol_5b",
                qty_planned: 12,
                qty_delivered: 0,
                status: "pending",
                reason_code: null,
              },
            ],
          },
        ],
      },
    ],
    transfers: [
      {
        id: "tr_1",
        org_id: "org_demo",
        from_location_id: "loc_wh_mre",
        to_location_id: "loc_wh_bhe",
        status: "draft",
        notes: "Rebalance edible oil demand toward Bhayandar East cluster",
        created_at: "2026-04-11T11:30:00.000Z",
        lines: [
          {
            id: "tl_1",
            sku_id: "sku_oil",
            qty_requested: 15,
            qty_shipped: 0,
            qty_received: 0,
          },
        ],
      },
      {
        id: "tr_2",
        org_id: "org_demo",
        from_location_id: "loc_wh_bhw",
        to_location_id: "loc_wh_mrw",
        status: "in_transit",
        notes: "Shift biscuit stock to western transit hub for morning retail rounds",
        created_at: "2026-04-10T15:00:00.000Z",
        lines: [
          {
            id: "tl_2",
            sku_id: "sku_biscuit",
            qty_requested: 10,
            qty_shipped: 10,
            qty_received: 0,
          },
          {
            id: "tl_3",
            sku_id: "sku_water",
            qty_requested: 12,
            qty_shipped: 12,
            qty_received: 0,
          },
        ],
      },
    ],
  };
}

function readState(): MockState {
  if (typeof window === "undefined") {
    if (!memoryState) memoryState = seedState();
    return clone(memoryState);
  }

  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MockState>;
      if (parsed.version === 2) {
        const s = parsed as MockState;
        if (!Array.isArray(s.transfers)) s.transfers = [];
        if (!Array.isArray(s.orders)) s.orders = [];
        if (!Array.isArray(s.locations)) s.locations = [];
        if (!Array.isArray(s.skus)) s.skus = [];
        if (!Array.isArray(s.inventory)) s.inventory = [];
        if (!Array.isArray(s.trips)) s.trips = [];
        if (!Array.isArray(s.vehicles)) s.vehicles = [];
        if (!Array.isArray(s.drivers)) s.drivers = [];
        for (const d of s.drivers) {
          if (!("onboarded_at" in d) || !(d as MockDriver).onboarded_at) {
            (d as MockDriver).onboarded_at = "2025-01-01T00:00:00.000Z";
          }
        }
        memoryState = s;
        return clone(memoryState);
      }
    }
  } catch {
    /* ignore malformed local state */
  }

  const seeded = seedState();
  writeState(seeded);
  return clone(seeded);
}

function writeState(state: MockState) {
  memoryState = clone(state);
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* ignore persistence failures */
  }
}

function withState<T>(fn: (state: MockState) => T): T {
  const state = readState();
  const result = fn(state);
  writeState(state);
  return clone(result);
}

function authTokenFor(userId: string) {
  return `${TOKEN_PREFIX}${userId}`;
}

function requireAuth(state: MockState, token: string | null) {
  if (!token?.startsWith(TOKEN_PREFIX)) {
    throw new Error("Could not validate credentials");
  }
  const userId = token.slice(TOKEN_PREFIX.length);
  const user = state.users.find((item) => item.id === userId && item.is_active);
  if (!user) throw new Error("Could not validate credentials");
  return user;
}

function requireOrder(state: MockState, orderId: string, orgId: string) {
  const order = state.orders.find((item) => item.id === orderId && item.org_id === orgId);
  if (!order) throw new Error("Order not found");
  return order;
}

function requireTrip(state: MockState, tripId: string, orgId: string) {
  const trip = state.trips.find((item) => item.id === tripId && item.org_id === orgId);
  if (!trip) throw new Error("Trip not found");
  return trip;
}

function requireTransfer(state: MockState, transferId: string, orgId: string) {
  const transfer = state.transfers.find((item) => item.id === transferId && item.org_id === orgId);
  if (!transfer) throw new Error("Transfer not found");
  return transfer;
}

function requireInventory(state: MockState, locationId: string, skuId: string) {
  const row = state.inventory.find(
    (item) => item.location_id === locationId && item.sku_id === skuId,
  );
  if (!row) throw new Error("Inventory row missing");
  return row;
}

function ensureInventory(state: MockState, locationId: string, skuId: string) {
  let row = state.inventory.find(
    (item) => item.location_id === locationId && item.sku_id === skuId,
  );
  if (!row) {
    row = {
      id: makeId("inv"),
      location_id: locationId,
      sku_id: skuId,
      on_hand: 0,
      reserved: 0,
    };
    state.inventory.push(row);
  }
  return row;
}

function findOrderLine(state: MockState, lineId: string) {
  for (const order of state.orders) {
    const line = order.lines.find((item) => item.id === lineId);
    if (line) return { order, line };
  }
  throw new Error("Order line missing");
}

function orderOut(state: MockState, order: MockOrder) {
  const retailer = state.locations.find((l) => l.id === order.retailer_location_id);
  const warehouse = state.locations.find((l) => l.id === order.warehouse_location_id);
  return {
    id: order.id,
    org_id: order.org_id,
    retailer_location_id: order.retailer_location_id,
    warehouse_location_id: order.warehouse_location_id,
    retailer_location_name: retailer?.name ?? order.retailer_location_id,
    warehouse_location_name: warehouse?.name ?? order.warehouse_location_id,
    status: order.status,
    priority: order.priority,
    requested_window_start: order.requested_window_start,
    requested_window_end: order.requested_window_end,
    created_at: order.created_at,
    lines: order.lines.map((line) => {
      const sku = state.skus.find((s) => s.id === line.sku_id);
      return {
        id: line.id,
        sku_id: line.sku_id,
        sku_code: sku?.sku_code ?? line.sku_id,
        sku_name: sku?.name ?? "",
        qty_requested: line.qty_requested,
        qty_allocated: line.qty_allocated,
        status: line.status,
      };
    }),
  };
}

function tripListOut(state: MockState, trip: MockTrip) {
  const wh = state.locations.find((l) => l.id === trip.warehouse_location_id);
  const vehicle = trip.vehicle_id ? state.vehicles.find((v) => v.id === trip.vehicle_id) : null;
  const driver = trip.driver_id ? state.drivers.find((d) => d.id === trip.driver_id) : null;
  const stops = [...trip.stops]
    .sort((a, b) => a.sequence - b.sequence)
    .map((stop) => {
      const loc = state.locations.find((l) => l.id === stop.location_id);
      const qtyPlanned = stop.deliveries.reduce((s, d) => s + d.qty_planned, 0);
      return {
        id: stop.id,
        sequence: stop.sequence,
        location_id: stop.location_id,
        location_name: loc?.name ?? stop.location_id,
        status: stop.status,
        eta: stop.eta,
        delivery_count: stop.deliveries.length,
        qty_planned_total: qtyPlanned,
      };
    });
  return {
    id: trip.id,
    status: trip.status,
    warehouse_location_id: trip.warehouse_location_id,
    warehouse_location_name: wh?.name ?? trip.warehouse_location_id,
    vehicle_id: trip.vehicle_id,
    vehicle_reg: vehicle?.reg_number ?? null,
    driver_id: trip.driver_id,
    driver_name: driver?.name ?? null,
    planned_start: trip.planned_start,
    dispatched_at: trip.dispatched_at,
    completed_at: trip.completed_at,
    created_at: trip.created_at,
    stops,
  };
}

function tripOut(trip: MockTrip) {
  return {
    id: trip.id,
    org_id: trip.org_id,
    warehouse_location_id: trip.warehouse_location_id,
    status: trip.status,
    vehicle_id: trip.vehicle_id,
    driver_id: trip.driver_id,
    planned_start: trip.planned_start,
    dispatched_at: trip.dispatched_at,
    completed_at: trip.completed_at,
    created_at: trip.created_at,
    stops: [...trip.stops]
      .sort((a, b) => a.sequence - b.sequence)
      .map((stop) => ({
        id: stop.id,
        sequence: stop.sequence,
        location_id: stop.location_id,
        status: stop.status,
        eta: stop.eta,
        arrived_at: stop.arrived_at,
        deliveries: stop.deliveries.map((delivery) => ({
          id: delivery.id,
          order_line_id: delivery.order_line_id,
          qty_planned: delivery.qty_planned,
          qty_delivered: delivery.qty_delivered,
          status: delivery.status,
          reason_code: delivery.reason_code,
        })),
      })),
  };
}

function transferOut(state: MockState, transfer: MockTransfer) {
  const fromLoc = state.locations.find((l) => l.id === transfer.from_location_id);
  const toLoc = state.locations.find((l) => l.id === transfer.to_location_id);
  return {
    id: transfer.id,
    org_id: transfer.org_id,
    from_location_id: transfer.from_location_id,
    to_location_id: transfer.to_location_id,
    from_location_name: fromLoc?.name ?? transfer.from_location_id,
    to_location_name: toLoc?.name ?? transfer.to_location_id,
    status: transfer.status,
    notes: transfer.notes,
    created_at: transfer.created_at,
    lines: transfer.lines.map((line) => {
      const sku = state.skus.find((s) => s.id === line.sku_id);
      return {
        id: line.id,
        sku_id: line.sku_id,
        sku_code: sku?.sku_code ?? line.sku_id,
        sku_name: sku?.name ?? "",
        qty_requested: line.qty_requested,
        qty_shipped: line.qty_shipped,
        qty_received: line.qty_received,
      };
    }),
  };
}

function allocateOrder(state: MockState, order: MockOrder) {
  if (["shipped", "delivered", "cancelled"].includes(order.status)) {
    throw new Error("Order cannot be allocated in current status");
  }

  for (const line of order.lines) {
    const need = line.qty_requested - line.qty_allocated;
    if (need <= 0) continue;

    const inv = state.inventory.find(
      (item) =>
        item.location_id === order.warehouse_location_id && item.sku_id === line.sku_id,
    );
    if (!inv) continue;

    const available = inv.on_hand - inv.reserved;
    const take = Math.min(need, Math.max(0, available));
    if (take <= 0) continue;

    inv.reserved += take;
    line.qty_allocated += take;
    if (line.qty_allocated > 0) line.status = "allocated";
  }

  const stillPending = order.lines.some(
    (line) => line.qty_allocated < line.qty_requested,
  );
  order.status = stillPending ? "pending_allocation" : "ready_to_ship";
}

function refreshOrderStatus(order: MockOrder) {
  if (order.lines.every((line) => line.status === "delivered")) {
    order.status = "delivered";
    return;
  }
  if (order.lines.some((line) => ["delivered", "shipped"].includes(line.status))) {
    order.status = "shipped";
  }
}

function stopHasPendingDeliveries(stop: MockTripStop) {
  return stop.deliveries.some((delivery) => delivery.status === "pending");
}

function recomputeTripCompletion(trip: MockTrip) {
  if (trip.stops.every((stop) => !stopHasPendingDeliveries(stop))) {
    trip.status = "completed";
    trip.completed_at = trip.completed_at ?? nowIso();
  }
}

function driverLeaderboard(state: MockState, orgId: string) {
  const drivers = state.drivers.filter((d) => d.org_id === orgId);
  if (!drivers.length) {
    return { latest_onboarded: null as null | Record<string, unknown>, top_performer: null as null | Record<string, unknown> };
  }
  const latest = [...drivers].sort((a, b) => b.onboarded_at.localeCompare(a.onboarded_at))[0];
  const stats = new Map<string, { completed: number; units: number }>();
  for (const trip of state.trips) {
    if (trip.org_id !== orgId || !trip.driver_id || trip.status !== "completed") continue;
    const sid = trip.driver_id;
    const cur = stats.get(sid) ?? { completed: 0, units: 0 };
    cur.completed += 1;
    for (const stop of trip.stops) {
      for (const del of stop.deliveries) {
        cur.units += del.qty_delivered;
      }
    }
    stats.set(sid, cur);
  }
  let topId: string | null = null;
  let best = -1;
  for (const [id, st] of stats) {
    const score = st.units * 100 + st.completed;
    if (score > best) {
      best = score;
      topId = id;
    }
  }
  const topDriver = topId ? drivers.find((d) => d.id === topId) : null;
  const topStat = topId ? stats.get(topId) : null;
  return {
    latest_onboarded: {
      driver_id: latest.id,
      name: latest.name,
      phone: latest.phone,
      onboarded_at: latest.onboarded_at,
    },
    top_performer:
      topDriver && topStat && best > 0
        ? {
            driver_id: topDriver.id,
            name: topDriver.name,
            completed_trips: topStat.completed,
            units_delivered: topStat.units,
          }
        : null,
  };
}

function buildReports(state: MockState) {
  const deliveries = state.trips.flatMap((trip) =>
    trip.stops.flatMap((stop) => stop.deliveries),
  );
  const totalDeliveries = deliveries.filter((item) =>
    ["delivered", "partial", "failed"].includes(item.status),
  ).length;
  const lateOrFailed = deliveries.filter((item) =>
    ["partial", "failed"].includes(item.status),
  ).length;
  const avgStops =
    state.trips.length > 0
      ? state.trips.reduce((sum, trip) => sum + trip.stops.length, 0) / state.trips.length
      : 0;
  return {
    otd: {
      window_days: 30,
      on_time_rate: totalDeliveries ? (totalDeliveries - lateOrFailed) / totalDeliveries : 1,
      total_deliveries: totalDeliveries,
      late_or_failed: lateOrFailed,
    },
    utilization: {
      avg_stops_per_trip: avgStops,
      trips_in_period: state.trips.length,
      completed_trips: state.trips.filter((trip) => trip.status === "completed").length,
    },
    exceptions: {
      failed_or_partial_stops: lateOrFailed,
      total_stops: state.trips.reduce((sum, trip) => sum + trip.stops.length, 0),
    },
  };
}

function normalizePath(path: string) {
  const url = new URL(path.startsWith("http") ? path : `http://mock.local${path.startsWith("/") ? path : `/${path}`}`);
  const pathname = url.pathname.startsWith("/api/")
    ? url.pathname.slice(4)
    : url.pathname === "/api"
      ? "/"
      : url.pathname;
  return { pathname, searchParams: url.searchParams };
}

export function resetMockData() {
  writeState(seedState());
}

export async function mockApiFetch<T>(
  path: string,
  options: ApiOptions = {},
  token: string | null,
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const { pathname, searchParams } = normalizePath(path);

  if (pathname === "/auth/login" && method === "POST") {
    const body = (options.json || {}) as { email?: string; password?: string };
    const state = readState();
    const user = state.users.find(
      (item) =>
        item.email.toLowerCase() === (body.email || "").toLowerCase() &&
        item.password === body.password &&
        item.is_active,
    );
    if (!user) throw new Error("Invalid email or password");
    return { access_token: authTokenFor(user.id) } as T;
  }

  return withState((state) => {
    const user = requireAuth(state, token);

    if (pathname === "/auth/me" && method === "GET") {
      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        org_id: user.org_id,
        roles: user.roles,
      } as T;
    }

    if (pathname === "/locations" && method === "GET") {
      const type = searchParams.get("type");
      return state.locations
        .filter((item) => item.org_id === user.org_id)
        .filter((item) => (type ? item.type === type : true))
        .map((item) => ({
          id: item.id,
          org_id: item.org_id,
          type: item.type,
          name: item.name,
          address: item.address,
          lat: item.lat,
          lng: item.lng,
        })) as T;
    }

    const locationDetailMatch = pathname.match(/^\/locations\/([^/]+)$/);
    if (locationDetailMatch && method === "GET") {
      const loc = state.locations.find(
        (item) => item.id === locationDetailMatch[1] && item.org_id === user.org_id,
      );
      if (!loc) throw new Error("Location not found");
      return {
        id: loc.id,
        org_id: loc.org_id,
        type: loc.type,
        name: loc.name,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
      } as T;
    }

    if (pathname === "/skus" && method === "GET") {
      return state.skus.map((item) => ({
        id: item.id,
        sku_code: item.sku_code,
        name: item.name,
        uom: item.uom,
        weight_kg: item.weight_kg,
        volume_m3: item.volume_m3,
      })) as T;
    }

    if (pathname === "/vehicles" && method === "GET") {
      return state.vehicles
        .filter((item) => item.org_id === user.org_id)
        .map((item) => ({
          id: item.id,
          org_id: item.org_id,
          reg_number: item.reg_number,
          capacity_kg: item.capacity_kg,
          capacity_m3: item.capacity_m3,
        })) as T;
    }

    if (pathname === "/drivers" && method === "GET") {
      return state.drivers
        .filter((item) => item.org_id === user.org_id)
        .map((item) => ({
          id: item.id,
          org_id: item.org_id,
          name: item.name,
          phone: item.phone,
          user_id: item.user_id,
          onboarded_at: item.onboarded_at,
        })) as T;
    }

    if (pathname === "/inventory" && method === "GET") {
      const locationId = searchParams.get("location_id");
      return state.inventory
        .filter((item) => (locationId ? item.location_id === locationId : true))
        .map((item) => {
          const location = state.locations.find((loc) => loc.id === item.location_id);
          const sku = state.skus.find((row) => row.id === item.sku_id);
          return {
            id: item.id,
            location_id: item.location_id,
            location_name: location?.name ?? item.location_id,
            location_type: location?.type ?? "",
            sku_id: item.sku_id,
            sku_code: sku?.sku_code ?? item.sku_id,
            sku_name: sku?.name ?? "",
            on_hand: item.on_hand,
            reserved: item.reserved,
            available: item.on_hand - item.reserved,
          };
        }) as T;
    }

    if (pathname === "/orders" && method === "GET") {
      const status = searchParams.get("status");
      return sortByCreatedDesc(
        state.orders
          .filter((item) => item.org_id === user.org_id)
          .filter((item) => (status ? item.status === status : true)),
      ).map((o) => orderOut(state, o)) as T;
    }

    if (pathname === "/orders" && method === "POST") {
      const body = (options.json || {}) as {
        retailer_location_id?: string;
        warehouse_location_id?: string;
        lines?: Array<{ sku_id?: string; qty?: number }>;
        priority?: number;
        requested_window_start?: string | null;
        requested_window_end?: string | null;
      };
      if (!body.retailer_location_id || !body.warehouse_location_id || !body.lines?.length) {
        throw new Error("retailer_location_id, warehouse_location_id, and lines required");
      }
      const order: MockOrder = {
        id: makeId("ord"),
        org_id: user.org_id,
        retailer_location_id: body.retailer_location_id,
        warehouse_location_id: body.warehouse_location_id,
        status: "pending_allocation",
        priority: body.priority ?? 0,
        requested_window_start: body.requested_window_start ?? null,
        requested_window_end: body.requested_window_end ?? null,
        created_at: nowIso(),
        lines: body.lines.map((line) => {
          if (!line.sku_id || !line.qty || line.qty <= 0) {
            throw new Error("Each order line requires sku_id and positive qty");
          }
          return {
            id: makeId("ol"),
            sku_id: line.sku_id,
            qty_requested: line.qty,
            qty_allocated: 0,
            status: "pending",
          };
        }),
      };
      state.orders.push(order);
      return orderOut(state, order) as T;
    }

    const orderAllocMatch = pathname.match(/^\/orders\/([^/]+)\/allocate$/);
    if (orderAllocMatch && method === "POST") {
      const order = requireOrder(state, orderAllocMatch[1], user.org_id);
      allocateOrder(state, order);
      return orderOut(state, order) as T;
    }

    const orderDetailMatch = pathname.match(/^\/orders\/([^/]+)$/);
    if (orderDetailMatch && method === "GET") {
      return orderOut(state, requireOrder(state, orderDetailMatch[1], user.org_id)) as T;
    }

    if (pathname === "/trips" && method === "GET") {
      return sortByCreatedDesc(
        state.trips
          .filter((item) => item.org_id === user.org_id)
          .map((t) => tripListOut(state, t)),
      ) as T;
    }

    if (pathname === "/trips/plan" && method === "POST") {
      const body = (options.json || {}) as {
        warehouse_location_id?: string;
        order_ids?: string[];
        vehicle_id?: string | null;
        driver_id?: string | null;
        planned_start?: string | null;
      };
      if (!body.warehouse_location_id || !body.order_ids?.length) {
        throw new Error("warehouse_location_id and order_ids required");
      }

      const orders = body.order_ids.map((orderId) => requireOrder(state, orderId, user.org_id));
      for (const order of orders) {
        if (order.status !== "ready_to_ship") {
          throw new Error(`Order ${order.id} must be ready_to_ship`);
        }
        if (order.warehouse_location_id !== body.warehouse_location_id) {
          throw new Error("Order warehouse mismatch");
        }
      }

      const grouped = new Map<string, MockOrder[]>();
      for (const order of orders) {
        const bucket = grouped.get(order.retailer_location_id) ?? [];
        bucket.push(order);
        grouped.set(order.retailer_location_id, bucket);
      }

      const retailerIds = [...grouped.keys()].sort();
      const trip: MockTrip = {
        id: makeId("trip"),
        org_id: user.org_id,
        warehouse_location_id: body.warehouse_location_id,
        status: "planned",
        vehicle_id: body.vehicle_id ?? null,
        driver_id: body.driver_id ?? null,
        planned_start: body.planned_start ?? null,
        dispatched_at: null,
        completed_at: null,
        created_at: nowIso(),
        stops: retailerIds.map((retailerId, index) => ({
          id: makeId("stop"),
          sequence: index + 1,
          location_id: retailerId,
          status: "pending",
          eta: null,
          arrived_at: null,
          deliveries: (grouped.get(retailerId) ?? []).flatMap((order) =>
            order.lines
              .filter((line) => line.qty_allocated > 0)
              .map((line) => ({
                id: makeId("sd"),
                order_line_id: line.id,
                qty_planned: line.qty_allocated,
                qty_delivered: 0,
                status: "pending",
                reason_code: null,
              })),
          ),
        })),
      };

      for (const order of orders) {
        order.status = "in_fulfillment";
      }
      state.trips.push(trip);
      return tripOut(trip) as T;
    }

    const tripDispatchMatch = pathname.match(/^\/trips\/([^/]+)\/dispatch$/);
    if (tripDispatchMatch && method === "POST") {
      const trip = requireTrip(state, tripDispatchMatch[1], user.org_id);
      if (!["planned", "draft"].includes(trip.status)) {
        throw new Error("Trip cannot be dispatched in current status");
      }
      if (!trip.vehicle_id || !trip.driver_id) {
        throw new Error("Assign vehicle and driver before dispatch");
      }
      trip.status = "dispatched";
      trip.dispatched_at = nowIso();
      return tripOut(trip) as T;
    }

    const tripDeliverMatch = pathname.match(/^\/trips\/([^/]+)\/stops\/([^/]+)\/deliver$/);
    if (tripDeliverMatch && method === "POST") {
      const trip = requireTrip(state, tripDeliverMatch[1], user.org_id);
      const stop = trip.stops.find((item) => item.id === tripDeliverMatch[2]);
      if (!stop) throw new Error("Stop not found");

      const body = (options.json || {}) as {
        deliveries?: Array<{
          stop_delivery_id?: string;
          qty_delivered?: number;
          status?: string;
          reason_code?: string | null;
        }>;
      };
      if (!body.deliveries?.length) throw new Error("deliveries required");

      const touchedOrders = new Set<string>();
      for (const lineInput of body.deliveries) {
        const delivery = stop.deliveries.find((item) => item.id === lineInput.stop_delivery_id);
        if (!delivery) throw new Error("Invalid stop delivery");
        const { order, line } = findOrderLine(state, delivery.order_line_id);
        const inv = requireInventory(state, trip.warehouse_location_id, line.sku_id);
        const nextQty = Math.max(0, Math.min(lineInput.qty_delivered ?? 0, delivery.qty_planned));
        const delta = nextQty - delivery.qty_delivered;
        if (delta > 0) {
          const reduceReserved = Math.min(delta, inv.reserved);
          inv.reserved -= reduceReserved;
          inv.on_hand = Math.max(0, inv.on_hand - delta);
        }

        delivery.qty_delivered = nextQty;
        delivery.status =
          lineInput.status ?? (nextQty >= delivery.qty_planned ? "delivered" : "partial");
        delivery.reason_code = lineInput.reason_code ?? null;

        if (delivery.status === "delivered" && nextQty >= delivery.qty_planned) {
          line.status = "delivered";
        } else if (delivery.status === "partial") {
          line.status = "shipped";
        } else {
          line.status = delivery.status;
        }
        touchedOrders.add(order.id);
      }

      stop.status = "completed";
      stop.arrived_at = stop.arrived_at ?? nowIso();
      for (const orderId of touchedOrders) {
        refreshOrderStatus(requireOrder(state, orderId, user.org_id));
      }
      recomputeTripCompletion(trip);
      return tripOut(trip) as T;
    }

    const tripDetailMatch = pathname.match(/^\/trips\/([^/]+)$/);
    if (tripDetailMatch && method === "GET") {
      return tripOut(requireTrip(state, tripDetailMatch[1], user.org_id)) as T;
    }

    if (pathname === "/transfers" && method === "GET") {
      const status = searchParams.get("status");
      return sortByCreatedDesc(
        state.transfers
          .filter((item) => item.org_id === user.org_id)
          .filter((item) => (status ? item.status === status : true)),
      ).map((t) => transferOut(state, t)) as T;
    }

    if (pathname === "/transfers" && method === "POST") {
      const body = (options.json || {}) as {
        from_location_id?: string;
        to_location_id?: string;
        lines?: Array<{ sku_id?: string; qty?: number }>;
        notes?: string | null;
      };
      if (!body.from_location_id || !body.to_location_id || !body.lines?.length) {
        throw new Error("from_location_id, to_location_id, and lines required");
      }
      if (body.from_location_id === body.to_location_id) {
        throw new Error("Source and destination must differ");
      }
      const transfer: MockTransfer = {
        id: makeId("tr"),
        org_id: user.org_id,
        from_location_id: body.from_location_id,
        to_location_id: body.to_location_id,
        status: "draft",
        notes: body.notes ?? null,
        created_at: nowIso(),
        lines: body.lines.map((line) => {
          if (!line.sku_id || !line.qty || line.qty <= 0) {
            throw new Error("Each transfer line requires sku_id and positive qty");
          }
          return {
            id: makeId("tl"),
            sku_id: line.sku_id,
            qty_requested: line.qty,
            qty_shipped: 0,
            qty_received: 0,
          };
        }),
      };
      state.transfers.push(transfer);
      return transferOut(state, transfer) as T;
    }

    const transferActionMatch = pathname.match(/^\/transfers\/([^/]+)\/(ship|receive|cancel)$/);
    if (transferActionMatch && method === "POST") {
      const transfer = requireTransfer(state, transferActionMatch[1], user.org_id);
      const action = transferActionMatch[2];

      if (action === "ship") {
        if (transfer.status !== "draft") throw new Error("Only draft transfers can be shipped");
        for (const line of transfer.lines) {
          const inv = requireInventory(state, transfer.from_location_id, line.sku_id);
          const available = inv.on_hand - inv.reserved;
          if (available < line.qty_requested) {
            throw new Error(
              `Insufficient stock for SKU ${line.sku_id}: need ${line.qty_requested}, available ${available}`,
            );
          }
          inv.on_hand -= line.qty_requested;
          line.qty_shipped = line.qty_requested;
        }
        transfer.status = "in_transit";
      }

      if (action === "receive") {
        if (transfer.status !== "in_transit") {
          throw new Error("Only in_transit transfers can be received");
        }
        for (const line of transfer.lines) {
          const inv = ensureInventory(state, transfer.to_location_id, line.sku_id);
          inv.on_hand += line.qty_shipped;
          line.qty_received = line.qty_shipped;
        }
        transfer.status = "received";
      }

      if (action === "cancel") {
        if (transfer.status !== "draft") {
          throw new Error("Only draft transfers can be cancelled");
        }
        transfer.status = "cancelled";
      }

      return transferOut(state, transfer) as T;
    }

    if (pathname === "/reports/otd" && method === "GET") {
      return buildReports(state).otd as T;
    }

    if (pathname === "/reports/utilization" && method === "GET") {
      return buildReports(state).utilization as T;
    }

    if (pathname === "/reports/exceptions" && method === "GET") {
      return buildReports(state).exceptions as T;
    }

    if (pathname === "/reports/drivers" && method === "GET") {
      return driverLeaderboard(state, user.org_id) as T;
    }

    throw new Error(`Mock route not implemented: ${method} ${pathname}`);
  });
}
