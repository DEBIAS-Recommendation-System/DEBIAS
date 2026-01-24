import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import Base, engine, SessionLocal
from app.models.models import User
from typing import Dict, Any


client = TestClient(app)


def reset_database() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def promote_user_to_admin(username: str) -> None:
    with SessionLocal() as db:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise RuntimeError(f"User {username} not found for admin promotion")
        user.role = "admin"
        db.commit()


def signup_user(payload: Dict[str, Any]) -> Dict[str, Any]:
    response = client.post("/auth/signup", json=payload)
    assert response.status_code == 200, response.text
    return response.json()


def login_user(username: str, password: str) -> Dict[str, Any]:
    response = client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200, response.text
    return response.json()


def refresh_token(refresh_token: str) -> Dict[str, Any]:
    response = client.post("/auth/refresh", headers={"refresh-token": refresh_token})
    assert response.status_code == 200, response.text
    return response.json()


def run_smoke_tests() -> None:
    reset_database()
    print("Database reset complete")

    admin_payload = {
        "full_name": "Admin User",
        "username": "admin",
        "email": "admin@example.com",
        "password": "AdminPass123",
    }
    signup_user(admin_payload)
    print("Admin signup completed")
    promote_user_to_admin(admin_payload["username"])
    print("Admin role granted")
    admin_tokens = login_user(admin_payload["username"], admin_payload["password"])
    print("Admin login successful")

    refreshed_tokens = refresh_token(admin_tokens["refresh_token"])
    print("Refresh token issued")

    auth_header = {"Authorization": f"Bearer {admin_tokens['access_token']}"}

    # Category endpoints
    category_payload = {"name": "Electronics"}
    category_create = client.post("/categories/", json=category_payload, headers=auth_header)
    assert category_create.status_code == 201, category_create.text
    category_id = category_create.json()["data"]["id"]
    print(f"Category created with id {category_id}")

    category_list = client.get("/categories/")
    assert category_list.status_code == 200, category_list.text
    print("Categories listed")

    category_update = client.put(
        f"/categories/{category_id}",
        json={"name": "Updated Electronics"},
        headers=auth_header,
    )
    assert category_update.status_code == 200, category_update.text
    print("Category updated")

    # Product endpoints
    product_payload = {
        "title": "Smartphone",
        "description": "Latest model",
        "price": 999,
        "discount_percentage": 10.0,
        "rating": 4.5,
        "stock": 50,
        "brand": "TechCorp",
        "thumbnail": "http://example.com/thumb.jpg",
        "images": ["http://example.com/image1.jpg"],
        "is_published": True,
        "category_id": category_id,
        "created_at": "2024-01-01T00:00:00Z",
    }
    product_create = client.post("/products/", json=product_payload, headers=auth_header)
    assert product_create.status_code == 201, product_create.text
    product_id = product_create.json()["data"]["id"]
    print(f"Product created with id {product_id}")

    product_list = client.get("/products/")
    assert product_list.status_code == 200, product_list.text
    print("Products listed")

    product_detail = client.get(f"/products/{product_id}")
    assert product_detail.status_code == 200, product_detail.text
    print("Product detail retrieved")

    product_update = client.put(
        f"/products/{product_id}",
        json={**product_payload, "price": 899},
        headers=auth_header,
    )
    assert product_update.status_code == 200, product_update.text
    print("Product updated")

    # Users endpoints
    user_payload = {
        "full_name": "Customer User",
        "username": "customer",
        "email": "customer@example.com",
        "password": "CustomerPass123",
    }
    user_create = client.post("/users/", json=user_payload, headers=auth_header)
    assert user_create.status_code == 201, user_create.text
    customer_record = user_create.json()["data"]
    customer_id = customer_record["id"]
    print(f"Customer created with id {customer_id}")

    users_list = client.get("/users/", headers=auth_header)
    assert users_list.status_code == 200, users_list.text
    print("Users listed")

    user_detail = client.get(f"/users/{customer_id}", headers=auth_header)
    assert user_detail.status_code == 200, user_detail.text
    print("User detail retrieved")

    updated_user_payload = {
        "full_name": "Updated Customer",
        "username": user_payload["username"],
        "email": user_payload["email"],
        "password": customer_record["password"],
    }
    user_update = client.put(
        f"/users/{customer_id}",
        json=updated_user_payload,
        headers=auth_header,
    )
    assert user_update.status_code == 200, user_update.text
    print("User updated")

    # Customer token for account and cart tests
    customer_tokens = login_user(user_payload["username"], user_payload["password"])
    customer_header = {"Authorization": f"Bearer {customer_tokens['access_token']}"}
    print("Customer login successful")

    account_me = client.get("/me/", headers=customer_header)
    assert account_me.status_code == 200, account_me.text
    print("Account details fetched")

    account_update = client.put(
        "/me/",
        json={"full_name": "Renamed Customer", "email": "customer@example.com", "username": "customer"},
        headers=customer_header,
    )
    assert account_update.status_code == 200, account_update.text
    print("Account updated")

    # Cart endpoints require existing product id
    cart_payload = {
        "cart_items": [
            {"product_id": product_id, "quantity": 2},
        ]
    }
    cart_create = client.post("/carts/", json=cart_payload, headers=customer_header)
    assert cart_create.status_code == 201, cart_create.text
    cart_id = cart_create.json()["data"]["id"]
    print(f"Cart created with id {cart_id}")

    cart_list = client.get("/carts/", headers=customer_header)
    assert cart_list.status_code == 200, cart_list.text
    print("Carts listed")

    cart_detail = client.get(f"/carts/{cart_id}", headers=customer_header)
    assert cart_detail.status_code == 200, cart_detail.text
    print("Cart detail retrieved")

    cart_update = client.put(
        f"/carts/{cart_id}",
        json={"cart_items": [{"product_id": product_id, "quantity": 1}]},
        headers=customer_header,
    )
    assert cart_update.status_code == 200, cart_update.text
    print("Cart updated")

    cart_delete = client.delete(f"/carts/{cart_id}", headers=customer_header)
    assert cart_delete.status_code == 200, cart_delete.text
    print("Cart deleted")

    # Delete product and category to complete lifecycle
    product_delete = client.delete(f"/products/{product_id}", headers=auth_header)
    assert product_delete.status_code == 200, product_delete.text
    print("Product deleted")

    category_delete = client.delete(f"/categories/{category_id}", headers=auth_header)
    assert category_delete.status_code == 200, category_delete.text
    print("Category deleted")

    # Delete customer via admin and remove account for admin
    user_delete = client.delete(f"/users/{customer_id}", headers=auth_header)
    assert user_delete.status_code == 200, user_delete.text
    print("Customer deleted")

    # Remove admin account using account endpoint
    admin_header = {"Authorization": f"Bearer {admin_tokens['access_token']}"}
    admin_delete = client.delete("/me/", headers=admin_header)
    assert admin_delete.status_code == 200, admin_delete.text
    print("Admin account removed")

    print("API smoke tests completed successfully.")


if __name__ == "__main__":
    run_smoke_tests()
