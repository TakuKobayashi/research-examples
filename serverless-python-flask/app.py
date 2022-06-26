from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/", methods=["GET"])
def hello():
  return jsonify({"hello": "world"})

if __name__ == '__main__':
  app.debug = True
  app.run(port=3002)