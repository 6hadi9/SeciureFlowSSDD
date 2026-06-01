from routes.auth import bp as auth_bp
from routes.projects import bp as projects_bp
from routes.analyze import bp as analyze_bp
from routes.templates import bp as templates_bp
from routes.insights import bp as insights_bp


def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(analyze_bp)
    app.register_blueprint(templates_bp)
    app.register_blueprint(insights_bp)
