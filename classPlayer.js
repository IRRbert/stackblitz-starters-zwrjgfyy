// classPlayer.js
// Controls the simulation playback speed and stepping

class classPlayer {
    constructor() {
        this.titel = "Player";
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        this.minFrameTime = 100; // Fixed time step (10fps for more consistent updates)
        
        // Create the player window immediately but hide it
        this.createPlayerWindow();
        
        // Register to menu
        MENU.register_to_MENU({
            MENU_Name: this.titel,
            MENU_Klick: this.MENU_Klick.bind(this)
        });

        // Start animation loop
        this.animate();
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
                    <legend>Zeitschritt</legend>
                    <div id="timeStepDisplay">0</div>
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
            x: "0",
            y: "bottom",
            oncreate: () => {
                // Play/Pause button
                document.getElementById('playPauseButton').addEventListener('click', () => {
                    this.isPlaying = !this.isPlaying;
                    document.getElementById('playPauseButton').textContent = this.isPlaying ? '⏸️ Pause' : '▶️ Play';
                    document.getElementById('stepButton').disabled = this.isPlaying;
                    this.updateTimeStepDisplay();
                });
                
                // Step button
                document.getElementById('stepButton').addEventListener('click', () => {
                    if (!this.isPlaying && window.SIMULATION) {
                        this.performStep();
                    }
                });
            }
        });
    }
    
    updateTimeStepDisplay() {
        const timeStepElement = document.getElementById('timeStepDisplay');
        if (!timeStepElement || !window.SIMULATION) return;
        timeStepElement.textContent = window.SIMULATION.stepCounter;
    }
    
    async performStep() {
        if (!window.SIMULATION) return;

        // Perform simulation step
        await window.SIMULATION.performSimulationStep();
        window.SIMULATION.updateFishAndSharkMatrices();
        this.updateTimeStepDisplay();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (meine_szene) {
            meine_szene.controls.update();
            
            if (meine_szene.camera.position.y < 0) {
                meine_szene.groundMaterial.opacity = 0.6;
            } else {
                meine_szene.groundMaterial.opacity = 1;
            }
            
            meine_szene.renderer.render(meine_szene.scene, meine_szene.camera);
        }

        // Handle simulation update with fixed time step
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        
        if (this.isPlaying && deltaTime >= this.minFrameTime) {
            this.performStep();
            this.lastFrameTime = now;
        }
    }
    
    MENU_Klick() {
        if (this.playerWindow) {
            if (this.playerWindow.hidden) {
                this.playerWindow.show();
                this.playerWindow.focus();
            } else {
                this.playerWindow.hide();
            }
        }
    }
}