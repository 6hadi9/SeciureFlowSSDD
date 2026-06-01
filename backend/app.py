from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO, join_room
from config import Config
from extensions import init_sqlite
from routes import register_routes


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    init_sqlite(app)
    register_routes(app)

    return app


app = create_app()
socketio = SocketIO(
    app,
    cors_allowed_origins=app.config["CORS_ORIGINS"],
    async_mode=app.config["SOCKETIO_ASYNC_MODE"],
)


@socketio.on("join")
def handle_join(data):
    # Room-based collaboration hook.
    room = data.get("room")
    if room:
        join_room(room)


@socketio.on("update")
def handle_update(data):
    room = data.get("room")
    if room:
        socketio.emit("update", data, to=room)


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
