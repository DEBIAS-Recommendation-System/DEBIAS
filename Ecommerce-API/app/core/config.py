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

    # Qdrant Config
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_api_key: str | None = None
    qdrant_collection_name: str = "embeddings"

    # Neo4j Config
    neo4j_hostname: str = "localhost"
    neo4j_port: int = 7687
    neo4j_user: str = "neo4j"
    neo4j_password: str = "testing_password"

    # RabbitMQ Config
    rabbitmq_hostname: str = "localhost"
    rabbitmq_port: int = 5672
    rabbitmq_user: str = "admin"
    rabbitmq_password: str = "admin123"
    rabbitmq_vhost: str = "/"

    class Config:
        env_file = ".env"


settings = Settings()
