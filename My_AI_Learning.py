import json
import os
from difflib import SequenceMatcher

AI_BRAIN_FILE = "AI_brain.txt"
AI_MODE = "prompt"  # learning or prompt
YOUR_NAME = "You"
AI_NAME = "AI"

message = []
if os.path.exists(AI_BRAIN_FILE):
    with open(AI_BRAIN_FILE, "r") as file:
        content = file.read().strip()
        if content:
            message = json.loads(content)

def sequence_matcher(input_text, stored_text, threshold=0.8):
    similarity = SequenceMatcher(None, input_text, stored_text).ratio()
    return similarity >= threshold

def AI_response(response):
    response = response.replace("\n", "\n" + " " * (len(AI_NAME) + 2)) 
    print(f"{AI_NAME}: {response}")
    print(f"{YOUR_NAME}: ", end="")

def save_file(message):
    with open(AI_BRAIN_FILE, "w") as file:
        json.dump(message, file, indent=4)

os.system('cls' if os.name == 'nt' else 'clear')
print(f"Your name: {YOUR_NAME}, AI name: {AI_NAME}, AI mode: {AI_MODE}, AI brain file: {AI_BRAIN_FILE}")
print(f"\n{YOUR_NAME}: ", end="")

while True:
    yourChat = input().lower()
    
    if AI_MODE == "learning":
        if "forget about" in yourChat:
            forget_phrase = yourChat.replace("forget about", "").strip()
            match = next((msg for msg in message if msg[0] == forget_phrase), None)
            if match:
                message = [msg for msg in message if msg[0] != forget_phrase]
                AI_response(f"Ok, I will forget about \"{forget_phrase}\".")
                save_file(message)
            else:
                AI_response(f"I didn't remember \"{forget_phrase}\" but whatever.")
            continue
        
        match = next((msg for msg in message if msg[0] == yourChat), None)
        if match:
            AI_response(match[1])
            continue
        
        similar_match = next((msg for msg in message if sequence_matcher(yourChat, msg[0])), None)
        if similar_match:
            AI_response(f"Um... does that mean \"{similar_match[0]}\"? [yes,no]")
            clarify = input().lower()
            if clarify == "yes":
                AI_response(similar_match[1])
                continue
        
        AI_response(f"I can't understand, what should I say to your response \"{yourChat}\"? "
                    f"\nIf you want to forget, type [forget]")
        AiChat = input().lower()

        if AiChat == "forget":
            AI_response(f"Ok, I'll forget about what you said about \"{yourChat}\".")
        else:
            AI_response(f"Ok, I understand now. Your response \"{yourChat}\" will be called \"{AiChat}\".")
            message.append((yourChat, AiChat))
        
            save_file(message)

    elif AI_MODE == "prompt":
        similar_match = next((msg for msg in message if sequence_matcher(yourChat, msg[0])), None)
        if similar_match:
            AI_response(similar_match[1])
        else:
            AI_response("???")
