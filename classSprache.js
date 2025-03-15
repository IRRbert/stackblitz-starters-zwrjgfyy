// Klasse Sprache UI Version 0.0001
class classSprache {
    constructor() {
        this.titel = "Sprache"; // Add titel property
        
        // Create the window immediately but hide it
        this.createSpracheWindow();
        this.spracheWindow.hide();
         
        // Registriere ein Objekt mit der MENU_Klick Methode
        MENU.register_to_MENU({
            MENU_Name: this.titel,
            MENU_Klick: this.MENU_Klick.bind(this) // Wichtig: .bind(this) verwenden!
        });
    }

    // ----------------------------- Sprache WinBox ----------------
    createSpracheWindow() {
        let htmlContent = `<div id="google_translate_element"></div>`;
        // Erstelle das Sprachfenster der WinBox zentriert
        this.spracheWindow = new WinBox({
            title: "Sprache wechseln",
            width: 230,
            height: 100,
            html: htmlContent,
            class: ["no-max", "no-full", "no-close", "no-min"],
            x: "center",
            y: "center",
            // min: true, // Fenster wird minimiert gestartet
            oncreate: () => {
                // Add custom close button to the title bar after WinBox is fully created
                setTimeout(() => {
                    if (this.spracheWindow && this.spracheWindow.dom) {
                        const titleBar = this.spracheWindow.dom.querySelector('.wb-title');
                        if (titleBar) {
                            const closeBtn = document.createElement('span');
                            closeBtn.innerHTML = '×';
                            closeBtn.className = 'custom-close-btn';
                            closeBtn.style.cssText = 'position: absolute; right: 10px; top: 0; cursor: pointer; font-size: 20px;';
                            closeBtn.addEventListener('click', () => {
                                this.spracheWindow.hide();
                            });
                            titleBar.appendChild(closeBtn);
                        }
                    }
                }, 100);
                
                // Lade das Google Translate Skript nach Erstellung des Fensters
                const script1 = document.createElement('script');
                script1.innerHTML = `
                    function googleTranslateElementInit() {
                        new google.translate.TranslateElement({
                            pageLanguage: 'de'
                        }, 'google_translate_element');
                    }
                `;
                document.body.appendChild(script1);
                const script2 = document.createElement('script');
                script2.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
                document.body.appendChild(script2);
            },
            onclose: () => {
                // Hide instead of destroying
                // this.spracheWindow.hide();
            }
        });
    }

    MENU_Klick() {  // Add MENU_Klick function
        if (this.spracheWindow) {
            if (this.spracheWindow.hidden) {
                this.spracheWindow.show();
                this.spracheWindow.focus();
            } else {
                this.spracheWindow.hide();
            }
        }
    }
}

const meine_sprache = new classSprache();

// EOF  classSprache