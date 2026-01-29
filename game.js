// Game state
let gameState = {
    isAnimating: false,
    goals: 0,
    saves: 0
};

// Zone positions mapping (relative to goal area)
const zonePositions = {
    'top-left': { top: '65%', left: '12.5%' },
    'top-right': { top: '65%', left: '87.5%' },
    'bottom-left': { top: '98%', left: '12.5%' },
    'bottom-right': { top: '98%', left: '87.5%' }
};

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    const goalZones = document.querySelectorAll('.goal-zone');
    const ball = document.getElementById('ball');
    const keeper = document.getElementById('keeper');
    const resultOverlay = document.getElementById('resultOverlay');
    const resultText = document.getElementById('resultText');

    // Preload keeper images for better performance
    const keeperImages = [
        'KEEPER NORMAL.png',
        'KEEPER save high.png',
        'KEEPER save high right.png',
        'KEEPER Save Low.png',
        'KEEPER low right.png'
    ];
    keeperImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });

    // Add click listeners to goal zones
    goalZones.forEach(zone => {
        zone.addEventListener('click', function() {
            if (gameState.isAnimating) return;
            
            const zoneType = this.getAttribute('data-zone');
            takeShot(zoneType);
        });
    });

    // Add keyboard controls (1-4 keys)
    document.addEventListener('keydown', function(event) {
        if (gameState.isAnimating) return;
        
        // Map keys 1-4 to zones
        const keyToZone = {
            '1': 'top-left',
            '2': 'top-right',
            '3': 'bottom-left',
            '4': 'bottom-right'
        };
        
        const zoneType = keyToZone[event.key];
        if (zoneType) {
            takeShot(zoneType);
        }
    });

    function takeShot(zoneType) {
        gameState.isAnimating = true;
        
        // Hide result overlay if visible
        resultOverlay.classList.remove('show');
        
        // Reset keeper and ball
        keeper.src = 'KEEPER NORMAL.png';
        keeper.className = 'keeper';
        ball.className = 'ball';
        
        // Calculate if keeper saves (60% chance of saving based on zone)
        const isSave = checkIfSave(zoneType);
        
        // Determine which corner keeper dives to
        let diveToZone = zoneType;
        if (!isSave) {
            // Dive to wrong corner for goals - opposite side
            if (zoneType === 'top-left') {
                diveToZone = 'top-right';
            } else if (zoneType === 'top-right') {
                diveToZone = 'top-left';
            } else if (zoneType === 'bottom-left') {
                diveToZone = 'bottom-right';
            } else if (zoneType === 'bottom-right') {
                diveToZone = 'bottom-left';
            }
        }
        
        // Get position for ball animation
        const zonePos = zonePositions[zoneType];
        const divePos = zonePositions[diveToZone];
        
        // Animate keeper and ball at the same time
        animateKeeper(zoneType, isSave);
        animateBall(zonePos, isSave, diveToZone);
        
        // Show result after animation (longer for saves due to bounce)
        const animationDelay = isSave ? 1400 : 1200;
        setTimeout(() => {
            showResult(isSave);
            if (isSave) {
                gameState.saves++;
            } else {
                gameState.goals++;
            }
            updateScore();
            resetGame();
        }, animationDelay);
    }

    function checkIfSave(zoneType) {
        // Keeper saves based on zone difficulty
        // Corners are harder to save
        const saveProbabilities = {
            'top-left': 0.4,
            'top-right': 0.4,
            'bottom-left': 0.3,
            'bottom-right': 0.3
        };
        
        return Math.random() < saveProbabilities[zoneType];
    }

    function animateKeeper(zoneType, isSave) {
        // Keeper always dives
        // If it's a save, dive to the correct corner
        // If it's a goal, dive to the wrong corner (opposite side)
        let diveClass = '';
        let keeperImage = 'KEEPER NORMAL.png';
        
        // Determine which corner to dive to
        let diveToZone = zoneType;
        if (!isSave) {
            // Dive to wrong corner for goals - opposite side
            if (zoneType === 'top-left') {
                diveToZone = 'top-right';
            } else if (zoneType === 'top-right') {
                diveToZone = 'top-left';
            } else if (zoneType === 'bottom-left') {
                diveToZone = 'bottom-right';
            } else if (zoneType === 'bottom-right') {
                diveToZone = 'bottom-left';
            }
        }
        
        // Set dive class and image based on where we're diving
        // Always use save images (high for top zones, low for bottom zones)
        if (diveToZone === 'top-left') {
            diveClass = 'diving-top-left';
            keeperImage = 'KEEPER save high.png';
        } else if (diveToZone === 'top-right') {
            diveClass = 'diving-top-right';
            keeperImage = 'KEEPER save high right.png';
        } else if (diveToZone === 'bottom-left') {
            diveClass = 'diving-bottom-left';
            keeperImage = 'KEEPER Save Low.png';
        } else if (diveToZone === 'bottom-right') {
            diveClass = 'diving-bottom-right';
            keeperImage = 'KEEPER low right.png';
        }
        
        // Apply the dive animation and image
        keeper.src = keeperImage;
        keeper.className = 'keeper ' + diveClass;
        
        // If it's a goal and keeper dived to top-left or top-right, make them fall after the dive
        if (!isSave && (diveToZone === 'top-left' || diveToZone === 'top-right')) {
            setTimeout(() => {
                // Add fall animation after dive completes (0.5s)
                const fallClass = diveToZone === 'top-left' ? 'falling-top-left' : 'falling-top-right';
                keeper.className = 'keeper ' + fallClass;
            }, 500); // After dive animation completes
        }
    }

    function animateBall(zonePos, isSave, diveToZone) {
        const ball = document.getElementById('ball');
        const goalArea = document.querySelector('.goal-area');
        const goalRect = goalArea.getBoundingClientRect();
        const ballContainer = ball.parentElement;
        
        // Calculate final position relative to viewport
        let finalLeft = goalRect.left + (goalRect.width * parseFloat(zonePos.left) / 100);
        let finalTop = goalRect.top + (goalRect.height * parseFloat(zonePos.top) / 100);
        
        // If it's a save, adjust ball position to align with keeper's hands
        if (isSave) {
            const keeperContainer = document.querySelector('.keeper-container');
            const keeperRect = keeperContainer.getBoundingClientRect();
            const keeperCenterX = keeperRect.left + keeperRect.width / 2;
            
            // Adjust based on dive direction to match keeper's hand position
            if (diveToZone === 'bottom-left') {
                // Keeper dives -70px left, 20px down - adjust ball to hit hands, more to side and higher
                finalLeft = keeperCenterX - 70 - 75; // More to the side
                finalTop = keeperRect.bottom - keeperRect.height * 0.35 - 5; // 20px higher
            } else if (diveToZone === 'bottom-right') {
                // Keeper dives 70px right, 20px down
                finalLeft = keeperCenterX + 70 + 75; // More to the side
                finalTop = keeperRect.bottom - keeperRect.height * 0.35 - 5; // 20px higher
            } else if (diveToZone === 'top-left') {
                // Keeper dives -40px left, -30px up
                finalLeft = keeperCenterX - 40 - 90; // Even further left to match hands
                finalTop = keeperRect.bottom - keeperRect.height * 0.65 - 25; // Higher to match hands
            } else if (diveToZone === 'top-right') {
                // Keeper dives 40px right, -30px up
                finalLeft = keeperCenterX + 40 + 90; // Even further right to match hands
                finalTop = keeperRect.bottom - keeperRect.height * 0.65 - 25; // Higher to match hands
            }
        }
        
        // Get ball's current position (center bottom)
        const ballRect = ballContainer.getBoundingClientRect();
        const startLeft = ballRect.left + ballRect.width / 2;
        const startTop = ballRect.top + ballRect.height / 2;
        
        // Calculate distance and angle
        const deltaX = finalLeft - startLeft;
        const deltaY = finalTop - startTop;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Apply transform (keep the -50% translateX for center, then add the delta)
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        // Calculate scale - ball gets smaller as it travels (from 1.0 to 0.3)
        const scaleEnd = 0.3;
        
        // Animate ball to target
        ballContainer.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        ballContainer.style.transform = `translate(calc(-50% + ${deltaX}px), ${deltaY}px) rotate(${angle}deg) scale(${scaleEnd})`;
        ball.classList.add('shooting');
        
        // If it's a save, bounce the ball away after it reaches the keeper
        if (isSave) {
            setTimeout(() => {
                // Calculate bounce direction based on the dive zone
                // Use explicit directions for each zone to ensure correct bounce
                let bounceX = 0;
                let bounceY = 0;
                let bounceAngle = 0;
                
                const bounceMagnitude = 400; // Distance to bounce off-screen
                
                if (diveToZone === 'bottom-right') {
                    // Bounce purely to the right
                    bounceX = bounceMagnitude;
                    bounceY = 0;
                    bounceAngle = 0;
                } else if (diveToZone === 'bottom-left') {
                    // Bounce purely to the left
                    bounceX = -bounceMagnitude;
                    bounceY = 0;
                    bounceAngle = 180;
                } else if (diveToZone === 'top-right') {
                    // Bounce right and up
                    bounceX = bounceMagnitude * 0.7;
                    bounceY = -bounceMagnitude * 0.5;
                    bounceAngle = -35;
                } else if (diveToZone === 'top-left') {
                    // Bounce left and up
                    bounceX = -bounceMagnitude * 0.7;
                    bounceY = -bounceMagnitude * 0.5;
                    bounceAngle = 215;
                }
                
                ballContainer.style.transition = 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                ballContainer.style.transform = `translate(calc(-50% + ${deltaX + bounceX}px), ${deltaY + bounceY}px) rotate(${bounceAngle}deg) scale(${scaleEnd * 1.5})`;
            }, 800); // After ball reaches target (800ms)
        }
    }

    function showResult(isSave) {
        resultText.textContent = isSave ? 'SAVE!' : 'GOAL!!!';
        resultText.className = 'result-text ' + (isSave ? 'save' : 'goal');
        resultOverlay.classList.add('show');
    }

    function updateScore() {
        document.getElementById('goals').textContent = gameState.goals;
        document.getElementById('saves').textContent = gameState.saves;
    }

    function resetGame() {
        setTimeout(() => {
            const ballContainer = document.querySelector('.ball-container');
            const ball = document.getElementById('ball');
            
            // Reset ball position to center bottom and restore size
            ballContainer.style.transform = 'translateX(-50%) rotate(0deg) scale(1)';
            ball.classList.remove('shooting');
            
            // Reset keeper only when ball resets (keep dive position until now)
            keeper.src = 'KEEPER NORMAL.png';
            keeper.className = 'keeper';
            
            // Hide result after 2 seconds
            setTimeout(() => {
                resultOverlay.classList.remove('show');
                gameState.isAnimating = false;
            }, 2000);
        }, 1500);
    }
});