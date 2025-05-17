let gameState = {
    currentRound: 1,
    totalRounds: 5,
    score: 0,
    roundData: [],
    currentLocation: null,
    guessLocation: null,
    guessMarker: null,
    actualMarker: null,
    guessLine: null,
    map: null,
    timerInterval: null,
    timeRemaining: 60,
    locations: [],
    locationImages: [],
    currentImageIndex: 0
};

const MAX_POINTS_PER_ROUND = 5000;
const TIME_LIMIT = 60;
const KOREA_BOUNDS = {
    north: 38.7,
    south: 33.0,
    east: 131.9,
    west: 124.5
};

$(document).ready(function() {
    console.log('Document ready - game.js');
    
    console.log('Google Maps API status:', typeof google !== 'undefined' ? 'Loaded' : 'Not loaded');
    
    console.log('jQuery version:', $.fn.jquery);
    
    if (!checkLoginBeforePlay()) {
        return;
    }
    
    $('.game-container').addClass('fade-in');
    
    initMap();
    
    initEventHandlers();
    
    startGame();
});

function checkLoginBeforePlay() {
    console.log("Checking login before play");
    
    const storedUser = localStorage.getItem('currentUser');
    const isLoggedIn = firebase.auth().currentUser || storedUser;
    
    if (!isLoggedIn) {
        console.log("User not logged in, redirecting to home page");
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

function initMap() {
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        console.error('Google Maps API not loaded');
        showError('Google Maps could not be loaded. Please try again later.');
        return;
    }
    
    console.log('Initializing map');
    
    gameState.map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 36.5, lng: 127.5 },
        zoom: 7,
        minZoom: 6,
        maxZoom: 14,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: true,
        mapTypeId: 'roadmap',
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        restriction: {
            latLngBounds: KOREA_BOUNDS,
            strictBounds: true
        }
    });
    
    console.log('Map created');
    
    gameState.map.addListener('click', function(event) {
        console.log('Map clicked at:', event.latLng.lat(), event.latLng.lng());
        placeGuessMarker(event.latLng);
    });
}

function initEventHandlers() {
    console.log('Initializing event handlers');
    
    $('#prev-image').on('click', function() {
        console.log('Previous image clicked');
        navigateImages(-1);
    });
    
    $('#next-image').on('click', function() {
        console.log('Next image clicked');
        navigateImages(1);
    });
    
    $('#make-guess').on('click', function() {
        console.log('Make guess clicked');
        if (gameState.guessLocation) {
            submitGuess();
        }
    });
    
    $('#reset-pin').on('click', function() {
        console.log('Reset pin clicked');
        resetGuessMarker();
    });
    
    $('#next-round').on('click', function() {
        console.log('Next round / finish button clicked');
        startNextRound();
    });
    
    $('#exit-game').on('click', function() {
        console.log('Exit game clicked');
        confirmExit();
    });
    
    $(document).keydown(function(e) {
        if (e.keyCode === 37) {
            navigateImages(-1);
        }
        
        if (e.keyCode === 39) {
            navigateImages(1);
        }
        
        if (e.keyCode === 13 && gameState.guessLocation && !$('#guess-result').is(':visible')) {
            submitGuess();
        }
    });
    
    console.log('Event handlers initialized');
}

function startGame() {
    console.log('Starting game');
    
    if (!checkLoginBeforePlay()) {
        return;
    }
    
    resetGameState();
    
    loadSampleLocations().then(function(locations) {
        console.log('Locations loaded:', locations.length);
        gameState.locations = locations;
        
        startRound(1);
    });
}

function loadSampleLocations() {
    console.log('Loading sample locations');
    
    return new Promise(function(resolve) {
        const locationPool = [
            {
                "id": "loc1",
                "name": "Gyeongbokgung Palace",
                "lat": 37.5796,
                "lng": 126.9770,
                "images": [
                    "assets/images/locations/gyeongbokgung1.jpg",
                    "assets/images/locations/gyeongbokgung2.jpg",
                    "assets/images/locations/gyeongbokgung3.jpg"
                ],
                "hint": "A major royal palace in Seoul",
                "description": "Gyeongbokgung, also known as Gyeongbok Palace, was the main royal palace of the Joseon dynasty. Built in 1395, it is located in northern Seoul.",
                "difficulty": "Easy"
            },
            {
                "id": "loc2",
                "name": "Namsan Tower",
                "lat": 37.5512,
                "lng": 126.9882,
                "images": [
                    "assets/images/locations/namsan1.jpg",
                    "assets/images/locations/namsan2.jpg",
                    "assets/images/locations/namsan3.jpg"
                ],
                "hint": "A communication and observation tower in central Seoul",
                "description": "N Seoul Tower, officially the YTN Seoul Tower and commonly known as Namsan Tower, is a communication and observation tower located on Namsan Mountain in central Seoul.",
                "difficulty": "Easy"
            },
            {
                "id": "loc3",
                "name": "Haeundae Beach",
                "lat": 35.1588,
                "lng": 129.1600,
                "images": [
                    "assets/images/locations/haeundae1.jpg",
                    "assets/images/locations/haeundae2.jpg",
                    "assets/images/locations/haeundae3.jpg"
                ],
                "hint": "A popular beach in Busan",
                "description": "Haeundae Beach is a popular beach in Busan, South Korea. It is one of the most famous beaches in Korea and is known for its white sand.",
                "difficulty": "Medium"
            },
            {
                "id": "loc4",
                "name": "Seongsan Ilchulbong",
                "lat": 33.4587,
                "lng": 126.9427,
                "images": [
                    "assets/images/locations/seongsan1.jpg",
                    "assets/images/locations/seongsan2.jpg",
                    "assets/images/locations/seongsan3.jpg"
                ],
                "hint": "A volcanic crater on Jeju Island",
                "description": "Seongsan Ilchulbong, also called 'Sunrise Peak', is an archetypal tuff cone formed by hydrovolcanic eruptions upon a shallow seabed about 5,000 years ago on Jeju Island.",
                "difficulty": "Hard"
            },
            {
                "id": "loc5",
                "name": "Bulguksa Temple",
                "lat": 35.7900,
                "lng": 129.3317,
                "images": [
                    "assets/images/locations/bulguksa1.jpg",
                    "assets/images/locations/bulguksa2.jpg",
                    "assets/images/locations/bulguksa3.jpg"
                ],
                "hint": "A Buddhist temple in Gyeongju",
                "description": "Bulguksa is a Buddhist temple located on the slopes of Mount Toham in Gyeongju, South Korea. It was built in the 8th century during the Silla dynasty.",
                "difficulty": "Medium"
            },
            {
                "id": "loc6",
                "name": "Myeongdong Shopping District",
                "lat": 37.5635,
                "lng": 126.9830,
                "images": [
                    "assets/images/locations/myeongdong1.jpg",
                    "assets/images/locations/myeongdong2.jpg",
                    "assets/images/locations/myeongdong3.jpg"
                ],
                "hint": "A major shopping area in Seoul",
                "description": "Myeongdong is a shopping district in Seoul, South Korea. It is known for its fashion stores, beauty brands, and street food.",
                "difficulty": "Easy"
            },
            {
                "id": "loc7",
                "name": "Seoraksan Mountain",
                "lat": 38.1193,
                "lng": 128.4659,
                "images": [
                    "assets/images/locations/seoraksan1.jpg",
                    "assets/images/locations/seoraksan2.jpg",
                    "assets/images/locations/seoraksan3.jpg"
                ],
                "hint": "A mountain in the northeast of South Korea",
                "description": "Seoraksan is the highest mountain in the Taebaek mountain range in the Gangwon Province in eastern South Korea. It's part of Seoraksan National Park.",
                "difficulty": "Hard"
            },
            {
                "id": "loc8",
                "name": "Hongdae Area",
                "lat": 37.5558,
                "lng": 126.9368,
                "images": [
                    "assets/images/locations/hongdae1.jpg",
                    "assets/images/locations/hongdae2.jpg",
                    "assets/images/locations/hongdae3.jpg"
                ],
                "hint": "A vibrant university area known for arts and nightlife",
                "description": "Hongdae is an area in Seoul, South Korea near Hongik University, known for its urban arts scene, indie music culture, entertainment, and nightlife.",
                "difficulty": "Medium"
            },
            {
                "id": "loc9",
                "name": "Gamcheon Culture Village",
                "lat": 35.0946,
                "lng": 129.0111,
                "images": [
                    "assets/images/locations/gamcheon1.jpg",
                    "assets/images/locations/gamcheon2.jpg",
                    "assets/images/locations/gamcheon3.jpg"
                ],
                "hint": "A colorful village built on a hillside in Busan",
                "description": "Gamcheon Culture Village is a hillside community in Busan, South Korea known for its colorful houses, narrow alleys, and art installations.",
                "difficulty": "Medium"
            },
            {
                "id": "loc10",
                "name": "Hanok Village",
                "lat": 35.8173,
                "lng": 127.1488,
                "images": [
                    "assets/images/locations/hanok1.jpg",
                    "assets/images/locations/hanok2.jpg",
                    "assets/images/locations/hanok3.jpg"
                ],
                "hint": "A traditional Korean village in Jeonju",
                "description": "Jeonju Hanok Village is a traditional Korean village located in Jeonju, South Korea, featuring over 800 traditional Korean houses called 'hanok'.",
                "difficulty": "Medium"
            },
            {
                "id": "loc11",
                "name": "Changdeokgung Palace",
                "lat": 37.5828,
                "lng": 126.9914,
                "images": [
                    "assets/images/locations/changdeokgung1.jpg",
                    "assets/images/locations/changdeokgung2.jpg",
                    "assets/images/locations/changdeokgung3.jpg"
                ],
                "hint": "A UNESCO World Heritage palace in Seoul",
                "description": "Changdeokgung Palace is a UNESCO World Heritage Site located in Seoul. It was the second royal villa built following the construction of Gyeongbokgung Palace.",
                "difficulty": "Medium"
            },
            {
                "id": "loc12",
                "name": "Busan Tower",
                "lat": 35.1006,
                "lng": 129.0322,
                "images": [
                    "assets/images/locations/busantower1.jpg",
                    "assets/images/locations/busantower2.jpg",
                    "assets/images/locations/busantower3.jpg"
                ],
                "hint": "An observation tower in Busan",
                "description": "Busan Tower is a 120-meter-high observation tower located in Yongdusan Park, Busan, South Korea.",
                "difficulty": "Easy"
            },
            {
                "id": "loc13",
                "name": "Hallasan Mountain",
                "lat": 33.3617,
                "lng": 126.5292,
                "images": [
                    "assets/images/locations/hallasan1.jpg",
                    "assets/images/locations/hallasan2.jpg",
                    "assets/images/locations/hallasan3.jpg"
                ],
                "hint": "The highest mountain in South Korea, located on Jeju Island",
                "description": "Hallasan is a shield volcano on Jeju Island of South Korea. It is the highest mountain in South Korea and is often covered in snow in winter.",
                "difficulty": "Hard"
            },
            {
                "id": "loc14",
                "name": "Gwanghwamun Square",
                "lat": 37.5759,
                "lng": 126.9769,
                "images": [
                    "assets/images/locations/gwanghwamun1.jpg",
                    "assets/images/locations/gwanghwamun2.jpg",
                    "assets/images/locations/gwanghwamun3.jpg"
                ],
                "hint": "A public square in Seoul with a statue of King Sejong",
                "description": "Gwanghwamun Square is a public open space on Sejongno, Jongno-gu, Seoul. The square features statues of King Sejong the Great and Admiral Yi Sun-sin.",
                "difficulty": "Easy"
            },
            {
                "id": "loc15",
                "name": "Bukchon Hanok Village",
                "lat": 37.5823,
                "lng": 126.9854,
                "images": [
                    "assets/images/locations/bukchon1.jpg",
                    "assets/images/locations/bukchon2.jpg",
                    "assets/images/locations/bukchon3.jpg"
                ],
                "hint": "A traditional village in Seoul between two palaces",
                "description": "Bukchon Hanok Village is a Korean traditional village located between Gyeongbokgung Palace, Changdeokgung Palace and Jongmyo Shrine in Seoul.",
                "difficulty": "Medium"
            },
            {
                "id": "loc16",
                "name": "Gyeongju Historic Areas",
                "lat": 35.8356,
                "lng": 129.2253,
                "images": [
                    "assets/images/locations/gyeongju1.jpg",
                    "assets/images/locations/gyeongju2.jpg",
                    "assets/images/locations/gyeongju3.jpg"
                ],
                "hint": "An ancient capital with many historical sites",
                "description": "Gyeongju Historic Areas are the areas containing archaeological sites, Buddhist temples, and various artifacts of the Silla Kingdom in Gyeongju, South Korea.",
                "difficulty": "Hard"
            },
            {
                "id": "loc17",
                "name": "Dongdaemun Design Plaza",
                "lat": 37.5668,
                "lng": 127.0093,
                "images": [
                    "assets/images/locations/ddp1.jpg",
                    "assets/images/locations/ddp2.jpg",
                    "assets/images/locations/ddp3.jpg"
                ],
                "hint": "A major urban development landmark in Seoul",
                "description": "Dongdaemun Design Plaza (DDP) is a major urban development landmark in Seoul designed by Zaha Hadid. The venue features innovative design and architecture.",
                "difficulty": "Easy"
            },
            {
                "id": "loc18",
                "name": "Insadong",
                "lat": 37.5741,
                "lng": 126.9870,
                "images": [
                    "assets/images/locations/insadong1.jpg",
                    "assets/images/locations/insadong2.jpg",
                    "assets/images/locations/insadong3.jpg"
                ],
                "hint": "A traditional arts and crafts shopping area in Seoul",
                "description": "Insadong is a dong, or neighborhood, in the Jongno-gu district of Seoul, South Korea. It is famous for its traditional crafts shops, art galleries, and tea houses.",
                "difficulty": "Medium"
            },
            {
                "id": "loc19",
                "name": "War Memorial of Korea",
                "lat": 37.5359,
                "lng": 126.9769,
                "images": [
                    "assets/images/locations/warmemorial1.jpg",
                    "assets/images/locations/warmemorial2.jpg",
                    "assets/images/locations/warmemorial3.jpg"
                ],
                "hint": "A museum and memorial hall in Seoul",
                "description": "The War Memorial of Korea is a museum located in Yongsan-dong, Seoul. It opened in 1994 on the site where the Korean Infantry headquarters used to be.",
                "difficulty": "Medium"
            },
            {
                "id": "loc20",
                "name": "Jagalchi Market",
                "lat": 35.0966,
                "lng": 129.0306,
                "images": [
                    "assets/images/locations/jagalchi1.jpg",
                    "assets/images/locations/jagalchi2.jpg",
                    "assets/images/locations/jagalchi3.jpg"
                ],
                "hint": "A famous fish market in Busan",
                "description": "Jagalchi Market is Korea's largest seafood market, located in Nampo-dong, Busan. It is a famous tourist destination known for its fresh seafood and vibrant atmosphere.",
                "difficulty": "Medium"
            }
        ];
        
        const randomLocations = getRandomLocations(locationPool, gameState.totalRounds);
        resolve(randomLocations);
    });
}

function getRandomLocations(pool, count) {
    const availableLocations = [...pool];
    const selectedLocations = [];
    
    count = Math.min(count, availableLocations.length);
    
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * availableLocations.length);
        
        selectedLocations.push(availableLocations[randomIndex]);
        
        availableLocations.splice(randomIndex, 1);
    }
    
    return selectedLocations;
}

function startRound(roundNumber) {
    console.log(`Starting round ${roundNumber}`);
    
    gameState.currentRound = roundNumber;
    gameState.guessLocation = null;
    gameState.timeRemaining = TIME_LIMIT;
    
    clearAllMapMarkers();
    
    $('#current-round').text(roundNumber);
    $('#timer-display').text(formatTime(TIME_LIMIT)).removeClass('timer-flash');
    
    $('#make-guess').prop('disabled', true);
    $('#reset-pin').prop('disabled', true);
    
    const location = gameState.locations[roundNumber - 1];
    gameState.currentLocation = {
        lat: location.lat,
        lng: location.lng,
        name: location.name
    };
    
    console.log(`Round location: ${location.name}`);
    
    gameState.locationImages = location.images || [];
    gameState.currentImageIndex = 0;
    
    displayCurrentImage();
    
    startTimer();
}

function displayCurrentImage() {
    const imageUrl = gameState.locationImages[gameState.currentImageIndex];
    console.log(`Displaying image: ${imageUrl}`);
    
    const defaultImage = 'https://via.placeholder.com/800x600?text=Location+Image';
    
    const img = new Image();
    img.onload = function() {
        $('#location-image').attr('src', imageUrl).addClass('fade-in');
        
        setTimeout(function() {
            $('#location-image').removeClass('fade-in');
        }, 500);
    };
    
    img.onerror = function() {
        console.log('Image not found, using default');
        $('#location-image').attr('src', defaultImage).addClass('fade-in');
        
        setTimeout(function() {
            $('#location-image').removeClass('fade-in');
        }, 500);
    };
    
    img.src = imageUrl;
}

function navigateImages(direction) {
    const numImages = gameState.locationImages.length;
    if (numImages <= 1) return;
    
    gameState.currentImageIndex = (gameState.currentImageIndex + direction + numImages) % numImages;
    console.log(`Navigated to image index: ${gameState.currentImageIndex}`);
    
    displayCurrentImage();
}

function clearAllMapMarkers() {
    console.log("Clearing all map markers");
    
    if (gameState.guessMarker) {
        gameState.guessMarker.setMap(null);
        gameState.guessMarker = null;
    }
    
    if (gameState.actualMarker) {
        gameState.actualMarker.setMap(null);
        gameState.actualMarker = null;
    }
    
    if (gameState.guessLine) {
        gameState.guessLine.setMap(null);
        gameState.guessLine = null;
    }
    
    if (gameState.map) {
        gameState.map.setCenter({ lat: 36.5, lng: 127.5 });
        gameState.map.setZoom(7);
    }
    
    gameState.guessLocation = null;
    
    $('#make-guess').prop('disabled', true);
    $('#reset-pin').prop('disabled', true);
}

function placeGuessMarker(latLng) {
    console.log(`Placing marker at: ${latLng.lat()}, ${latLng.lng()}`);
    
    if (gameState.guessMarker) {
        gameState.guessMarker.setMap(null);
    }
    
    gameState.guessMarker = new google.maps.Marker({
        position: latLng,
        map: gameState.map,
        animation: google.maps.Animation.DROP,
        title: 'Your guess'
    });
    
    gameState.guessLocation = {
        lat: latLng.lat(),
        lng: latLng.lng()
    };
    
    $('#make-guess').prop('disabled', false);
    $('#reset-pin').prop('disabled', false);
    
    gameState.guessMarker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        if (gameState.guessMarker) {
            gameState.guessMarker.setAnimation(null);
        }
    }, 1500);
}

function resetGuessMarker() {
    console.log('Resetting guess marker');
    
    if (gameState.guessMarker) {
        gameState.guessMarker.setMap(null);
        gameState.guessMarker = null;
        gameState.guessLocation = null;
    }
    
    $('#make-guess').prop('disabled', true);
    $('#reset-pin').prop('disabled', true);
}

function submitGuess() {
    console.log('Submitting guess');
    
    clearInterval(gameState.timerInterval);
    
    const distance = calculateDistance(
        gameState.guessLocation.lat, 
        gameState.guessLocation.lng,
        gameState.currentLocation.lat,
        gameState.currentLocation.lng
    );
    
    const score = calculateScore(distance);
    console.log(`Distance: ${distance}km, Score: ${score}`);
    
    gameState.score += score;
    $('#current-score').text(gameState.score);
    
    const roundData = {
        round: gameState.currentRound,
        actualLocation: {
            lat: gameState.currentLocation.lat,
            lng: gameState.currentLocation.lng,
            name: gameState.currentLocation.name
        },
        guessLocation: {
            lat: gameState.guessLocation.lat,
            lng: gameState.guessLocation.lng
        },
        distance: Math.round(distance * 10) / 10,
        score: score,
        time: formatTime(TIME_LIMIT - gameState.timeRemaining)
    };
    
    gameState.roundData.push(roundData);
    
    showResult(roundData);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c;
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function calculateScore(distance) {
    let score = 0;
    
    if (distance <= 1) {
        score = MAX_POINTS_PER_ROUND;
    } else if (distance <= 5) {
        score = MAX_POINTS_PER_ROUND - (distance - 1) * 250;
    } else if (distance <= 10) {
        score = 4000 - (distance - 5) * 200;
    } else if (distance <= 50) {
        score = 3000 - (distance - 10) * 25;
    } else if (distance <= 100) {
        score = 2000 - (distance - 50) * 20;
    } else {
        score = Math.max(0, 1000 - (distance - 100) * 5);
    }
    
    return Math.round(score);
}

function showResult(roundData) {
    console.log('Showing improved result popup');
    
    $('#result-popup').remove();
    
    $('body').append(`
        <div id="result-popup" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.8); z-index: 2000; display: flex; justify-content: center; align-items: center;">
            <div style="background-color: white; width: 90%; max-width: 600px; border-radius: 10px; padding: 20px; box-shadow: 0 0 20px rgba(0,0,0,0.5);">
                <h2 style="color: #e63946; text-align: center; margin-bottom: 15px;">Round ${roundData.round} Result</h2>
                
                <div style="margin-bottom: 15px; text-align: center;">
                    <p style="font-size: 18px;">The location was: <strong>${roundData.actualLocation.name}</strong></p>
                    <p style="font-size: 18px; margin-top: 10px;">Your guess was <strong style="color: ${getDistanceColor(roundData.distance)};">${roundData.distance} km</strong> away</p>
                    <p style="font-size: 20px; margin-top: 10px;">You earned <strong style="color: #e63946;">${roundData.score}</strong> points</p>
                    <p style="margin-top: 5px;">Total score: <strong>${gameState.score}</strong></p>
                </div>
                
                <div id="result-map-container" style="width: 100%; height: 300px; margin: 15px 0; border: 1px solid #ccc;"></div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button id="next-button" style="background-color: #e63946; color: white; border: none; border-radius: 5px; padding: 12px 25px; font-size: 16px; font-weight: bold; cursor: pointer;">
                        ${gameState.currentRound < gameState.totalRounds ? 'Next Round' : 'See Final Score'}
                    </button>
                </div>
            </div>
        </div>
    `);
    
    setTimeout(function() {
        const resultMap = new google.maps.Map(document.getElementById('result-map-container'), {
            center: { 
                lat: (roundData.actualLocation.lat + roundData.guessLocation.lat) / 2, 
                lng: (roundData.actualLocation.lng + roundData.guessLocation.lng) / 2 
            },
            zoom: getAppropriateZoom(roundData.distance),
            streetViewControl: false,
            fullscreenControl: false,
            mapTypeControl: false
        });
        
        const actualMarker = new google.maps.Marker({
            position: { 
                lat: roundData.actualLocation.lat, 
                lng: roundData.actualLocation.lng 
            },
            map: resultMap,
            title: roundData.actualLocation.name,
            label: 'A',
            animation: google.maps.Animation.DROP
        });
        
        const infoWindow = new google.maps.InfoWindow({
            content: `<div><strong>${roundData.actualLocation.name}</strong></div>`
        });
        
        infoWindow.open(resultMap, actualMarker);
        
        const guessMarker = new google.maps.Marker({
            position: { 
                lat: roundData.guessLocation.lat, 
                lng: roundData.guessLocation.lng 
            },
            map: resultMap,
            title: 'Your guess',
            label: 'G',
            animation: google.maps.Animation.DROP
        });
        
        const line = new google.maps.Polyline({
            path: [
                { lat: roundData.actualLocation.lat, lng: roundData.actualLocation.lng },
                { lat: roundData.guessLocation.lat, lng: roundData.guessLocation.lng }
            ],
            geodesic: true,
            strokeColor: '#FF5722',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            map: resultMap
        });
        
        const midLat = (roundData.actualLocation.lat + roundData.guessLocation.lat) / 2;
        const midLng = (roundData.actualLocation.lng + roundData.guessLocation.lng) / 2;
        
        const distanceLabel = new google.maps.InfoWindow({
            position: { lat: midLat, lng: midLng },
            content: `<div style="font-weight: bold; color: #FF5722;">${roundData.distance} km</div>`,
            disableAutoPan: true
        });
        
        distanceLabel.open(resultMap);
    }, 100);
    
    $('#next-button').on('click', function() {
        console.log('Next button clicked');
        $('#result-popup').remove();
        
        if (gameState.currentRound >= gameState.totalRounds) {
            finishGame();
        } else {
            startRound(gameState.currentRound + 1);
        }
    });
}

function getDistanceColor(distance) {
    if (distance <= 1) return '#4CAF50';
    if (distance <= 5) return '#8BC34A';
    if (distance <= 20) return '#FFEB3B';
    if (distance <= 50) return '#FF9800';
    return '#F44336';
}

function getAppropriateZoom(distance) {
    if (distance < 5) return 13;
    if (distance < 10) return 12;
    if (distance < 20) return 11;
    if (distance < 50) return 10;
    if (distance < 100) return 9;
    return 8;
}

function startNextRound() {
    console.log('Next round / finish game button clicked');
    
    $('#result-popup').remove();
    
    if (gameState.currentRound >= gameState.totalRounds) {
        finishGame();
        return;
    }
    
    startRound(gameState.currentRound + 1);
}

function finishGame() {
    console.log('Game finished - showing final results');
    
    let totalDistance = 0;
    let bestRound = { score: 0, round: 0 };
    let worstRound = { score: Infinity, round: 0 };
    
    gameState.roundData.forEach((round, index) => {
        totalDistance += round.distance;
        
        if (round.score > bestRound.score) {
            bestRound = { score: round.score, round: index + 1 };
        }
        
        if (round.score < worstRound.score) {
            worstRound = { score: round.score, round: index + 1 };
        }
    });
    
    const avgDistance = Math.round(totalDistance / gameState.roundData.length * 10) / 10;
    
    $('body').append(`
        <div id="upload-indicator" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background-color: rgba(0, 0, 0, 0.7); z-index: 3000; display: flex; justify-content: center; 
            align-items: center; flex-direction: column;">
            <div style="color: white; font-size: 24px; margin-bottom: 20px;">Saving your score...</div>
            <div class="spinner" style="border: 5px solid #f3f3f3; border-top: 5px solid #3498db; 
                border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite;"></div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `);
    
    const gameResults = {
        totalScore: gameState.score,
        rounds: gameState.roundData,
        timestamp: new Date()
    };
    
    localStorage.setItem('gameResults', JSON.stringify(gameResults));
    
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        saveScoreToFirebase(gameState.score, gameState.roundData)
            .then(() => {
                showFinalResults(avgDistance, bestRound, true);
            })
            .catch(error => {
                console.error('Error saving score:', error);
                showFinalResults(avgDistance, bestRound, false);
            });
    } else {
        setTimeout(() => {
            showFinalResults(avgDistance, bestRound, false);
        }, 1000);
    }
}

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

function showFinalResults(avgDistance, bestRound, savedToFirebase) {
    $('#upload-indicator').remove();
    
    const user = firebase.auth().currentUser;
    const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const playerName = user ? (user.displayName || user.email) : (storedUser.displayName || 'Guest');
    
    $('body').append(`
        <div id="final-results" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); z-index: 2000; display: flex; justify-content: center; align-items: center;">
            <div style="background-color: white; width: 90%; max-width: 600px; border-radius: 10px; padding: 20px; box-shadow: 0 0 20px rgba(0,0,0,0.5);">
                <h2 style="color: #e63946; text-align: center; margin-bottom: 25px; font-size: 28px;">Game Complete!</h2>
                
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="font-size: 40px; color: #1d3557; font-weight: bold; margin-bottom: 5px;">${gameState.score}</div>
                    <div style="font-size: 18px; color: #666;">TOTAL POINTS</div>
                    <div style="font-size: 16px; color: ${savedToFirebase ? '#4CAF50' : '#FF9800'}; margin-top: 5px;">
                        ${savedToFirebase ? 'Score saved to leaderboard' : 'Playing as guest - score not saved'}
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-around; margin-bottom: 25px;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #457b9d;">${avgDistance} km</div>
                        <div style="font-size: 14px; color: #666;">AVG DISTANCE</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #457b9d;">Round ${bestRound.round}</div>
                        <div style="font-size: 14px; color: #666;">BEST ROUND</div>
                    </div>
                </div>
                
                <div style="margin-top: 15px;">
                    <h3 style="color: #1d3557; margin-bottom: 10px;">Round Summary</h3>
                    <div style="max-height: 150px; overflow-y: auto; border: 1px solid #eee; padding: 10px; border-radius: 5px;">
                        ${createRoundSummaryHTML()}
                    </div>
                </div>
                
                <div style="display: flex; justify-content: center; gap: 15px; margin-top: 25px;">
                    <button id="play-again-btn" style="background-color: #e63946; color: white; border: none; border-radius: 5px; padding: 12px 20px; font-weight: bold; cursor: pointer;">Play Again</button>
                    <button id="leaderboard-btn" style="background-color: #2a9d8f; color: white; border: none; border-radius: 5px; padding: 12px 20px; font-weight: bold; cursor: pointer;">Leaderboard</button>
                    <button id="home-btn" style="background-color: #457b9d; color: white; border: none; border-radius: 5px; padding: 12px 20px; font-weight: bold; cursor: pointer;">Home</button>
                </div>
            </div>
        </div>
    `);
    
    $('#play-again-btn').on('click', function() {
        $('#final-results').remove();
        startGame();
    });
    
    $('#leaderboard-btn').on('click', function() {
        window.location.href = 'leaderboard.html';
    });
    
    $('#home-btn').on('click', function() {
        window.location.href = 'index.html';
    });
}

function createRoundSummaryHTML() {
    let html = '';
    
    gameState.roundData.forEach((round, index) => {
        const scoreColor = round.score > 4000 ? '#4CAF50' : 
                           round.score > 3000 ? '#8BC34A' : 
                           round.score > 2000 ? '#FFEB3B' : 
                           round.score > 1000 ? '#FF9800' : '#F44336';
        
        html += `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: ${index < gameState.roundData.length - 1 ? '1px solid #eee' : 'none'}">
            <div>Round ${round.round}: ${round.actualLocation.name}</div>
            <div style="color: ${scoreColor}; font-weight: bold;">${round.score} pts</div>
        </div>`;
    });
    
    return html;
}

function resetGameState() {
    console.log('Resetting game state');
    
    gameState.currentRound = 1;
    gameState.score = 0;
    gameState.roundData = [];
    gameState.currentLocation = null;
    gameState.guessLocation = null;
    
    clearAllMapMarkers();
    
    $('#current-round').text('1');
    $('#current-score').text('0');
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function startTimer() {
    console.log('Starting timer');
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    updateTimerDisplay();
    
    gameState.timerInterval = setInterval(function() {
        gameState.timeRemaining--;
        
        updateTimerDisplay();
        
        if (gameState.timeRemaining <= 0) {
            console.log('Time is up!');
            clearInterval(gameState.timerInterval);
            
            if (!gameState.guessLocation) {
                placeRandomGuess();
            }
            
            submitGuess();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    
    $('#timer-display').text(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
    
    if (gameState.timeRemaining <= 30) {
        $('#timer-display').addClass('timer-flash');
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function placeRandomGuess() {
    console.log('Placing random guess');
    
    const lat = Math.random() * (KOREA_BOUNDS.north - KOREA_BOUNDS.south) + KOREA_BOUNDS.south;
    const lng = Math.random() * (KOREA_BOUNDS.east - KOREA_BOUNDS.west) + KOREA_BOUNDS.west;
    
    placeGuessMarker(new google.maps.LatLng(lat, lng));
}

function confirmExit() {
    console.log('Confirming exit');
    
    $('body').append(`
        <div id="exit-confirm" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); z-index: 1000; justify-content: center; align-items: center;">
            <div style="background-color: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%;">
                <h2>Exit Game?</h2>
                <p>Your progress will be lost. Are you sure you want to exit?</p>
                <div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;">
                    <button id="confirm-exit-btn" style="background-color: #e63946; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Exit Game</button>
                    <button id="cancel-exit-btn" style="background-color: #457b9d; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Continue Playing</button>
                </div>
            </div>
        </div>
    `);
    
    $("#confirm-exit-btn").on('click', function() {
        window.location.href = 'index.html';
    });
    
    $("#cancel-exit-btn").on('click', function() {
        $("#exit-confirm").remove();
    });
}

function showError(message) {
    console.error('Error:', message);
    
    $('body').append(`
        <div id="error-modal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); z-index: 1000; justify-content: center; align-items: center;">
            <div style="background-color: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%;">
                <h2>Error</h2>
                <p>${message}</p>
                <div style="text-align: center; margin-top: 20px;">
                    <button id="error-ok" style="background-color: #e63946; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">OK</button>
                </div>
            </div>
        </div>
    `);
    
    $('#error-ok').on('click', function() {
        $('#error-modal').remove();
    });
}

function performStateCheck() {
    console.log("Failsafe state check running");
    
    if (gameState.timerInterval && gameState.timeRemaining <= 0) {
        console.log("Timer reached zero but didn't trigger - forcing submit");
        clearInterval(gameState.timerInterval);
        
        if (!gameState.guessLocation) {
            placeRandomGuess();
        }
        
        submitGuess();
    }
    
    if ($('#result-popup').is(':visible') && $('#result-map-container').length > 0 && !$('#result-map-container').children().length) {
        console.log("Result map is empty but modal is showing - redrawing map");
        
        if (gameState.roundData.length > 0) {
            const lastRound = gameState.roundData[gameState.roundData.length - 1];
            showResult(lastRound);
        }
    }
}

$(document).ready(function() {
    setInterval(performStateCheck, 5000);
});