// classPlayer.js
// Controls the simulation playback speed and stepping

class classPlayer {
    constructor() {
        this.titel = "Player";
        this.isPlaying = true;
        this.speed = 1; // Normal speed
        this.brake = 0; // No braking
        this.turbo = 0; // No turbo
        this.lastFrameTime = 0;
        this.frameDelay = 0;
        this.frameSkip = 0;
        
        // Create the player window immediately but hide it
        this.createPlayerWindow();
        this.playerWindow.hide();
        
        // Register to menu
        MENU.register_to_MENU({
            MENU_Name: this.titel,
            MENU_Klick: this.MENU_Klick.bind(this)
        });
    }
    
    createPlayerWindow() {
        let htmlContent = `
            <form>
                <fieldset>
                    <legend>Simulation Control</legend>
                    <div style="text-align: center; margin-bottom: 10px;">
                        <button type="button" id="playPauseButton">⏸️ Pause</button>
                        <button type="button" id="stepButton" disabled>⏯️ Step</button>
                    </div>
                </fieldset>
                
                <fieldset>
                    <legend>Geschwindigkeit</legend>
                    <div>
                        <label>Bremse: <span id="brakeValue">0</span></label><br>
                        <input type="range" id="brakeSlider" min="0" max="10" value="0">
                        <div class="slider-description">Bilder zwischen Zeitschritten</div>
                    </div>
                    
                    <div style="margin-top: 10px;">
                        <label>Turbo: <span id="turboValue">0</span></label><br>
                        <input type="range" id="turboSlider" min="0" max="10" value="0">
                        <div class="slider-description">Bilder überspringen</div>
                    </div>
                </fieldset>
                
                <fieldset>
                    <legend>Aktualisierungsintervall</legend>
                    <div id="updateIntervalDisplay">10 ms</div>
                </fieldset>
            </form>
        `;
        
        const { width: contentWidth, height: contentHeight } = measureContentSize(htmlContent);
        const windowWidth = contentWidth + 24;
        const windowHeight = contentHeight + 60;
        
        this.playerWindow = new WinBox({
            title: this.titel,
            width: windowWidth + 'px',
            height: windowHeight + 'px',
            html: htmlContent,
            class: ["no-max", "no-close", "no-full"],
            x: "center",
            y: "center",
            oncreate: () => {
                // Play/Pause button
                document.getElementById('playPauseButton').addEventListener('click', () => {
                    this.isPlaying = !this.isPlaying;
                    document.getElementById('playPauseButton').textContent = this.isPlaying ? '⏸️ Pause' : '▶️ Play';
                    document.getElementById('stepButton').disabled = this.isPlaying;
                });
                
                // Step button
                document.getElementById('stepButton').addEventListener('click', () => {
                    if (!this.isPlaying && window.SIMULATION) {
                        window.SIMULATION.performSimulationStep();
                    }
                });
                
                // Brake slider
                document.getElementById('brakeSlider').addEventListener('input', (e) => {
                    this.brake = parseInt(e.target.value);
                    document.getElementById('brakeValue').textContent = this.brake;
                    this.updateSimulationSpeed();
                });
                
                // Turbo slider
                document.getElementById('turboSlider').addEventListener('input', (e) => {
                    this.turbo = parseInt(e.target.value);
                    document.getElementById('turboValue').textContent = this.turbo;
                    this.updateSimulationSpeed();
                });
                
                this.updateSimulationSpeed();
            },
            onclose: () => {
                // Hide instead of destroying
                this.playerWindow.hide();
            }
        });
    }
    
    updateSimulationSpeed() {
        if (window.SIMULATION) {
            // Calculate the new update interval based on brake and turbo
            // Base interval is 10ms
            const baseInterval = 10;
            
            // Brake adds delay between steps
            this.frameDelay = this.brake * 100; // Each brake level adds 100ms
            
            // Turbo skips frames
            this.frameSkip = this.turbo;
            
            // Update the simulation's update interval
            window.SIMULATION.updateInterval = baseInterval + this.frameDelay;
            window.SIMULATION.frameSkip = this.frameSkip;
            
            // Update the display
            document.getElementById('updateIntervalDisplay').textContent = 
                `${window.SIMULATION.updateInterval} ms` + 
                (this.frameSkip > 0 ? `, ${this.frameSkip + 1}x speed` : '');
        }
    }
    
    MENU_Klick() {
        if (this.playerWindow) {
            if (this.playerWindow.hidden) {
                this.playerWindow.show();
            } else {
                this.playerWindow.hide();
            }
        }
    }
}

// Create the player instance
window.PLAYER = new classPlayer();