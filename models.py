from datetime import date

class Location:
    def __init__(self, name, lat, lon, type, visit_date):
        self.name = name
        self.lat = lat
        self.lon = lon
        self.type = type
        self.visit_date = visit_date
