let AI_MODE = "learning";  // learning or prompt
let YOUR_NAME = "You";
let AI_NAME = "AI";

let keyName = "AI Database";
let selectedAI = "AI Default";
let allData = JSON.parse(localStorage.getItem(keyName)) || {};
let message = allData[selectedAI] || [];

const chatArea = document.getElementById("chat-area");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const yourNameInput = document.getElementById("your-name");
const aiNameInput = document.getElementById("ai-name");
const aiModeSelect = document.getElementById("ai-mode");
const aiSelect = document.getElementById("ai-select");

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

async function delay(time) {
    time *= 1000;
    await new Promise(resolve => setTimeout(resolve, time));
}

async function AIResponse(response) {
    toggleAutoScroll(true);
    userInput.blur();
    userInput.value = '';
    chatArea.value += `${AI_NAME}: `;
    await delay(0.5);
    for (let i = 0; i < response.length; i++) {
        chatArea.value += response[i];
        await delay(0.02);
    }
    chatArea.value += `\n${YOUR_NAME}: `;
    userInput.focus();
    await delay(0.1);
    toggleAutoScroll(false);
}

function saveMessage() {
    allData[selectedAI] = message;
    localStorage.setItem(keyName, JSON.stringify(allData));
    displayStorageSize();
    aiSelectOption();
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
                createInputField("Type [yes,no]. Press Enter when you're done.", (clarify) => {
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
            createInputField("Type [yes,no]. Press Enter when you done.", (clarify) => {
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

let autoScrollEnabled = false;
function toggleAutoScroll(toggle) {
    autoScrollEnabled = toggle;
    if (toggle) {
        function autoScroll() {
            if (autoScrollEnabled) {
                chatArea.scrollTop = chatArea.scrollHeight;
                requestAnimationFrame(autoScroll);
            }
        }
        autoScroll();
    }
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
}

function loadLocalStorage() {
    const preloadMessage = [["how are you?","i am fine"],["whats your name?","i am powerful ai"],["whats my name?","your name is nobody"],["eeeyy","nice"],["is ai replace job","yes"],["why balatro wins on game award?","because i dont understand people why they like balatro"],["what's the best game?","geometry dash"],["hi","hello"],["good","good is success"],["nice","nice one"],["ok","it means i agree"],["yes","lmao"],["bruh","ok"],["how old are you?","your 69"],["what?","what is whaaaat"],["wow","it means amazing"],["what did you say?","it say your lmao"],["ok good","good is ok"],["so hows your day?","its good day"],["lets go","it means lets gooo"],["yeah","it means agree"],["so who are you?","your ai"],["im not ai","it means im human"],["so what now?","so it means what should i do?"],["so what is the best game?","its geometry dash"],["good morning","say good morning too"],["alright","it's alright"],["now what should we do?","we do gaming"],["eyo","it means to express"],["lmao","lol"],["geometry dash is the best game","the best game in the world"],["lol","it means league of legends"],["who are you?","i am ai"]];
    const userConfirmed = confirm('Are you sure you want to add "Load AI sample" with data?');
    if (userConfirmed) {
        allData["Load AI sample"] = preloadMessage;
        localStorage.setItem(keyName, JSON.stringify(allData));
        alert('Done loading sample data.');
        message = preloadMessage;
        aiSelectOption();
        displayStorageSize();
    }
}

function deleteAiData() {
    if (Object.keys(allData).length > 1) {
        const confirmed = confirm(`Are you sure you want to delete all data from "${selectedAI}"?`);
        if (confirmed) {
            if (allData[selectedAI]) {
                delete allData[selectedAI];
                localStorage.setItem(keyName, JSON.stringify(allData));
                alert(`AI "${selectedAI}" has been deleted.`);
                aiSelectOption();
                displayStorageSize();
            }
        }
    } else {
        alert("You cannot delete when only one AI is selected.");
    }
}

function displayStorageSize() {
    const value = localStorage.getItem(keyName);
    if (value === null) {
        document.getElementById('storage-size').textContent = `"${keyName}" is empty. Please add AI data or chat with AI.`;
        return;
    }
    const allData = JSON.parse(value) || {};
    let totalSize = (keyName.length + value.length) * 2;
    const totalSizeInKB = (totalSize / 1024).toFixed(2);
    if (selectedAI && allData[selectedAI]) {
        const aiData = JSON.stringify(allData[selectedAI]);
        const aiSize = (selectedAI.length + aiData.length) * 2; 
        const aiSizeInKB = (aiSize / 1024).toFixed(2);
        document.getElementById('storage-size').innerHTML = 
            `Key "${keyName}" size: ${totalSizeInKB} KB<br>` +
            `Selected AI ("${selectedAI}") size: ${aiSizeInKB} KB`;
    }
}

function addAiData() {
    const aiName = prompt("Enter the name of the new AI:");
    if (!aiName || aiName.trim() === "") {
        alert("AI name is required to add new AI data.");
        return;
    }
    if (allData[aiName]) {
        alert(`AI named "${aiName}" already exists.`);
        return;
    }
    allData[aiName] = [];
    localStorage.setItem(keyName, JSON.stringify(allData));
    
    alert(`AI "${aiName}" has been added successfully.`);
    aiSelectOption();
    displayStorageSize();
}

function aiSelectOption() { // Also, auto produce "AI Default" if empty
    aiSelect.innerHTML = "";
    if (Object.keys(allData).length === 0) {
        const defaultOption = document.createElement("option");
        defaultOption.value = "AI Default";
        defaultOption.textContent = "AI Default";
        aiSelect.appendChild(defaultOption);
        selectedAI = "AI Default";
    } else {
        Object.keys(allData).reverse().forEach(aiName => {
            const option = document.createElement("option");
            option.value = aiName;
            option.textContent = aiName;
            aiSelect.appendChild(option);
        });
        selectedAI = Object.keys(allData).reverse()[0];
        message = allData[selectedAI]; 
    }
}

document.getElementById("ai-select").addEventListener("change", (event) => {
    selectedAI = event.target.value;
    message = allData[selectedAI] || [];
    chatArea.value += `(You switched to "${selectedAI}")\n${YOUR_NAME}: `;
    displayStorageSize();
});

userInput.focus();
aiSelectOption();
displayStorageSize();
chatArea.value += `${YOUR_NAME}: (AI data set to "${selectedAI}")\n${YOUR_NAME}: `;