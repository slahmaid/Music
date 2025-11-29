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
    initNewsletterModal();
    const audioPlayer = new AudioPreviewPlayer();
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
        window.undoManager = initPortfolio(audioPlayer);
    }
});

class AudioPreviewPlayer {
    constructor() {
        this.container = document.querySelector('.audio-mini-player');
        if (!this.container) {
            this.enabled = false;
            return;
        }
        this.enabled = true;
        this.audio = new Audio();
        this.audio.preload = 'auto';
        this.toggleBtn = this.container.querySelector('.player-toggle');
        this.closeBtn = this.container.querySelector('.player-close');
        this.trackEl = this.container.querySelector('.player-track');
        this.metaEl = this.container.querySelector('.player-meta');
        this.timeEl = this.container.querySelector('.player-time');
        this.progress = this.container.querySelector('.player-progress');
        this.defaultTrack = this.trackEl?.textContent || '';
        this.defaultMeta = this.metaEl?.textContent || '';
        this.isScrubbing = false;
        this.currentSrc = '';

        this.toggleBtn?.addEventListener('click', () => this.toggle());
        this.closeBtn?.addEventListener('click', () => this.reset());
        this.progress?.addEventListener('input', (e) => this.handleScrub(e));
        this.progress?.addEventListener('change', (e) => this.commitScrub(e));

        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('play', () => this.setPlayingState(true));
        this.audio.addEventListener('pause', () => this.setPlayingState(false));
        this.audio.addEventListener('ended', () => this.handleEnded());
    }

    load(meta) {
        if (!this.enabled || !meta || !meta.src) return;
        if (this.currentSrc !== meta.src) {
            this.audio.src = meta.src;
            this.currentSrc = meta.src;
        }
        if (this.trackEl) this.trackEl.textContent = meta.title || 'Untitled Preview';
        if (this.metaEl) {
            const details = [meta.genre, meta.description].filter(Boolean).join(" • ");
            this.metaEl.textContent = details || 'Custom preview loaded';
        }
        this.container?.classList.add('active');
        this.play();
    }

    play() {
        if (!this.enabled || !this.currentSrc) return;
        this.audio.play().catch(() => {});
    }

    pause() {
        if (!this.enabled) return;
        this.audio.pause();
    }

    toggle() {
        if (!this.enabled || !this.currentSrc) return;
        if (this.audio.paused) {
            this.play();
        } else {
            this.pause();
        }
    }

    handleScrub(event) {
        if (!this.enabled || !this.progress || !this.audio.duration) return;
        this.isScrubbing = true;
        const percent = Number(event.target.value) / 100;
        this.timeEl.textContent = this.formatTime(percent * this.audio.duration);
    }

    commitScrub(event) {
        if (!this.enabled || !this.progress || !this.audio.duration) return;
        const percent = Number(event.target.value) / 100;
        this.audio.currentTime = percent * this.audio.duration;
        this.isScrubbing = false;
    }

    updateProgress() {
        if (!this.enabled || this.isScrubbing || !this.progress || !isFinite(this.audio.duration)) return;
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.progress.value = percent || 0;
        if (this.timeEl) this.timeEl.textContent = this.formatTime(this.audio.currentTime);
    }

    setPlayingState(isPlaying) {
        if (!this.enabled || !this.container) return;
        this.container.classList.toggle('is-playing', isPlaying);
    }

    handleEnded() {
        if (!this.enabled) return;
        this.progress.value = 0;
        this.timeEl.textContent = '0:00';
        this.setPlayingState(false);
    }

    reset() {
        if (!this.enabled) return;
        this.pause();
        this.container?.classList.remove('active', 'is-playing');
        this.audio.src = '';
        this.currentSrc = '';
        if (this.progress) this.progress.value = 0;
        if (this.trackEl) this.trackEl.textContent = this.defaultTrack;
        if (this.metaEl) this.metaEl.textContent = this.defaultMeta;
        if (this.timeEl) this.timeEl.textContent = '0:00';
    }

    formatTime(time) {
        const minutes = Math.floor(time / 60) || 0;
        const seconds = Math.floor(time % 60) || 0;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
}

function initNewsletterModal() {
    const modal = document.getElementById('newsletter-modal');
    const closeBtn = document.getElementById('close-newsletter');
    const status = document.getElementById('newsletter-status');
    const form = document.getElementById('newsletter-form');
    const hasTrigger = document.querySelector('.bell-notify-btn');

    if (!modal || !hasTrigger) return;

    const openModal = () => {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        if (status) {
            status.textContent = '';
            status.classList.remove('visible');
        }
    };

    const closeModal = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    };

    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('.bell-notify-btn');
        if (!trigger) return;
        event.preventDefault();
        const bell = trigger.closest('.bell-wrapper')?.querySelector('.bell-container');
        if (bell) bell.classList.remove('off');
        openModal();
    });

    closeBtn?.addEventListener('click', closeModal);

    modal.addEventListener('click', (event) => {
        if (event.target === modal || event.target.classList.contains('newsletter-backdrop')) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = form.email.value.trim();
        if (!email) return;
        if (status) {
            status.textContent = "You're in. Watch your inbox.";
            status.classList.add('visible');
        }
        form.reset();
    });
}

function initPortfolio(previewPlayer) {
    class AnimationManager {
      constructor() {
        this.backgroundImage = document.getElementById("backgroundImage");
        this.projectItems = document.querySelectorAll(".project-item");
        this.portfolioContainer = document.querySelector(".portfolio-container");
        this.previewPlayer = previewPlayer;
        
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
                  if (e.target.closest('.listen-btn')) {
                      return;
                  }
                  
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

              const listenBtn = item.querySelector('.listen-btn');
              if (listenBtn && this.previewPlayer && this.previewPlayer.enabled) {
                  listenBtn.addEventListener('click', (event) => {
                      event.stopPropagation();
                      this.previewPlayer.load(this.getPreviewMeta(item));
                  });
              }
          });
      }

      getPreviewMeta(item) {
          return {
              title: item.querySelector('.album')?.textContent || 'Untitled Preview',
              artist: item.querySelector('.artist')?.textContent || '',
              genre: item.dataset.genre || '',
              description: item.dataset.description || '',
              src: item.dataset.preview || ''
          };
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