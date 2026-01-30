from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import SessionLocal
from app.models.models import User
from app.core.security import get_password_hash
from app.core.config import settings
from app.routers import (
    products,
    categories,
    carts,
    users,
    auth,
    accounts,
    events,
    recommendations,
    behavioral_recommendations,
)


description = """
Welcome to the E-commerce API! 🚀

This API provides a comprehensive set of functionalities for managing your e-commerce platform.

Key features include:

- **Crud**
	- Create, Read, Update, and Delete endpoints.
- **Search**
	- Find specific information with parameters and pagination.
- **Auth**
	- Verify user/system identity.
	- Secure with Access and Refresh tokens.
- **Permission**
	- Assign roles with specific permissions.
	- Different access levels for User/Admin.
- **Validation**
	- Ensure accurate and secure input data.


For any inquiries, please contact:

* Github: https://github.com/aliseyedi01
"""


app = FastAPI(
    description=description,
    title="E-commerce API",
    version="1.0.0",
    contact={
        "name": "Ali Seyedi",
        "url": "https://github.com/aliseyedi01",
    },
    swagger_ui_parameters={
        "syntaxHighlight.theme": "monokai",
        "layout": "BaseLayout",
        "filter": True,
        "tryItOutEnabled": True,
        "onComplete": "Ok",
    },
)

# IMPORTANT: Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(products.router)
app.include_router(categories.router)
app.include_router(carts.router)
app.include_router(users.router)
app.include_router(accounts.router)
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(recommendations.router)
app.include_router(behavioral_recommendations.router)


@app.on_event("startup")
def ensure_admin_account() -> None:
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == settings.admin_username).first()
        if not admin:
            hashed_password = get_password_hash(settings.admin_password)
            admin = User(
                username=settings.admin_username,
                email=settings.admin_email,
                full_name=settings.admin_full_name,
                password=hashed_password,
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()
