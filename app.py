import os
import requests
from flask import Flask, request, jsonify, render_template
import config
import json
import re
import time
import random

app = Flask(__name__)

# set OpenRouter API Key
API_KEY = config.API_KEY
BASE_URL = "https://openrouter.ai/api/v1"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/generate_problem')
def generate_problem():
    operation = request.args.get('operation', 'addition')
    problem_type = request.args.get('type', 'word')  # 'word' or 'simple'
    
    # For simple arithmetic problems
    if problem_type == 'simple':
        return generate_simple_problem(operation)
    
    # For word problems (existing functionality)
    #  prompt 
    if operation == 'addition':
        prompt = "Générez un problème de mathématiques unique pour l'addition au format JSON, sans texte supplémentaire ni sauts de ligne. Le problème doit être basé sur une situation réelle, comme des fruits, des objets ou des personnes. Format : {\"problem\":\"texte\", \"answer\":?} (answer doit être un nombre). Exemple : {\"problem\":\"Alice a 3 pommes. Bob lui en donne 2 de plus. Combien de pommes Alice a-t-elle maintenant ?\", \"answer\":5}. Ne répétez pas les problèmes déjà vus."
    elif operation == 'soustraction':
        prompt = "Générez un problème de mathématiques unique pour la soustraction au format JSON, sans texte supplémentaire ni sauts de ligne. Le problème doit être basé sur une situation réelle, comme des fruits, des objets ou des personnes. Format : {\"problem\":\"texte\", \"answer\":?} (answer doit être un nombre). Exemple : {\"problem\":\"Jean a 7 oranges. Il en donne 2 à son ami. Combien d'oranges reste-t-il à Jean ?\", \"answer\":5}. Ne répétez pas les problèmes déjà vus."
    elif operation == 'multiplication':
        prompt = "Générez un problème de mathématiques unique pour la multiplication au format JSON, sans texte supplémentaire ni sauts de ligne. Le problème doit être basé sur une situation réelle, comme des fruits, des objets ou des personnes. Format : {\"problem\":\"texte\", \"answer\":?} (answer doit être un nombre). Exemple : {\"problem\":\"Emma a 4 paquets d'autocollants. Chaque paquet contient 3 autocollants. Combien d'autocollants Emma a-t-elle en tout ?\", \"answer\":12}. Ne répétez pas les problèmes déjà vus."
    else:
        prompt = "Générez un problème de mathématiques unique pour l'addition au format JSON, sans texte supplémentaire ni sauts de ligne. Le problème doit être basé sur une situation réelle, comme des fruits, des objets ou des personnes. Format : {\"problem\":\"texte\", \"answer\":?} (answer doit être un nombre). Exemple : {\"problem\":\"Alice a 3 pommes. Bob lui en donne 2 de plus. Combien de pommes Alice a-t-elle maintenant ?\", \"answer\":5}. Ne répétez pas les problèmes déjà vus."

    headers = {
        "Authorization": f"Bearer {API_KEY}", 
        "Content-Type": "application/json"
    }
    payload = {
        "model": "deepseek/deepseek-chat-v3-0324:free",
        "prompt": prompt,
        "max_tokens": 50  
    }

    max_attempts = 5 
    attempts = 0  

    while attempts < max_attempts:
        attempts += 1
        try:
            response = requests.post(f"{BASE_URL}/completions", headers=headers, json=payload)

            if response.status_code == 200:
                data = response.json()

                print("API Response Data:", json.dumps(data, indent=4))

                prompt_tokens = data.get("usage", {}).get("prompt_tokens", 0)
                completion_tokens = data.get("usage", {}).get("completion_tokens", 0)
                total_tokens = data.get("usage", {}).get("total_tokens", 0)

                if 'choices' in data:
                    generated_text = data['choices'][0].get('text', '').strip()

                    match = re.search(r'(\{.*\})', generated_text)
                    if match:
                        json_text = match.group(1)
                        try:
                            problem_data = json.loads(json_text)

                            problem = problem_data.get('problem', "")
                            answer = str(problem_data.get('answer', "0"))

                            if problem and answer:
                                return jsonify({
                                    "probleme": problem,
                                    "reponse": answer,
                                    "prompt_tokens": prompt_tokens,
                                    "completion_tokens": completion_tokens,
                                    "total_tokens": total_tokens
                                })
                        except json.JSONDecodeError:
                            pass

            print(f"Attempt {attempts}: Invalid response, retrying...")
            time.sleep(1)

        except Exception as e:
            print(f"Attempt {attempts}: Error - {e}, retrying...")
            time.sleep(1) 

    return jsonify({"probleme": "Erreur", "reponse": "0"})

def generate_simple_problem(operation):
    """Generate a simple arithmetic problem like '1+2'"""
    # Generate two random numbers between 1 and 10
    num1 = random.randint(1, 10)
    num2 = random.randint(1, 10)
    
    if operation == 'addition':
        problem = f"{num1} + {num2}"
        answer = num1 + num2
        
    elif operation == 'soustraction':
        # Ensure the result is positive for children
        if num1 < num2:
            num1, num2 = num2, num1
        problem = f"{num1} - {num2}"
        answer = num1 - num2
        
    elif operation == 'multiplication':
        problem = f"{num1} × {num2}"
        answer = num1 * num2
    
    else:
        # Default to addition
        problem = f"{num1} + {num2}"
        answer = num1 + num2
    
    return jsonify({
        "probleme": problem,
        "reponse": str(answer)
    })

if __name__ == '__main__':
    app.run(debug=True)