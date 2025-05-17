$(document).ready(function() {
    console.log('Document ready - main.js');
    
    console.log('jQuery version:', $.fn.jquery);
    
    checkLoginStatus();
    
    fixUIElements();
});

function checkLoginStatus() {
    console.log("Checking login status on page load");
    
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedUser) {
        console.log("Found stored user:", storedUser);
        updateUserUI(JSON.parse(storedUser));
    } else if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            console.log("Firebase auth state changed:", user);
            updateUserUI(user);
        });
    }
}

$(document).on('click', '#login-btn', function() {
    console.log("Login button clicked");
    const username = $('#username').val();
    const password = $('#password').val();
    
    if (!username || !password) {
        showMessage('Please enter both username and password.', 'error');
        return;
    }
    
    $(this).prop('disabled', true).text('Logging in...');
    
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const email = username + "@koreaGeoGuessr.com";
        
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(function(userCredential) {
                showMessage('Login successful!', 'success');
                setTimeout(function() {
                    updateUserUI(userCredential.user);
                }, 1000);
                $('#login-btn').prop('disabled', false).text('Login');
            })
            .catch(function(error) {
                console.error('Login error:', error);
                showMessage('Login failed: ' + error.message, 'error');
                $('#login-btn').prop('disabled', false).text('Login');
            });
    } else {
        console.log("Firebase not available, using local authentication");
        setTimeout(function() {
            showMessage('Login successful!', 'success');
            const user = {
                displayName: username,
                email: username + "@koreaGeoGuessr.com"
            };
            updateUserUI(user);
            $('#login-btn').prop('disabled', false).text('Login');
        }, 1000);
    }
});

$(document).on('click', '#signup-btn', function() {
    console.log("Signup button clicked");
    const username = $('#username').val();
    const password = $('#password').val();
    
    if (!username || !password) {
        showMessage('Please enter both username and password.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long.', 'error');
        return;
    }
    
    $(this).prop('disabled', true).text('Signing up...');
    
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const email = username + "@koreaGeoGuessr.com";
        
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(function(userCredential) {
                return userCredential.user.updateProfile({
                    displayName: username
                });
            })
            .then(function() {
                const user = firebase.auth().currentUser;
                
                if (firebase.firestore) {
                    return firebase.firestore().collection('users').doc(user.uid).set({
                        displayName: username,
                        email: user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        gamesPlayed: 0,
                        bestScore: 0
                    });
                }
                
                return Promise.resolve();
            })
            .then(function() {
                showMessage('Account created successfully!', 'success');
                $('#signup-btn').prop('disabled', false).text('Sign Up');
            })
            .catch(function(error) {
                console.error('Signup error:', error);
                showMessage('Signup failed: ' + error.message, 'error');
                $('#signup-btn').prop('disabled', false).text('Sign Up');
            });
    } else {
        console.log("Firebase not available, using local signup");
        setTimeout(function() {
            showMessage('Account created successfully!', 'success');
            
            const user = {
                displayName: username,
                email: username + "@koreaGeoGuessr.com"
            };
            
            updateUserUI(user);
            $('#signup-btn').prop('disabled', false).text('Sign Up');
        }, 1000);
    }
});

$(document).on('click', '#logout-btn', function() {
    console.log("Logout button clicked");
    
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut()
            .then(function() {
                showMessage('You have been logged out.', 'success');
                updateUserUI(null);
            })
            .catch(function(error) {
                console.error('Logout error:', error);
                showMessage('Logout failed: ' + error.message, 'error');
            });
    } else {
        showMessage('You have been logged out.', 'success');
        updateUserUI(null);
    }
});

$(document).on('click', '#play-btn', function(e) {
    console.log("Play button clicked");
    e.preventDefault();
    
    const isLoggedIn = $('#user-info').is(':visible');
    const storedUser = localStorage.getItem('currentUser');
    
    if (isLoggedIn || storedUser) {
        navigateToPage('game.html');
    } else {
        $('body').append(`
            <div id="login-prompt" class="modal" style="
                display: flex;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 1000;
                justify-content: center;
                align-items: center;
            ">
                <div class="modal-content" style="
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    max-width: 500px;
                    width: 90%;
                ">
                    <h2>Login Required</h2>
                    <p>Sign in to save your scores and appear on the leaderboard.</p>
                    <div class="modal-actions" style="
                        display: flex;
                        justify-content: center;
                        gap: 10px;
                        margin-top: 20px;
                    ">
                        <button id="prompt-login" class="btn btn-primary">Login</button>
                        <button id="play-as-guest" class="btn btn-secondary">Play as Guest</button>
                    </div>
                </div>
            </div>
        `);
        
        $('#prompt-login').on('click', function() {
            $('#login-prompt').remove();
            $('#username').focus();
        });
        
        $('#play-as-guest').on('click', function() {
            $('#login-prompt').remove();
            
            const guestUser = {
                displayName: 'Guest',
                email: 'guest@koreaGeoGuessr.com'
            };
            
            localStorage.setItem('currentUser', JSON.stringify(guestUser));
            
            navigateToPage('game.html');
        });
    }
});

function updateUserUI(user) {
    console.log("Updating UI for user:", user);
    
    if (user) {
        $('#login-container').hide();
        $('#user-info').show().css('display', 'block');
        $('#user-display-name').text(user.displayName || user.email);
        
        $('#play-btn').removeClass('disabled');
        
        localStorage.setItem('currentUser', JSON.stringify({
            displayName: user.displayName || user.email,
            email: user.email
        }));
        
        showMessage(`Welcome, ${user.displayName || user.email}!`, 'success');
    } else {
        $('#login-container').show();
        $('#user-info').hide();
        
        $('#play-btn').removeClass('disabled');
        
        localStorage.removeItem('currentUser');
    }
}

function showMessage(message, type = 'info') {
    console.log(`Showing message: ${message} (${type})`);
    
    if ($('#message-container').length === 0) {
        $('body').append('<div id="message-container" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 300px;"></div>');
    }
    
    const messageId = 'msg-' + Date.now();
    const messageElement = $(`
        <div id="${messageId}" class="message message-${type}" style="
            background-color: white;
            color: #333;
            padding: 12px 15px;
            margin-bottom: 10px;
            border-radius: 4px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
            display: flex;
            justify-content: space-between;
            align-items: center;
            opacity: 0;
            transform: translateX(50px);
            transition: opacity 0.3s, transform 0.3s;
            border-left: 4px solid ${type === 'error' ? '#e74c3c' : (type === 'success' ? '#2ecc71' : '#3498db')};
        ">
            <span class="message-text">${message}</span>
            <button class="message-close" style="
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                margin-left: 10px;
                opacity: 0.5;
                transition: opacity 0.3s;
            ">&times;</button>
        </div>
    `);
    
    $('#message-container').append(messageElement);
    
    setTimeout(function() {
        $(`#${messageId}`).css({
            'opacity': '1',
            'transform': 'translateX(0)'
        });
    }, 10);
    
    setTimeout(function() {
        $(`#${messageId}`).css({
            'opacity': '0',
            'transform': 'translateX(50px)'
        });
        setTimeout(function() {
            $(`#${messageId}`).remove();
        }, 300);
    }, 5000);
    
    $(`#${messageId} .message-close`).click(function() {
        $(`#${messageId}`).css({
            'opacity': '0',
            'transform': 'translateX(50px)'
        });
        setTimeout(function() {
            $(`#${messageId}`).remove();
        }, 300);
    });
}

function fixUIElements() {
    console.log("Fixing UI elements");
    
    if ($('#message-container').length === 0) {
        $('body').append('<div id="message-container" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 300px;"></div>');
    }
    
    $('#user-info').css({
        'margin-top': '1rem',
        'padding': '1rem',
        'background-color': '#f8f9fa',
        'border-radius': '4px'
    });
    
    $('#login-btn, #signup-btn').addClass('btn').css({
        'display': 'inline-block',
        'padding': '0.5rem 1rem',
        'margin-right': '0.5rem',
        'border-radius': '4px',
        'cursor': 'pointer'
    });
    
    $('#login-btn').addClass('btn-primary').css('background-color', '#e63946');
    $('#signup-btn').addClass('btn-secondary').css('background-color', '#457b9d');
    
    $('#username, #password').css({
        'padding': '0.5rem',
        'margin-right': '0.5rem',
        'border': '1px solid #ccc',
        'border-radius': '4px',
        'width': '100%',
        'margin-bottom': '0.5rem'
    });
    
    $('#login-container').css({
        'display': 'flex',
        'flex-direction': 'column',
        'gap': '0.5rem'
    });
    
    fixCssMissing();
}

function fixCssMissing() {
    const css = `
        .modal {
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        
        .modal-content {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 500px;
            width: 90%;
        }
        
        .modal-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
        }
        
        .btn {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            font-weight: 700;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            border: none;
            font-size: 1rem;
        }
        
        .btn-primary {
            background-color: #e63946;
            color: white;
        }
        
        .btn-secondary {
            background-color: #457b9d;
            color: white;
        }
        
        .fade-in {
            animation: fadeIn 0.8s ease forwards;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .page-exit {
            animation: pageExit 0.5s ease forwards;
        }
        
        @keyframes pageExit {
            to {
                opacity: 0;
                transform: translateY(-20px);
            }
        }
        
        #user-info {
            display: none;
        }
    `;
    
    if ($('#emergency-styles').length === 0) {
        $('head').append(`<style id="emergency-styles">${css}</style>`);
    }
}

function navigateToPage(url) {
    $('.container').addClass('page-exit');
    
    setTimeout(function() {
        window.location.href = url;
    }, 500);
}

$(document).on('click', 'a[href^="index.html"], a[href^="game.html"], a[href^="leaderboard.html"], a[href^="tutorial.html"]', function(e) {
    e.preventDefault();
    const url = $(this).attr('href');
    navigateToPage(url);
});

$(document).ready(function() {
    $('.container').addClass('fade-in');
});

function loadUserData(userId) {
    if (!firebase || !firebase.firestore) {
        console.log('Firebase/Firestore not available, skipping user data loading');
        return;
    }
    
    firebase.firestore().collection('users').doc(userId).get()
        .then(function(doc) {
            if (doc.exists) {
                const userData = doc.data();
                
                console.log('User data loaded:', userData);
                
                if (userData.bestScore > 0) {
                    $('#user-best-score').text(userData.bestScore);
                }
            }
        })
        .catch(function(error) {
            console.error('Error loading user data:', error);
        });
}

$('#login-btn').on('click', function() {
    console.log("Login button clicked");
    const username = $('#username').val();
    const password = $('#password').val();
    
    if (!username || !password) {
        showMessage('Please enter both username and password.', 'error');
        return;
    }
    
    $(this).prop('disabled', true).text('Logging in...');
    
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const email = username + "@koreaGeoGuessr.com";
        
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(function(userCredential) {
                showMessage('Login successful!', 'success');
                setTimeout(function() {
                    updateUserUI(userCredential.user);
                }, 1000);
            })
            .catch(function(error) {
                console.error('Login error:', error);
                showMessage('Login failed: ' + error.message, 'error');
                $('#login-btn').prop('disabled', false).text('Login');
            });
    } else {
        console.log("Firebase not available, using local authentication");
        setTimeout(function() {
            showMessage('Login successful!', 'success');
            const user = {
                displayName: username,
                email: username + "@koreaGeoGuessr.com"
            };
            updateUserUI(user);
            $('#login-btn').prop('disabled', false).text('Login');
        }, 1000);
    }
});

$('#signup-btn').on('click', function() {
    console.log("Signup button clicked");
    const username = $('#username').val();
    const password = $('#password').val();
    
    if (!username || !password) {
        showMessage('Please enter both username and password.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long.', 'error');
        return;
    }
    
    $(this).prop('disabled', true).text('Signing up...');
    
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const email = username + "@koreaGeoGuessr.com";
        
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(function(userCredential) {
                return userCredential.user.updateProfile({
                    displayName: username
                });
            })
            .then(function() {
                const user = firebase.auth().currentUser;
                
                if (firebase.firestore) {
                    return firebase.firestore().collection('users').doc(user.uid).set({
                        displayName: username,
                        email: user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        gamesPlayed: 0,
                        bestScore: 0
                    });
                }
                
                return Promise.resolve();
            })
            .then(function() {
                showMessage('Account created successfully!', 'success');
                $('#signup-btn').prop('disabled', false).text('Sign Up');
            })
            .catch(function(error) {
                console.error('Signup error:', error);
                showMessage('Signup failed: ' + error.message, 'error');
                $('#signup-btn').prop('disabled', false).text('Sign Up');
            });
    } else {
        console.log("Firebase not available, using local signup");
        setTimeout(function() {
            showMessage('Account created successfully!', 'success');
            
            const user = {
                displayName: username,
                email: username + "@koreaGeoGuessr.com"
            };
            
            updateUserUI(user);
            $('#signup-btn').prop('disabled', false).text('Sign Up');
        }, 1000);
    }
});

$('#logout-btn').on('click', function() {
    console.log("Logout button clicked");
    
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut()
            .then(function() {
                showMessage('You have been logged out.', 'success');
                updateUserUI(null);
            })
            .catch(function(error) {
                console.error('Logout error:', error);
                showMessage('Logout failed: ' + error.message, 'error');
            });
    } else {
        showMessage('You have been logged out.', 'success');
        updateUserUI(null);
    }
});

$(document).ready(function() {
    console.log("Checking login status on page load");
    
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedUser) {
        console.log("Found stored user:", storedUser);
        updateUserUI(JSON.parse(storedUser));
    } else if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            console.log("Firebase auth state changed:", user);
            updateUserUI(user);
        });
    }
    
    fixUIElements();
});

$('#play-btn').on('click', function(e) {
    console.log("Play button clicked");
    e.preventDefault();
    
    const isLoggedIn = $('#user-info').is(':visible');
    const storedUser = localStorage.getItem('currentUser');
    
    if (isLoggedIn || storedUser) {
        window.location.href = 'game.html';
    } else {
        $('body').append(`
            <div id="login-prompt" class="modal" style="
                display: flex;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 1000;
                justify-content: center;
                align-items: center;
            ">
                <div class="modal-content" style="
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    max-width: 500px;
                    width: 90%;
                ">
                    <h2>Login Required</h2>
                    <p>Sign in to save your scores and appear on the leaderboard.</p>
                    <div class="modal-actions" style="
                        display: flex;
                        justify-content: center;
                        gap: 10px;
                        margin-top: 20px;
                    ">
                        <button id="prompt-login" class="btn btn-primary">Login</button>
                        <button id="play-as-guest" class="btn btn-secondary">Play as Guest</button>
                    </div>
                </div>
            </div>
        `);
        
        $('#prompt-login').on('click', function() {
            $('#login-prompt').remove();
            $('#username').focus();
        });
        
        $('#play-as-guest').on('click', function() {
            $('#login-prompt').remove();
            
            const guestUser = {
                displayName: 'Guest',
                email: 'guest@koreaGeoGuessr.com'
            };
            
            localStorage.setItem('currentUser', JSON.stringify(guestUser));
            
            window.location.href = 'game.html';
        });
    }
});

$(document).ready(function() {
    fixCssMissing();
});