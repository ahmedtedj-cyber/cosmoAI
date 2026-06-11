# ─────────────────────────────────────────
#  database.py  —  SQLite + SQLAlchemy ORM
# ─────────────────────────────────────────
from sqlalchemy import (
    create_engine, Column, Integer, String,
    Float, Text, DateTime, ForeignKey, JSON, Boolean
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "sqlite:///./cosmoai.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ══════════════════════════════════════════
#  MODELS
# ══════════════════════════════════════════

class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    email      = Column(String, unique=True, index=True, nullable=False)
    username   = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    products  = relationship("Product",  back_populates="owner", cascade="all, delete")
    analyses  = relationship("Analysis", back_populates="owner", cascade="all, delete")


class Product(Base):
    __tablename__ = "products"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    brand       = Column(String, nullable=False)
    category    = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    owner_id    = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner    = relationship("User",     back_populates="products")
    analyses = relationship("Analysis", back_populates="product", cascade="all, delete")


class Analysis(Base):
    __tablename__ = "analyses"

    id             = Column(Integer, primary_key=True, index=True)
    product_id     = Column(Integer, ForeignKey("products.id"), nullable=False)
    owner_id       = Column(Integer, ForeignKey("users.id"),    nullable=False)
    reviews_count  = Column(Integer, default=0)
    summary        = Column(Text,    nullable=True)
    aspects        = Column(JSON,    default=list)
    recommendations= Column(JSON,    default=list)
    confidence     = Column(String,  default="moyenne")
    health_score   = Column(Float,   default=0.0)
    warnings       = Column(JSON,    default=list)
    raw_reviews    = Column(JSON,    default=list)
    source_file    = Column(String,  nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="analyses")
    owner   = relationship("User",    back_populates="analyses")


# ── Dependency ───────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
