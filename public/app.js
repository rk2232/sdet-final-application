// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// State Management
let currentUser = null;
let authToken = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Check for Google OAuth callback
    handleGoogleCallback();
    checkAuth();
    setupEventListeners();
    loadPopularMovies();
});

// Handle Google OAuth callback
function handleGoogleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const username = urlParams.get('username');
    const error = urlParams.get('error');

    if (error) {
        showToast('Google authentication failed', 'error');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    if (token) {
        authToken = token;
        localStorage.setItem('authToken', authToken);
        
        // Fetch user profile
        fetchUserProfile().then(() => {
            showToast(`Welcome ${username || 'back'}!`, 'success');
            showPage('home');
            updateAuthUI();
        });
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Check Authentication
function checkAuth() {
    authToken = localStorage.getItem('authToken');
    if (authToken) {
        fetchUserProfile();
    } else {
        showPage('login');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            if (page === 'login' && authToken) {
                logout();
            } else {
                showPage(page);
            }
        });
    });

    // Auth Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            switchAuthTab(tab);
        });
    });

    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('preferences-form').addEventListener('submit', handleSavePreferences);

    // Search
    document.getElementById('home-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchMovies();
    });
    document.getElementById('movie-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchMovies();
    });

    // Modal
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// Navigation
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const pageElement = document.getElementById(`${pageName}-page`);
    if (pageElement) {
        pageElement.classList.add('active');
    }

    // Update nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });

    // Load page-specific content
    if (pageName === 'recommendations' && authToken) {
        loadRecommendations();
    } else if (pageName === 'profile' && authToken) {
        loadProfile();
    } else if (pageName === 'movies') {
        loadPopularMovies();
    }
}

// Auth Functions
function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });

    if (tab === 'login') {
        document.getElementById('login-form').classList.add('active');
    } else {
        document.getElementById('register-form').classList.add('active');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        hideLoading();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            showToast('Login successful!', 'success');
            showPage('home');
            updateAuthUI();
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('Error connecting to server', 'error');
    }
}

function loginWithGoogle() {
    // Redirect to Google OAuth endpoint
    fetch(`${API_BASE_URL}/auth/google`)
      .then(response => {
        if (response.ok) {
          window.location.href = `${API_BASE_URL}/auth/google`;
        } else {
          showToast('Google sign-in is not configured. Please use username/password login.', 'error');
        }
      })
      .catch(() => {
        showToast('Google sign-in is not configured. Please use username/password login.', 'error');
      });
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();
        hideLoading();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            showToast('Registration successful!', 'success');
            showPage('home');
            updateAuthUI();
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('Error connecting to server', 'error');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateAuthUI();
    showPage('login');
    showToast('Logged out successfully', 'success');
}

function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (authToken) {
        authLink.textContent = 'Logout';
        authLink.setAttribute('data-page', 'logout');
    } else {
        authLink.textContent = 'Login';
        authLink.setAttribute('data-page', 'login');
    }
}

async function fetchUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
        });

        if (response.ok) {
            currentUser = await response.json();
            updateAuthUI();
        } else {
            localStorage.removeItem('authToken');
            authToken = null;
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

// Movie Functions
async function loadPopularMovies() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/movies/popular`);
        const data = await response.json();
        hideLoading();

        if (data.movies) {
            displayMovies(data.movies, 'popular-movies');
        }
    } catch (error) {
        hideLoading();
        showToast('Error loading movies', 'error');
    }
}

async function searchMovies() {
    const query = document.getElementById('movie-search')?.value || 
                  document.getElementById('home-search')?.value;

    if (!query) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/movies/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        hideLoading();

        if (data.movies) {
            displayMovies(data.movies, 'movies-results');
            showPage('movies');
        }
    } catch (error) {
        hideLoading();
        showToast('Error searching movies', 'error');
    }
}

function displayMovies(movies, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="${movie.poster_url || 'https://via.placeholder.com/200x300?text=No+Image'}" 
                 alt="${movie.title}" 
                 class="movie-poster"
                 onerror="this.src='https://via.placeholder.com/200x300?text=No+Image'">
            <div class="movie-info">
                <div class="movie-title">${movie.title}</div>
                <div class="movie-rating">
                    ⭐ ${movie.vote_average?.toFixed(1) || 'N/A'}
                </div>
            </div>
        `;
        card.addEventListener('click', () => showMovieDetails(movie.id));
        container.appendChild(card);
    });
}

async function showMovieDetails(movieId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/movies/${movieId}`);
        const movie = await response.json();
        hideLoading();

        const modal = document.getElementById('movie-modal');
        const details = document.getElementById('movie-details');

        details.innerHTML = `
            <div style="display: grid; grid-template-columns: 300px 1fr; gap: 2rem;">
                <img src="${movie.poster_url || 'https://via.placeholder.com/300x450'}" 
                     alt="${movie.title}" 
                     style="width: 100%; border-radius: 10px;">
                <div>
                    <h2>${movie.title}</h2>
                    <p style="color: var(--text-secondary); margin: 1rem 0;">
                        ${movie.overview || 'No description available'}
                    </p>
                    <div style="margin: 1rem 0;">
                        <strong>Rating:</strong> ⭐ ${movie.vote_average?.toFixed(1) || 'N/A'} / 10
                    </div>
                    <div style="margin: 1rem 0;">
                        <strong>Release Date:</strong> ${movie.release_date || 'N/A'}
                    </div>
                    <div style="margin: 1rem 0;">
                        <strong>Genres:</strong> ${movie.genres?.map(g => g.name).join(', ') || 'N/A'}
                    </div>
                    ${authToken ? `
                        <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                            <button onclick="addToWatchHistory(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')" 
                                    class="btn-primary">
                                Mark as Watched
                            </button>
                            <input type="number" id="movie-rating" min="1" max="10" 
                                   placeholder="Rating (1-10)" 
                                   style="padding: 0.75rem; border-radius: 10px; border: 2px solid rgba(99, 102, 241, 0.3); background: rgba(26, 26, 46, 0.8); color: white; width: 150px;">
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        modal.style.display = 'block';
    } catch (error) {
        hideLoading();
        showToast('Error loading movie details', 'error');
    }
}

function closeModal() {
    document.getElementById('movie-modal').style.display = 'none';
}

async function addToWatchHistory(movieId, movieTitle) {
    if (!authToken) {
        showToast('Please login to add movies', 'error');
        return;
    }

    const rating = document.getElementById('movie-rating')?.value;

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/users/watch-history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                movieId,
                movieTitle,
                rating: rating ? parseInt(rating) : null,
            }),
        });

        const data = await response.json();
        hideLoading();

        if (response.ok) {
            showToast('Added to watch history!', 'success');
            closeModal();
            if (document.getElementById('profile-page').classList.contains('active')) {
                loadProfile();
            }
        } else {
            showToast(data.error || 'Error adding to watch history', 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('Error connecting to server', 'error');
    }
}

// Recommendations
async function loadRecommendations() {
    if (!authToken) {
        showToast('Please login to see recommendations', 'error');
        showPage('login');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/recommendations`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
        });

        const data = await response.json();
        hideLoading();

        if (data.recommendations) {
            displayMovies(data.recommendations, 'recommendations-results');
        } else {
            document.getElementById('recommendations-results').innerHTML = 
                '<p>No recommendations available. Add some movies to your watch history!</p>';
        }
    } catch (error) {
        hideLoading();
        showToast('Error loading recommendations', 'error');
    }
}

// Profile Functions
async function loadProfile() {
    if (!authToken) return;

    try {
        // Load user info
        const userResponse = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
        });
        const user = await userResponse.json();

        document.getElementById('profile-info').innerHTML = `
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
        `;

        // Load stats
        const statsResponse = await fetch(`${API_BASE_URL}/users/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
        });
        const stats = await statsResponse.json();

        document.getElementById('user-stats').innerHTML = `
            <p><strong>Total Watched:</strong> ${stats.totalWatched || 0}</p>
            <p><strong>Average Rating:</strong> ${stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}</p>
            <p><strong>Rated Movies:</strong> ${stats.ratedCount || 0}</p>
        `;

        // Load preferences
        const prefsResponse = await fetch(`${API_BASE_URL}/users/preferences`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
        });
        const prefs = await prefsResponse.json();

        if (prefs) {
            document.getElementById('favorite-genres').value = prefs.favorite_genres || '';
            document.getElementById('favorite-actors').value = prefs.favorite_actors || '';
            document.getElementById('min-rating').value = prefs.min_rating || 6.0;
        }

        // Load watch history
        const historyResponse = await fetch(`${API_BASE_URL}/users/watch-history`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
        });
        const history = await historyResponse.json();

        const historyContainer = document.getElementById('watch-history');
        if (history.length === 0) {
            historyContainer.innerHTML = '<p>No watch history yet.</p>';
        } else {
            historyContainer.innerHTML = history.map(item => `
                <div class="watch-history-item">
                    <div>
                        <strong>${item.movie_title}</strong>
                        ${item.rating ? `<span style="color: var(--warning); margin-left: 1rem;">⭐ ${item.rating}/10</span>` : ''}
                    </div>
                    <button onclick="deleteWatchHistory(${item.id})" style="padding: 0.5rem 1rem; background: var(--error); color: white; border: none; border-radius: 5px; cursor: pointer;">Delete</button>
                </div>
            `).join('');
        }

        // Update chart
        updateStatsChart(stats);
    } catch (error) {
        showToast('Error loading profile', 'error');
    }
}

async function handleSavePreferences(e) {
    e.preventDefault();
    if (!authToken) return;

    const favoriteGenres = document.getElementById('favorite-genres').value;
    const favoriteActors = document.getElementById('favorite-actors').value;
    const minRating = parseFloat(document.getElementById('min-rating').value);

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/users/preferences`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                favoriteGenres,
                favoriteActors,
                minRating,
            }),
        });

        const data = await response.json();
        hideLoading();

        if (response.ok) {
            showToast('Preferences saved!', 'success');
        } else {
            showToast(data.error || 'Error saving preferences', 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('Error connecting to server', 'error');
    }
}

async function deleteWatchHistory(id) {
    if (!authToken) return;

    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/users/watch-history/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` },
        });

        hideLoading();

        if (response.ok) {
            showToast('Deleted successfully', 'success');
            loadProfile();
        } else {
            showToast('Error deleting item', 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('Error connecting to server', 'error');
    }
}

function updateStatsChart(stats) {
    const ctx = document.getElementById('stats-chart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total Watched', 'Rated Movies'],
            datasets: [{
                label: 'Your Statistics',
                data: [stats.totalWatched || 0, stats.ratedCount || 0],
                backgroundColor: ['rgba(99, 102, 241, 0.8)', 'rgba(139, 92, 246, 0.8)'],
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#a0a0a0' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                },
                x: {
                    ticks: { color: '#a0a0a0' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                },
            },
        },
    });
}

// Utility Functions
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

