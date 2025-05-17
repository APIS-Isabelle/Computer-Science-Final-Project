const firebaseConfig = {
  apiKey: "AIzaSyBBfdDgzuHESNCnZBBpF-EMK673XqPf4vo",
  authDomain: "korea-geoguessr.firebaseapp.com",
  projectId: "korea-geoguessr",
  storageBucket: "korea-geoguessr.firebasestorage.app",
  messagingSenderId: "959422659192",
  appId: "1:959422659192:web:94b2cbd37d353ad36b0b8d",
  measurementId: "G-Y4PBCCC4SN"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const firebaseHelpers = {
    signUp: function(email, password, displayName) {
        return auth.createUserWithEmailAndPassword(email, password)
            .then(function(userCredential) {
                return userCredential.user.updateProfile({
                    displayName: displayName
                });
            })
            .then(function() {
                return db.collection('users').doc(auth.currentUser.uid).set({
                    displayName: displayName,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    gamesPlayed: 0,
                    bestScore: 0
                });
            });
    },
    
    signIn: function(email, password) {
        return auth.signInWithEmailAndPassword(email, password);
    },
    
    signOut: function() {
        return auth.signOut();
    },
    
    getCurrentUser: function() {
        return auth.currentUser;
    },
    
    saveScore: function(score, roundData) {
        const user = auth.currentUser;
        if (!user) {
            return Promise.reject(new Error('User not logged in'));
        }
        
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        
        return db.collection('scores').add({
            userId: user.uid,
            playerName: user.displayName || user.email,
            score: score,
            roundData: roundData,
            createdAt: timestamp
        })
        .then(function(docRef) {
            return db.collection('users').doc(user.uid).get()
                .then(function(userDoc) {
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        const gamesPlayed = (userData.gamesPlayed || 0) + 1;
                        const bestScore = Math.max(userData.bestScore || 0, score);
                        
                        return db.collection('users').doc(user.uid).update({
                            gamesPlayed: gamesPlayed,
                            bestScore: bestScore,
                            lastPlayed: timestamp
                        });
                    }
                });
        });
    },
    
    getLeaderboard: function(timeFilter = 'all-time', limit = 100) {
        let query = db.collection('scores')
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
            
            query = query.where('createdAt', '>=', date);
        }
        
        return query.get().then(function(querySnapshot) {
            const leaderboardData = [];
            
            querySnapshot.forEach(function(doc) {
                const data = doc.data();
                leaderboardData.push({
                    id: doc.id,
                    userId: data.userId,
                    playerName: data.playerName,
                    score: data.score,
                    date: data.createdAt ? data.createdAt.toDate() : new Date(),
                    roundData: data.roundData
                });
            });
            
            return leaderboardData;
        });
    },
    
    getUserScores: function(userId, limit = 10) {
        return db.collection('scores')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get()
                .then(function(querySnapshot) {
                    const scores = [];
                    
                    querySnapshot.forEach(function(doc) {
                        const data = doc.data();
                        scores.push({
                            id: doc.id,
                            score: data.score,
                            date: data.createdAt ? data.createdAt.toDate() : new Date(),
                            roundData: data.roundData
                        });
                    });
                    
                    return scores;
                });
    },
    
    getUserStats: function(userId) {
        return db.collection('users').doc(userId).get()
            .then(function(doc) {
                if (doc.exists) {
                    return doc.data();
                } else {
                    return null;
                }
            });
    },
    
    getRandomLocations: function(count = 5) {
        return db.collection('locations')
                .orderBy('randomIndex')
                .limit(count)
                .get()
                .then(function(querySnapshot) {
                    const locations = [];
                    
                    querySnapshot.forEach(function(doc) {
                        locations.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    return locations;
                });
    }
};

window.firebaseConfig = firebaseConfig;
window.firebaseHelpers = firebaseHelpers;

console.log('Firebase initialized');