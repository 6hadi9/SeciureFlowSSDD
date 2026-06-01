from flask import jsonify


def ok(data, status=200):
    return jsonify(data), status


def fail(message, status=400):
    return jsonify({"error": message}), status
