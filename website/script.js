const chatArea = document.getElementById("chat-area");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const yourNameInput = document.getElementById("your-name");
const aiNameInput = document.getElementById("ai-name");
const aiModeSelect = document.getElementById("ai-mode");
const aiSelect = document.getElementById("ai-select");
const typewriterSpeed = document.getElementById("typewriter-speed");
const volumeIcon = document.getElementById("volume-icon");

let keyName = "AI Database";
let selectedAI = "AI Default";
let AI_Database = JSON.parse(localStorage.getItem(keyName)) || {};
if (!AI_Database.AI_Data) {
    AI_Database.AI_Data = {};
    AI_Database.Settings = {Your_Name: "You", AI_Name: "Baby AI", Typewriter_Speed: "0.02", Is_Muted: false};
}
let message = AI_Database.AI_Data[selectedAI] || [];

let AI_MODE = "learning";  // learning or prompt
let YOUR_NAME = AI_Database.Settings.Your_Name;
let AI_NAME = AI_Database.Settings.AI_Name;
let setTypewriterSpeed = AI_Database.Settings.Typewriter_Speed;
let isMuted = AI_Database.Settings.Is_Muted;
if (isMuted) volumeIcon.className = "fa-solid fa-volume-xmark";
else volumeIcon.className = "fa-solid fa-volume-high";

localStorage.setItem(keyName, JSON.stringify(AI_Database));

yourNameInput.value = YOUR_NAME;
aiNameInput.value = AI_NAME;
typewriterSpeed.value = setTypewriterSpeed;

let isAudioAllowed = false;
let bgMusic = new Audio("Sound effect\\Epic Sci-Fi Music_ Aphelion  Alibi Music.mp3");
let userEnterSound = new Audio("Sound effect\\520579__divoljud__clickglass.wav");
let soundBlip = new Audio("Sound effect\\624037__the_sample_workshop__2690_vial_tap_br-a-1-tmc.mp3");

function sequenceMatcher(inputText, storedText, threshold = 0.75) {
    let similarity = 0, m = 0, n = 0;
    let sequenceLength = Math.max(inputText.length, storedText.length);
    for (let i = 0; i < sequenceLength; i++) {
        if (inputText[i] === storedText[i]) m++;
        if (inputText[i] === storedText[n]) n++;
    }
    similarity = (m + n) / sequenceLength;
    return similarity >= threshold;
}

String.prototype.capitalize = function() { // For .capitalize()
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.perspShift = function() { // For .perspShift()
    const shift = [
        ["are you", "am I"],
        ["I am", "you are"],
        ["I'm", "you're"],
        ["your", "my"],
        ["you", "I"],
        ["this", "that"],
        ["we", "they"],
        ["us", "them"],
        ["our", "their"],
        ["here", "there"],
    ];
    let response = this;
    for (let i = 0; i < shift.length; i++){
        let word1 = shift[i][0], word2 = shift[i][1];
        if (response.includes(word1)){
            response = response.replace(word1, word2);
            break;
        } else if (response.includes(word2)){
            response = response.replace(word2, word1);
            break;
        }
    }
    return response;
};

async function delay(time) {
    time *= 1000;
    await new Promise(resolve => setTimeout(resolve, time));
}

// To start music and sound (because it doesn't work on autoplay due to security reasons)
let isMusicPlaying = false;
document.addEventListener('click', () => {
    if (!isMuted && !isMusicPlaying) {
        bgMusic.loop = true;
        bgMusic.volume = 0;
        function fadeInAudio(audio, duration, targetVolume) {
            const step = 0.01;
            const interval = (duration * 1000) / (targetVolume / step);
            let currentVolume = audio.volume;
            return new Promise((resolve) => {
                const fadeInterval = setInterval(() => {
                    currentVolume = Math.min(currentVolume + step, targetVolume);
                    audio.volume = currentVolume;
                    if (currentVolume >= targetVolume) {
                        clearInterval(fadeInterval);
                        resolve();
                    }
                }, interval);
            });
        }
        bgMusic.play()
            .then(() => {
                isMusicPlaying = true;
                return fadeInAudio(bgMusic, 3, 0.5);
            })
    }
    if (!isAudioAllowed) {
        isAudioAllowed = true;
    }
});

function toggleVolume() {
    if (isAudioAllowed) {    
        if (isMuted) {
            bgMusic.volume = 0.5;
            soundBlip.volume = 1;
            volumeIcon.className = "fa-solid fa-volume-high";
        } else {
            bgMusic.volume = 0; 
            soundBlip.volume = 0;
            volumeIcon.className = "fa-solid fa-volume-xmark";
        }
        isMuted = !isMuted;
        AI_Database.Settings.Is_Muted = isMuted;
        localStorage.setItem(keyName, JSON.stringify(AI_Database)); 
    } 
}

async function aiResponse(response) {
    toggleAutoScroll(true);
    userInput.value = '';
    chatArea.value += `\n${AI_NAME}: `;
    response = response.capitalize();
    await delay(0.5);
    for (let i = 0; i < response.length; i++) {
        chatArea.value += response[i];
        if (isAudioAllowed && !isMuted) {
            soundBlip.currentTime = 0;
            soundBlip.play();
        }
        await delay(setTypewriterSpeed);
    }
    await delay(0.2);
    toggleAutoScroll(false);
}

async function yourResponse(response){
    toggleAutoScroll(true);
    if (isAudioAllowed && !isMuted) {
        userEnterSound.currentTime = 0;
        userEnterSound.play();
    }
    chatArea.value += `\n${YOUR_NAME}: ${response.capitalize()}`;
    await delay(0.1);
    toggleAutoScroll(false);
}

function getUserEnter(placeholder) {
    userInput.placeholder = placeholder;
    return new Promise((resolve) => {
        const handler = (e) => {
            if (((e.type === "click") || (e.key === "Enter" && !e.shiftKey)) && userInput.value !== '') {
                userInput.removeEventListener('keydown', handler);
                sendBtn.removeEventListener('click', handler);
                const yourChat = userInput.value.trim().toLowerCase();
                yourResponse(yourChat);
                resolve(yourChat);
            }
        };
        userInput.addEventListener('keydown', handler);
        sendBtn.addEventListener('click', handler);
    });
}

function saveMessage() {
    AI_Database.AI_Data[selectedAI] = message;
    localStorage.setItem(keyName, JSON.stringify(AI_Database));
    displayStorageSize();
}

async function handleUserInput() {
    while (true) {
        AI_MODE = AI_MODE.toLowerCase();
        let isAiQuestion = Math.random() < 0.35;
        if (isAiQuestion && message.length > 0) {
            const randMsg = message[Math.floor(Math.random() * message.length)];
            await aiResponse(randMsg[0].perspShift());
            let yourChat = await getUserEnter(`Answer the AI question about "${randMsg[0].perspShift()}".`);
            if (yourChat.includes(randMsg[1]) || sequenceMatcher(yourChat, randMsg[1])) {
                const agree = ["Okay", ":)", "Nice", "Noted", "Good", "Ah I see."];
                const agreeResponse = agree[Math.floor(Math.random() * agree.length)];
                await aiResponse(agreeResponse);
                continue;
            } else {
                if (AI_MODE === "learning") {
                    await aiResponse(`Oh, "${yourChat}" seems very new...`);
                    await aiResponse(`Do you want to replace "${randMsg[1]}" (From the current I learn from "${randMsg[0]}") into "${yourChat}"?`);
                    const clarify = await getUserEnter("Type [yes, no].");
                    if (clarify.includes("yes")) {
                        randMsg[1] = yourChat;
                        await aiResponse(`Ok, I will replace to "${yourChat}".`);
                        saveMessage();
                        continue;
                    } else {
                        await aiResponse(`Oh okay. Forget about that.`);
                        continue;
                    }
                } else if (AI_MODE === "prompt") {
                    await aiResponse(`Uhm Okay...`);
                    continue;
                }
            }
        } else { // If AI doesn't have question
            let yourChat = await getUserEnter("Type anything.");

            if (AI_MODE === "learning") {
                let forgetRegex = /forget\s+"([^"]+)"/;
                let isForget = yourChat.match(forgetRegex);
                let replaceRegex = /replace\s+on\s+"([^"]+)"\s+to\s+"([^"]+)"/;
                let isReplace = yourChat.match(replaceRegex);
                if (isForget) {
                    const forgetPhrase = isForget[1];
                    const match = message.find(msg => msg[0] === forgetPhrase);
                    const similarMatch = message.find(msg => sequenceMatcher(forgetPhrase, msg[0]));
                    if (match) {
                        await aiResponse(`Wait, are you sure you want to forget my "${forgetPhrase}"?`);
                        const clarify = await getUserEnter("Type [yes, no].");
                        if (clarify.includes("yes")) {
                            message = message.filter(msg => msg[0] !== forgetPhrase);
                            await aiResponse(`Ok, I will forget about "${forgetPhrase}".`);
                            saveMessage();
                            continue;
                        } else if (clarify.includes("no")){
                            await aiResponse(`Ok I will not forget "${forgetPhrase}". Please continue.`);
                            continue;
                        } // else, it will proceed to I dont understand that
                    } else if (similarMatch) {
                        await aiResponse(`Wait, does that mean I'll forget "${similarMatch[0]}"?`);
                        const clarify = await getUserEnter("Type [yes, no].");
                        if (clarify.includes("yes")) {
                            message = message.filter(msg => msg[0] !== similarMatch[0]);
                            await aiResponse(`Ok, I will forget about "${similarMatch[0]}".`);
                            saveMessage();
                            continue;
                        } else if (clarify.includes("no")){
                            await aiResponse(`Oh... I thought it's "${similarMatch[0]}" sorry. Please continue.`);
                            continue;
                        } // else, it will proceed to I dont understand that
                    } else {
                        await aiResponse(`I couldn't find anything to forget related to "${forgetPhrase}".`);
                        continue;
                    } 
                } else if (isReplace) {
                    let word1 = isReplace[1], word2 = isReplace[2];
                    const match = message.find(msg => msg[0] === word1);
                    const similarMatch = message.find(msg => sequenceMatcher(word1, msg[0]));
                    if (match) {
                        await aiResponse(`Are you sure you want to replace "${word1}" from "${match[1]}" to "${word2}"?`);
                        const clarify = await getUserEnter("Type [yes, no].");
                        if (clarify.includes("yes")) {
                            match[1] = word2;
                            await aiResponse(`Ok, I will replace "${word1}" into "${word2}".`);
                            saveMessage();
                            continue;
                        } else if (clarify.includes("no")){
                            await aiResponse(`Okay. Please continue.`);
                            continue;
                        } // else, it will proceed to I dont understand that
                    } else if (similarMatch) {
                        await aiResponse(`Wait, does that mean I'll replace from the word "${similarMatch[0]}"?`);
                        const clarify = await getUserEnter("Type [yes, no].");
                        if (clarify.includes("yes")) {
                            similarMatch[1] = word2;
                            await aiResponse(`Ok, I will replace "${similarMatch[0]}" into "${word2}".`);
                            saveMessage();
                            continue;
                        } else if (clarify.includes("no")){
                            await aiResponse(`Oh... I thought it's "${similarMatch[0]}" sorry. Please continue.`);
                            continue;
                        } // else, it will proceed to I dont understand that
                    } else {
                        await aiResponse(`I couldn't find anything to replace related to "${word1}".`);
                        continue;
                    } 
                } else if (yourChat.includes("show me your data")) {
                    await aiResponse(`As you wish, here's my data on "${selectedAI}":\n${AI_Database.AI_Data[selectedAI]}`);
                    continue;
                }
                const match = message.find(msg => msg[0] === yourChat);
                const similarMatch = message.find(msg => sequenceMatcher(yourChat, msg[0]));
                if (match) {
                    await aiResponse(match[1].perspShift());
                    continue;
                } else if (similarMatch) {
                    await aiResponse(`Um... does that mean "${similarMatch[0]}"?`);
                    const clarify = await getUserEnter("Type [yes, no].");

                    if (clarify.includes("yes")) {
                        await aiResponse(similarMatch[1]);
                        continue;
                    } // else, it will proceed to I dont understand that
                } // else, it will proceed to I dont understand that

                // this part will pass when there's no declare on "continue;"
                // AI is going to .perspShift() but your not .perspShift()
                await aiResponse(`How to respond "${yourChat.perspShift()}"?`);
                const AiChat = await getUserEnter(`What should the AI learn from "${yourChat.perspShift()}"? Or type [nevermind, nvm].`);
                if (AiChat.includes("nevermind") || AiChat.includes("nvm")) {
                    await aiResponse(`Ok, I'll forget about what you said about "${yourChat}".`);
                } else {
                    await aiResponse(`Got it. I'll remember that "${yourChat.perspShift()}" means "${AiChat.perspShift()}".`);
                    message.push([yourChat, AiChat]);
                    saveMessage();
                }

            } else if (AI_MODE === "prompt") {
                const similarMatch = message.find(msg => sequenceMatcher(yourChat, msg[0]));
                await aiResponse(similarMatch ? similarMatch[1] : "???");
            }
        }
        userInput.value = '';
    } 
}

yourNameInput.addEventListener('blur', () => {
    YOUR_NAME = yourNameInput.value;
    AI_Database.Settings.Your_Name = YOUR_NAME;
    localStorage.setItem(keyName, JSON.stringify(AI_Database));  
    yourResponse(`(You change your name to "${YOUR_NAME}")`);
});

aiNameInput.addEventListener('blur', () => {
    AI_NAME = aiNameInput.value;
    AI_Database.Settings.AI_Name = AI_NAME;
    localStorage.setItem(keyName, JSON.stringify(AI_Database));  
    yourResponse(`(You changed the AI name to "${AI_NAME}")`);
});

typewriterSpeed.addEventListener('blur', () => {
    setTypewriterSpeed = typewriterSpeed.value;
    AI_Database.Settings.Typewriter_Speed = setTypewriterSpeed;
    localStorage.setItem(keyName, JSON.stringify(AI_Database));  
    alert("Typewriter speed changed successfully!");
});

aiModeSelect.addEventListener('change', function (event) {
    const selectedMode = event.target.value; 
    yourResponse(`(You switch the AI mode to "${selectedMode}")`);
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
    const preloadMessage = [
        ["how are you?", "i am fine"],
        ["whats your name?", "I am powerful ai"],
        ["whats my name?", "my name is nobody"],
        ["eeeyy", "nice"],
        ["is ai replace job", "yes"],
        ["why balatro wins on game award?", "because you dont understand people why they like balatro"],
        ["what's the best game?", "geometry dash"],
        ["hi", "hello"],
        ["good", "okay"],
        ["nice", "nice one"],
        ["ok", "okay"],
        ["yes", "agree"],
        ["bruh", "lmao"],
        ["how old are you?", "you are 69"],
        ["what?", "nani"],
        ["wow", "sugoi"],
        ["what did you say?", "it said i am lmao"],
        ["ok good", "good is ok"],
        ["so how's your day?", "it's fine"],
        ["let's go", "aight"],
        ["yeah", "it means agree"],
        ["so who are you?", "your ai"],
        ["so what now?", "so it means what should i do?"],
        ["so what is the best game?", "it's geometry dash"],
        ["good morning", "ohayo"],
        ["alright", "it's alright"],
        ["now what should we do?", "we do gaming"],
        ["eyo", "it means to express"],
        ["lmao", "lol"],
        ["geometry dash is the best game", "the best game in the world"],
        ["lol", "it means league of legends"]
    ];
    const userConfirmed = confirm('Are you sure you want to add "Load AI sample" with data?');
    if (userConfirmed) {
        AI_Database.AI_Data["Load AI sample"] = preloadMessage;
        AI_Database.Settings = {Your_Name: "You", AI_Name: "Baby AI", Typewriter_Speed: "0.02", Is_Muted: false};
        localStorage.setItem(keyName, JSON.stringify(AI_Database));
        alert('Done loading sample data.');
        message = preloadMessage;
        aiSelectOption();
        displayStorageSize();
    }
}

function deleteAiData() {
    if (Object.keys(AI_Database.AI_Data).length > 1) {
        const confirmed = confirm(`Are you sure you want to delete all data from "${selectedAI}"?`);
        if (confirmed) {
            if (AI_Database.AI_Data[selectedAI]) {
                delete AI_Database.AI_Data[selectedAI];
                localStorage.setItem(keyName, JSON.stringify(AI_Database));
                alert(`AI "${selectedAI}" has been deleted.`);
                aiSelectOption();
                displayStorageSize();
            }
        }
    } else {
        alert("You cannot delete when only one AI is selected.");
    }
}

function deleteAiDatabase() {
    const confirmed = confirm(`Are you sure you want to delete the key "${keyName}" from localStorage? This can't be undone!`);
    if (confirmed) {
        if (localStorage.getItem(keyName) !== null) {
            localStorage.removeItem(keyName);
            alert(`"${keyName}" has been deleted from localStorage.`);
            aiSelectOption();
            displayStorageSize();
        } else {
            alert(`The key "${keyName}" does not exist in localStorage.`);
        }
    }
}

function displayStorageSize() {
    const storageSize = document.getElementById('storage-size');
    const value = localStorage.getItem(keyName);
    if (value === null) {
        storageSize.textContent = `"${keyName}" is empty. Please add AI data or chat with AI.`;
        return;
    }
    const AI_Database = JSON.parse(value) || {};
    let totalSize = (keyName.length + value.length) * 2;
    const totalSizeInKB = (totalSize / 1024).toFixed(2);
    if (selectedAI && AI_Database.AI_Data[selectedAI]) {
        const aiData = JSON.stringify(AI_Database.AI_Data[selectedAI]);
        const aiSize = (selectedAI.length + aiData.length) * 2; 
        const aiSizeInKB = (aiSize / 1024).toFixed(2);
        storageSize.innerHTML = 
            `Key "${keyName}" size: ${totalSizeInKB} KB<br>` +
            `Selected AI ("${selectedAI}") size: ${aiSizeInKB} KB`;
    }
}

function addAiData() {
    const aiName = prompt("Enter the name of the new AI:");
    if (!aiName || aiName.trim() === "") {
        alert("AI name is required to add new AI data.");
        return;
    } else if (AI_Database.AI_Data[aiName]) {
        alert(`AI named "${aiName}" already exists.`);
        return;
    }
    AI_Database.AI_Data[aiName] = [];
    localStorage.setItem(keyName, JSON.stringify(AI_Database));   
    alert(`AI "${aiName}" has been added successfully.`);
    yourResponse(`(You switched to "${aiName}")`);
    aiSelectOption();
    displayStorageSize();
}

function aiSelectOption() { // Also, auto produce "AI Default" if empty
    aiSelect.innerHTML = "";
    if (Object.keys(AI_Database.AI_Data).length === 0) {
        const defaultOption = document.createElement("option");
        defaultOption.value = "AI Default";
        defaultOption.textContent = "AI Default";
        aiSelect.appendChild(defaultOption);
        selectedAI = "AI Default";
    } else {
        Object.keys(AI_Database.AI_Data).reverse().forEach(aiName => {
            const option = document.createElement("option");
            option.value = aiName;
            option.textContent = aiName;
            aiSelect.appendChild(option);
        });
        selectedAI = Object.keys(AI_Database.AI_Data).reverse()[0];
        message = AI_Database.AI_Data[selectedAI]; 
    }
}

aiSelect.addEventListener("change", (event) => {
    selectedAI = event.target.value;
    message = AI_Database.AI_Data[selectedAI] || [];
    yourResponse(`(You switched to "${selectedAI}")`);
    displayStorageSize();
});

// Main code
aiSelectOption();
displayStorageSize();
chatArea.value += `${YOUR_NAME}: (AI data set to "${selectedAI}")`;
(async () => {
    await aiResponse(`Hi ${YOUR_NAME}~`);
    await handleUserInput();
})();  
