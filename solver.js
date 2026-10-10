(async function executeGoodWordsExploit() {
    console.log("[*] Initializing exploit...");

    // 1. EXTRACT THE DOM GRID
    const buttons = document.querySelectorAll('button[data-cell]');
    if (buttons.length === 0) return console.error("[-] Grid not found. Start the game first.");
    
    const grid = [];
    let currentRow = [];
    buttons.forEach((btn, index) => {
        currentRow.push({ letter: btn.textContent.trim().toUpperCase(), index: index, element: btn });
        if ((index + 1) % 5 === 0) { grid.push(currentRow); currentRow = []; }
    });

    // 2. FETCH SCRABBLE DICTIONARY
    console.log("[*] Fetching Scrabble dictionary...");
    const response = await fetch('https://raw.githubusercontent.com/redbo/scrabble/master/dictionary.txt');
    const text = await response.text();
    
    const validWords = new Set();
    const validPrefixes = new Set();
    
    text.split('\n').forEach(word => {
        word = word.trim().toUpperCase();
        if (word.length >= 4 && word.length <= 8) {
            validWords.add(word);
            for (let i = 1; i <= word.length; i++) {
                validPrefixes.add(word.substring(0, i));
            }
        }
    });

    // 3. DFS PATHFINDING
    console.log("[*] Running DFS pathfinding...");
    const foundWordsMap = new Map(); 
    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    function dfs(row, col, currentWord, visitedCoords, currentPath) {
        if (row < 0 || row >= 5 || col < 0 || col >= 5) return;
        const coordKey = `${row},${col}`;
        if (visitedCoords.has(coordKey)) return;

        const cell = grid[row][col];
        currentWord += cell.letter;
        currentPath.push(cell.element); 
        
        if (!validPrefixes.has(currentWord)) {
            currentPath.pop(); 
            return;
        }
        
        visitedCoords.add(coordKey);

        if (currentWord.length >= 4 && validWords.has(currentWord)) {
            if (!foundWordsMap.has(currentWord)) {
                foundWordsMap.set(currentWord, [...currentPath]); 
            }
        }

        for (let [dr, dc] of directions) {
            dfs(row + dr, col + dc, currentWord, new Set(visitedCoords), currentPath);
        }
        currentPath.pop(); 
    }

    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            dfs(r, c, "", new Set(), []);
        }
    }
    
    const wordsArray = Array.from(foundWordsMap.entries()).sort((a, b) => b[0].length - a[0].length);
    console.log(`[+] Found ${wordsArray.length} valid words.`);

    // 4. DISPATCH EVENTS VIA ATTRIBUTE SELECTOR
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    
    function dispatchClick(el) {
        if (!el) return;
        ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(evtType => {
            el.dispatchEvent(new MouseEvent(evtType, { bubbles: true, cancelable: true, view: window, buttons: 1 }));
        });
    }

    const startTime = Date.now();
    const MAX_RUN_TIME_MS = 170000;

    for (let i = 0; i < wordsArray.length; i++) {
        if (Date.now() - startTime > MAX_RUN_TIME_MS) {
            console.log("[!] Time limit reached. Halting.");
            break; 
        }

        let [word, path] = wordsArray[i];
        console.log(`Submitting: ${word}`);
        
        // Click letter sequence
        for (let el of path) {
            dispatchClick(el);
            await sleep(60); 
        }
        
        await sleep(120);

        // Target the submit button directly using the verified attribute selector
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
            dispatchClick(submitButton);
        } else {
            console.warn(`[-] Could not find button[type="submit"] for word: ${word}`);
        }

        // Pacing delay
        let delay = Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
        await sleep(delay); 
    }
    
    console.log("[+] Execution complete.");
})();
