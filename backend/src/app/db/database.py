from sqlalchemy.ext.asyncio import {
    async_sessionmaker,
    AsyncSession,
    create_async_engine,
}
from app.core.config import settings


engine = create_async_engine(
    settings.database_url,
    echo=True,
)


AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session