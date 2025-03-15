// classStatistik.js
class classStatistik {
    constructor() {
        this.titel = "Statistik";
        this.clearData();
        
        // Create the statistics window
        this.createStatistikWindow();
        
        // Register to menu
        MENU.register_to_MENU({
            MENU_Name: this.titel,
            MENU_Klick: this.MENU_Klick.bind(this)
        });
    }

    clearData() {
        this.data = {
            steps: [],
            fish: [],
            sharks: []
        };
    }

    createStatistikWindow() {
        let htmlContent = `
            <div style="padding: 10px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="text-align: left; padding: 5px;">Schritt</th>
                            <th style="text-align: right; padding: 5px;">Fische</th>
                            <th style="text-align: right; padding: 5px;">Haie</th>
                        </tr>
                    </thead>
                    <tbody id="statisticsBody">
                    </tbody>
                </table>
            </div>
        `;

        const { width: contentWidth, height: contentHeight } = measureContentSize(htmlContent);
        const windowWidth = Math.max(contentWidth + 24, 300);
        const windowHeight = Math.max(contentHeight + 60, 300);

        this.statistikWindow = new WinBox({
            title: this.titel,
            width: windowWidth + 'px',
            height: windowHeight + 'px',
            x: "right",
            y: "center",
            html: htmlContent,
            class: ["no-max", "no-full", "no-close"],
            oncreate: () => {
                // Add custom close button
                setTimeout(() => {
                    if (this.statistikWindow && this.statistikWindow.dom) {
                        const titleBar = this.statistikWindow.dom.querySelector('.wb-title');
                        if (titleBar) {
                            const closeBtn = document.createElement('span');
                            closeBtn.innerHTML = '×';
                            closeBtn.className = 'custom-close-btn';
                            closeBtn.style.cssText = 'position: absolute; right: 10px; top: 0; cursor: pointer; font-size: 20px;';
                            closeBtn.addEventListener('click', () => {
                                this.statistikWindow.hide();
                            });
                            titleBar.appendChild(closeBtn);
                        }
                    }
                }, 100);
            }
        });
    }

    updateStatistics(step, fishCount, sharkCount) {
        // Store the data
        this.data.steps.push(step);
        this.data.fish.push(fishCount);
        this.data.sharks.push(sharkCount);

        // Limit data arrays to 200 entries
        if (this.data.steps.length > 200) {
            this.data.steps.shift();
            this.data.fish.shift();
            this.data.sharks.shift();
        }

        // Update the display
        const tbody = document.getElementById('statisticsBody');
        if (tbody) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="text-align: left; padding: 5px;">${step}</td>
                <td style="text-align: right; padding: 5px;">${fishCount}</td>
                <td style="text-align: right; padding: 5px;">${sharkCount}</td>
            `;
            
            // Insert at the top
            if (tbody.firstChild) {
                tbody.insertBefore(row, tbody.firstChild);
            } else {
                tbody.appendChild(row);
            }
            
            // Keep only the last 200 entries
            while (tbody.children.length > 200) {
                tbody.removeChild(tbody.lastChild);
            }
        }

        // Check for stop conditions
        if (fishCount === 0 || sharkCount === 0) {
            if (window.PLAYER) {
                window.PLAYER.isPlaying = false;
                const playPauseButton = document.getElementById('playPauseButton');
                if (playPauseButton) {
                    playPauseButton.textContent = '▶️ Play';
                }
                const stepButton = document.getElementById('stepButton');
                if (stepButton) {
                    stepButton.disabled = false;
                }
            }
        }
    }

    MENU_Klick() {
        if (this.statistikWindow) {
            if (this.statistikWindow.hidden) {
                this.statistikWindow.show();
                this.statistikWindow.focus();
            } else {
                this.statistikWindow.hide();
            }
        }
    }
}