from flask import Flask, render_template, request, jsonify
from google import genai

GOOGLE_API_KEY = ""

client = genai.Client(api_key=GOOGLE_API_KEY)

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat_response():
    try:
        data = request.get_json(force=True)
        user_input = data.get("message")

        print("User:", user_input)

        if not user_input:
            return jsonify({"response": "Empty message"}), 200

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_input
        )

        print("Bot:", response.text)

        return jsonify({
            "response": response.text
        })

    except Exception as e:
        print("SERVER ERROR:", e)
        return jsonify({
            "response": "Backend error occurred"
        }), 200


if __name__ == "__main__":
    app.run(debug=True)
