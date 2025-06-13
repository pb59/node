export function setupUserProfile({ onProfileReady }) {
    const userOverlay = document.getElementById('userFormOverlay');
    const userForm = document.getElementById('userForm');

    userForm.onsubmit = function(e) {
        e.preventDefault();
        const userInfo = {
            name: document.getElementById('userName').value,
            age: parseInt(document.getElementById('userAge').value, 10),
            skill: document.getElementById('userSkill').value,
            expertise: parseInt(document.getElementById('userExpertise').value, 10),
            email: document.getElementById('userEmail') ? document.getElementById('userEmail').value : "",
            password: document.getElementById('userPassword') ? document.getElementById('userPassword').value : ""
        };
        userOverlay.style.display = 'none';
        if (onProfileReady) onProfileReady(userInfo);
    };
}