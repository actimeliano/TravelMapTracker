from flask import Flask, render_template, jsonify, request, send_from_directory
from database import init_db, get_db_connection
from models import Location
import os
from datetime import datetime
import traceback

app = Flask(__name__)

# Initialize database
init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/locations', methods=['GET'])
def get_locations():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        SELECT id, name, lat, lon, type, 
               COALESCE(visit_date, CURRENT_DATE) as visit_date 
        FROM locations
    ''')
    locations = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([{
        'id': loc[0], 
        'name': loc[1], 
        'lat': loc[2], 
        'lon': loc[3], 
        'type': loc[4], 
        'visitDate': loc[5].isoformat()
    } for loc in locations])

@app.route('/api/locations', methods=['POST'])
def add_location():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400

        required_fields = ['name', 'lat', 'lon', 'type', 'visitDate']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        location_type = categorize_location_type(data['type'])
        try:
            visit_date = datetime.strptime(data['visitDate'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

        location = Location(name=data['name'], lat=data['lat'], lon=data['lon'], type=location_type, visit_date=visit_date)
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('INSERT INTO locations (name, lat, lon, type, visit_date) VALUES (%s, %s, %s, %s, %s) RETURNING id',
                    (location.name, location.lat, location.lon, location.type, location.visit_date))
        location_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'id': location_id, 'name': location.name, 'lat': location.lat, 'lon': location.lon, 'type': location.type, 'visitDate': location.visit_date.isoformat()}), 201
    except Exception as e:
        print(f"Error in add_location: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/locations/<int:location_id>', methods=['DELETE'])
def delete_location(location_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM locations WHERE id = %s', (location_id,))
    conn.commit()
    cur.close()
    conn.close()
    return '', 204

@app.route('/static/data/<path:filename>')
def serve_static(filename):
    return send_from_directory(os.path.join(app.root_path, 'static', 'data'), filename)

def categorize_location_type(type_from_api):
    type_lower = type_from_api.lower()
    if 'city' in type_lower or 'town' in type_lower or 'village' in type_lower:
        return 'city'
    elif 'state' in type_lower or 'province' in type_lower or 'region' in type_lower:
        return 'region'
    elif 'country' in type_lower or 'nation' in type_lower:
        return 'country'
    else:
        return 'unknown'

if __name__ == '__main__':
    init_db()  # Make sure the database is initialized with the latest schema
    app.run(host='0.0.0.0', port=5000, debug=True)
