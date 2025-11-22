const CONFIG = { timeZone: "Europe/Zagreb", timeUpdateInterval: 1000 };

// Page Navigation Logic
const unlockBtn = document.getElementById('unlock-btn');
if (unlockBtn) {
    unlockBtn.addEventListener('click', () => {
        const landing = document.getElementById('landing-view');
        if (landing) {
            landing.style.opacity = '0';
            setTimeout(() => {
                window.location.assign('project.html');
            }, 800);
        } else {
            window.location.assign('project.html');
        }
    });
}

const backBtn = document.getElementById('back-btn');
if (backBtn) {
    backBtn.addEventListener('click', () => {
        const vault = document.getElementById('vault-view');
        if (vault) {
            vault.style.opacity = '0';
            setTimeout(() => {
                window.location.assign('index.html');
            }, 800);
        } else {
            window.location.assign('index.html');
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Landing Page Scroller ONLY if on landing page
    const scroller = document.querySelector(".scroller");
    if (scroller) {
        const container = document.querySelector(".container");
        const progressCounter = document.querySelector(".progress-counter h1");
        const progressBar = document.querySelector(".progress-bar");
        const sections = Array.from(scroller.querySelectorAll("section"));
        const isMobile = window.innerWidth <= 768;
        const touchSensitivity = isMobile ? 3.0 : 2.5; 
        const bufferSize = 2;
        let targetScrollX = 0, currentScrollX = 0, isAnimating = false, currentProgressScale = 0, targetProgressScale = 0, lastPercentage = 0;
        let isDown = false, lastTouchX = 0, touchVelocity = 0, lastTouchTime = 0;
        const lerp = (start, end, factor) => start + (end - start) * factor;

        const setupScroll = () => {
            scroller.querySelectorAll(".clone-section").forEach((clone) => clone.remove());
            const originalSections = Array.from(scroller.querySelectorAll("section:not(.clone-section)"));
            const templateSections = originalSections.length > 0 ? originalSections : sections;
            let sequenceWidth = 0;
            templateSections.forEach((section) => { sequenceWidth += parseFloat(window.getComputedStyle(section).width); });
            for (let i = -bufferSize; i < 0; i++) { templateSections.forEach((section, index) => { const clone = section.cloneNode(true); clone.classList.add("clone-section"); clone.setAttribute("data-clone-index", `${i}-${index}`); scroller.appendChild(clone); }); }
            if (originalSections.length === 0) { templateSections.forEach((section, index) => { const clone = section.cloneNode(true); clone.setAttribute("data-clone-index", `0-${index}`); scroller.appendChild(clone); }); }
            for (let i = 1; i <= bufferSize; i++) { templateSections.forEach((section, index) => { const clone = section.cloneNode(true); clone.classList.add("clone-section"); clone.setAttribute("data-clone-index", `${i}-${index}`); scroller.appendChild(clone); }); }
            scroller.style.width = `${sequenceWidth * (1 + bufferSize * 2)}px`;
            targetScrollX = sequenceWidth * bufferSize; currentScrollX = targetScrollX; scroller.style.transform = `translateX(-${currentScrollX}px)`;
            return sequenceWidth;
        };
        const checkBoundaryAndReset = (sequenceWidth) => {
            if (currentScrollX > sequenceWidth * (bufferSize + 0.5)) { targetScrollX -= sequenceWidth; currentScrollX -= sequenceWidth; scroller.style.transform = `translateX(-${currentScrollX}px)`; return true; }
            if (currentScrollX < sequenceWidth * (bufferSize - 0.5)) { targetScrollX += sequenceWidth; currentScrollX += sequenceWidth; scroller.style.transform = `translateX(-${currentScrollX}px)`; return true; }
            return false;
        };
        const updateProgress = (sequenceWidth, forceReset = false) => {
            const basePosition = sequenceWidth * bufferSize; const currentPosition = (currentScrollX - basePosition) % sequenceWidth; let percentage = (currentPosition / sequenceWidth) * 100;
            if (percentage < 0) percentage = 100 + percentage;
            const isWrapping = (lastPercentage > 80 && percentage < 20) || (lastPercentage < 20 && percentage > 80) || forceReset;
            if(progressCounter) progressCounter.textContent = `${Math.round(percentage)}`; 
            targetProgressScale = percentage / 100;
            if (isWrapping) { currentProgressScale = targetProgressScale; if(progressBar) progressBar.style.transform = `scaleX(${currentProgressScale})`; }
            lastPercentage = percentage;
        };
        const animate = (sequenceWidth, forceProgressReset = false) => {
            currentScrollX = lerp(currentScrollX, targetScrollX, 0.05); scroller.style.transform = `translateX(-${currentScrollX}px)`; updateProgress(sequenceWidth, forceProgressReset);
            if (!forceProgressReset) { currentProgressScale = lerp(currentProgressScale, targetProgressScale, 0.05); } if(progressBar) progressBar.style.transform = `scaleX(${currentProgressScale})`;
            if (Math.abs(targetScrollX - currentScrollX) > 0.01) { requestAnimationFrame(() => animate(sequenceWidth)); } else { isAnimating = false; }
        };
        let sequenceWidth = setupScroll(); updateProgress(sequenceWidth, true); if(progressBar) progressBar.style.transform = `scaleX(${currentProgressScale})`;
        window.addEventListener('resize', () => { sequenceWidth = setupScroll(); });
        container.addEventListener("wheel", (e) => { e.preventDefault(); targetScrollX += e.deltaY; const needsReset = checkBoundaryAndReset(sequenceWidth); if (!isAnimating) { isAnimating = true; requestAnimationFrame(() => animate(sequenceWidth, needsReset)); } }, { passive: false });
        container.addEventListener("touchstart", (e) => { isDown = true; lastTouchX = e.touches[0].clientX; lastTouchTime = Date.now(); targetScrollX = currentScrollX; }, { passive: false });
        container.addEventListener("touchmove", (e) => { if(!isDown) return; e.preventDefault(); const currentTouchX = e.touches[0].clientX; const touchDelta = lastTouchX - currentTouchX; targetScrollX += touchDelta * touchSensitivity; const currentTime = Date.now(); const timeDelta = currentTime - lastTouchTime; if (timeDelta > 0) touchVelocity = (touchDelta / timeDelta) * 15; lastTouchX = currentTouchX; lastTouchTime = currentTime; const needsReset = checkBoundaryAndReset(sequenceWidth); if (!isAnimating) { isAnimating = true; requestAnimationFrame(() => animate(sequenceWidth, needsReset)); } }, { passive: false });
        container.addEventListener("touchend", () => { isDown = false; if (Math.abs(touchVelocity) > 0.1) { targetScrollX += touchVelocity * 20; const decayVelocity = () => { touchVelocity *= 0.95; if (Math.abs(touchVelocity) > 0.1) { targetScrollX += touchVelocity; const needsReset = checkBoundaryAndReset(sequenceWidth); if (needsReset) updateProgress(sequenceWidth, true); requestAnimationFrame(decayVelocity); } }; requestAnimationFrame(decayVelocity); } });
    }

    // Initialize Portfolio ONLY if on project page
    if (document.querySelector('.portfolio-container')) {
        window.undoManager = initPortfolio();
    }
});

function initPortfolio() {
    class AnimationManager {
      constructor() {
        this.backgroundImage = document.getElementById("backgroundImage");
        this.projectItems = document.querySelectorAll(".project-item");
        this.portfolioContainer = document.querySelector(".portfolio-container");
        
        this.currentActiveIndex = -1; 
        this.originalTexts = new Map();
        this.debounceTimeout = null; 
        this.idleAnimation = null; 
        this.isIdle = true; 
        this.idleTimer = null; 

        this.projectItems.forEach((item) => { 
            const textElements = item.querySelectorAll(".hover-text"); 
            const texts = Array.from(textElements).map((el) => el.textContent); 
            this.originalTexts.set(item, texts); 
        });
      }

      initializeAnimations() {
        this.preloadImages();
        this.projectItems.forEach((item, index) => { this.addEventListeners(item, index); });
        const container = document.querySelector(".portfolio-container");
        container.addEventListener("mouseleave", () => {
          if (this.debounceTimeout) { clearTimeout(this.debounceTimeout); }
          this.clearActiveStates();
          this.hideBackgroundImage();
          this.startIdleTimer();
        });
        this.startIdleTimer();
        this.initTrackModal();
      }

      initTrackModal() {
          const modal = document.getElementById('track-details-modal');
          const closeBtn = document.getElementById('close-modal-btn');
          
          // Close handlers
          if(closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
          if(modal) modal.addEventListener('click', (e) => {
              if (e.target === modal) modal.classList.remove('active');
          });

          // Item click handlers
          this.projectItems.forEach((item) => {
              item.addEventListener('click', (e) => {
                  // Check if we clicked the button specifically (optional behavior, depends if user wants separate actions)
                  // Here we trigger modal on row click as requested
                  
                  const data = {
                      img: item.dataset.image,
                      artist: item.querySelector('.artist').textContent,
                      track: item.querySelector('.album').textContent,
                      album: item.querySelector('.label').textContent, 
                      category: item.querySelector('.category').textContent,
                      year: item.querySelector('.year').textContent,
                      spotify: item.dataset.spotify,
                      youtube: item.dataset.youtube,
                      apple: item.dataset.apple
                  };

                  this.populateModal(data);
                  if(modal) modal.classList.add('active');
              });
          });
      }

      populateModal(data) {
          const img = document.getElementById('modal-img');
          if(img) img.src = data.img;
          
          const title = document.getElementById('modal-title');
          if(title) title.textContent = data.track;
          
          const artist = document.getElementById('modal-artist');
          if(artist) artist.textContent = data.artist;
          
          const album = document.getElementById('modal-album');
          if(album) album.innerHTML = `<b>Album</b> ${data.album}`;
          
          const cat = document.getElementById('modal-category');
          if(cat) cat.innerHTML = `<b>Format</b> ${data.category}`;
          
          const year = document.getElementById('modal-year');
          if(year) year.innerHTML = `<b>Released</b> ${data.year}`;
          
          const spotify = document.getElementById('link-spotify');
          if(spotify) spotify.href = data.spotify;
          
          const youtube = document.getElementById('link-youtube');
          if(youtube) youtube.href = data.youtube;
          
          const apple = document.getElementById('link-apple');
          if(apple) apple.href = data.apple;
      }

      preloadImages() { this.projectItems.forEach((item) => { const imageUrl = item.dataset.image; if (imageUrl) { const img = new Image(); img.crossOrigin = "anonymous"; img.src = imageUrl; } }); }
      
      addEventListeners(item, index) {
        const textElements = item.querySelectorAll(".hover-text");
        const imageUrl = item.dataset.image;
        const originalTexts = this.originalTexts.get(item);
        
        const handleMouseEnter = () => {
          if(window.innerWidth <= 768) return; 
          this.stopIdleAnimation(); this.stopIdleTimer(); this.isIdle = false;
          if (this.debounceTimeout) { clearTimeout(this.debounceTimeout); }
          if (this.currentActiveIndex === index) return;
          this.updateActiveStates(index);
          textElements.forEach((element, i) => { gsap.killTweensOf(element); gsap.to(element, { duration: 0.8, scrambleText: { text: originalTexts[i], chars: "qwerty1337h@ck3r", revealDelay: 0.3, speed: 0.4 } }); });
          if (imageUrl) { this.showBackgroundImage(imageUrl); }
        };
        
        const handleMouseLeave = () => {
          if(window.innerWidth <= 768) return;
          this.debounceTimeout = setTimeout(() => { textElements.forEach((element, i) => { gsap.killTweensOf(element); element.textContent = originalTexts[i]; }); }, 50);
        };

        item.addEventListener("mouseenter", handleMouseEnter);
        item.addEventListener("mouseleave", handleMouseLeave);
      }
      
      updateActiveStates(activeIndex) {
        this.currentActiveIndex = activeIndex;
        this.portfolioContainer.classList.add("has-active");
        this.projectItems.forEach((item, index) => { if (index === activeIndex) { item.classList.add("active"); } else { item.classList.remove("active"); } });
      }
      clearActiveStates() {
        this.currentActiveIndex = -1;
        this.portfolioContainer.classList.remove("has-active");
        this.projectItems.forEach((item) => {
          item.classList.remove("active");
          const textElements = item.querySelectorAll(".hover-text"); const originalTexts = this.originalTexts.get(item);
          textElements.forEach((element, i) => { gsap.killTweensOf(element); element.textContent = originalTexts[i]; });
        });
        this.startIdleTimer();
      }
      showBackgroundImage(imageUrl) {
        if(window.innerWidth <= 768) return; 
        this.backgroundImage.style.transition = "none";
        this.backgroundImage.style.transform = "translate(-50%, -50%) scale(1.2)";
        this.backgroundImage.style.backgroundImage = `url(${imageUrl})`;
        this.backgroundImage.style.opacity = "1";
        requestAnimationFrame(() => { requestAnimationFrame(() => { this.backgroundImage.style.transition = "opacity 0.6s ease, transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)"; this.backgroundImage.style.transform = "translate(-50%, -50%) scale(1.0)"; }); });
      }
      hideBackgroundImage() { this.backgroundImage.style.opacity = "0"; }
      startIdleTimer() { this.stopIdleTimer(); this.idleTimer = setTimeout(() => { if (this.currentActiveIndex === -1) { this.isIdle = true; this.startIdleAnimation(); } }, 3000); }
      stopIdleTimer() { if (this.idleTimer) { clearTimeout(this.idleTimer); this.idleTimer = null; } }
      startIdleAnimation() {
        if (this.idleAnimation) return;
        this.idleAnimation = gsap.timeline({ repeat: -1, repeatDelay: 2 });
        const columnElements = { artists: [...this.projectItems].map((item) => item.querySelector(".artist")), albums: [...this.projectItems].map((item) => item.querySelector(".album")), categories: [...this.projectItems].map((item) => item.querySelector(".category")), labels: [...this.projectItems].map((item) => item.querySelector(".label")), years: [...this.projectItems].map((item) => item.querySelector(".year")) };
        const totalRows = this.projectItems.length;
        const columnStartDelay = 0.25; const rowDelay = 0.05; const hideShowGap = totalRows * rowDelay * 0.5;
        this.projectItems.forEach((item, rowIndex) => { const hideTime = 0 + rowIndex * rowDelay; const showTime = 0 + hideShowGap + rowIndex * rowDelay; this.idleAnimation.call(() => { item.classList.add("counter-hidden"); }, [], hideTime); this.idleAnimation.call(() => { item.classList.remove("counter-hidden"); }, [], showTime); });
        Object.keys(columnElements).forEach((columnName, columnIndex) => { const elements = columnElements[columnName]; const columnStart = (columnIndex + 1) * columnStartDelay; elements.forEach((element, rowIndex) => { const hideTime = columnStart + rowIndex * rowDelay; this.idleAnimation.to(element, { duration: 0.1, opacity: 0.05, ease: "power2.inOut" }, hideTime); }); elements.forEach((element, rowIndex) => { const showTime = columnStart + hideShowGap + rowIndex * rowDelay; this.idleAnimation.to(element, { duration: 0.1, opacity: 1, ease: "power2.inOut" }, showTime); }); });
      }
      stopIdleAnimation() { if (this.idleAnimation) { this.idleAnimation.kill(); this.idleAnimation = null; gsap.set([...document.querySelectorAll(".project-data")], { opacity: 1 }); this.projectItems.forEach((item) => { item.classList.remove("counter-hidden"); }); } }
    }
    class TimeDisplay {
      constructor(elementId) { this.element = document.getElementById(elementId); if (!this.element) { throw new Error(`Element with id '${elementId}' not found.`); } }
      start() { this.updateDisplay(); setInterval(() => this.updateDisplay(), CONFIG.timeUpdateInterval); }
      updateDisplay() { const { hours, minutes, dayPeriod } = this.getCurrentTime(); const timeString = `${hours}<span class="time-blink">:</span>${minutes} ${dayPeriod}`; this.element.innerHTML = timeString; }
      getCurrentTime() { const now = new Date(); const options = { timeZone: CONFIG.timeZone, hour12: true, hour: "numeric", minute: "numeric", second: "numeric" }; const formatter = new Intl.DateTimeFormat("en-US", options); const parts = formatter.formatToParts(now); return { hours: parts.find((part) => part.type === "hour").value, minutes: parts.find((part) => part.type === "minute").value, dayPeriod: parts.find((part) => part.type === "dayPeriod").value }; }
    }
    const animationManager = new AnimationManager();
    animationManager.initializeAnimations();
    const timeDisplay = new TimeDisplay("current-time");
    timeDisplay.start();
    return animationManager;
}