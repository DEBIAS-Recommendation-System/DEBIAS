import csv
from pathlib import Path
from typing import Iterable

from sqlalchemy.dialects.postgresql import insert

from app.db.database import SessionLocal
from app.models.models import Product

CSV_PATH = Path(__file__).resolve().parents[1] / "data" / "products.csv"
CHUNK_SIZE = 1000


def _read_rows(path: Path) -> Iterable[dict]:
    with path.open("r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            if not row.get("product_id"):
                continue
            yield {
                "product_id": int(row["product_id"]),
                "title": row.get("title", "").strip(),
                "brand": row.get("brand", "").strip(),
                "category": row.get("category", "").strip(),
                "price": float(row.get("price", 0) or 0),
                "imgUrl": row.get("imgUrl", "").strip(),
            }


def populate_products(csv_path: Path = CSV_PATH) -> None:
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found at {csv_path}")

    total_inserted = 0
    batch: list[dict] = []

    with SessionLocal() as db:
        for row in _read_rows(csv_path):
            batch.append(row)
            if len(batch) >= CHUNK_SIZE:
                stmt = insert(Product).values(batch)
                stmt = stmt.on_conflict_do_nothing(index_elements=["product_id"])
                result = db.execute(stmt)
                db.commit()
                total_inserted += result.rowcount or 0
                batch.clear()

        if batch:
            stmt = insert(Product).values(batch)
            stmt = stmt.on_conflict_do_nothing(index_elements=["product_id"])
            result = db.execute(stmt)
            db.commit()
            total_inserted += result.rowcount or 0

    print(f"Inserted {total_inserted} products from {csv_path}")


if __name__ == "__main__":
    populate_products()
