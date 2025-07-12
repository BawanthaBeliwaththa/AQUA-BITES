document.addEventListener('DOMContentLoaded', function() {
    console.log("[Init] Starting authentication system");
    
    const firebaseConfig = {
        apiKey: "AIzaSyBpKRY83AmkPKDlM681bO-_f4-RVEODKJc",
        authDomain: "fish-feed-test.firebaseapp.com",
        databaseURL: "https://fish-feed-test-default-rtdb.firebaseio.com",
        projectId: "fish-feed-test",
        storageBucket: "fish-feed-test.appspot.com",
        messagingSenderId: "770716235170",
        appId: "1:770716235170:web:1c8a2568b0f23df2d06efb",
        measurementId: "G-T46SCXTHC3"
    };

    // Initialize Firebase
    if (!firebase.apps.length) {
        try {
            firebase.initializeApp(firebaseConfig);
            console.log("[Init] Firebase initialized successfully");
        } catch (error) {
            console.error("[Error] Firebase initialization failed:", error);
            showError("System initialization failed. Please refresh.");
            return;
        }
    }

    const auth = firebase.auth();
    const database = firebase.database();

    // Enhanced logout functionality
    document.addEventListener('click', function(e) {
        if (e.target && (e.target.id === 'logout-btn' || e.target.closest('#logout-btn'))) {
            console.log("[Auth] Logout initiated");
            auth.signOut().then(() => {
                console.log("[Auth] User signed out");
                window.location.href = 'login.html';
            }).catch(error => {
                console.error("[Error] Logout failed:", error);
                showError("Logout failed. Please try again.");
            });
        }
    });

    auth.onAuthStateChanged(user => {
        console.log(`[Auth] State changed. User: ${user ? user.email : 'None'}`);
        
        if (user) {
            checkUserAuthorization(user);
        } else {
            handleNoUser();
        }
    });

    async function checkUserAuthorization(user) {
        console.log(`[Auth] Checking authorization for ${user.email}`);
        try {
            const [isAuthorized, isAdmin] = await Promise.all([
                checkPathExists(`authorizedUsers/${user.uid}`),
                checkPathExists(`admins/${user.uid}`)
            ]);
            
            handleAuthorization(user, isAuthorized, isAdmin);
        } catch (error) {
            console.error("[Error] Authorization check failed:", error);
            showError("Authorization check failed. Please try again.");
        }
    }

    async function checkPathExists(path) {
        try {
            const snapshot = await database.ref(path).once('value');
            return snapshot.exists();
        } catch (error) {
            console.error("[Error] Path check failed:", error);
            return false;
        }
    }

    function handleAuthorization(user, isAuthorized, isAdmin) {
        const currentPage = window.location.pathname.split('/').pop();
        
        if (isAdmin || user.email === "bawanthabeliwaththa@gmail.com") {
            console.log("[Auth] User is admin or owner");
            if (!currentPage.includes('admin.html')) {
                console.log("[Auth] Redirecting admin/owner to admin panel");
                window.location.href = 'admin.html';
            } else {
                initializeAuthorizedUser(user);
            }
        } else if (isAuthorized) {
            console.log("[Auth] User is authorized");
            if (currentPage.includes('admin.html')) {
                console.log("[Auth] Redirecting user to dashboard");
                window.location.href = 'index.html';
            } else {
                initializeAuthorizedUser(user);
            }
        } else {
            console.log("[Auth] User not authorized");
            redirectToApproval();
        }
    }

    function initializeAuthorizedUser(user) {
        console.log("[Init] Setting up UI for authorized user");
        updateUserProfile(user);
        document.dispatchEvent(new Event('auth-complete'));
    }

    function updateUserProfile(user) {
        console.log("[UI] Updating user profile");
        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        setText('username-display', user.displayName || user.email.split('@')[0]);
        setText('user-fullname', user.displayName || user.email);
        setText('user-email', user.email);

        const avatar = document.getElementById('user-avatar');
        if (avatar) {
            avatar.src = user.photoURL || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email.split('@')[0])}`;
        }
    }

    function handleNoUser() {
        console.log("[Auth] No user detected");
        const currentPage = window.location.pathname.split('/').pop();
        if (!currentPage.includes('login.html') && !currentPage.includes('waiting-approval.html')) {
            console.log("[Auth] Redirecting to login");
            window.location.href = 'login.html';
        }
    }

    function redirectToApproval() {
        console.log("[Auth] Redirecting to approval page");
        const currentPage = window.location.pathname.split('/').pop();
        if (!currentPage.includes('waiting-approval.html')) {
            window.location.href = 'waiting-approval.html';
        }
    }

    function showError(message) {
        console.error("[UI Error]", message);
        const alertBox = document.getElementById('alert-box');
        if (alertBox) {
            alertBox.textContent = message;
            alertBox.style.display = 'block';
            alertBox.className = 'alert-box error';
            setTimeout(() => {
                alertBox.style.display = 'none';
            }, 5000);
        }
    }
});