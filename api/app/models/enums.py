import enum


class LocationType(str, enum.Enum):
    factory = "factory"
    dairy = "dairy"
    warehouse = "warehouse"
    retailer = "retailer"
    customer = "customer"


class OrderStatus(str, enum.Enum):
    draft = "draft"
    pending_allocation = "pending_allocation"
    allocated = "allocated"
    ready_to_ship = "ready_to_ship"
    in_fulfillment = "in_fulfillment"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class OrderLineStatus(str, enum.Enum):
    pending = "pending"
    allocated = "allocated"
    picked = "picked"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class TripStatus(str, enum.Enum):
    draft = "draft"
    planned = "planned"
    dispatched = "dispatched"
    enroute = "enroute"
    completed = "completed"
    cancelled = "cancelled"


class TripStopStatus(str, enum.Enum):
    pending = "pending"
    arrived = "arrived"
    completed = "completed"
    skipped = "skipped"


class StopDeliveryStatus(str, enum.Enum):
    pending = "pending"
    delivered = "delivered"
    partial = "partial"
    failed = "failed"


class RoleName(str, enum.Enum):
    admin = "admin"
    factory_ops = "factory_ops"
    dairy_ops = "dairy_ops"
    warehouse_manager = "warehouse_manager"
    dispatcher = "dispatcher"
    driver = "driver"
    retailer = "retailer"
    customer = "customer"
