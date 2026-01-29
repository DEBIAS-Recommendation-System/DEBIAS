from sqlalchemy.orm import Session
from app.models.models import Product
from app.schemas.products import ProductCreate, ProductUpdate
from app.utils.responses import ResponseHandler


class ProductService:
    @staticmethod
    def get_all_products(db: Session, page: int, limit: int, search: str = ""):
        # Build the base query with search filter
        query = db.query(Product).filter(Product.title.contains(search))
        
        # Get total count for pagination
        total_count = query.count()
        
        # Get paginated products
        products = query.order_by(Product.product_id.asc()).limit(limit).offset((page - 1) * limit).all()
        
        return {
            "message": f"Page {page} with {limit} products",
            "data": products,
            "total_count": total_count
        }

    @staticmethod
    def get_product(db: Session, product_id: int):
        product = db.query(Product).filter(Product.product_id == product_id).first()
        if not product:
            ResponseHandler.not_found_error("Product", product_id)
        return ResponseHandler.get_single_success(product.title, product_id, product)

    @staticmethod
    def create_product(db: Session, product: ProductCreate):
        product_dict = product.model_dump()
        db_product = Product(**product_dict)
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return ResponseHandler.create_success(db_product.title, db_product.product_id, db_product)

    @staticmethod
    def update_product(db: Session, product_id: int, updated_product: ProductUpdate):
        db_product = db.query(Product).filter(Product.product_id == product_id).first()
        if not db_product:
            ResponseHandler.not_found_error("Product", product_id)

        for key, value in updated_product.model_dump(exclude_unset=True).items():
            setattr(db_product, key, value)

        db.commit()
        db.refresh(db_product)
        return ResponseHandler.update_success(db_product.title, db_product.product_id, db_product)

    @staticmethod
    def delete_product(db: Session, product_id: int):
        db_product = db.query(Product).filter(Product.product_id == product_id).first()
        if not db_product:
            ResponseHandler.not_found_error("Product", product_id)
        db.delete(db_product)
        db.commit()
        return ResponseHandler.delete_success(db_product.title, db_product.product_id, db_product)
