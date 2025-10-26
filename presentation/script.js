// Presentation Navigation Script
let currentSlideIndex = 1;
const totalSlides = 19;

// Initialize presentation
document.addEventListener('DOMContentLoaded', function() {
    updateSlideCounter();
    updateNavigationButtons();
});

// Change slide function
function changeSlide(direction) {
    const currentSlide = document.querySelector('.slide.active');
    const currentIndicator = document.querySelector('.indicator.active');
    
    // Remove active classes
    currentSlide.classList.remove('active');
    currentIndicator.classList.remove('active');
    
    // Update slide index
    currentSlideIndex += direction;
    
    // Wrap around if necessary
    if (currentSlideIndex > totalSlides) {
        currentSlideIndex = 1;
    } else if (currentSlideIndex < 1) {
        currentSlideIndex = totalSlides;
    }
    
    // Show new slide
    const newSlide = document.getElementById(`slide-${currentSlideIndex}`);
    const newIndicator = document.querySelectorAll('.indicator')[currentSlideIndex - 1];
    
    newSlide.classList.add('active');
    newIndicator.classList.add('active');
    
    // Update UI
    updateSlideCounter();
    updateNavigationButtons();
}

// Go to specific slide
function currentSlide(slideNumber) {
    const currentSlide = document.querySelector('.slide.active');
    const currentIndicator = document.querySelector('.indicator.active');
    
    // Remove active classes
    currentSlide.classList.remove('active');
    currentIndicator.classList.remove('active');
    
    // Update slide index
    currentSlideIndex = slideNumber;
    
    // Show new slide
    const newSlide = document.getElementById(`slide-${currentSlideIndex}`);
    const newIndicator = document.querySelectorAll('.indicator')[currentSlideIndex - 1];
    
    newSlide.classList.add('active');
    newIndicator.classList.add('active');
    
    // Update UI
    updateSlideCounter();
    updateNavigationButtons();
}

// Update slide counter
function updateSlideCounter() {
    document.getElementById('currentSlide').textContent = currentSlideIndex;
    document.getElementById('totalSlides').textContent = totalSlides;
}

// Update navigation buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentSlideIndex === 1;
    nextBtn.disabled = currentSlideIndex === totalSlides;
}

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
            if (currentSlideIndex > 1) {
                changeSlide(-1);
            }
            break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ': // Spacebar
            if (currentSlideIndex < totalSlides) {
                changeSlide(1);
            }
            break;
        case 'Home':
            currentSlide(1);
            break;
        case 'End':
            currentSlide(totalSlides);
            break;
        case 'Escape':
            // Toggle fullscreen if supported
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
            break;
    }
});

// Touch/swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function(event) {
    touchStartX = event.changedTouches[0].screenX;
});

document.addEventListener('touchend', function(event) {
    touchEndX = event.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0 && currentSlideIndex > 1) {
            // Swipe right - previous slide
            changeSlide(-1);
        } else if (swipeDistance < 0 && currentSlideIndex < totalSlides) {
            // Swipe left - next slide
            changeSlide(1);
        }
    }
}

// Auto-advance slides (optional - uncomment to enable)
/*
let autoAdvanceTimer;
const autoAdvanceDelay = 10000; // 10 seconds

function startAutoAdvance() {
    autoAdvanceTimer = setInterval(() => {
        if (currentSlideIndex < totalSlides) {
            changeSlide(1);
        } else {
            stopAutoAdvance();
        }
    }, autoAdvanceDelay);
}

function stopAutoAdvance() {
    if (autoAdvanceTimer) {
        clearInterval(autoAdvanceTimer);
        autoAdvanceTimer = null;
    }
}

// Start auto-advance when presentation loads
// startAutoAdvance();

// Stop auto-advance on user interaction
document.addEventListener('click', stopAutoAdvance);
document.addEventListener('keydown', stopAutoAdvance);
document.addEventListener('touchstart', stopAutoAdvance);
*/

// Presentation mode toggle
function togglePresentationMode() {
    const navigation = document.querySelector('.navigation');
    const indicators = document.querySelector('.slide-indicators');
    
    if (navigation.style.display === 'none') {
        navigation.style.display = 'flex';
        indicators.style.display = 'flex';
    } else {
        navigation.style.display = 'none';
        indicators.style.display = 'none';
    }
}

// Add presentation mode toggle on 'P' key
document.addEventListener('keydown', function(event) {
    if (event.key === 'p' || event.key === 'P') {
        togglePresentationMode();
    }
});

// Smooth scroll for long content
document.querySelectorAll('.slide-content').forEach(content => {
    content.style.scrollBehavior = 'smooth';
});

// Add loading animation
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});

// Print styles
window.addEventListener('beforeprint', function() {
    // Show all slides for printing
    document.querySelectorAll('.slide').forEach(slide => {
        slide.style.position = 'relative';
        slide.style.opacity = '1';
        slide.style.transform = 'none';
        slide.style.pageBreakAfter = 'always';
    });
});

window.addEventListener('afterprint', function() {
    // Restore normal view
    location.reload();
});
