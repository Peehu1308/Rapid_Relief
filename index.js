// document.addEventListener('DOMContentLoaded', function(){
//     let slides=document.querySelectorAll('.fades');
//     let index=0;

//     function showSlide(){
//         slides.forEach((slide) =>{
//             slide.classList.remove("active");
//         });

//         slides[index].classList.add("active");
//         index=(index+1)%slides.length;
//     }

//     slides[0].classList.add("active");
//     setInterval(showSlide,2000);
// });

// OpenAI API key - Replace with your actual API key if needed
const apiKey = "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";

// Global variables to store location data
let currentLocation = {
    latitude: null,
    longitude: null,
    accuracy: null,
    address: "Address not available"
};

// Wait for DOM to be fully loaded before accessing elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize chatbot elements
    const chatbox = document.getElementById("chatBody"); // Changed to chatBody per the HTML
    const userInput = document.getElementById("userInput");
    
    // Add an event listener for Enter key in the input field
    if (userInput) {
        userInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Make functions globally available
    window.sendMessage = sendMessage;
    window.toggleChatbox = toggleChatbox;
    window.showLocation = showLocation;
    window.closeLocation = closeLocation;
    window.copyLocation = copyLocation;
    
    // Add initial message
    appendMessage("Bot", "Hello! I'm your emergency response assistant. How can I help you today?");
});

// Function to show location dialog and fetch current location
function showLocation() {
    const locationDialog = document.getElementById("locationDialog");
    const coordinates = document.getElementById("locationCoordinates");
    const addressElement = document.getElementById("locationAddress");
    
    if (locationDialog) {
        locationDialog.style.display = "block";
    } else {
        console.error("Location dialog not found");
        return;
    }
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // Success callback
            function(position) {
                currentLocation.latitude = position.coords.latitude;
                currentLocation.longitude = position.coords.longitude;
                currentLocation.accuracy = position.coords.accuracy;
                
                const coordText = `Latitude: ${currentLocation.latitude.toFixed(6)}<br>` +
                                  `Longitude: ${currentLocation.longitude.toFixed(6)}<br>` +
                                  `Accuracy: ±${Math.round(currentLocation.accuracy)} meters`;
                
                if (coordinates) {
                    coordinates.innerHTML = coordText;
                }
                
                // Get address using reverse geocoding
                fetchAddress(currentLocation.latitude, currentLocation.longitude, addressElement);
            },
            // Error callback
            function(error) {
                console.error("Geolocation error:", error);
                if (coordinates) {
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            coordinates.innerHTML = "Location access denied. Please enable location services.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            coordinates.innerHTML = "Location information unavailable.";
                            break;
                        case error.TIMEOUT:
                            coordinates.innerHTML = "Location request timed out.";
                            break;
                        default:
                            coordinates.innerHTML = "An unknown error occurred.";
                    }
                }
                
                if (addressElement) {
                    addressElement.textContent = "Address not available";
                }
            },
            // Options
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        if (coordinates) {
            coordinates.innerHTML = "Geolocation is not supported by this browser.";
        }
    }
}

// Function to fetch address from coordinates using reverse geocoding
async function fetchAddress(latitude, longitude, addressElement) {
    try {
        // Using OpenStreetMap Nominatim API for reverse geocoding
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.display_name) {
            currentLocation.address = data.display_name;
            
            if (addressElement) {
                addressElement.textContent = data.display_name;
            }
        }
    } catch (error) {
        console.error("Error fetching address:", error);
        if (addressElement) {
            addressElement.textContent = "Unable to retrieve address";
        }
    }
}

// Function to close the location dialog
function closeLocation() {
    const locationDialog = document.getElementById("locationDialog");
    if (locationDialog) {
        locationDialog.style.display = "none";
    }
}

// Function to copy location information to clipboard
function copyLocation() {
    const locationText = `EMERGENCY LOCATION\n` +
                         `Latitude: ${currentLocation.latitude}\n` +
                         `Longitude: ${currentLocation.longitude}\n` +
                         `Accuracy: ±${Math.round(currentLocation.accuracy)} meters\n` +
                         `Address: ${currentLocation.address}`;
    
    // Create a temporary textarea element to copy from
    const textarea = document.createElement('textarea');
    textarea.value = locationText;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            alert('Location copied to clipboard!');
        } else {
            throw new Error('Copy command was unsuccessful');
        }
    } catch (err) {
        console.error('Failed to copy location: ', err);
        alert('Failed to copy location. Please try again.');
    } finally {
        document.body.removeChild(textarea);
    }
}

// Function to send user message and get bot response
async function sendMessage() {
    const chatbox = document.getElementById("chatBody");
    const userInput = document.getElementById("userInput");
    
    if (!chatbox || !userInput) {
        console.error("Chat elements not found");
        return;
    }
    
    let userMessage = userInput.value.trim();
    if (userMessage === "") return;
    
    console.log("User Message Sent:", userMessage);
    appendMessage("User", userMessage);
    userInput.value = "";

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are an emergency response chatbot for Rapid Relief, providing helpful information about disaster management and emergency response." },
                    { role: "user", content: userMessage }
                ]
            })
        });

        if (!response.ok) {
            console.error("API Error:", response.status, response.statusText);
            
            if (response.status === 429) {
                appendMessage("Bot", "⚠ Too many requests. Please wait a moment.");
            } else {
                appendMessage("Bot", `⚠ Error: ${response.status} ${response.statusText}`);
            }
            return;
        }

        const data = await response.json();
        console.log("Bot Response Data:", data); // Debugging

        if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
            appendMessage("Bot", "⚠ Unexpected API response format.");
            return;
        }

        const botReply = data.choices[0].message.content;
        appendMessage("Bot", botReply);

    } catch (error) {
        console.error("Fetch Error:", error);
        appendMessage("Bot", "⚠ Connection issue. Please try again.");
    }
}

// Function to append messages to the chatbox
function appendMessage(sender, message) {
    const chatbox = document.getElementById("chatBody");
    
    if (!chatbox) {
        console.error("Chatbox element not found");
        return;
    }
    
    const messageElement = document.createElement("p");
    messageElement.className = sender.toLowerCase() === "bot" ? "bot-message" : "user-message";
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Function to toggle the chatbox visibility
function toggleChatbox() {
    let chatbox = document.getElementById("chatbox");
    
    if (!chatbox) {
        console.error("Chatbox container not found");
        return;
    }
    
    if (chatbox.style.display === "none" || chatbox.style.display === "") {
        chatbox.style.display = "flex"; // Show chatbox
    } else {
        chatbox.style.display = "none"; // Hide chatbox
    }
}
