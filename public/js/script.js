// Main script.js
window.addEventListener('load', function () {
  const userId = localStorage.getItem('user_id');

  if (userId) {
    // User is already logged in, redirect to home page
window.location.href = 'index.html';
  }

  // Handle registration form
  const form = document.querySelector('#register-form');
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.querySelector('#name').value;
      const email = document.querySelector('#email').value;
      const password = document.querySelector('#password').value;

      // Validate form data
      if (!name || !email || !password) {
        alert('Please fill in all fields!');
        return;
      }

      // Simple form submission (you can enhance this with AJAX later)
      alert('Registration form submitted with:\nName: ' + name + '\nEmail: ' + email);
      
      // For now, just simulate success
      localStorage.setItem('user_id', '1');
      alert('Registration successful!');
window.location.href = 'dashboard.html';
    });
  }
});
