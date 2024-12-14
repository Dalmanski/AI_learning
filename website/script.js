let AI_MODE = "learning";  // learning or prompt
let YOUR_NAME = "You";
let AI_NAME = "AI";

let keyName = "AI data";
let message = JSON.parse(localStorage.getItem(keyName)) || [];

const chatArea = document.getElementById("chat-area");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const yourNameInput = document.getElementById("your-name");
const aiNameInput = document.getElementById("ai-name");
const aiModeSelect = document.getElementById("ai-mode");

function updateSettings() {
    YOUR_NAME = yourNameInput.value || "You";
    AI_NAME = aiNameInput.value || "AI";
    AI_MODE = aiModeSelect.value.toLowerCase();
}

function sequenceMatcher(inputText, storedText, threshold = 0.7) {
    let similarity = 0, m = 0, n = 0;
    let sequenceLength = Math.max(inputText.length, storedText.length);
    
    for (let i = 0; i < sequenceLength; i++) {
        if (inputText[i] === storedText[i]) m++;
        if (inputText[i] === storedText[n]) n++;
    }
    similarity = (m + n) / sequenceLength;
    return similarity >= threshold;
}

async function wait(time) {
    time *= 1000;
    await new Promise(resolve => setTimeout(resolve, time));
}

async function AIResponse(response) {
    chatArea.value += `${AI_NAME}: `;
    await wait(0.5);
    for (let i = 0; i < response.length; i++) {
        chatArea.value += response[i];
        await wait(0.02);
    }
    chatArea.value += `\n${YOUR_NAME}: `;
    userInput.value = '';
    userInput.focus();
}

function saveMessage() {
    localStorage.setItem(keyName, JSON.stringify(message));
}

function handleUserInput() {
    const yourChat = userInput.value.toLowerCase();
    chatArea.value += `${yourChat}\n`;
    updateSettings();

    const createInputField = (placeholder, callback) => {
        const newInput = document.createElement("input");  
        newInput.type = "text";
        newInput.placeholder = placeholder;

        const computedStyle = window.getComputedStyle(userInput);
        newInput.style.width = computedStyle.width; 
        newInput.style.boxSizing = computedStyle.boxSizing; 
        newInput.style.padding = computedStyle.padding;
        newInput.style.border = computedStyle.border;
        
        newInput.addEventListener('change', (e) => {
            const newValue = e.target.value.toLowerCase();
            chatArea.value += `${newValue}\n`;
            callback(newValue);
            userInput.style.display = "block";
            userInput.focus();
            newInput.remove();
        });
        userInput.style.display = "none"; 
        chatArea.parentElement.appendChild(newInput); 
        newInput.focus(); 
    };

    if (AI_MODE === "learning") {
        if (yourChat.includes("forget about")) {
            const forgetPhrase = yourChat.replace("forget about", "").trim();
            const match = message.find(msg => msg[0] === forgetPhrase);
            const similarMatch = message.find(msg => sequenceMatcher(forgetPhrase, msg[0]));
            
            if (match) {
                message = message.filter(msg => msg[0] !== forgetPhrase);
                AIResponse(`Ok, I will forget about "${forgetPhrase}".`);
                saveMessage();
            } else if (similarMatch) {           
                AIResponse(`Um... does that mean "${similarMatch[0]}"? [yes, no]`);
                createInputField("type [yes,no]. Press Enter when you're done.", (clarify) => {
                    if (clarify === "yes") {
                        message = message.filter(msg => msg[0] !== similarMatch[0]);
                        AIResponse(`Ok, I will forget about "${similarMatch[0]}".`);
                        saveMessage();
                    } else {
                        AIResponse(`Oh... I thought it's "${similarMatch[0]}" sorry. Pls continue.`);
                    }
                });
            } else {
                   AIResponse(`I couldn't find anything to forget related to "${forgetPhrase}".`);
            }
            return;
        }  
        const match = message.find(msg => msg[0] === yourChat);
        const similarMatch = message.find(msg => sequenceMatcher(yourChat, msg[0]));
        if (match) {
            AIResponse(match[1]);
            return;
        } else if (similarMatch) {
            AIResponse(`Um... does that mean "${similarMatch[0]}"? [yes, no]`);
            createInputField("type [yes,no]. Press Enter when you done.", (clarify) => {
                if (clarify === "yes") {
                    AIResponse(similarMatch[1]);
                } else {
                    AIResponse(`Ok but, I don't understand "${yourChat}". What should I say to your response? If you want to forget, type [forget]`);
                    setTimeout(() => {
                        createInputField(`What should the AI learn from "${yourChat}"? or type [forget]?`, (AiChat) => {
                            if (AiChat === "forget") {
                                AIResponse(`Ok, I'll forget about what you said about "${yourChat}".`);
                            } else {
                                AIResponse(`Ok, I understand now. Your response "${yourChat}" will be called "${AiChat}".`);
                                message.push([yourChat, AiChat]);
                                saveMessage();
                            }
                        });
                    }, 1); 
                }
            });
            return;
        } else {
            AIResponse(`I don't understand "${yourChat}". What should I say to your response? If you want to forget, type [forget]`);
            createInputField(`What should the AI learn from "${yourChat}"? or type [forget]?`, (AiChat) => {
                if (AiChat.includes("forget")) {
                    AIResponse(`Ok, I'll forget about what you said about "${yourChat}".`);
                } else {
                    AIResponse(`Ok, I understand now. Your response "${yourChat}" will be called "${AiChat}".`);
                    message.push([yourChat, AiChat]);
                    saveMessage();
                }
            });
        }
    } else if (AI_MODE === "prompt") {
        const similarMatch = message.find(msg => sequenceMatcher(yourChat, msg[0]));
        AIResponse(similarMatch ? similarMatch[1] : "???");
    }

    userInput.value = '';
}

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        handleUserInput();
    }
});

yourNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        YOUR_NAME = yourNameInput.value;
        chatArea.value += `(You change your name to "${YOUR_NAME}")\n${YOUR_NAME}: `;
    }
});

aiNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        AI_NAME = aiNameInput.value;
        chatArea.value += `(You change the AI name to "${AI_NAME}")\n${YOUR_NAME}: `;
    }
});

aiModeSelect.addEventListener('change', function (event) {
    const selectedMode = event.target.value; 
    chatArea.value += `(You switch the AI mode to "${selectedMode}")\n${YOUR_NAME}: `;
});

function enableAutoScroll() {
    requestAnimationFrame(() => {
        chatArea.scrollTop = chatArea.scrollHeight;
        enableAutoScroll();
    });
}
enableAutoScroll();

function loadLocalStorage() {
    const conversation = [["how are you?","i am fine"],["whats your name?","i am powerful ai"],["whats my name?","your name is nobody"],["eeeyy","nice"],["is ai replace job","yes"],["why balatro wins on game award?","because i dont understand people why they like balatro"],["what's the best game?","geometry dash"],["hi","hello"],["good","good is success"],["nice","nice one"],["ok","it means i agree"],["yes","lmao"],["bruh","ok"],["how old are you?","your 69"],["what?","what is whaaaat"],["wow","it means amazing"],["what did you say?","it say your lmao"],["ok good","good is ok"],["so hows your day?","its good day"],["lets go","it means lets gooo"],["yeah","it means agree"],["so who are you?","your ai"],["im not ai","it means im human"],["so what now?","so it means what should i do?"],["so what is the best game?","its geometry dash"],["good morning","say good morning too"],["alright","it's alright"],["now what should we do?","we do gaming"],["eyo","it means to express"],["lmao","lol"],["geometry dash is the best game","the best game in the world"],["lol","it means league of legends"],["who are you?","i am ai"]]
    const userConfirmed = confirm("Are you sure you want to overwrite this data? This can't be undone.");
    if (userConfirmed) {
        localStorage.setItem(keyName, JSON.stringify(conversation));
        alert("Done loading sample from load local storage.");
        message = JSON.parse(localStorage.getItem(keyName)) || [];
    } else {
        alert("Data was not overwritten.");
    }
}

chatArea.value = `${YOUR_NAME}: `;
userInput.focus();
