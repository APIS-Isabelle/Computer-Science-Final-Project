import { showLoading } from './main.js';

const LEADERBOARD_SIZE = 10;

const leaderboardContainer = document.getElementById('leaderboard-container');
const leaderboardTable = document.getElementById('leaderboard-table');
const backButton = document.getElementById('back-button');

async function loadLeaderboard() {
  try {
    showLoading(true);
    
    const scores = await getLeaderboardData();
    
    renderLeaderboard(scores);
    
    initLeaderboardPage();
    
    showLoading(false);
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    
    if (leaderboardContainer) {
      leaderboardContainer.innerHTML = `
        <div class="error-message">
          <p>Failed to load leaderboard data. Please try again later.</p>
          <button id="retry-button" class="btn">Retry</button>
        </div>
      `;
      
      document.getElementById('retry-button').addEventListener('click', loadLeaderboard);
    }
    
    showLoading(false);
  }
}

async function getLeaderboardData() {
  try {
    const { getTopScores } = window.FirebaseModule;
    const scores = await getTopScores(LEADERBOARD_SIZE);
    return scores;
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    throw error;
  }
}

function renderLeaderboard(scores) {
  if (!leaderboardTable) return;
  
  while (leaderboardTable.rows.length > 1) {
    leaderboardTable.deleteRow(1);
  }
  
  const tableBody = document.createElement('tbody');
  
  if (scores.length === 0) {
    const row = tableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 4;
    cell.className = 'no-scores';
    cell.textContent = 'No scores yet. Be the first to play!';
  } else {
    scores.forEach((score, index) => {
      const row = tableBody.insertRow();
      
      const rankCell = row.insertCell();
      rankCell.className = 'rank-cell';
      
      if (index === 0) {
        rankCell.innerHTML = '<span class="medal gold">🥇</span>';
      } else if (index === 1) {
        rankCell.innerHTML = '<span class="medal silver">🥈</span>';
      } else if (index === 2) {
        rankCell.innerHTML = '<span class="medal bronze">🥉</span>';
      } else {
        rankCell.textContent = index + 1;
      }
      
      const nameCell = row.insertCell();
      nameCell.className = 'name-cell';
      nameCell.textContent = score.playerName || score.username || 'Anonymous';
      
      const scoreCell = row.insertCell();
      scoreCell.className = 'score-cell';
      scoreCell.textContent = score.score;
      
      const dateCell = row.insertCell();
      dateCell.className = 'date-cell';
      const scoreDate = score.timestamp ? new Date(score.timestamp.seconds * 1000) : new Date();
      dateCell.textContent = formatDate(scoreDate);
      
      row.addEventListener('click', () => {
        showScoreDetails(score);
      });
    });
  }
  
  const oldTbody = leaderboardTable.getElementsByTagName('tbody')[0];
  if (oldTbody) {
    leaderboardTable.replaceChild(tableBody, oldTbody);
  } else {
    leaderboardTable.appendChild(tableBody);
  }
  
  animateLeaderboardRows();
}

function showScoreDetails(score) {
  let detailsModal = document.getElementById('score-details-modal');
  
  if (!detailsModal) {
    detailsModal = document.createElement('div');
    detailsModal.id = 'score-details-modal';
    detailsModal.className = 'modal';
    document.body.appendChild(detailsModal);
  }
  
  let modalContent = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <h2>Score Details</h2>
      <div class="player-info">
        <div class="player-name">Player: <span>${score.playerName || score.username || 'Anonymous'}</span></div>
        <div class="total-score">Total Score: <span>${score.score}</span></div>
        <div class="played-on">Played on: <span>${formatDate(new Date(score.timestamp.seconds * 1000))}</span></div>
      </div>
      <h3>Rounds</h3>
      <div class="rounds-detail">
  `;
  
  if (score.rounds && Array.isArray(score.rounds)) {
    score.rounds.forEach((round, index) => {
      modalContent += `
        <div class="round-detail">
          <h4>Round ${index + 1}</h4>
          <div class="location-name">Location: ${round.locationName}</div>
          <div class="distance">Distance: ${round.distance.toFixed(2)} km</div>
          <div class="points">Points: ${round.points}</div>
        </div>
      `;
    });
  } else if (score.locations && Array.isArray(score.locations)) {
    score.locations.forEach((location, index) => {
      modalContent += `
        <div class="round-detail">
          <h4>Round ${index + 1}</h4>
          <div class="location-name">Location: ${location.locationName}</div>
          <div class="distance">Distance: ${location.distance.toFixed(2)} km</div>
          <div class="points">Points: ${location.points}</div>
        </div>
      `;
    });
  } else {
    modalContent += `<p>No round details available</p>`;
  }
  
  modalContent += `
      </div>
    </div>
  `;
  
  detailsModal.innerHTML = modalContent;
  
  $(detailsModal).fadeIn(300);
  
  const closeBtn = detailsModal.querySelector('.close-modal');
  closeBtn.addEventListener('click', () => {
    $(detailsModal).fadeOut(300);
  });
  
  window.addEventListener('click', function(event) {
    if (event.target === detailsModal) {
      $(detailsModal).fadeOut(300);
    }
  });
}

function initLeaderboardPage() {
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
  
  const refreshButton = document.getElementById('refresh-button');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      loadLeaderboard();
    });
  }
  
  const leaderboardTitle = document.querySelector('.leaderboard-title');
  if (leaderboardTitle) {
    $(leaderboardTitle).hide().fadeIn(800);
  }
}

function animateLeaderboardRows() {
  const rows = leaderboardTable.querySelectorAll('tbody tr');
  
  rows.forEach((row, index) => {
    $(row).css({
      opacity: 0,
      transform: 'translateY(20px)'
    }).delay(index * 100).animate({
      opacity: 1,
      transform: 'translateY(0)'
    }, 500);
  });
}

function formatDate(date) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

export { loadLeaderboard };

window.loadLeaderboard = loadLeaderboard;

function getUserStats() {
    console.log('Getting user stats');
    
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log('No user logged in');
        return;
    }
    
    firebase.firestore().collection('users').doc(user.uid).get()
        .then(function(doc) {
            if (doc.exists) {
                const userData = doc.data();
                console.log('User stats:', userData);
                
                $('#user-stats-container').html(`
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h3>Your Stats</h3>
                        <p>Best Score: <strong>${userData.bestScore || 0}</strong></p>
                        <p>Games Played: <strong>${userData.gamesPlayed || 0}</strong></p>
                        <p>Last Played: <strong>${userData.lastPlayed ? new Date(userData.lastPlayed.toDate()).toLocaleDateString() : 'Never'}</strong></p>
                    </div>
                `).show();
            } else {
                console.log('No user document found');
            }
        })
        .catch(function(error) {
            console.error('Error getting user stats:', error);
        });
}

$(document).ready(function() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                getUserStats();
            }
        });
    }
});