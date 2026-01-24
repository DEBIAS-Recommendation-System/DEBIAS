from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database Config
    db_username: str
    db_password: str
    db_hostname: str
    db_port: str
    db_name: str

    # JWT Config
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int

    # Bootstrap Admin Config
    admin_username: str = "admin"
    admin_password: str = "admin"
    admin_email: str = "admin@example.com"
    admin_full_name: str = "Admin User"

    class Config:
        env_file = ".env"


settings = Settings()
