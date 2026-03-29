from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, drivers, inventory, locations, orders, reports, skus, transfers, trips, vehicles

app = FastAPI(title="Getto API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(locations.router)
app.include_router(skus.router)
app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(inventory.router)
app.include_router(orders.router)
app.include_router(transfers.router)
app.include_router(trips.router)
app.include_router(reports.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
