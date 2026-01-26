import os
import time
import httpx

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
ADMIN_USER = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASS = os.getenv("ADMIN_PASSWORD", "admin")


def main() -> None:
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    login_resp = client.post(
        "/auth/login",
        data={"username": ADMIN_USER, "password": ADMIN_PASS},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    login_resp.raise_for_status()
    tokens = login_resp.json()
    access_token = tokens["access_token"]
    auth_headers = {"Authorization": f"Bearer {access_token}"}

    product_id = int(time.time())
    product_payload = {
        "product_id": product_id,
        "title": "Admin Test Product",
        "brand": "AdminBrand",
        "category": "admin.test",
        "price": 12.34,
        "imgUrl": "http://example.com/admin-test.jpg",
    }

    product_create = client.post("/products/", json=product_payload, headers=auth_headers)
    product_create.raise_for_status()
    product_data = product_create.json()["data"]

    product_list = client.get("/products/", headers=auth_headers)
    product_list.raise_for_status()

    product_detail = client.get(f"/products/{product_id}", headers=auth_headers)
    product_detail.raise_for_status()

    cart_payload = {"cart_items": [{"product_id": product_id, "quantity": 2}]}
    cart_create = client.post("/carts/", json=cart_payload, headers=auth_headers)
    cart_create.raise_for_status()
    cart_id = cart_create.json()["data"]["id"]

    cart_detail = client.get(f"/carts/{cart_id}", headers=auth_headers)
    cart_detail.raise_for_status()

    carts_list = client.get("/carts/", headers=auth_headers)
    carts_list.raise_for_status()

    print("Login: OK")
    print(f"Product created: {product_data['product_id']}")
    print(f"Product list count: {len(product_list.json()['data'])}")
    print(f"Product detail: {product_detail.json()['data']['product_id']}")
    print(f"Cart created: {cart_id}")
    print(f"Cart detail: {cart_detail.json()['data']['id']}")
    print(f"Carts list count: {len(carts_list.json()['data'])}")


if __name__ == "__main__":
    main()
