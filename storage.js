// ===============================
// STORAGE UTILITIES
// ===============================

// Get data safely
function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

// Save data safely
function setData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}


// 🚀 When This Becomes Powerful
//Later if you decide to:
//Replace LocalStorage with a database
//Connect to a backend
//Use IndexedDB
//Sync with cloud..............
//You only modify storage.js
//Everything else stays untouched.
//That’s professional design.
