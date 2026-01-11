// verify_password.js
const bcrypt = require('bcrypt');

async function verifyPassword() {
    const enteredPassword = "ark12345"; // What user typed
    const storedHash = "$2b$10$c2/cHbvNwaeLaA1qznaku.ihKG/ykl34UFhMKuVkYV0XE/C1pYK/K"; // From your DB

    const match = await bcrypt.compare(enteredPassword, storedHash);

    if (match) {
        console.log("✅ Password is correct!");
    } else {
        console.log("❌ Invalid password.");
    }
}

verifyPassword();
