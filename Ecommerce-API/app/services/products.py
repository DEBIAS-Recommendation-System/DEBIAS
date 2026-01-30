from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.models.models import Product
from app.schemas.products import ProductCreate, ProductUpdate
from app.utils.responses import ResponseHandler


class ProductService:
    @staticmethod
    def get_all_products(
        db: Session, 
        page: int, 
        limit: int, 
        search: str = "",
        category: str = None,
        minPrice: float = None,
        maxPrice: float = None,
        sort_by: str = None,
        order: str = "asc"
    ):
        # Build the base query with search filter
        query = db.query(Product).filter(Product.title.contains(search))
        
        # Apply category filter if provided (supports multiple categories separated by comma)
        if category:
            # Split by comma for multiple categories
            categories = [cat.strip() for cat in category.split(',') if cat.strip()]
            if categories:
                # Create OR conditions for each category
                category_conditions = []
                for cat in categories:
                    category_prefix = f"{cat.lower()}."
                    category_conditions.append(Product.category.startswith(category_prefix))
                    category_conditions.append(Product.category == cat.lower())
                query = query.filter(or_(*category_conditions))
        
        # Apply price range filters if provided
        if minPrice is not None:
            query = query.filter(Product.price >= minPrice)
        if maxPrice is not None:
            query = query.filter(Product.price <= maxPrice)
        
        # Apply sorting if provided
        if sort_by:
            sort_column = getattr(Product, sort_by, None)
            if sort_column:
                if order == "desc":
                    query = query.order_by(sort_column.desc())
                else:
                    query = query.order_by(sort_column.asc())
        else:
            # Default sorting by product_id
            query = query.order_by(Product.product_id.asc())
        
        # Get total count for pagination
        total_count = query.count()
        
        # Get paginated products
        products = query.limit(limit).offset((page - 1) * limit).all()
        
        return {
            "message": f"Page {page} with {limit} products",
            "data": products,
            "total_count": total_count
        }

    @staticmethod
    def get_price_range(db: Session):
        """Get the minimum and maximum prices from all products"""
        result = db.query(
            func.min(Product.price).label('min_price'),
            func.max(Product.price).label('max_price')
        ).first()
        
        return {
            "message": "Price range retrieved successfully",
            "data": {
                "min_price": result.min_price if result.min_price is not None else 0,
                "max_price": result.max_price if result.max_price is not None else 1000
            }
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

    @staticmethod
    def get_products_by_ids(db: Session, product_ids: list[int]):
        """
        Get multiple products by their IDs
        
        Args:
            db: Database session
            product_ids: List of product IDs to fetch
            
        Returns:
            List of Product objects
        """
        products = db.query(Product).filter(Product.product_id.in_(product_ids)).all()
        return products
