export function setupAuth({ onAuthSuccess }) {
    const overlay = document.getElementById('authOverlay');
    const form = document.getElementById('authForm');
    const toggle = document.getElementById('toggleAuth');
    const title = document.getElementById('authTitle');
    const errorDiv = document.getElementById('authError');

    let isLogin = false;

    function showError(msg) {
        errorDiv.textContent = msg;
        errorDiv.style.display = 'block';
    }

    toggle.onclick = () => {
        isLogin = !isLogin;
        title.textContent = isLogin ? 'Login' : 'Sign Up';
        form.querySelector('button').textContent = isLogin ? 'Login' : 'Sign Up';
        toggle.textContent = isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login";
        form.querySelector('#authName').style.display = isLogin ? 'none' : '';
        errorDiv.style.display = 'none';
    };

    form.onsubmit = function(e) {
        e.preventDefault();
        const name = form.querySelector('#authName').value;
        const email = form.querySelector('#authEmail').value;
        const password = form.querySelector('#authPassword').value;

        // Replace this with your backend API call
        fetch(isLogin ? '/api/login' : '/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                overlay.style.display = 'none';
                onAuthSuccess(data.user); // Pass user info to game
            } else {
                showError(data.message || 'Authentication failed');
            }
        })
        .catch(() => showError('Network error'));
    };
}