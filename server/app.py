from flask import Flask, render_template, request, redirect, session, flash, jsonify
from dotenv import load_dotenv
from DBConnection import Db
import os
import requests
import csv
from flask import Response
from datetime import datetime

# ==========================
# LOAD ENV VARIABLES
# ==========================
load_dotenv()

# ==========================
# TEMPLATE & STATIC PATH
# ==========================
BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

TEMPLATE_FOLDER = os.path.join(
    os.path.dirname(BASE_DIR),
    "templates"
)

STATIC_FOLDER = os.path.join(
    os.path.dirname(BASE_DIR),
    "static"
)

print("Template Path:", TEMPLATE_FOLDER)
print("Static Path:", STATIC_FOLDER)

app = Flask(
    __name__,
    template_folder=TEMPLATE_FOLDER,
    static_folder=STATIC_FOLDER
)

app.secret_key = os.getenv(
    "SECRET_KEY",
    "secret123"
)

def init_gamification_db():
    db = Db()
    db.insert("""
    CREATE TABLE IF NOT EXISTS user_wallet (
        login_id INTEGER PRIMARY KEY,
        balance INTEGER DEFAULT 0,
        total_earned INTEGER DEFAULT 0,
        total_spent INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        last_login_date TEXT
    )
    """)
    db.insert("""
    CREATE TABLE IF NOT EXISTS wallet_transactions (
        transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
        login_id INTEGER,
        amount INTEGER,
        transaction_type TEXT,
        description TEXT,
        timestamp TEXT
    )
    """)
    db.insert("""
    CREATE TABLE IF NOT EXISTS game_cooldowns (
        login_id INTEGER,
        game_name TEXT,
        last_played TEXT,
        PRIMARY KEY (login_id, game_name)
    )
    """)

init_gamification_db()

# ==========================
# HOME PAGE
# ==========================
@app.route('/')
def home():
    return render_template(
        'index.html'
    )


# ==========================
# ABOUT PAGE
# ==========================
@app.route('/about')
def about():
    return render_template(
        'about.html'
    )

# ==========================
# AI ROUTE PLANNER
# ==========================
@app.route('/ai-route-planner')
def ai_route_planner():
    return render_template(
        'ai_planner.html'
    )


# ==========================
# CONTACT PAGE
# ==========================
@app.route('/contact-us')
def contact_us():
    return render_template(
        'contact_us.html'
    )


# ==========================
# FIND YOUR CHARGER
# ==========================
@app.route('/find-your-charger')
def find_your_charger():

    if 'user_type' not in session:
        return redirect('/login')

    return render_template(
        'user/user_find_your_charger.html'
    )


# ==========================
# USER DASHBOARD
# ==========================
@app.route('/user-dashboard')
def user_dashboard():

    if 'user_type' not in session:
        return redirect('/login')

    db = Db()

    username = session.get('username')
    user_id = session.get('uid')

    # Total Stations
    total_stations = db.select(
        "SELECT * FROM charging_station_list"
    )

    # User Bookings
    my_bookings = db.select(
        f"""
        SELECT *
        FROM booking
        WHERE user_id='{user_id}'
        ORDER BY booking_id DESC
        """
    )

    total_bookings = len(my_bookings)

    recent_booking = (
        my_bookings[0]
        if total_bookings > 0
        else None
    )

    # Fetch Wallet Balance
    wallet = db.selectOne(f"SELECT * FROM user_wallet WHERE login_id={user_id}")
    wallet_balance = wallet['balance'] if wallet else 0

    return render_template(
        'user/user_dashboard.html',
        username=username,
        total_stations=len(total_stations),
        total_bookings=total_bookings,
        recent_booking=recent_booking,
        wallet_balance=wallet_balance
    )




# ==========================
# LOGIN
# ==========================
@app.route('/login', methods=['GET', 'POST'])
def login():

    if request.method == "POST":

        username = request.form.get(
            'username'
        )

        password = request.form.get(
            'password'
        )

        db = Db()

        query = """
        SELECT *
        FROM login
        WHERE username=%s
        """

        user = db.selectOne(
            query,
            (username,)
        )

        if user:

            if user['password'] == password:

                session['username'] = username
                session['user_type'] = user['usertype']
                session['uid'] = user['login_id']

                # ADMIN LOGIN
                if user['usertype'] == 'admin':
                    return redirect(
                        '/admin-dashboard'
                    )

                # USER LOGIN
                elif user['usertype'] == 'user':
                    return redirect(
                        '/user-dashboard'
                    )

        flash(
            "Invalid username or password",
            "danger"
        )

        return redirect('/login')

    return render_template(
        'login.html'
    )


# ==========================
# REGISTER
# ==========================
@app.route('/register', methods=['GET', 'POST'])
def register():

    if request.method == "POST":

        username = request.form.get(
            'username'
        )

        password = request.form.get(
            'password'
        )

        confirm_password = request.form.get(
            'confirm_password'
        )

        db = Db()

        # CHECK EMPTY FIELDS
        if not username or not password:

            flash(
                "Please fill all fields",
                "danger"
            )

            return redirect(
                '/register'
            )

        # PASSWORD CHECK
        if password != confirm_password:

            flash(
                "Passwords do not match",
                "danger"
            )

            return redirect(
                '/register'
            )

        # CHECK EXISTING USER
        existing_user = db.selectOne(
            """
            SELECT *
            FROM login
            WHERE username=%s
            """,
            (username,)
        )

        if existing_user:

            flash(
                "Username already exists",
                "warning"
            )

            return redirect(
                '/register'
            )

        # INSERT USER
        db.insert(
            """
            INSERT INTO login
            (
                username,
                password,
                usertype
            )
            VALUES
            (
                %s,
                %s,
                'user'
            )
            """,
            (
                username,
                password
            )
        )

        flash(
            "Registration successful!",
            "success"
        )

        return redirect(
            '/login'
        )

    return render_template(
        'register.html'
    )


# ==========================
# ADMIN DASHBOARD
# ==========================
@app.route('/admin-dashboard')
def admin_dashboard():

    if 'user_type' not in session:
        return redirect('/login')

    db = Db()

    # TOTAL USERS
    users = db.select(
        "SELECT * FROM login WHERE usertype='user'"
    )

    # TOTAL STATIONS
    stations = db.select(
        "SELECT * FROM charging_station_list"
    )

    # TOTAL BOOKINGS
    bookings = db.select(
        """
        SELECT *
        FROM booking
        ORDER BY booking_id DESC
        """
    )

    total_users = len(users)
    total_stations = len(stations)
    total_bookings = len(bookings)

    # DEMO REVENUE
    revenue = total_bookings * 199

    recent_bookings = bookings[:5]
    latest_users = users[-5:]

    return render_template(
        'admin/admin_dashboard.html',

        total_users=total_users,
        total_stations=total_stations,
        total_bookings=total_bookings,
        revenue=revenue,

        recent_bookings=recent_bookings,
        latest_users=latest_users
    )


# ==========================
# LOGOUT
# ==========================
@app.route('/logout')
def logout():

    session.clear()

    flash(
        "Logged out successfully",
        "success"
    )

    return redirect('/')

# ==========================
# SEARCH STATIONS
# ==========================
@app.route('/search-stations', methods=['POST'])
def search_stations():

    city = request.form.get('City')
    charger_type = request.form.get(
        'Charger_type'
    )

    stations = []

    # -----------------------
    # LIVE API (OpenChargeMap)
    # -----------------------

    try:

        api_url = (
            "https://api.openchargemap.io/v3/poi/"
        )

        params = {
            "output": "json",
            "countrycode": "IN",
            "maxresults": 15,
            "compact": True,
            "verbose": False,
            "location": city
        }

        headers = {
            "X-API-Key":
            "ocm-demo-key"
        }

        response = requests.get(
            api_url,
            params=params,
            headers=headers,
            timeout=8
        )

        if response.status_code == 200:

            api_data = response.json()

            for item in api_data:

                address = item.get(
                    "AddressInfo", {}
                )

                connections = item.get(
                    "Connections", []
                )

                station = {

                    "station_id":
                    item.get("ID"),

                    "station_name":
                    address.get(
                        "Title",
                        "EV Station"
                    ),

                    "city":
                    city,

                    "location":
                    address.get(
                        "AddressLine1",
                        "Unknown Location"
                    ),

                    "charger_type":
                    charger_type,

                    "available_slots":
                    len(connections),

                    "status":
                    "Live Available"
                }

                stations.append(station)

    except Exception as e:

        print("API Error:", e)

    # -----------------------
    # FALLBACK DATABASE
    # -----------------------

    if len(stations) == 0:

        db = Db()

        query = f"""
        SELECT *
        FROM charging_station_list
        WHERE city='{city}'
        AND charger_type=
        '{charger_type}'
        LIMIT 20
        """

        stations = db.select(query)

    return render_template(
        'user/station_search.html',
        stations=stations,
        city=city,
        charger_type=charger_type
    )
# ==========================
# BOOK SLOT PAGE
# ==========================
@app.route('/book-slot/<int:station_id>')
def book_slot(station_id):

    if 'user_type' not in session:
        return redirect('/login')

    db = Db()

    query = f"""
    SELECT *
    FROM charging_station_list
    WHERE station_id={station_id}
    """

    station = db.selectOne(query)

    user_id = session.get('uid')
    wallet = db.selectOne(f"SELECT * FROM user_wallet WHERE login_id={user_id}")
    wallet_balance = wallet['balance'] if wallet else 0

    return render_template(
        'user/book_slot.html',
        station=station,
        wallet_balance=wallet_balance
    )
# ==========================
# SAVE BOOKING
# ==========================
@app.route('/save-booking', methods=['POST'])
def save_booking():

    if 'user_type' not in session:
        return redirect('/login')

    user_id = session.get('uid')

    station_name = request.form.get(
        'station_name'
    )

    city = request.form.get(
        'city'
    )

    charger_type = request.form.get(
        'charger_type'
    )

    booking_date = request.form.get(
        'booking_date'
    )

    booking_time = request.form.get(
        'booking_time'
    )

    db = Db()

    query = f"""
    INSERT INTO booking
    (
        user_id,
        station_name,
        city,
        charger_type,
        booking_date,
        booking_time
    )
    VALUES
    (
        '{user_id}',
        '{station_name}',
        '{city}',
        '{charger_type}',
        '{booking_date}',
        '{booking_time}'
    )
    """

    booking_id = db.insert(query)

    use_coins = request.form.get('use_coins')
    discount_applied = 0
    if use_coins:
        wallet = db.selectOne(f"SELECT * FROM user_wallet WHERE login_id={user_id}")
        if wallet and wallet['balance'] > 0:
            discount_applied = min(50, wallet['balance'])
            new_balance = wallet['balance'] - discount_applied
            db.update(f"UPDATE user_wallet SET balance={new_balance}, total_spent=total_spent+{discount_applied} WHERE login_id={user_id}")
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            db.insert(f"INSERT INTO wallet_transactions (login_id, amount, transaction_type, description, timestamp) VALUES ({user_id}, {discount_applied}, 'Spent', 'Used for booking at {station_name}', '{timestamp}')")

    # Reward for booking
    reward_coins = 20
    wallet = db.selectOne(f"SELECT * FROM user_wallet WHERE login_id={user_id}")
    if not wallet:
        db.insert(f"INSERT INTO user_wallet (login_id, balance, total_earned) VALUES ({user_id}, {reward_coins}, {reward_coins})")
    else:
        db.update(f"UPDATE user_wallet SET balance=balance+{reward_coins}, total_earned=total_earned+{reward_coins} WHERE login_id={user_id}")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.insert(f"INSERT INTO wallet_transactions (login_id, amount, transaction_type, description, timestamp) VALUES ({user_id}, {reward_coins}, 'Earned', 'Completed booking at {station_name}', '{timestamp}')")

    # -------------------------
    # GOOGLE MAPS VARIABLES
    # -------------------------

    station_query = (
        f"{station_name}, {city}, India"
    )

    google_api_key = os.getenv(
        "GOOGLE_MAPS_API_KEY"
    )

    return render_template(
        'user/booking_success.html',

        booking_id=booking_id,
        station_name=station_name,
        city=city,
        charger_type=charger_type,
        booking_date=booking_date,
        booking_time=booking_time,

        # NEW VARIABLES
        station_query=station_query,
        google_api_key=google_api_key,
        discount_applied=discount_applied,
        reward_coins=reward_coins
    )
# ==========================
# MANAGE USERS
# ==========================
@app.route('/manage-users')
def manage_users():

    if 'user_type' not in session:
        return redirect('/login')

    db = Db()

    users = db.select("""
    SELECT *
    FROM login
    WHERE usertype='user'
    """)

    return render_template(
        'admin/manage_users.html',
        users=users
    )


# ==========================
# ADD STATION PAGE
# ==========================
@app.route('/add-station')
def add_station():

    if 'user_type' not in session:
        return redirect('/login')

    return render_template(
        'admin/add_station.html'
    )


# ==========================
# SAVE STATION
# ==========================
@app.route('/save-station',
methods=['POST'])
def save_station():

    db = Db()

    station_name = request.form['station_name']
    city = request.form['city']
    charger_type = request.form['charger_type']
    location = request.form['location']
    available_slots = request.form['available_slots']

    query = f"""
    INSERT INTO charging_station_list
    (
        station_name,
        city,
        charger_type,
        location,
        available_slots,
        status
    )
    VALUES
    (
        '{station_name}',
        '{city}',
        '{charger_type}',
        '{location}',
        '{available_slots}',
        'Available'
    )
    """

    db.insert(query)

    return redirect('/admin-dashboard')


# ==========================
# EXPORT REPORT CSV
# ==========================
@app.route('/export-report')
def export_report():

    if 'user_type' not in session:
        return redirect('/login')

    db = Db()

    bookings = db.select("""
    SELECT *
    FROM booking
    ORDER BY booking_id DESC
    """)

    def generate():

        data = []

        header = [
            'Booking ID',
            'Station Name',
            'City',
            'Charger Type',
            'Booking Date',
            'Booking Time'
        ]

        data.append(header)

        for booking in bookings:

            row = [
                booking['booking_id'],
                booking['station_name'],
                booking['city'],
                booking['charger_type'],
                str(booking['booking_date']),
                booking['booking_time']
            ]

            data.append(row)

        for row in data:
            yield ','.join(map(str, row)) + '\n'

    return Response(
        generate(),
        mimetype='text/csv',
        headers={
            'Content-Disposition':
            'attachment; filename=evease_report.csv'
        }
    )

# ==========================
# VIEW LIVE STATIONS
# ==========================
@app.route('/view-live-stations')
def view_live_stations():

    return redirect('/find-your-charger')
# ==========================
# LIVE NEARBY CHARGERS
# ==========================
@app.route('/nearby-live-chargers')
def nearby_live_chargers():

    lat = request.args.get('lat')
    lng = request.args.get('lng')

    if not lat or not lng:
        return "Location not found"

    api_key = os.getenv(
        "OPENCHARGEMAP_API_KEY"
    )

    url = (
        "https://api.openchargemap.io/v3/poi/"
    )

    params = {
        "output": "json",
        "countrycode": "IN",
        "latitude": lat,
        "longitude": lng,
        "distance": 100,
        "distanceunit": "KM",
        "maxresults": 25,
        "compact": False,
        "verbose": True,
        "key": api_key
    }

    stations = []

    try:

        response = requests.get(
            url,
            params=params,
            timeout=10
        )

        print(
            "STATUS:",
            response.status_code
        )

        data = response.json()

        print(
            "TOTAL FOUND:",
            len(data)
        )

        # =====================
        # REAL API DATA
        # =====================

        for item in data:

            address = item.get(
                "AddressInfo", {}
            )

            station = {

                "station_name":
                address.get(
                    "Title",
                    "EV Charging Station"
                ),

                "location":
                address.get(
                    "AddressLine1",
                    "Unknown Address"
                ),

                "distance":
                round(
                    address.get(
                        "Distance", 0
                    ),
                    2
                ),

                "lat":
                address.get(
                    "Latitude", 0
                ),

                "lng":
                address.get(
                    "Longitude", 0
                )
            }

            stations.append(
                station
            )

        # =====================
        # FALLBACK DATA
        # =====================

        if len(stations) == 0:

            stations = [

                {
                    "station_name":
                    "Tata Power EV Station",

                    "location":
                    "Connaught Place, Delhi",

                    "distance":
                    2.4,

                    "lat":
                    28.6315,

                    "lng":
                    77.2167
                },

                {
                    "station_name":
                    "ChargeZone Hub",

                    "location":
                    "Noida Sector 18",

                    "distance":
                    4.8,

                    "lat":
                    28.5708,

                    "lng":
                    77.3260
                },

                {
                    "station_name":
                    "Statiq Fast Charger",

                    "location":
                    "India Gate, Delhi",

                    "distance":
                    5.6,

                    "lat":
                    28.6129,

                    "lng":
                    77.2295
                }

            ]

    except Exception as e:

        print(
            "API ERROR:",
            e
        )

        # BACKUP FOR DEMO
        stations = [

            {
                "station_name":
                "Tata EV Charging Station",

                "location":
                "Central Delhi",

                "distance":
                3.2,

                "lat":
                28.6139,

                "lng":
                77.2090
            }

        ]

    return render_template(
        'user/live_chargers.html',
        stations=stations
    )
#==========================
# GAMIFICATION ROUTES
#==========================
@app.route('/rewards-dashboard')
def rewards_dashboard():
    if 'user_type' not in session:
        return redirect('/login')
    user_id = session.get('uid')
    db = Db()
    wallet = db.selectOne(f"SELECT * FROM user_wallet WHERE login_id={user_id}")
    if not wallet:
        db.insert(f"INSERT INTO user_wallet (login_id) VALUES ({user_id})")
        wallet = db.selectOne(f"SELECT * FROM user_wallet WHERE login_id={user_id}")
    transactions = db.select(f"SELECT * FROM wallet_transactions WHERE login_id={user_id} ORDER BY transaction_id DESC LIMIT 10")
    return render_template('user/rewards_dashboard.html', wallet=wallet, transactions=transactions)

@app.route('/play-game/<game_name>')
def play_game(game_name):
    if 'user_type' not in session:
        return redirect('/login')
    return render_template('user/mini_games.html', game_name=game_name)

@app.route('/api/earn-coins', methods=['POST'])
def earn_coins():
    if 'user_type' not in session:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    user_id = session.get('uid')
    data = request.json
    game_name = data.get('game_name')
    coins = data.get('coins', 10)
    
    db = Db()
    cooldown = db.selectOne(f"SELECT * FROM game_cooldowns WHERE login_id={user_id} AND game_name='{game_name}'")
    today = datetime.now().strftime('%Y-%m-%d')
    
    if cooldown and cooldown['last_played'] == today:
        return jsonify({'status': 'error', 'message': 'You have already played this game today!'})
        
    if cooldown:
        db.update(f"UPDATE game_cooldowns SET last_played='{today}' WHERE login_id={user_id} AND game_name='{game_name}'")
    else:
        db.insert(f"INSERT INTO game_cooldowns (login_id, game_name, last_played) VALUES ({user_id}, '{game_name}', '{today}')")
        
    db.update(f"UPDATE user_wallet SET balance=balance+{coins}, total_earned=total_earned+{coins} WHERE login_id={user_id}")
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    db.insert(f"INSERT INTO wallet_transactions (login_id, amount, transaction_type, description, timestamp) VALUES ({user_id}, {coins}, 'Earned', 'Won from {game_name}', '{timestamp}')")
    
    return jsonify({'status': 'success', 'message': f'Earned {coins} EVE Coins!'})

@app.route('/api/daily-login', methods=['POST'])
def daily_login():
    if 'user_type' not in session:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    user_id = session.get('uid')
    db = Db()
    wallet = db.selectOne(f"SELECT * FROM user_wallet WHERE login_id={user_id}")
    if not wallet:
        db.insert(f"INSERT INTO user_wallet (login_id) VALUES ({user_id})")
        wallet = db.selectOne(f"SELECT * FROM user_wallet WHERE login_id={user_id}")
        
    today = datetime.now().strftime('%Y-%m-%d')
    if wallet['last_login_date'] == today:
        return jsonify({'status': 'error', 'message': 'Already claimed today!'})
        
    coins = 5
    db.update(f"UPDATE user_wallet SET balance=balance+{coins}, total_earned=total_earned+{coins}, last_login_date='{today}' WHERE login_id={user_id}")
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    db.insert(f"INSERT INTO wallet_transactions (login_id, amount, transaction_type, description, timestamp) VALUES ({user_id}, {coins}, 'Earned', 'Daily Login Bonus', '{timestamp}')")
    
    return jsonify({'status': 'success', 'message': f'Claimed {coins} Daily Login EVE Coins!'})

#================
# RUN APP
# ==========================
if __name__ == "__main__":

    app.run(
        debug=True
    )