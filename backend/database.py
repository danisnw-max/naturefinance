from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.engine import Engine
from sqlalchemy import event

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# check_same_thread is needed only for SQLite because FastAPI could access it from multiple threads
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

def get_quarter_dates(year: int, quarter: int = None):
    if quarter is not None:
        if quarter == 1:
            return f"{year}-01-01", f"{year}-03-31"
        elif quarter == 2:
            return f"{year}-04-01", f"{year}-06-30"
        elif quarter == 3:
            return f"{year}-07-01", f"{year}-09-30"
        elif quarter == 4:
            return f"{year}-10-01", f"{year}-12-31"
    return f"{year}-01-01", f"{year}-12-31"

