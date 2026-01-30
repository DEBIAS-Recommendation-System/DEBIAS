from fastapi import APIRouter, Depends, Query, status
from app.db.database import get_db
from app.services.products import ProductService
from sqlalchemy.orm import Session
from app.schemas.products import ProductCreate, ProductOut, ProductsOut, ProductOutDelete, ProductUpdate
from app.core.security import get_current_user, check_admin_role

router = APIRouter(tags=["Products"], prefix="/products")


# Get Price Range (min and max prices)
@router.get("/price-range", status_code=status.HTTP_200_OK)
def get_price_range(db: Session = Depends(get_db)):
    return ProductService.get_price_range(db)


# Get All Products
@router.get("/", status_code=status.HTTP_200_OK, response_model=ProductsOut)
def get_all_products(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    search: str | None = Query("", description="Search based title of products"),
    category: str | None = Query(None, description="Filter by category (comma-separated for multiple: Apparel,Electronics)"),
    minPrice: float | None = Query(None, description="Minimum price filter"),
    maxPrice: float | None = Query(None, description="Maximum price filter"),
    sort_by: str | None = Query(None, description="Sort by field (price, title, product_id)"),
    order: str = Query("asc", description="Sort order (asc or desc)"),
):
    return ProductService.get_all_products(db, page, limit, search, category, minPrice, maxPrice, sort_by, order)


# Get Product By ID
@router.get("/{product_id}", status_code=status.HTTP_200_OK, response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return ProductService.get_product(db, product_id)


# Create New Product
@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ProductOut,
    dependencies=[Depends(check_admin_role)])
def create_product(
        product: ProductCreate,
        db: Session = Depends(get_db)):
    return ProductService.create_product(db, product)


# Update Exist Product
@router.put(
    "/{product_id}",
    status_code=status.HTTP_200_OK,
    response_model=ProductOut,
    dependencies=[Depends(check_admin_role)])
def update_product(
        product_id: int,
        updated_product: ProductUpdate,
        db: Session = Depends(get_db)):
    return ProductService.update_product(db, product_id, updated_product)


# Delete Product By ID
@router.delete(
    "/{product_id}",
    status_code=status.HTTP_200_OK,
    response_model=ProductOutDelete,
    dependencies=[Depends(check_admin_role)])
def delete_product(
        product_id: int,
        db: Session = Depends(get_db)):
    return ProductService.delete_product(db, product_id)
