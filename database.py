import psycopg2
import os

def get_db_connection():
    conn = psycopg2.connect(
        host=os.environ['PGHOST'],
        database=os.environ['PGDATABASE'],
        user=os.environ['PGUSER'],
        password=os.environ['PGPASSWORD'],
        port=os.environ['PGPORT']
    )
    return conn

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS locations (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            lat FLOAT NOT NULL,
            lon FLOAT NOT NULL,
            type TEXT NOT NULL,
            visit_date DATE NOT NULL
        )
    ''')
    
    # Check if visit_date column exists, if not, add it
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='locations' and column_name='visit_date'
    """)
    if cur.fetchone() is None:
        cur.execute("ALTER TABLE locations ADD COLUMN visit_date DATE")
    
    conn.commit()
    cur.close()
    conn.close()
