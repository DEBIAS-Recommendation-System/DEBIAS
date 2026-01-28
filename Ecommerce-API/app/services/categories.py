from sqlalchemy.orm import Session
from app.models.models import Category
from app.schemas.categories import CategoryCreate, CategoryUpdate
from app.utils.responses import ResponseHandler


class CategoryService:
    @staticmethod
    def get_all_categories(db: Session, page: int, limit: int, search: str = ""):
        # Get total count for pagination
        query = db.query(Category).filter(Category.name.contains(search))
        total_count = query.count()
        
        # Get paginated categories
        categories = query.order_by(Category.id.asc()).limit(limit).offset((page - 1) * limit).all()
        
        return {
            "message": f"Page {page} with {len(categories)} categories", 
            "data": categories,
            "total_count": total_count
        }

    @staticmethod
    def get_category(db: Session, category_id: int):
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            ResponseHandler.not_found_error("Category", category_id)
        return ResponseHandler.get_single_success(category.name, category_id, category)

    @staticmethod
    def create_category(db: Session, category: CategoryCreate):
        category_dict = category.dict()
        db_category = Category(**category_dict)
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return ResponseHandler.create_success(db_category.name, db_category.id, db_category)

    @staticmethod
    def update_category(db: Session, category_id: int, updated_category: CategoryUpdate):
        db_category = db.query(Category).filter(Category.id == category_id).first()
        if not db_category:
            ResponseHandler.not_found_error("Category", category_id)

        for key, value in updated_category.model_dump().items():
            setattr(db_category, key, value)

        db.commit()
        db.refresh(db_category)
        return ResponseHandler.update_success(db_category.name, db_category.id, db_category)

    @staticmethod
    def delete_category(db: Session, category_id: int):
        db_category = db.query(Category).filter(Category.id == category_id).first()
        if not db_category:
            ResponseHandler.not_found_error("Category", category_id)
        db.delete(db_category)
        db.commit()
        return ResponseHandler.delete_success(db_category.name, db_category.id, db_category)
