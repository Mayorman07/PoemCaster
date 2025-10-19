// 1. Import poems from their individual files
import { venicePoem } from './poems/venice.js';
import { milanPoem } from './poems/milan.js';
import { romePoem } from './poems/rome.js';
import { parisPoem } from './poems/paris.js';
import { lagosPoem } from './poems/lagos.js';
// Add more imports here as you create more poem files

// 2. Create the central map including image paths (use lowercase keys)
const poems = {
  "venice": {
    lines: venicePoem,
    image: 'img/venice.jpg' // Add image path for Venice
  },
  "lagos": {
    lines: venicePoem,
    image: 'img/lagos.jpg' // Add image path for Venice
  },
  "milan": {
    lines: milanPoem,
    image: 'img/milan.jpg' // Add image path for Milan
  },
  "rome": {
    lines: romePoem,
    image: 'img/rome.jpg' // Add image path for Rome
  },
  "room": { // Alias for Rome
    lines: romePoem,
    image: 'img/rome.jpg'
  },
  "paris": {
    lines: parisPoem,
    image: 'img/paris.jpg' // Add image path for Paris
  },
  "pari": { // Alias for Paris
    lines: parisPoem,
    image: 'img/paris.jpg'
  }
  // Add more cities with their lines and images here
};

const defaultMessage = "Lovely hearing your voice, the city you named is currently unavailable";
const defaultBackgroundImage = 'img/fog.jpg'; // Your desired default background

// 3. Get HTML elements using the new IDs
const micButton = document.getElementById('micButton');
const statusDisplay = document.getElementById('status');
const poemOutput = document.getElementById('poemOutput');

// 4. State Variables
let isRecognizing = false;
let isSpeaking = false;
let voices = []; // Keep track of available voices

// --- New Simple Function to Set Background ---
function changeBackgroundImage(imagePath) {
    if (imagePath) { // Only change if a path is provided
        console.log("Changing background to:", imagePath);
        document.body.style.backgroundImage = `url('${imagePath}')`;
    }
}

// --- Set Initial Background on Load ---
window.addEventListener('load', () => {
    changeBackgroundImage(defaultBackgroundImage); // Set the default background when the page loads
});

// 5. Check for Speech Recognition support
if (!("SpeechRecognition" in window)) {
    window.SpeechRecognition = window.webkitSpeechRecognition;
}

if (!window.SpeechRecognition) {
    statusDisplay.textContent = "Sorry, your browser doesn't support Speech Recognition.";
    if (micButton) micButton.disabled = true; // Disable mic if not supported
} else {
    const recognition = new window.SpeechRecognition();
    recognition.continuous = false; // Stop listening after one result
    recognition.interimResults = false;
    recognition.lang = 'en-US'; // Set language

    // --- Voice Loading ---
    function loadVoices() {
        voices = window.speechSynthesis.getVoices();
    }
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Initial load attempt

    // --- Speech Recognition Event Handlers ---

    recognition.onresult = (event) => {
        if (isSpeaking) return; // Don't process if already speaking

        const spokenWord = event.results[0][0].transcript.toLowerCase().trim();
        console.log("SpeechRecognition heard:", spokenWord);
        statusDisplay.textContent = `You said: "${spokenWord}"`;
        poemOutput.textContent = ""; // Clear previous poem text display

        // Lookup the poem data
        if (poems[spokenWord]) {
            const poemData = poems[spokenWord];
            const poemLines = poemData.lines;
            const imagePath = poemData.image;

            // ✅ CHANGE BACKGROUND IMAGE IMMEDIATELY
            changeBackgroundImage(imagePath);

            poemOutput.innerHTML = poemLines.join('<br>');

            // Speak the message (without the background change in the callback)
            speakMessage(poemLines); // REMOVED the callback from here

        } else {
            // Default message - Change background immediately too
            // ✅ CHANGE BACKGROUND IMAGE IMMEDIATELY
            changeBackgroundImage(defaultBackgroundImage);

            poemOutput.textContent = defaultMessage;
            speakMessage(defaultMessage); // REMOVED the callback from here
        }
    };

    recognition.onerror = (e) => {
        console.error("Recognition error:", e);
        statusDisplay.textContent = "Error during recognition: " + e.error;
        isRecognizing = false; // Reset flag on error
    };

    recognition.onstart = () => {
        isRecognizing = true;
        statusDisplay.textContent = "Listening...";
        // Optional: Add visual feedback for listening state
    };

    recognition.onend = () => {
        isRecognizing = false;
        // Reset status only if not currently speaking
        if (!isSpeaking) {
             statusDisplay.textContent = "Press the mic to start...";
        }
        // Optional: Remove visual feedback for listening state
    };

    // --- Microphone Button Event Listener ---
    if (micButton) {
        micButton.addEventListener('click', () => {
            if (isRecognizing) {
                recognition.stop(); // Allow stopping if already listening
            } else if (!isSpeaking) { // Prevent starting if already speaking
                 try {
                     recognition.start();
                 } catch (error) {
                      console.error("Error starting recognition:", error);
                      statusDisplay.textContent = "Could not start listening. Try again.";
                 }
            }
        });
    }

    // --- Speech Synthesis Function (Updated for Array Input) ---
    function speakMessage(textOrLines, callback = null) {
        speechSynthesis.cancel(); // Cancel any current speech

        let textToSpeak;
        if (Array.isArray(textOrLines)) {
            // If it's an array, join lines with a pause (comma + space works well for speech)
            textToSpeak = textOrLines.join(', ');
        } else {
            // If it's already a string (like the default message)
            textToSpeak = textOrLines;
        }

        const speech = new SpeechSynthesisUtterance(textToSpeak);

        // Optional: Voice selection
        const selectedVoice = voices.find(v => v.name.includes('Google UK English Female'));
        if (selectedVoice) {
            speech.voice = selectedVoice;
            console.log("Using voice:", selectedVoice.name);
        } else {
             // Fallback or just use default
            console.log("Default voice used.");
        }

        isSpeaking = true; // Set speaking flag

        speech.onend = () => {
            console.log("Finished speaking.");
            isSpeaking = false; // Clear speaking flag
             statusDisplay.textContent = "Press the mic to start..."; // Reset status after speaking
            if (callback) callback(); // Call callback if provided
        };

        speech.onerror = (e) => {
            console.error("Speech synthesis error:", e);
            isSpeaking = false; // Clear flag on error
             statusDisplay.textContent = "Error speaking. Try again.";
        };

        // Delay slightly might help ensure voice list is ready
        setTimeout(() => {
            try {
                 window.speechSynthesis.speak(speech);
            } catch (error) {
                 console.error("Error initiating speech synthesis:", error);
                 statusDisplay.textContent = "Could not start speaking.";
                 isSpeaking = false;
            }
        }, 100);
    }

} // End of SpeechRecognition support check