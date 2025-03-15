class classSimulation_ui {
    constructor() {
        // Initialize the dimensions with smaller default values
        this.dimensions = {
            x: 20,
            y: 20,
            z: 20
        };

        // Initialize the standard values
        this.world_edge = 'keine';
        this.neighbors = {
            sides: true,
            edges: true,
            corners: true
        };

        // Initialize values for fish and sharks
        this.fish = {
            count: 100,
            birth: 10
        };
        
        this.shark = {
            count: 10,
            birth: 50,
            starve: 70
        };

        // Load default settings if they exist
        this.loadDefaultSettings();

        // Create WinBox immediately and keep it visible
        this.createWatorBox();

        // Register to menu
        MENU.register_to_MENU({
            MENU_Name: 'Wator',
            MENU_Klick: this.MENU_Klick.bind(this),
        });

        window.addEventListener('resize', () => {
            this.centerWatorBox();
        });
    }

    loadDefaultSettings() {
        fetch('simulation/default.json')
            .then(response => response.json())
            .then(settings => {
                // Apply settings
                if (settings.dimensions) {
                    this.dimensions = settings.dimensions;
                }
                if (settings.world_edge) {
                    this.world_edge = settings.world_edge;
                }
                if (settings.neighbors) {
                    this.neighbors = settings.neighbors;
                }
                if (settings.fish) {
                    this.fish = settings.fish;
                }
                if (settings.shark) {
                    this.shark = settings.shark;
                }

                // Update UI if WatorBox exists
                if (this.WatorBox) {
                    this.updateSettingsUI();
                }
            })
            .catch(error => {
                console.warn('Could not load default settings:', error);
            });
    }

    createWatorBox() {
        let htmlContent = `<form>`;
        htmlContent += `
                    <fieldset>
                      <legend>Dimensionen: </legend>
                      <button type="button" id="dimensionButton">
                           X:${this.dimensions.x}, Y:${this.dimensions.y}, Z:${this.dimensions.z}
                      </button>            <br>
                    </fieldset>`;

        htmlContent += `
                    <fieldset>
                          <legend>Der Grenzen der Welt sind: </legend>
                        <select id="world_edge">
                            <option value="keine" ${this.world_edge === 'keine' ? 'selected' : ''}>keine</option>
                            <option value="Wand" ${this.world_edge === 'Wand' ? 'selected' : ''}>Wände</option>
                            <option value="verbunden" ${this.world_edge === 'verbunden' ? 'selected' : ''}>verbunden</option>
                        </select>
                    </fieldset>
                    `;

        htmlContent += `<fieldset><legend>Was sind Nachbarn: </legend>
                     <label><input type="checkbox" id="neighbor-sides" value="sides" ${this.neighbors.sides ? 'checked' : ''} onchange="if (!this.checked && !document.getElementById('neighbor-edges').checked && !document.getElementById('neighbor-corners').checked) this.checked = true;">Seiten</label>            
                     <label><input type="checkbox" id="neighbor-edges" value="edges" ${this.neighbors.edges ? 'checked' : ''} onchange="if (!this.checked && !document.getElementById('neighbor-sides').checked && !document.getElementById('neighbor-corners').checked) this.checked = true;">Kanten</label>
                     <label><input type="checkbox" id="neighbor-corners" value="corners" ${this.neighbors.corners ? 'checked' : ''} onchange="if (!this.checked && !document.getElementById('neighbor-sides').checked && !document.getElementById('neighbor-edges').checked) this.checked = true;">Ecken</label>
                   </fieldset>`;

        htmlContent += `<fieldset><legend>Wesen: 
                  </legend>`;

        htmlContent += `<fieldset><legend>Fische: 
                    <input type="number" id="fish_count" name="fish_count" min="0" max="1000" value="${this.fish.count}"> 
                    </legend>`;

        htmlContent += `
                  Zeit bis Nachwuchs: <input type="number" id="fish_birth" name="fish_birth" min="0" max="1000" value="${this.fish.birth}">   `;

        htmlContent += `</fieldset>`;

        htmlContent += `<fieldset><legend>Haie: 
                    <input type="number" id="shark_count" name="shark_count" min="0" max="1000" value="${this.shark.count}"> 
                    </legend>`;

        htmlContent += `
                  Zeit bis Nachwuchs: <input type="number" id="shark_birth" name="shark_birth" min="0" max="1000" value="${this.shark.birth}">   
                  <br>
                  Zeit bis Verhungert: <input type="number" id="shark_starve" name="shark_starve" min="0" max="1000" value="${this.shark.starve}"> 
                  `;

        htmlContent += `</fieldset>`;
        htmlContent += `</fieldset>`;

        htmlContent += `<div style="text-align: center;"><button type="button" id="startRestartButton">Start / Restart</button></div>`;

        htmlContent += `<fieldset>
            <legend>Einstellungen</legend>
            <div style="text-align: center;">
                <button type="button" id="saveWatorSettingsBtn">Speichern</button>
                <button type="button" id="loadWatorSettingsBtn">Laden</button>
            </div>
        </fieldset>`;

        htmlContent += `</form>`;

        const { width: contentWidth, height: contentHeight } = measureContentSize(htmlContent);
        const windowWidth = contentWidth + 24;
        const windowHeight = contentHeight + 60;

        this.WatorBox = new WinBox({
            title: 'Wator',
            width: windowWidth + 'px',
            height: windowHeight + 'px',
            html: htmlContent,
            class: ['no-max', 'no-full', "no-close"],
            x: '0',
            y: '0',
            oncreate: () => {
                setTimeout(() => {
                    if (this.WatorBox && this.WatorBox.dom) {
                        const titleBar = this.WatorBox.dom.querySelector('.wb-title');
                        if (titleBar) {
                            const closeBtn = document.createElement('span');
                            closeBtn.innerHTML = '×';
                            closeBtn.className = 'custom-close-btn';
                            closeBtn.style.cssText = 'position: absolute; right: 10px; top: 0; cursor: pointer; font-size: 20px;';
                            closeBtn.addEventListener('click', () => {
                                this.WatorBox.hide();
                            });
                            titleBar.appendChild(closeBtn);
                        }
                    }
                }, 100);
                
                const dimensionButton = document.getElementById('dimensionButton');
                if (dimensionButton) {
                    dimensionButton.addEventListener('click', this.openDimensionWindow.bind(this));
                }

                document.getElementById('neighbor-sides').addEventListener('change', (e) => {
                    this.neighbors.sides = e.target.checked;
                });
                document.getElementById('neighbor-edges').addEventListener('change', (e) => {
                    this.neighbors.edges = e.target.checked;
                });
                document.getElementById('neighbor-corners').addEventListener('change', (e) => {
                    this.neighbors.corners = e.target.checked;
                });

                document.getElementById('world_edge').addEventListener('change', (e) => {
                    this.world_edge = e.target.value;
                });

                document.getElementById('fish_count').addEventListener('change', (e) => {
                    this.fish.count = parseInt(e.target.value);
                });
                document.getElementById('fish_birth').addEventListener('change', (e) => {
                    this.fish.birth = parseInt(e.target.value);
                });

                document.getElementById('shark_count').addEventListener('change', (e) => {
                    this.shark.count = parseInt(e.target.value);
                });
                document.getElementById('shark_birth').addEventListener('change', (e) => {
                    this.shark.birth = parseInt(e.target.value);
                });
                document.getElementById('shark_starve').addEventListener('change', (e) => {
                    this.shark.starve = parseInt(e.target.value);
                });

                document.getElementById('startRestartButton').addEventListener('click', () => {
                    const config = {
                        dimensions: this.dimensions,
                        neighbors: this.neighbors,
                        world_edge: this.world_edge,
                        fish: this.fish,
                        shark: this.shark
                    };

                    if (!window.SIMULATION) {
                        window.SIMULATION = new classSimulation(config);
                        meine_szene.registerUpdateObject(window.SIMULATION);
                    } else {
                        window.SIMULATION.removeFromScene();
                        window.SIMULATION = new classSimulation(config);
                        meine_szene.registerUpdateObject(window.SIMULATION);
                    }
                });

                // Settings buttons event listeners
                document.getElementById('saveWatorSettingsBtn').addEventListener('click', () => this.saveSettings());
                document.getElementById('loadWatorSettingsBtn').addEventListener('click', () => this.loadSettings());
            }
        });

        return this.WatorBox;
    }

    saveSettings() {
        const settings = {
            dimensions: this.dimensions,
            world_edge: this.world_edge,
            neighbors: this.neighbors,
            fish: this.fish,
            shark: this.shark
        };

        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wator-settings.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    loadSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const settings = JSON.parse(e.target.result);
                        this.applySettings(settings);
                        this.updateSettingsUI();
                    } catch (error) {
                        console.error('Error parsing settings file:', error);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    applySettings(settings) {
        if (settings.dimensions) {
            this.dimensions = settings.dimensions;
        }
        if (settings.world_edge) {
            this.world_edge = settings.world_edge;
        }
        if (settings.neighbors) {
            this.neighbors = settings.neighbors;
        }
        if (settings.fish) {
            this.fish = settings.fish;
        }
        if (settings.shark) {
            this.shark = settings.shark;
        }
    }

    updateSettingsUI() {
        // Update dimension button
        const dimensionButton = document.getElementById('dimensionButton');
        if (dimensionButton) {
            dimensionButton.textContent = `X:${this.dimensions.x}, Y:${this.dimensions.y}, Z:${this.dimensions.z}`;
        }

        // Update world edge
        const worldEdgeSelect = document.getElementById('world_edge');
        if (worldEdgeSelect) {
            worldEdgeSelect.value = this.world_edge;
        }

        // Update neighbors
        const neighborSides = document.getElementById('neighbor-sides');
        const neighborEdges = document.getElementById('neighbor-edges');
        const neighborCorners = document.getElementById('neighbor-corners');
        if (neighborSides) neighborSides.checked = this.neighbors.sides;
        if (neighborEdges) neighborEdges.checked = this.neighbors.edges;
        if (neighborCorners) neighborCorners.checked = this.neighbors.corners;

        // Update fish settings
        const fishCount = document.getElementById('fish_count');
        const fishBirth = document.getElementById('fish_birth');
        if (fishCount) fishCount.value = this.fish.count;
        if (fishBirth) fishBirth.value = this.fish.birth;

        // Update shark settings
        const sharkCount = document.getElementById('shark_count');
        const sharkBirth = document.getElementById('shark_birth');
        const sharkStarve = document.getElementById('shark_starve');
        if (sharkCount) sharkCount.value = this.shark.count;
        if (sharkBirth) sharkBirth.value = this.shark.birth;
        if (sharkStarve) sharkStarve.value = this.shark.starve;
    }

    centerWatorBox() {
        if (this.WatorBox && !this.WatorBox.min) {
            this.WatorBox.move('0', '0');
        }
    }

    openDimensionWindow() {
      const htmlContent = `
            <form>
                <fieldset><legend>X Y Z</legend>
                <label style="display: block;">X: <input type="number" id="x_value_input" value="${this.dimensions.x}" min="1" max="1000"></label>
                    <input type="range" id="x_slider" min="1" max="1000" step="1" value="${this.dimensions.x}"><br>
                    <label style="display: block;">Y: <input type="number" id="y_value_input" value="${this.dimensions.y}" min="1" max="1000"></label>
                    <input type="range" id="y_slider" min="1" max="1000" step="1" value="${this.dimensions.y}"><br>
                    <label style="display: block;">Z: <input type="number" id="z_value_input" value="${this.dimensions.z}" min="1" max="1000"></label>
                    <input type="range" id="z_slider" min="1" max="1000" step="1" value="${this.dimensions.z}"><br><br>
                    <label style="display: block;">Alle: <input type="number" id="all_value_input" value="${this.dimensions.x === this.dimensions.y && this.dimensions.y === this.dimensions.z ? this.dimensions.x : ''}" min="1" max="1000"></label>
                    <input type="range" id="all_slider" min="1" max="1000" step="1" value="${this.dimensions.x}"><br>
                </fieldset>
                <fieldset><legend>action</legend>
                    <div style="text-align: center;">
                        <button type="button" id="cancelButton">Cancel</button>
                        <button type="button" id="okButton">OK</button>
                    </div>
                </fieldset> 
            </form>
        `;

        const { width: contentWidth, height: contentHeight } = measureContentSize(htmlContent);
        const windowWidth = contentWidth + 24;
        const windowHeight = contentHeight + 60;

        // Create dimension window if it doesn't exist yet
        if (!this.dimensionWindow) {
            this.dimensionWindow = new WinBox({
                title: 'Dimension',
                x: 'center',
                y: 'center',
                width: windowWidth + 'px',
                height: windowHeight + 'px',
                html: htmlContent,
                class: ['no-max', 'no-full', 'no-min'],
                modal: true,
                oncreate: () => {
                    // Add custom close button to the title bar after WinBox is fully created
                    setTimeout(() => {
                        if (this.dimensionWindow && this.dimensionWindow.dom) {
                            const titleBar = this.dimensionWindow.dom.querySelector('.wb-title');
                            if (titleBar) {
                                const closeBtn = document.createElement('span');
                                closeBtn.innerHTML = '×';
                                closeBtn.className = 'custom-close-btn';
                                closeBtn.style.cssText = 'position: absolute; right: 10px; top: 0; cursor: pointer; font-size: 20px;';
                                closeBtn.addEventListener('click', () => {
                                    this.dimensionWindow.hide();
                                });
                                titleBar.appendChild(closeBtn);
                            }
                        }
                    }, 100);
                    
                    document.getElementById('x_slider').addEventListener('input', (event) => {
                        this.dimensions.x = parseInt(event.target.value);
                        document.getElementById('x_value_input').value = this.dimensions.x;
                        this.updateAllValueDisplay();
                    });
                    document.getElementById('y_slider').addEventListener('input', (event) => {
                        this.dimensions.y = parseInt(event.target.value);
                        document.getElementById('y_value_input').value = this.dimensions.y;
                        this.updateAllValueDisplay();
                    });
                    document.getElementById('z_slider').addEventListener('input', (event) => {
                        this.dimensions.z = parseInt(event.target.value);
                        document.getElementById('z_value_input').value = this.dimensions.z;
                        this.updateAllValueDisplay();
                    });
                    document.getElementById('all_slider').addEventListener('input', (event) => {
                        const value = parseInt(event.target.value);
                        this.updateAllValues(value);
                        document.getElementById('all_value_input').value = value;
                    });

                    document.getElementById('cancelButton').addEventListener('click', () => {
                        this.dimensionWindow.hide();
                    });

                    document.getElementById('okButton').addEventListener('click', () => {
                        try {
                            this.dimensions.x = parseInt(document.getElementById('x_value_input').value);
                            this.dimensions.y = parseInt(document.getElementById('y_value_input').value);
                            this.dimensions.z = parseInt(document.getElementById('z_value_input').value);

                            if (isNaN(this.dimensions.x) || isNaN(this.dimensions.y) || isNaN(this.dimensions.z)) {
                                throw new Error('Invalid input: Dimension values must be numeric.');
                            }

                            if (this.dimensions.x === 0) this.dimensions.x = 1;
                            if (this.dimensions.y === 0) this.dimensions.y = 1;
                            if (this.dimensions.z === 0) this.dimensions.z = 1;

                            if (this.dimensions.x * this.dimensions.y * this.dimensions.z < 10) {
                                throw new Error('Zuwenig Dimensionen: Das Produkt von X, Y und Z muss mindestens 10 sein.');
                            }

                            document.getElementById('dimensionButton').textContent = `X:${this.dimensions.x}, Y:${this.dimensions.y}, Z:${this.dimensions.z}`;
                            
                            // Update helper box when dimensions change
                            if (meine_szene) {
                                meine_szene.setupHelperBox();
                            }
                            
                            this.dimensionWindow.hide();
                        } catch (error) {
                            alert(error.message);
                        }
                    });
                }
            });
        } else {
            // Update content if window already exists
            this.dimensionWindow.setTitle('Dimension');
            this.dimensionWindow.body.innerHTML = htmlContent;
            
            // Re-attach event listeners
            document.getElementById('x_slider').addEventListener('input', (event) => {
                this.dimensions.x = parseInt(event.target.value);
                document.getElementById('x_value_input').value = this.dimensions.x;
                this.updateAllValueDisplay();
            });
            document.getElementById('y_slider').addEventListener('input', (event) => {
                this.dimensions.y = parseInt(event.target.value);
                document.getElementById('y_value_input').value = this.dimensions.y;
                this.updateAllValueDisplay();
            });
            document.getElementById('z_slider').addEventListener('input', (event) => {
                this.dimensions.z = parseInt(event.target.value);
                document.getElementById('z_value_input').value = this.dimensions.z;
                this.updateAllValueDisplay();
            });
            document.getElementById('all_slider').addEventListener('input', (event) => {
                const value = parseInt(event.target.value);
                this.updateAllValues(value);
                document.getElementById('all_value_input').value = value;
            });

            document.getElementById('cancelButton').addEventListener('click', () => {
                this.dimensionWindow.hide();
            });

            document.getElementById('okButton').addEventListener('click', () => {
                try {
                    this.dimensions.x = parseInt(document.getElementById('x_value_input').value);
                    this.dimensions.y = parseInt(document.getElementById('y_value_input').value);
                    this.dimensions.z = parseInt(document.getElementById('z_value_input').value);

                    if (isNaN(this.dimensions.x) || isNaN(this.dimensions.y) || isNaN(this.dimensions.z)) {
                        throw new Error('Invalid input: Dimension values must be numeric.');
                    }

                    if (this.dimensions.x === 0) this.dimensions.x = 1;
                    if (this.dimensions.y === 0) this.dimensions.y = 1;
                    if (this.dimensions.z === 0) this.dimensions.z = 1;

                    if (this.dimensions.x * this.dimensions.y * this.dimensions.z < 10) {
                        throw new Error('Zuwenig Dimensionen: Das Produkt von X, Y und Z muss mindestens 10 sein.');
                    }

                    document.getElementById('dimensionButton').textContent = `X:${this.dimensions.x}, Y:${this.dimensions.y}, Z:${this.dimensions.z}`;
                    
                    // Update helper box when dimensions change
                    if (meine_szene) {
                        meine_szene.setupHelperBox();
                    }
                    
                    this.dimensionWindow.hide();
                } catch (error) {
                    alert(error.message);
                }
            });
            
            // Show the window
            this.dimensionWindow.show();
        }
    }

    updateAllValues(value) {
        this.dimensions.x = value;
        this.dimensions.y = value;
        this.dimensions.z = value;
        document.getElementById('x_slider').value = value;
        document.getElementById('x_value_input').value = value;
        document.getElementById('y_slider').value = value;
        document.getElementById('y_value_input').value = value;
        document.getElementById('z_slider').value = value;
        document.getElementById('z_value_input').value = value;
    }

    updateAllValueDisplay() {
        const x = this.dimensions.x;
        const y = this.dimensions.y;
        const z = this.dimensions.z;
        const allValueDisplay = document.getElementById('all_value_input');
        if (x === y && y === z) {
            allValueDisplay.value = x;
        } else {
            allValueDisplay.value = '';
        }
    }

    MENU_Klick() {
        if (this.WatorBox) {
            if (this.WatorBox.hidden) {
                this.WatorBox.show();
                this.WatorBox.focus();
            } else {
                this.WatorBox.hide();
            }
        }
    }
}