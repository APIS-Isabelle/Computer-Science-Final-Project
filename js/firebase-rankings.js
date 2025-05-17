function saveScoreToFirebase(score, rounds) {
    console.log('Saving score to Firebase:', score);
    
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.error('Firebase is not available');
        return Promise.reject('Firebase is not available');
    }
    
    const user = firebase.auth().currentUser;
    const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    const userId = user ? user.uid : (storedUser.uid || 'guest-' + Date.now());
    const displayName = user ? (user.displayName || user.email) : (storedUser.displayName || 'Guest');
    
    const roundData = rounds.map(round => ({
        locationName: round.actualLocation.name,
        distance: round.distance,
        points: round.score,
        actualLocation: {
            lat: round.actualLocation.lat,
            lng: round.actualLocation.lng
        },
        guessLocation: {
            lat: round.guessLocation.lat,
            lng: round.guessLocation.lng
        }
    }));
    
    const scoreData = {
        userId: userId,
        playerName: displayName,
        score: score,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        rounds: roundData,
        isGuest: !user && storedUser.isGuest
    };
    
    return firebase.firestore().collection('scores')
        .add(scoreData)
        .then(docRef => {
            console.log('Score uploaded successfully with ID:', docRef.id);
            
            if (user) {
                return updateUserStats(user.uid, score);
            }
            
            return docRef.id;
        })
        .catch(error => {
            console.error('Error uploading score:', error);
            throw error;
        });
}

function updateUserStats(userId, score) {
    return firebase.firestore().collection('users').doc(userId).get()
        .then(doc => {
            const userData = doc.exists ? doc.data() : {};
            const bestScore = Math.max(userData.bestScore || 0, score);
            const gamesPlayed = (userData.gamesPlayed || 0) + 1;
            
            return firebase.firestore().collection('users').doc(userId).set({
                bestScore: bestScore,
                gamesPlayed: gamesPlayed,
                lastPlayed: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
}

function getLeaderboardData(timeFilter = 'all-time', limit = 100) {
    console.log(`Getting leaderboard data: ${timeFilter}, limit: ${limit}`);
    
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.error('Firebase is not available');
        return Promise.reject('Firebase is not available');
    }
    
    let query = firebase.firestore().collection('scores')
                    .orderBy('score', 'desc')
                    .limit(limit);
    
    if (timeFilter !== 'all-time') {
        let date = new Date();
        if (timeFilter === 'this-month') {
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
        } else if (timeFilter === 'this-week') {
            const day = date.getDay();
            date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
            date.setHours(0, 0, 0, 0);
        } else if (timeFilter === 'today') {
            date.setHours(0, 0, 0, 0);
        }
        
        query = query.where('timestamp', '>=', date);
    }
    
    return query.get()
        .then(querySnapshot => {
            const results = [];
            
            querySnapshot.forEach(doc => {
                const data = doc.data();
                results.push({
                    id: doc.id,
                    playerName: data.playerName,
                    score: data.score,
                    timestamp: data.timestamp,
                    userId: data.userId,
                    rounds: data.rounds,
                    isGuest: data.isGuest
                });
            });
            
            return results;
        });
}

function getUserScores(userId, limit = 10) {
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.error('Firebase is not available');
        return Promise.reject('Firebase is not available');
    }
    
    const query = firebase.firestore().collection('scores')
                    .where('userId', '==', userId)
                    .orderBy('timestamp', 'desc')
                    .limit(limit);
    
    return query.get()
        .then(querySnapshot => {
            const results = [];
            
            querySnapshot.forEach(doc => {
                const data = doc.data();
                results.push({
                    id: doc.id,
                    score: data.score,
                    timestamp: data.timestamp,
                    rounds: data.rounds
                });
            });
            
            return results;
        });
}

function calculatePlayerRank(score) {
    return firebase.firestore().collection('scores')
        .where('score', '>', score)
        .count()
        .get()
        .then(snapshot => {
            return snapshot.data().count + 1;
        });
}

function getScoreDetails(scoreId) {
    return firebase.firestore().collection('scores').doc(scoreId).get()
        .then(doc => {
            if (doc.exists) {
                return doc.data();
            } else {
                throw new Error('Score not found');
            }
        });
}

function getGlobalStats() {
    return firebase.firestore().collection('scores')
        .orderBy('score', 'desc')
        .get()
        .then(querySnapshot => {
            let totalScore = 0;
            let count = 0;
            let bestScore = 0;
            
            querySnapshot.forEach(doc => {
                const data = doc.data();
                totalScore += data.score;
                count++;
                bestScore = Math.max(bestScore, data.score);
            });
            
            return {
                totalGames: count,
                averageScore: count > 0 ? Math.round(totalScore / count) : 0,
                bestScore: bestScore
            };
        });
}

function initFirebaseRankings() {
    console.log('Initializing Firebase Rankings');
    
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded');
        return;
    }
    
    console.log('Required Firestore indexes:');
    console.log('- Collection: scores, Fields: score (desc), timestamp (asc)');
    console.log('- Collection: scores, Fields: userId, timestamp (desc)');
}

window.firebaseRankings = {
    saveScore: saveScoreToFirebase,
    getLeaderboard: getLeaderboardData,
    getUserScores: getUserScores,
    calculateRank: calculatePlayerRank,
    getScoreDetails: getScoreDetails,
    getGlobalStats: getGlobalStats,
    initialize: initFirebaseRankings
};

document.addEventListener('DOMContentLoaded', function() {
    if (window.firebaseRankings) {
        window.firebaseRankings.initialize();
    }
});