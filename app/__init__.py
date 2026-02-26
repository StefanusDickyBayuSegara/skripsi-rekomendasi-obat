from flask import Flask
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='../static')  # ← ubah di sini saja
app.config.from_object(Config)

CORS(app)

db = SQLAlchemy(app)
migrate = Migrate(app, db)

from app.model import user
from app import routes