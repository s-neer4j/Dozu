from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import json, os, threading

app = Flask(__name__)
CORS(app)

DATA_PATH = os.path.join(os.path.dirname(__file__), "data.json")
_lock = threading.Lock()

# ---------- Persistence ----------
def ensure_data_file():
    if not os.path.exists(DATA_PATH):
        initial = {
            "boards": [
                {
                    "id": 1,
                    "name": "Dozu Demo Board",
                    "lists": [
                        {"id": 1, "name": "Backlog", "cards": [
                            {"id": 101, "title": "First task", "labels": ["Demo"], "due_date": "2025-08-18", "description": "Sample description"}
                        ]},
                        {"id": 2, "name": "Doing", "cards": []},
                        {"id": 3, "name": "Done", "cards": []},
                        {"id": 4, "name": "Urgent", "cards": []}
                    ]
                }
            ]
        }
        with open(DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(initial, f, indent=2)

def read_data():
    ensure_data_file()
    with _lock:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

def write_data(data):
    with _lock:
        with open(DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

def get_board(data, board_id):
    for b in data["boards"]:
        if b["id"] == board_id:
            return b
    return None

def next_board_id(data):
    ids = [b["id"] for b in data["boards"]]
    return (max(ids) + 1) if ids else 1

def next_card_id(data):
    ids = []
    for b in data["boards"]:
        for lst in b["lists"]:
            for c in lst["cards"]:
                ids.append(c["id"])
    return (max(ids) + 1) if ids else 101

# ---------- Automation: Overdue -> Urgent ----------
def apply_automation(board):
    # Find/create Urgent list
    urgent = None
    for lst in board["lists"]:
        if lst["name"].lower() == "urgent":
            urgent = lst
            break
    if urgent is None:
        urgent = {"id": max([l["id"] for l in board["lists"]]+[0])+1, "name": "Urgent", "cards": []}
        board["lists"].append(urgent)

    today = datetime.now().strftime("%Y-%m-%d")

    moved = []
    for lst in board["lists"]:
        if lst["id"] == urgent["id"]:
            continue
        keep = []
        for c in lst["cards"]:
            due = c.get("due_date")
            if due and due < today:
                moved.append(c)
            else:
                keep.append(c)
        lst["cards"] = keep
    urgent["cards"].extend(moved)

# ---------- Routes: Boards ----------
@app.route("/api/boards", methods=["GET"])
def list_boards():
    data = read_data()
    return jsonify([{"id": b["id"], "name": b["name"]} for b in data["boards"]])

@app.route("/api/boards", methods=["POST"])
def create_board():
    payload = request.json or {}
    name = payload.get("name", "New Board")
    data = read_data()
    new_id = next_board_id(data)
    board = {
        "id": new_id,
        "name": name,
        "lists": [
            {"id": 1, "name": "Backlog", "cards": []},
            {"id": 2, "name": "Doing", "cards": []},
            {"id": 3, "name": "Done", "cards": []},
            {"id": 4, "name": "Urgent", "cards": []}
        ]
    }
    data["boards"].append(board)
    write_data(data)
    return jsonify({"id": new_id, "name": name}), 201

@app.route("/api/boards/<int:board_id>", methods=["GET"])
def get_board_route(board_id):
    data = read_data()
    board = get_board(data, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404
    # Automation on read
    apply_automation(board)
    write_data(data)
    return jsonify(board)

# ---------- Routes: Cards (CRUD + Move) ----------
@app.route("/api/boards/<int:board_id>/card", methods=["POST"])
def add_card(board_id):
    data = read_data()
    board = get_board(data, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404

    payload = request.json or {}
    list_id = payload.get("list_id")
    title = payload.get("title")
    due_date = payload.get("due_date")  # "YYYY-MM-DD" or None
    labels = payload.get("labels", [])  # list[str]
    description = payload.get("description", "")

    if not list_id or not title:
        return jsonify({"error": "list_id and title are required"}), 400

    new_card = {
        "id": next_card_id(data),
        "title": title,
        "labels": labels,
        "due_date": due_date,
        "description": description
    }

    for lst in board["lists"]:
        if lst["id"] == int(list_id):
            lst["cards"].append(new_card)
            write_data(data)
            return jsonify(new_card), 201

    return jsonify({"error": "List not found"}), 404

@app.route("/api/boards/<int:board_id>/card/<int:card_id>", methods=["PATCH"])
def update_card(board_id, card_id):
    data = read_data()
    board = get_board(data, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404

    payload = request.json or {}
    updated = None

    for lst in board["lists"]:
        for c in lst["cards"]:
            if c["id"] == card_id:
                if "title" in payload: c["title"] = payload["title"]
                if "due_date" in payload: c["due_date"] = payload["due_date"]
                if "labels" in payload: c["labels"] = payload["labels"]
                if "description" in payload: c["description"] = payload["description"]
                updated = c
                break

    if not updated:
        return jsonify({"error": "Card not found"}), 404

    write_data(data)
    return jsonify(updated)

@app.route("/api/boards/<int:board_id>/card/<int:card_id>", methods=["DELETE"])
def delete_card(board_id, card_id):
    data = read_data()
    board = get_board(data, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404

    for lst in board["lists"]:
        new_cards = [c for c in lst["cards"] if c["id"] != card_id]
        if len(new_cards) != len(lst["cards"]):
            lst["cards"] = new_cards
            write_data(data)
            return jsonify({"success": True})

    return jsonify({"error": "Card not found"}), 404

@app.route("/api/boards/<int:board_id>/move_card", methods=["POST"])
def move_card(board_id):
    data = read_data()
    board = get_board(data, board_id)
    if not board:
        return jsonify({"error": "Board not found"}), 404

    payload = request.json or {}
    card_id = int(payload.get("card_id"))
    from_list = int(payload.get("from_list"))
    to_list = int(payload.get("to_list"))

    card = None
    for lst in board["lists"]:
        if lst["id"] == from_list:
            for c in lst["cards"]:
                if c["id"] == card_id:
                    card = c
                    lst["cards"].remove(c)
                    break

    if not card:
        return jsonify({"error": "Card not found"}), 404

    for lst in board["lists"]:
        if lst["id"] == to_list:
            lst["cards"].append(card)
            write_data(data)
            return jsonify({"success": True})

    return jsonify({"error": "Destination list not found"}), 404

# ---------- Root ----------
@app.route("/", methods=["GET"])
def home():
    return "Dozu Backend is Running 🚀"

if __name__ == "__main__":
    ensure_data_file()
    app.run(debug=True)
