import type {
  Driver,
  InventoryBalance,
  Location,
  Order,
  OrderLine,
  SKU,
  StopDelivery,
  StockTransfer,
  StockTransferLine,
  Trip,
  TripStop,
  Vehicle,
} from "@prisma/client";

function iso(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString();
}

export function orderLineOut(l: OrderLine) {
  return {
    id: l.id,
    sku_id: l.skuId,
    qty_requested: l.qtyRequested,
    qty_allocated: l.qtyAllocated,
    status: l.status,
  };
}

export function orderOut(o: Order & { lines: OrderLine[] }) {
  return {
    id: o.id,
    org_id: o.orgId,
    retailer_location_id: o.retailerLocationId,
    warehouse_location_id: o.warehouseLocationId,
    status: o.status,
    priority: o.priority,
    requested_window_start: iso(o.requestedWindowStart),
    requested_window_end: iso(o.requestedWindowEnd),
    lines: o.lines.map(orderLineOut),
  };
}

export function stopDeliveryOut(d: StopDelivery) {
  return {
    id: d.id,
    order_line_id: d.orderLineId,
    qty_planned: d.qtyPlanned,
    qty_delivered: d.qtyDelivered,
    status: d.status,
    reason_code: d.reasonCode,
  };
}

export function tripStopOut(s: TripStop & { deliveries: StopDelivery[] }) {
  return {
    id: s.id,
    sequence: s.sequence,
    location_id: s.locationId,
    status: s.status,
    eta: iso(s.eta),
    arrived_at: iso(s.arrivedAt),
    deliveries: s.deliveries.map(stopDeliveryOut),
  };
}

export function tripSummary(t: Trip) {
  return {
    id: t.id,
    status: t.status,
    warehouse_location_id: t.warehouseLocationId,
    vehicle_id: t.vehicleId,
    driver_id: t.driverId,
    created_at: iso(t.createdAt),
  };
}

export function tripOut(t: Trip & { stops: (TripStop & { deliveries: StopDelivery[] })[] }) {
  const stops = [...t.stops].sort((a, b) => a.sequence - b.sequence);
  return {
    id: t.id,
    org_id: t.orgId,
    warehouse_location_id: t.warehouseLocationId,
    status: t.status,
    vehicle_id: t.vehicleId,
    driver_id: t.driverId,
    planned_start: iso(t.plannedStart),
    dispatched_at: iso(t.dispatchedAt),
    completed_at: iso(t.completedAt),
    created_at: iso(t.createdAt),
    stops: stops.map(tripStopOut),
  };
}

export function transferLineOut(l: StockTransferLine) {
  return {
    id: l.id,
    sku_id: l.skuId,
    qty_requested: l.qtyRequested,
    qty_shipped: l.qtyShipped,
    qty_received: l.qtyReceived,
  };
}

export function transferOut(t: StockTransfer & { lines: StockTransferLine[] }) {
  return {
    id: t.id,
    org_id: t.orgId,
    from_location_id: t.fromLocationId,
    to_location_id: t.toLocationId,
    status: t.status,
    notes: t.notes,
    lines: t.lines.map(transferLineOut),
  };
}

export function locationOut(l: Location) {
  return {
    id: l.id,
    org_id: l.orgId,
    type: l.type,
    name: l.name,
    address: l.address,
    lat: l.lat,
    lng: l.lng,
  };
}

export function skuOut(s: SKU) {
  return {
    id: s.id,
    sku_code: s.skuCode,
    name: s.name,
    uom: s.uom,
    weight_kg: s.weightKg,
    volume_m3: s.volumeM3,
  };
}

export function vehicleOut(v: Vehicle) {
  return {
    id: v.id,
    org_id: v.orgId,
    reg_number: v.regNumber,
    capacity_kg: v.capacityKg,
    capacity_m3: v.capacityM3,
  };
}

export function driverOut(d: Driver) {
  return {
    id: d.id,
    org_id: d.orgId,
    name: d.name,
    phone: d.phone,
    user_id: d.userId,
  };
}

export function inventoryRow(
  inv: InventoryBalance & { location: { name: string }; sku: { skuCode: string } },
) {
  const avail = inv.onHand - inv.reserved;
  return {
    id: inv.id,
    location_id: inv.locationId,
    location_name: inv.location.name,
    sku_id: inv.skuId,
    sku_code: inv.sku.skuCode,
    on_hand: inv.onHand,
    reserved: inv.reserved,
    available: avail,
  };
}
