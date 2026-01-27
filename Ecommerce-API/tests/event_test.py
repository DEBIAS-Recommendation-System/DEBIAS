import os
import sys
from datetime import datetime, timezone, timedelta

import httpx

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.db.database import SessionLocal
from app.models.models import Product, User, Event
from populateDB import populate_products


def ensure_products() -> int:
    with SessionLocal() as db:
        count = db.query(Product).count()
        if count == 0:
            populate_products()
            count = db.query(Product).count()
        product = db.query(Product).order_by(Product.product_id.asc()).first()
        if not product:
            raise RuntimeError("No products available for event tests")
        return product.product_id


def ensure_user(username: str, password: str, email: str, full_name: str) -> None:
    with SessionLocal() as db:
        user = db.query(User).filter(User.username == username).first()
        if user:
            return

    client = httpx.Client(base_url="http://127.0.0.1:8000", timeout=10.0)
    resp = client.post(
        "/auth/signup",
        json={
            "full_name": full_name,
            "username": username,
            "email": email,
            "password": password,
        },
    )
    resp.raise_for_status()


def main() -> None:
    product_id = ensure_products()

    username = "event_user"
    password = "EventPass123"
    email = "event_user@example.com"
    full_name = "Event User"

    ensure_user(username, password, email, full_name)

    client = httpx.Client(base_url="http://127.0.0.1:8000", timeout=10.0)
    login = client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    login.raise_for_status()
    tokens = login.json()
    session_id = tokens["session_id"]
    auth_headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    with SessionLocal() as db:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise RuntimeError("User not found after login")
        user_id = user.id

    base_time = datetime.now(timezone.utc).replace(microsecond=0)
    for idx, event_type in enumerate(["view", "cart", "purchase"]):
        payload = {
            "event_time": (base_time + timedelta(seconds=idx)).strftime("%Y-%m-%d %H:%M:%S"),
            "event_type": event_type,
            "product_id": product_id,
            "user_session": session_id,
        }
        resp = client.post("/events/", json=payload, headers=auth_headers)
        resp.raise_for_status()

    with SessionLocal() as db:
        events = (
            db.query(Event)
            .filter(Event.product_id == product_id, Event.user_id == user_id)
            .order_by(Event.event_time.desc())
            .limit(3)
            .all()
        )
        assert len(events) == 3
        assert all(event.user_session == session_id for event in events)
        assert all(event.event_time.microsecond == 0 for event in events)

    print("Event test passed: 3 events created with same session/user/product.")


if __name__ == "__main__":
    main()
