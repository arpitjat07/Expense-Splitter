// Login/Signup Logic - Validated for New Config

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (window.auth) {
        window.auth.onAuthStateChanged(user => {
            if (user && !window.location.pathname.includes('dashboard.html')) {
                console.log("User already logged in, redirecting to dashboard...");
                window.location.href = 'dashboard.html';
            }
        });
    }

    // Tab Switching
    const tabs = {
        signin: document.getElementById('signin-tab'),
        signup: document.getElementById('signup-tab')
    };
    const forms = {
        signin: document.getElementById('signin-form'),
        signup: document.getElementById('signup-form')
    };

    window.switchTab = function (tabName) {
        // Reset classes
        Object.values(tabs).forEach(t => t.classList.remove('active'));
        Object.values(forms).forEach(f => f.classList.remove('active'));

        // Activate selected
        tabs[tabName].classList.add('active');
        forms[tabName].classList.add('active');
    };

    // Password Toggle
    window.togglePassword = function (inputId, btn) {
        const input = document.getElementById(inputId);
        const iconPaths = btn.querySelectorAll('svg');

        if (input.type === 'password') {
            input.type = 'text';
            iconPaths[0].style.display = 'none'; // eye
            iconPaths[1].style.display = 'block'; // eye-off
        } else {
            input.type = 'password';
            iconPaths[0].style.display = 'block';
            iconPaths[1].style.display = 'none';
        }
    };
});

// Helper: Username to Email
function getEmail(username) {
    return `${username.toLowerCase().replace(/\s+/g, '')}@expensesplitter.app`;
}

// Sign In Handler
window.handleSignIn = async function (e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    const username = document.getElementById('signin-username').value.trim();
    const password = document.getElementById('signin-password').value;

    if (!username || !password) return alert('Please enter both username and password.');

    try {
        btn.textContent = 'Signing In...';
        btn.disabled = true;

        const email = getEmail(username);
        await window.auth.signInWithEmailAndPassword(email, password);
        // Redirect handled by onAuthStateChanged
    } catch (error) {
        console.error("Login Error:", error);
        alert("Login failed: " + error.message);
        btn.textContent = originalText;
        btn.disabled = false;
    }
};

// Sign Up Handler
window.handleSignUp = async function (e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    const first = document.getElementById('signup-firstname').value.trim();
    const last = document.getElementById('signup-lastname').value.trim();
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!first || !last || !username || !password) {
        return alert('Please fill in all fields.');
    }
    if (password.length < 6) {
        return alert('Password must be at least 6 characters.');
    }

    try {
        btn.textContent = 'Creating Account...';
        btn.disabled = true;

        const email = getEmail(username);

        // 1. Create User
        const cred = await window.auth.createUserWithEmailAndPassword(email, password);
        const user = cred.user;

        // 2. Update Profile
        await user.updateProfile({
            displayName: `${first} ${last}`
        });

        // 3. Save User Data to Firestore
        await window.db.collection('users').doc(user.uid).set({
            firstName: first,
            lastName: last,
            username: username,
            email: email,
            uid: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

    } catch (error) {
        console.error("Signup Error:", error);
        alert("Signup failed: " + error.message);
        btn.textContent = originalText;
        btn.disabled = false;
    }
};
