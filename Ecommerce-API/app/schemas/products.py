from pydantic import BaseModel
from typing import List, Optional


# Base Models
class BaseConfig:
    from_attributes = True


class ProductBase(BaseModel):
    product_id: int
    title: str
    brand: str
    category: str
    price: float
    imgUrl: str

    class Config(BaseConfig):
        pass


# Create Product
class ProductCreate(ProductBase):
    class Config(BaseConfig):
        pass


# Update Product
class ProductUpdate(BaseModel):
    title: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    imgUrl: Optional[str] = None

    class Config(BaseConfig):
        pass


# Get Products
class ProductOut(BaseModel):
    message: str
    data: ProductBase

    class Config(BaseConfig):
        pass


class ProductsOut(BaseModel):
    message: str
    data: List[ProductBase]

    class Config(BaseConfig):
        pass


# Delete Product
class ProductDelete(ProductBase):
    pass


class ProductOutDelete(BaseModel):
    message: str
    data: ProductDelete
