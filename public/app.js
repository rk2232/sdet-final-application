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
    
    // Load movies based on current page
    const currentPage = document.querySelector('.page.active');
    if (currentPage) {
        if (currentPage.id === 'home-page') {
            loadPopularMovies();
        } else if (currentPage.id === 'movies-page') {
            // Load movies for movies page immediately - direct approach
            const container = document.getElementById('movies-results');
            if (container) {
                const fallbackMovies = getFallbackMovies();
                console.log('Initial load: displaying', fallbackMovies.length, 'movies');
                displayMovies(fallbackMovies, 'movies-results');
            }
            forceLoadMoviesPage();
        } else if (currentPage.id === 'recommendations-page') {
            // Load recommendations
            loadRecommendations();
        }
    }
    
    // Add MutationObserver to watch for page visibility changes
    const pageObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.id === 'movies-page' && target.classList.contains('active')) {
                    console.log('Movies page became active, loading movies');
                    forceLoadMoviesPage();
                }
            }
        });
    });
    
    // Observe all page elements
    document.querySelectorAll('.page').forEach(page => {
        pageObserver.observe(page, { attributes: true, attributeFilter: ['class'] });
    });
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
    }
    // Don't automatically redirect to login - let users browse the home page
    updateAuthUI();
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
            } else if (page === 'logout') {
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

    // Map page names to actual page IDs
    const pageIdMap = {
        'login': 'auth-page',
        'register': 'auth-page',
        'home': 'home-page',
        'movies': 'movies-page',
        'recommendations': 'recommendations-page',
        'profile': 'profile-page'
    };

    const actualPageId = pageIdMap[pageName] || `${pageName}-page`;
    const pageElement = document.getElementById(actualPageId);
    if (pageElement) {
        pageElement.classList.add('active');
        
        // If showing auth page, make sure the correct tab is active
        if (pageName === 'login' || pageName === 'register') {
            switchAuthTab(pageName);
        }
    }

    // Update nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });

    // Load page-specific content
    if (pageName === 'recommendations') {
        // Always try to load recommendations, show fallback if not logged in or API fails
        if (authToken) {
            loadRecommendations();
        } else {
            // Show fallback movies even if not logged in
            const container = document.getElementById('recommendations-results');
            if (container) {
                const fallbackMovies = getFallbackMovies();
                displayMovies(fallbackMovies, 'recommendations-results');
                showToast('Please login for personalized recommendations', 'warning');
            }
        }
    } else if (pageName === 'profile' && authToken) {
        loadProfile();
    } else if (pageName === 'movies') {
        // Force load movies immediately - don't wait for anything
        console.log('Movies page shown, loading movies immediately');
        
        // Direct approach - load movies NOW
        function loadMoviesDirectly() {
            const container = document.getElementById('movies-results');
            if (container) {
                const fallbackMovies = getFallbackMovies();
                if (fallbackMovies && fallbackMovies.length > 0) {
                    console.log('Loading', fallbackMovies.length, 'fallback movies directly');
                    displayMovies(fallbackMovies, 'movies-results');
                    return true;
                } else {
                    console.error('getFallbackMovies() returned empty or invalid data');
                }
            } else {
                console.error('movies-results container not found');
            }
            return false;
        }
        
        // Try immediately
        if (!loadMoviesDirectly()) {
            // Retry with delays
            setTimeout(() => loadMoviesDirectly(), 10);
            setTimeout(() => loadMoviesDirectly(), 50);
            setTimeout(() => loadMoviesDirectly(), 100);
            setTimeout(() => loadMoviesDirectly(), 200);
            setTimeout(() => loadMoviesDirectly(), 500);
        }
        
        // Try API in background (non-blocking)
        setTimeout(() => loadMoviesForMoviesPage(), 1000);
    } else if (pageName === 'home') {
        // Reload popular movies when showing home page
        const container = document.getElementById('popular-movies');
        if (container && container.innerHTML === '') {
            loadPopularMovies();
        }
    } else if (pageName === 'login' || pageName === 'register') {
        // Ensure auth page is visible and correct tab is shown
        const authPage = document.getElementById('auth-page');
        if (authPage) {
            authPage.classList.add('active');
            switchAuthTab(pageName);
        }
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
    const container = document.getElementById('popular-movies');
    if (!container) return;
    
    // Show fallback movies immediately
    const fallbackMovies = getFallbackMovies();
    displayMovies(fallbackMovies, 'popular-movies');
    
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/movies/popular`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        hideLoading();

        if (data.movies && data.movies.length > 0) {
            displayMovies(data.movies, 'popular-movies');
        }
        // If API returns empty, keep fallback movies
    } catch (error) {
        hideLoading();
        console.error('Error loading movies:', error);
        // Keep fallback movies displayed
    }
}

// Force load movies for Movies page - multiple attempts to ensure it works
function forceLoadMoviesPage() {
    const fallbackMovies = getFallbackMovies();
    console.log('forceLoadMoviesPage called with', fallbackMovies.length, 'movies');
    
    // Try immediately
    const container1 = document.getElementById('movies-results');
    if (container1 && fallbackMovies && fallbackMovies.length > 0) {
        console.log('Loading movies immediately');
        displayMovies(fallbackMovies, 'movies-results');
    }
    
    // Try after 50ms
    setTimeout(() => {
        const container2 = document.getElementById('movies-results');
        if (container2) {
            const currentContent = container2.innerHTML.trim();
            if (!currentContent || currentContent === '') {
                console.log('Loading movies after 50ms delay');
                displayMovies(fallbackMovies, 'movies-results');
            }
        }
    }, 50);
    
    // Try after 200ms
    setTimeout(() => {
        const container3 = document.getElementById('movies-results');
        if (container3) {
            const currentContent = container3.innerHTML.trim();
            if (!currentContent || currentContent === '') {
                console.log('Loading movies after 200ms delay');
                displayMovies(fallbackMovies, 'movies-results');
            }
        }
    }, 200);
    
    // Try to load from API
    loadMoviesForMoviesPage();
}

// Load movies specifically for the Movies page
async function loadMoviesForMoviesPage() {
    const container = document.getElementById('movies-results');
    if (!container) {
        console.error('movies-results container not found in loadMoviesForMoviesPage');
        // Ensure fallback movies are shown even if container not found initially
        setTimeout(() => {
            const retryContainer = document.getElementById('movies-results');
            if (retryContainer) {
                const fallbackMovies = getFallbackMovies();
                displayMovies(fallbackMovies, 'movies-results');
            }
        }, 300);
        return;
    }
    
    // Always ensure fallback movies are shown first
    const fallbackMovies = getFallbackMovies();
    if (fallbackMovies && fallbackMovies.length > 0) {
        const currentContent = container.innerHTML.trim();
        if (!currentContent || currentContent === '') {
            console.log('Container empty, loading fallback movies');
            displayMovies(fallbackMovies, 'movies-results');
        }
    }
    
    // Try to load from API (non-blocking)
    try {
        const response = await fetch(`${API_BASE_URL}/movies/popular`, {
            signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.movies && data.movies.length > 0) {
                console.log('Loaded', data.movies.length, 'movies from API');
                displayMovies(data.movies, 'movies-results');
            }
        }
    } catch (error) {
        console.error('Error loading movies for movies page:', error);
        // Keep fallback movies displayed - they're already shown above
    }
}

async function searchMovies() {
    const query = document.getElementById('movie-search')?.value || 
                  document.getElementById('home-search')?.value;

    if (!query) return;

    const container = document.getElementById('movies-results');
    if (!container) {
        showPage('movies');
        // Wait a bit for the page to render
        setTimeout(() => searchMovies(), 100);
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/movies/search?query=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        hideLoading();

        if (data.movies && data.movies.length > 0) {
            displayMovies(data.movies, 'movies-results');
            showPage('movies');
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No movies found for your search.</p>';
            showPage('movies');
        }
    } catch (error) {
        hideLoading();
        console.error('Error searching movies:', error);
        // Show fallback movies on error
        const fallbackMovies = getFallbackMovies().filter(m => 
            m.title.toLowerCase().includes(query.toLowerCase())
        );
        if (fallbackMovies.length > 0) {
            displayMovies(fallbackMovies, 'movies-results');
            showPage('movies');
            showToast('Showing fallback results. API may not be configured.', 'warning');
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No movies found. Please check your TMDB API key configuration.</p>';
            showPage('movies');
        }
    }
}

function displayMovies(movies, containerId) {
    console.log(`displayMovies called with ${movies?.length || 0} movies for container: ${containerId}`);
    
    if (!movies || movies.length === 0) {
        console.warn('No movies to display');
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No movies found.</p>';
        }
        return;
    }
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID "${containerId}" not found`);
        // Try to find it with a delay
        setTimeout(() => {
            const retryContainer = document.getElementById(containerId);
            if (retryContainer) {
                console.log('Found container on retry, displaying movies');
                renderMoviesToContainer(movies, retryContainer);
            } else {
                console.error(`Container "${containerId}" still not found after retry`);
            }
        }, 100);
        return;
    }

    renderMoviesToContainer(movies, container);
}

function renderMoviesToContainer(movies, container) {
    if (!container) {
        console.error('renderMoviesToContainer: container is null');
        return;
    }
    
    console.log(`Rendering ${movies.length} movies to container`);
    container.innerHTML = '';

    let renderedCount = 0;
    movies.forEach((movie, index) => {
        if (!movie || !movie.title) {
            console.warn('Invalid movie data at index', index, ':', movie);
            return;
        }

        try {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.innerHTML = `
                <img src="${movie.poster_url || 'https://via.placeholder.com/200x300?text=No+Image'}" 
                     alt="${movie.title}" 
                     class="movie-poster"
                     onerror="this.src='https://via.placeholder.com/200x300?text=No+Image'">
                <div class="movie-info">
                    <div class="movie-title" title="${movie.title}">${movie.title || 'Untitled Movie'}</div>
                    <div class="movie-rating">
                        ⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                    </div>
                </div>
            `;
            card.addEventListener('click', () => showMovieDetails(movie.id));
            container.appendChild(card);
            renderedCount++;
        } catch (error) {
            console.error('Error rendering movie at index', index, ':', error);
        }
    });
    
    console.log(`Successfully rendered ${renderedCount} out of ${movies.length} movies`);
    
    // Verify movies are actually in the DOM
    const movieCards = container.querySelectorAll('.movie-card');
    console.log(`Verified: ${movieCards.length} movie cards in DOM`);
    
    if (movieCards.length === 0) {
        console.error('No movie cards were added to the container! Using direct HTML injection');
        // Last resort - add HTML directly with proper escaping
        const moviesHTML = movies.map(movie => {
            if (!movie || !movie.title) return '';
            const title = String(movie.title).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            const posterUrl = movie.poster_url || 'https://via.placeholder.com/200x300?text=No+Image';
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
            return `<div class="movie-card" onclick="showMovieDetails(${movie.id})">
                <img src="${posterUrl}" alt="${title}" class="movie-poster" onerror="this.src='https://via.placeholder.com/200x300?text=No+Image'">
                <div class="movie-info">
                    <div class="movie-title">${title}</div>
                    <div class="movie-rating">⭐ ${rating}</div>
                </div>
            </div>`;
        }).filter(html => html !== '').join('');
        
        if (moviesHTML) {
            container.innerHTML = moviesHTML;
            console.log('Used direct HTML injection -', movies.filter(m => m && m.title).length, 'movies');
        } else {
            console.error('Failed to generate movies HTML');
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Error loading movies. Please refresh the page.</p>';
        }
    }
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
    const container = document.getElementById('recommendations-results');
    if (!container) {
        console.error('Recommendations container not found');
        return;
    }

    // Always show fallback movies first (for immediate display)
    const fallbackMovies = getFallbackMovies();
    displayMovies(fallbackMovies, 'recommendations-results');

    // If not logged in, just show fallback and return
    if (!authToken) {
        showToast('Please login for personalized recommendations', 'warning');
        return;
    }

    // Try to load personalized recommendations
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/recommendations`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        hideLoading();

        if (data.recommendations && data.recommendations.length > 0) {
            displayMovies(data.recommendations, 'recommendations-results');
            showToast('Personalized recommendations loaded!', 'success');
        } else {
            // Keep fallback movies, just show message
            showToast('No personalized recommendations yet. Showing popular movies.', 'success');
        }
    } catch (error) {
        hideLoading();
        console.error('Error loading recommendations:', error);
        // Keep fallback movies displayed
        showToast('Using fallback recommendations. API may not be configured.', 'warning');
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

// Fallback movie data (shown when API is not available)
function getFallbackMovies() {
    console.log('getFallbackMovies() called');
    const movies = [
        {
            id: 1,
            title: 'The Shawshank Redemption',
            vote_average: 9.3,
            poster_url: 'https://via.placeholder.com/200x300?text=Shawshank',
            overview: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
            release_date: '1994-09-23'
        },
        {
            id: 2,
            title: 'The Godfather',
            vote_average: 9.2,
            poster_url: 'https://via.placeholder.com/200x300?text=Godfather',
            overview: 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.',
            release_date: '1972-03-24'
        },
        {
            id: 3,
            title: 'The Dark Knight',
            vote_average: 9.0,
            poster_url: 'https://via.placeholder.com/200x300?text=Dark+Knight',
            overview: 'Batman faces the Joker, a criminal mastermind who seeks to undermine Batman and create chaos.',
            release_date: '2008-07-18'
        },
        {
            id: 4,
            title: 'Pulp Fiction',
            vote_average: 8.9,
            poster_url: 'https://via.placeholder.com/200x300?text=Pulp+Fiction',
            overview: 'The lives of two mob hitmen, a boxer, and others intertwine in four tales of violence and redemption.',
            release_date: '1994-10-14'
        },
        {
            id: 5,
            title: 'Forrest Gump',
            vote_average: 8.8,
            poster_url: 'https://via.placeholder.com/200x300?text=Forrest+Gump',
            overview: 'The presidencies of Kennedy and Johnson, the Vietnam War, and other historical events unfold from the perspective of an Alabama man.',
            release_date: '1994-07-06'
        },
        {
            id: 6,
            title: 'Inception',
            vote_average: 8.8,
            poster_url: 'https://via.placeholder.com/200x300?text=Inception',
            overview: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.',
            release_date: '2010-07-16'
        },
        {
            id: 7,
            title: 'The Matrix',
            vote_average: 8.7,
            poster_url: 'https://via.placeholder.com/200x300?text=Matrix',
            overview: 'A computer hacker learns about the true nature of reality and his role in the war against its controllers.',
            release_date: '1999-03-31'
        },
        {
            id: 8,
            title: 'Goodfellas',
            vote_average: 8.7,
            poster_url: 'https://via.placeholder.com/200x300?text=Goodfellas',
            overview: 'The story of Henry Hill and his life in the mob, covering his relationship with his wife and his partners.',
            release_date: '1990-09-21'
        },
        {
            id: 9,
            title: 'The Lord of the Rings: The Return of the King',
            vote_average: 8.9,
            poster_url: 'https://via.placeholder.com/200x300?text=LOTR',
            overview: 'Gandalf and Aragorn lead the World of Men against Sauron\'s army to draw his gaze from Frodo and Sam.',
            release_date: '2003-12-17'
        },
        {
            id: 10,
            title: 'Fight Club',
            vote_average: 8.8,
            poster_url: 'https://via.placeholder.com/200x300?text=Fight+Club',
            overview: 'An insomniac office worker and a devil-may-care soapmaker form an underground fight club.',
            release_date: '1999-10-15'
        },
        {
            id: 11,
            title: 'Interstellar',
            vote_average: 8.6,
            poster_url: 'https://via.placeholder.com/200x300?text=Interstellar',
            overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
            release_date: '2014-11-07'
        },
        {
            id: 12,
            title: 'The Silence of the Lambs',
            vote_average: 8.6,
            poster_url: 'https://via.placeholder.com/200x300?text=Silence',
            overview: 'A young F.B.I. cadet must receive the help of an incarcerated cannibalistic killer to catch another serial killer.',
            release_date: '1991-02-14'
        },
        {
            id: 13,
            title: 'Schindler\'s List',
            vote_average: 8.9,
            poster_url: 'https://via.placeholder.com/200x300?text=Schindler',
            overview: 'In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce.',
            release_date: '1993-12-15'
        },
        {
            id: 14,
            title: 'The Godfather Part II',
            vote_average: 9.0,
            poster_url: 'https://via.placeholder.com/200x300?text=Godfather+II',
            overview: 'The early life and career of Vito Corleone in 1920s New York is portrayed, while his son, Michael, expands and tightens his grip on the family crime syndicate.',
            release_date: '1974-12-20'
        },
        {
            id: 15,
            title: '12 Angry Men',
            vote_average: 9.0,
            poster_url: 'https://via.placeholder.com/200x300?text=12+Angry+Men',
            overview: 'A jury holdout attempts to prevent a miscarriage of justice by forcing his colleagues to reconsider the evidence.',
            release_date: '1957-04-10'
        },
        {
            id: 16,
            title: 'The Lord of the Rings: The Fellowship of the Ring',
            vote_average: 8.8,
            poster_url: 'https://via.placeholder.com/200x300?text=Fellowship',
            overview: 'A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth.',
            release_date: '2001-12-19'
        },
        {
            id: 17,
            title: 'Parasite',
            vote_average: 8.5,
            poster_url: 'https://via.placeholder.com/200x300?text=Parasite',
            overview: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
            release_date: '2019-05-30'
        },
        {
            id: 18,
            title: 'The Green Mile',
            vote_average: 8.6,
            poster_url: 'https://via.placeholder.com/200x300?text=Green+Mile',
            overview: 'The lives of guards on Death Row are affected by one of their charges: a black man accused of child murder and rape.',
            release_date: '1999-12-10'
        },
        {
            id: 19,
            title: 'The Lord of the Rings: The Two Towers',
            vote_average: 8.7,
            poster_url: 'https://via.placeholder.com/200x300?text=Two+Towers',
            overview: 'While Frodo and Sam edge closer to Mordor with the help of the shifty Gollum, the divided fellowship makes a stand against Sauron.',
            release_date: '2002-12-18'
        },
        {
            id: 20,
            title: 'Se7en',
            vote_average: 8.6,
            poster_url: 'https://via.placeholder.com/200x300?text=Se7en',
            overview: 'Two detectives, a rookie and a veteran, hunt a serial killer who uses the seven deadly sins as his motives.',
            release_date: '1995-09-22'
        },
        {
            id: 21,
            title: 'The Usual Suspects',
            vote_average: 8.5,
            poster_url: 'https://via.placeholder.com/200x300?text=Usual+Suspects',
            overview: 'A sole survivor tells of the twisty events leading up to a horrific gun battle on a boat, which began when five criminals met at a seemingly random police lineup.',
            release_date: '1995-08-16'
        },
        {
            id: 22,
            title: 'Léon: The Professional',
            vote_average: 8.5,
            poster_url: 'https://via.placeholder.com/200x300?text=Leon',
            overview: 'Mathilda, a 12-year-old girl, is reluctantly taken in by Léon, a professional assassin, after her family is murdered.',
            release_date: '1994-11-18'
        },
        {
            id: 23,
            title: 'Saving Private Ryan',
            vote_average: 8.6,
            poster_url: 'https://via.placeholder.com/200x300?text=Saving+Ryan',
            overview: 'Following the Normandy Landings, a group of U.S. soldiers go behind enemy lines to retrieve a paratrooper whose brothers have been killed in action.',
            release_date: '1998-07-24'
        },
        {
            id: 24,
            title: 'The Prestige',
            vote_average: 8.5,
            poster_url: 'https://via.placeholder.com/200x300?text=Prestige',
            overview: 'After a tragic accident, two stage magicians engage in a battle to create the ultimate illusion while sacrificing everything they have.',
            release_date: '2006-10-20'
        },
        {
            id: 25,
            title: 'Gladiator',
            vote_average: 8.5,
            poster_url: 'https://via.placeholder.com/200x300?text=Gladiator',
            overview: 'A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.',
            release_date: '2000-05-05'
        },
        {
            id: 26,
            title: 'Whiplash',
            vote_average: 8.5,
            poster_url: 'https://via.placeholder.com/200x300?text=Whiplash',
            overview: 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student\'s potential.',
            release_date: '2014-10-10'
        },
        {
            id: 27,
            title: 'The Departed',
            vote_average: 8.5,
            poster_url: 'https://via.placeholder.com/200x300?text=Departed',
            overview: 'An undercover cop and a mole in the police attempt to identify each other while infiltrating an Irish gang in South Boston.',
            release_date: '2006-10-06'
        },
        {
            id: 28,
            title: 'The Lion King',
            vote_average: 8.5,
            poster_url: 'https://via.placeholder.com/200x300?text=Lion+King',
            overview: 'Lion prince Simba and his father are targeted by his bitter uncle, who wants to ascend the throne himself.',
            release_date: '1994-06-24'
        },
        {
            id: 29,
            title: 'American History X',
            vote_average: 8.5,
            poster_url: 'https://via.placeholder.com/200x300?text=American+X',
            overview: 'A former neo-nazi skinhead tries to prevent his younger brother from going down the same wrong path that he did.',
            release_date: '1998-11-20'
        },
        {
            id: 30,
            title: 'The Shining',
            vote_average: 8.4,
            poster_url: 'https://via.placeholder.com/200x300?text=Shining',
            overview: 'A family heads to an isolated hotel for the winter where a sinister presence influences the father into violence.',
            release_date: '1980-05-23'
        },
        {
            id: 31,
            title: 'Django Unchained',
            vote_average: 8.4,
            poster_url: 'https://via.placeholder.com/200x300?text=Django',
            overview: 'With the help of a German bounty hunter, a freed slave sets out to rescue his wife from a brutal Mississippi plantation owner.',
            release_date: '2012-12-25'
        },
        {
            id: 32,
            title: 'WALL-E',
            vote_average: 8.4,
            poster_url: 'https://via.placeholder.com/200x300?text=WALL-E',
            overview: 'In the distant future, a small waste-collecting robot inadvertently embarks on a space journey that will ultimately decide the fate of mankind.',
            release_date: '2008-06-27'
        },
        {
            id: 33,
            title: 'Avengers: Infinity War',
            vote_average: 8.4,
            poster_url: 'https://via.placeholder.com/200x300?text=Infinity+War',
            overview: 'The Avengers and their allies must be willing to sacrifice all in an attempt to defeat the powerful Thanos.',
            release_date: '2018-04-27'
        },
        {
            id: 34,
            title: 'Spirited Away',
            vote_average: 8.6,
            poster_url: 'https://via.placeholder.com/200x300?text=Spirited+Away',
            overview: 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits.',
            release_date: '2001-07-20'
        },
        {
            id: 35,
            title: 'The Pianist',
            vote_average: 8.5,
            poster_url: 'https://via.placeholder.com/200x300?text=Pianist',
            overview: 'A Polish Jewish musician struggles to survive the destruction of the Warsaw ghetto of World War II.',
            release_date: '2002-09-24'
        },
        {
            id: 36,
            title: 'Terminator 2: Judgment Day',
            vote_average: 8.5,
            poster_url: 'https://via.placeholder.com/200x300?text=T2',
            overview: 'A cyborg, identical to the one who failed to kill Sarah Connor, must now protect her ten-year-old son from a more advanced cyborg.',
            release_date: '1991-07-03'
        },
        {
            id: 37,
            title: 'Back to the Future',
            vote_average: 8.5,
            poster_url: 'https://via.placeholder.com/200x300?text=BTTF',
            overview: 'Marty McFly, a 17-year-old high school student, is accidentally sent thirty years into the past in a time-traveling DeLorean.',
            release_date: '1985-07-03'
        },
        {
            id: 38,
            title: 'The Avengers',
            vote_average: 8.0,
            poster_url: 'https://via.placeholder.com/200x300?text=Avengers',
            overview: 'Earth\'s mightiest heroes must come together and learn to fight as a team if they are going to stop the mischievous Loki.',
            release_date: '2012-05-04'
        },
        {
            id: 39,
            title: 'Toy Story',
            vote_average: 8.3,
            poster_url: 'https://via.placeholder.com/200x300?text=Toy+Story',
            overview: 'A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him as top toy in a boy\'s room.',
            release_date: '1995-11-22'
        },
        {
            id: 40,
            title: 'Joker',
            vote_average: 8.2,
            poster_url: 'https://via.placeholder.com/200x300?text=Joker',
            overview: 'During the 1980s, a failed stand-up comedian is driven insane and turns to a life of crime and chaos in Gotham City.',
            release_date: '2019-10-04'
        }
    ];
    console.log('getFallbackMovies returning', movies.length, 'movies');
    return movies;
}

// Global function to test movie loading (can be called from browser console)
window.testLoadMovies = function() {
    console.log('testLoadMovies called');
    const container = document.getElementById('movies-results');
    if (container) {
        const movies = getFallbackMovies();
        console.log('Test: Loading', movies.length, 'movies');
        displayMovies(movies, 'movies-results');
        return true;
    } else {
        console.error('Test: movies-results container not found');
        return false;
    }
};

// Utility Functions
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('hidden');
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.log(`Toast: ${message}`);
        return;
    }
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

