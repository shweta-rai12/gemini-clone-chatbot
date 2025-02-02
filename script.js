const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false;

//API configuration
const API_KEY = "AIzaSyANm7HFXTE3S99vv83TNrmVQ6eTFJTP27s";
const API_URL =`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalstorageData = () => {
	const savedChats = localStorage.getItem("savedChats");
	const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

	//apply the stored theme
	document.body.classList.toggle("light_mode", isLightMode);
	toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

	//restore the saved chats
	chatList.innerHTML = savedChats || "";

	document.body.classList.toggle("hide-header", savedChats);
	chatList.scrollTo(0, chatList.scrollHeight); //scroll button
}

loadLocalstorageData();

//create a new message element and return it
const createMessageElement = (content, ...classes) => {
	const div = document.createElement("div");
	div.classList.add("message", ...classes);
	div.innerHTML = content;
	return div;
};

//show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
	const words = text.split(" ");
	let currentWordIndex = 0;

	const typingInterval = setInterval(() => {
		//append each word to the text element with the space
		textElement.innerText += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
		incomingMessageDiv.querySelector(".icon").classList.add("hide");

		//if all words display
	if(currentWordIndex === words.length) {
			clearInterval(typingInterval);
			isResponseGenerating = false;
			incomingMessageDiv.querySelector(".icon").chatList.remove("hide");
		localStorage.setItem("savedChats", chatList.innerHTML);	 //save chats to local storage
		chatList.scrollTo(0, chatList.scrollHeight); //scroll button
		}
	}, 75); 
}

const generateAPIResponse = async (incomingMessageDiv) => {
	const textElement = incomingMessageDiv.querySelector(".text"); //get text element
	try {
	  const response = await fetch(API_URL, { 
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			contents: [{
				role: "user",
				parts:[{text: userMessage }]
			}]
		})
	  });

	  const data = await response.json();
	  if(!response.ok) throw new Error(data.error.message);

	 // const apiResponse = data?.candidates[0].content.parts[0].text;

	// get the api response text and remove asterisks from it
	  const apiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text.replace(/\*\*(.*?)\*\*/g, '$1') || "Sorry, I couldn't process that.";
	  showTypingEffect(apiResponse, textElement, incomingMessageDiv);
	//  textElement.innerText = apiResponse;
	} catch (error) {
	  isResponseGenerating = false;
	  textElement.innerText = error.message;
	  console.log(error);
	}  finally{
		incomingMessageDiv.classList.remove("loading");
	}
  }; 

//show a loading animation
const showLoadingAnimation = () => {
	const html = `<div class="message-content">
				<img src="img/gemini.png" alt="Gemini Image" class="avatar" >
				<p class="text"></p>
				<div class="loading-indicator">
					<div class="loading-bar"></div>
					<div class="loading-bar"></div>
					<div class="loading-bar"></div>
				</div>
			</div>
			<span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");	
	chatList.appendChild(incomingMessageDiv);

	chatList.scrollTo(0, chatList.scrollHeight); //scroll button
	generateAPIResponse(incomingMessageDiv);
}

//copy message text to the clopboard
const copyMessage = (copyIcon) => {
	const messageText = copyIcon.parentElement.querySelector(".text").innerText;
	navigator.clipboard .writeText(messageText);
	copyIcon.innerText = "done"; // show tick icon
	setTimeout(() => { copyIcon.innerText = "content_copy"; }, 1000);
};

//handle sending outgoing chat messages
const handleOutgoingChat = () => {
	userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;   
	if(!userMessage || isResponseGenerating) return; // exit if there is no message

	isResponseGenerating = true;
	
	const html = `<div class="message-content">
				<img src="img/human.jpg" alt="User Image" class="avatar">
				<p class="text"></p>
			</div>`;
	
	const outgoingMessageDiv = createMessageElement(html, "outgoing");	
	outgoingMessageDiv.querySelector(".text").innerText = userMessage;
	chatList.appendChild(outgoingMessageDiv);

	typingForm.reset();   //clear input field
	chatList.scrollTo(0, chatList.scrollHeight); //scroll button
	document.body.classList.add("hide-header"); //hide the header once chat start
	setTimeout(showLoadingAnimation, 500);  //Show loading animation after a delay
	//console.log(userMessage);	
};

//set usermessage and handle outgoing chat
suggestions.forEach(suggestion => {
	suggestion.addEventListener("click", () => {
		userMessage = suggestion.querySelector(".text").innerText;
		handleOutgoingChat();
	});
});

//toogles between light and dark thems
toggleThemeButton.addEventListener("click", () => {
	const isLightMode = document.body.classList.toggle("light_mode");
	localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
	toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

//delete all chats 
deleteChatButton.addEventListener("click", () => {
	if(confirm("Are you sure want to delete all messages?")){
		localStorage.removeItem("savedChats");
		loadLocalstorageData();
	}
})

//Prevent default form submission and handle outgoing chat  
if (typingForm) {
    typingForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleOutgoingChat();
    });
}


