const translations = {
    ru: {
        title: 'Волшебный поединок',
        analyze: 'Анализировать ход',
        depth: 'Глубина',
        moon: 'Луна',
        sun: 'Солнце',
        moonTurn: 'Ход луны',
        sunTurn: 'Ход солнца',
        vs: 'VS',
        topMoves: 'Топ 5 лучших ходов для',
        move: 'Ход',
        score: 'Оценка',
        positionalMove: 'Позиционный ход',
        noMoves: 'Нет доступных ходов для анализа',
        winningMove: 'Выигрышный ход',
        blockThreat: 'Блокировка угрозы',
        strongThreat: 'Сильная угроза',
        developAttack: 'Развитие атаки'
    },
    en: {
        title: 'Wizard Duel',
        analyze: 'Analyze Move',
        depth: 'Depth',
        moon: 'Moon',
        sun: 'Sun',
        moonTurn: 'Moon\'s turn',
        sunTurn: 'Sun\'s turn',
        vs: 'VS',
        topMoves: 'Top 5 best moves for',
        move: 'Move',
        score: 'Score',
        positionalMove: 'Positional move',
        noMoves: 'No moves available for analysis',
        winningMove: 'Winning move',
        blockThreat: 'Block threat',
        strongThreat: 'Strong threat',
        developAttack: 'Develop attack'
    }
};

// Функция для изменения языка
function changeLang(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });

    // Обновляем текст
    document.querySelector('h1').textContent = translations[lang].title;
    document.querySelector('#analyzeButton').textContent = translations[lang].analyze;
    document.querySelector('#player1 span').textContent = translations[lang].moon;
    document.querySelector('#player2 span').textContent = translations[lang].sun;
    document.querySelector('.vs').textContent = translations[lang].vs;
    
    // Обновляем текст глубины
    const depthSelect = document.querySelector('#depthSelect');
    Array.from(depthSelect.options).forEach(option => {
        option.textContent = `${translations[lang].depth} ${option.value}`;
    });

    // Обновляем текст анализа, если он есть
    const analysisResults = document.querySelector('#analysis-results');
    if (analysisResults && analysisResults.innerHTML.trim() !== '') {
        // Перезапускаем анализ для обновления текста
        document.querySelector('#analyzeButton').click();
    }

    // Сохраняем выбранный язык
    currentLang = lang;
}

// Глобальная переменная для текущего языка
let currentLang = 'ru';

// Добавляем обработчики событий для кнопок языка
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => changeLang(btn.dataset.lang));
    });
});

class WizardDuel {
    constructor() {
        this.gridSize = 15;
        this.board = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(null));
        this.engine = new WizardEngine(this.gridSize);
        this.currentPlayer = 'moon';
        this.gameOver = false;
        this.winLength = 5;
        this.setupBoard();
        this.initializeControls();
        gameEngine = this.engine; // Сохраняем engine в глобальную переменную
    }

    setupBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', () => this.makeMove(i, j));
                gameBoard.appendChild(cell);
            }
        }
        
        this.updateStatus('Ход луны');
    }

    initializeControls() {
        const analyzeButton = document.getElementById('analyzeButton');
        const depthSelect = document.getElementById('depthSelect');
        
        analyzeButton.addEventListener('click', () => {
            this.clearSuggestions();
            const depth = parseInt(depthSelect.value);
            // Синхронизируем состояние перед анализом
            this.engine.board = JSON.parse(JSON.stringify(this.board));
            this.analyzeMoves(depth);
        });
    }

    clearSuggestions() {
        document.querySelectorAll('.cell.suggestion').forEach(cell => {
            cell.classList.remove('suggestion', 'suggestion-best', 'suggestion-good', 'suggestion-neutral', 'suggestion-bad');
            cell.removeAttribute('data-score');
        });
    }

    analyzeMoves(depth) {
        console.time('Analysis');
        const analysis = this.engine.analyzeBestMove(depth, this.currentPlayer);
        console.timeEnd('Analysis');

        if (analysis.length === 0) {
            document.getElementById('analysis-results').innerHTML = translations[currentLang].noMoves;
            return;
        }

        // Показываем результаты анализа
        const resultsDiv = document.getElementById('analysis-results');
        resultsDiv.innerHTML = `<strong>${translations[currentLang].topMoves} ${this.currentPlayer === 'moon' ? translations[currentLang].moon : translations[currentLang].sun}:</strong><br>`;
        
        // Подсвечиваем ходы на доске
        analysis.forEach((move, index) => {
            const cell = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            if (cell && !this.board[move.row][move.col]) {
                cell.classList.add('suggestion');
                
                // Добавляем класс в зависимости от оценки
                const score = move.score;
                if (score >= 1000) {
                    cell.classList.add('suggestion-best');
                } else if (score >= 500) {
                    cell.classList.add('suggestion-good');
                } else {
                    cell.classList.add('suggestion-neutral');
                }
                
                cell.setAttribute('data-score', move.score);
            }

            // Добавляем информацию в результаты
            resultsDiv.innerHTML += `${index + 1}. ${translations[currentLang].move}: [${move.row}, ${move.col}], ` +
                `${translations[currentLang].score}: ${Math.round(move.score)}, ` +
                `${move.description}<br>`;
        });
    }

    makeMove(row, col) {
        if (this.gameOver || this.board[row][col]) return;

        this.board[row][col] = this.currentPlayer;
        this.engine.board[row][col] = this.currentPlayer;
        // Обновляем кэш движка при каждом ходе
        this.engine.moveCache.add([row, col].toString());
        
        this.updateCell(row, col);
        this.clearSuggestions();

        if (this.checkWin(row, col)) {
            this.gameOver = true;
            this.updateStatus(`${this.currentPlayer === 'moon' ? translations[currentLang].moon : translations[currentLang].sun} ${translations[currentLang].winningMove}`);
            return;
        }

        this.currentPlayer = this.currentPlayer === 'moon' ? 'sun' : 'moon';
        this.updateStatus(`${translations[currentLang].moonTurn} ${this.currentPlayer === 'moon' ? translations[currentLang].moon : translations[currentLang].sun}`);
        
        // Анализируем после каждого хода
        const depth = parseInt(document.getElementById('depthSelect').value);
        this.analyzeMoves(depth);
    }

    checkWin(row, col) {
        const directions = [
            [[0, 1], [0, -1]], // horizontal
            [[1, 0], [-1, 0]], // vertical
            [[1, 1], [-1, -1]], // diagonal
            [[1, -1], [-1, 1]] // anti-diagonal
        ];

        return directions.some(dir => {
            const count = 1 + 
                this.countDirection(row, col, dir[0][0], dir[0][1]) +
                this.countDirection(row, col, dir[1][0], dir[1][1]);
            return count >= this.winLength;
        });
    }

    countDirection(row, col, dRow, dCol) {
        const player = this.board[row][col];
        let count = 0;
        let currentRow = row + dRow;
        let currentCol = col + dCol;

        while (
            currentRow >= 0 && currentRow < this.gridSize &&
            currentCol >= 0 && currentCol < this.gridSize &&
            this.board[currentRow][currentCol] === player
        ) {
            count++;
            currentRow += dRow;
            currentCol += dCol;
        }

        return count;
    }

    updateCell(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add(this.board[row][col]);
    }

    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }

    updateUI() {
        const analysisResults = document.getElementById('analysis-results');
        if (!analysisResults) {
            console.error('Не найден элемент для результатов анализа');
            return;
        }
        
        // Получаем ходы для обоих игроков
        const moonMoves = this.engine.analyzeBestMove(4, 'moon');
        const sunMoves = this.engine.analyzeBestMove(4, 'sun');
        
        // Показываем результаты
        analysisResults.innerHTML = `
            <div class="moon-moves">
                <h3>${translations[currentLang].topMoves} ${translations[currentLang].moon}:</h3>
                ${moonMoves.map((move, index) => 
                    `${index + 1}. ${translations[currentLang].move}: [${move.row}, ${move.col}], ` +
                    `${translations[currentLang].score}: ${Math.round(move.score)}, ` +
                    `${move.description}`
                ).join('<br>')}
            </div>
            <br>
            <div class="sun-moves">
                <h3>${translations[currentLang].topMoves} ${translations[currentLang].sun}:</h3>
                ${sunMoves.map((move, index) => 
                    `${index + 1}. ${translations[currentLang].move}: [${move.row}, ${move.col}], ` +
                    `${translations[currentLang].score}: ${Math.round(move.score)}, ` +
                    `${move.description}`
                ).join('<br>')}
            </div>
        `;
    }
}

class WizardEngine {
    constructor(size = 15) {
        this.gridSize = size;
        this.board = Array(size).fill().map(() => Array(size).fill(null));
        this.winLength = 5;
        this.patterns = {
            win: ['XXXXX'],
            mustBlock: ['XXXX_', '_XXXX', 'XXX_X', 'X_XXX'], 
            urgent: ['XX_XX', '_XXX_', 'XX__X'], 
        };
        this.moveCache = new Set();
        this.centerPoint = Math.floor(size / 2);
    }

    analyzeBestMove(depth, player) {
        const opponent = player === 'moon' ? 'sun' : 'moon';
        
        // 1. Сначала ищем выигрышный ход
        const winningMove = this.findWinningMove(player);
        if (winningMove) {
            return [winningMove];
        }

        // 2. Затем ищем блокирующий ход против победы противника
        const blockingMove = this.findWinningMove(opponent);
        if (blockingMove) {
            blockingMove.score = 900;
            blockingMove.description = translations[currentLang].blockThreat;
            return [blockingMove];
        }

        // 3. Ищем форсированные угрозы
        const threatMoves = this.findThreats(player, opponent);
        if (threatMoves.length > 0) {
            return threatMoves;
        }

        // 4. Обычный поиск ходов
        return this.findNormalMoves(player, opponent, depth);
    }

    findWinningMove(player) {
        // Проверяем все возможные ходы на немедленную победу
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (!this.board[i][j]) {
                    this.board[i][j] = player;
                    if (this.checkWin(i, j, player)) {
                        this.board[i][j] = null;
                        return {
                            row: i,
                            col: j,
                            score: 1000,
                            description: translations[currentLang].winningMove
                        };
                    }
                    this.board[i][j] = null;
                }
            }
        }
        return null;
    }

    findThreats(player, opponent) {
        const threats = [];
        const searchArea = this.getRelevantMoves();

        for (const [row, col] of searchArea) {
            if (!this.board[row][col]) {
                // Проверяем создание угрозы
                const threatScore = this.evaluateThreat(row, col, player);
                
                // Проверяем блокировку угрозы противника
                const blockScore = this.evaluateThreat(row, col, opponent);
                
                const score = Math.max(threatScore, blockScore);
                if (score > 300) {
                    threats.push({
                        row, col,
                        score: score,
                        description: score === threatScore ? translations[currentLang].strongThreat : translations[currentLang].blockThreat
                    });
                }
            }
        }

        return threats.sort((a, b) => b.score - a.score).slice(0, 5);
    }

    findNormalMoves(player, opponent, depth) {
        const moves = [];
        const searchArea = this.getRelevantMoves();

        for (const [row, col] of searchArea) {
            if (!this.board[row][col]) {
                const score = this.evaluatePosition(row, col, player, opponent);
                if (score > 0) {
                    moves.push({
                        row, col,
                        score: score,
                        description: this.getDescription(score)
                    });
                }
            }
        }

        return moves.sort((a, b) => b.score - a.score).slice(0, 5);
    }

    getRelevantMoves() {
        const moves = new Set();
        
        // Ищем ходы вокруг существующих фигур
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.board[i][j]) {
                    // Добавляем соседние клетки
                    for (let di = -2; di <= 2; di++) {
                        for (let dj = -2; dj <= 2; dj++) {
                            const newRow = i + di;
                            const newCol = j + dj;
                            if (this.isValidCell(newRow, newCol) && !this.board[newRow][newCol]) {
                                moves.add([newRow, newCol].toString());
                            }
                        }
                    }
                }
            }
        }

        // Если нет ходов - вернуть центр и клетки вокруг
        if (moves.size === 0) {
            const center = Math.floor(this.gridSize / 2);
            moves.add([center, center].toString());
            for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                    moves.add([center + di, center + dj].toString());
                }
            }
        }

        return Array.from(moves).map(pos => pos.split(',').map(Number));
    }

    evaluateThreat(row, col, player) {
        this.board[row][col] = player;
        let maxThreat = 0;

        // Проверяем все направления
        const directions = [[1,0], [0,1], [1,1], [1,-1]];
        
        for (const [dx, dy] of directions) {
            const line = this.getLine(row, col, dx, dy, player);
            
            // Проверяем паттерны угроз
            if (this.matchesPattern(line, this.patterns.mustBlock)) {
                maxThreat = Math.max(maxThreat, 800);
            } else if (this.matchesPattern(line, this.patterns.urgent)) {
                maxThreat = Math.max(maxThreat, 400);
            }
        }

        this.board[row][col] = null;
        return maxThreat;
    }

    evaluatePosition(row, col, player, opponent) {
        let score = 0;
        
        // Оценка позиции
        const distToCenter = Math.max(
            Math.abs(row - this.centerPoint),
            Math.abs(col - this.centerPoint)
        );
        score += (10 - distToCenter) * 2;

        // Оценка соседних фигур
        let playerPieces = 0;
        let opponentPieces = 0;
        
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const r = row + i;
                const c = col + j;
                if (this.isValidCell(r, c)) {
                    if (this.board[r][c] === player) playerPieces++;
                    else if (this.board[r][c] === opponent) opponentPieces++;
                }
            }
        }
        
        score += playerPieces * 15;
        score += opponentPieces * 10;

        return score;
    }

    getLine(row, col, dx, dy, player) {
        let line = '';
        const opponent = player === 'moon' ? 'sun' : 'moon';

        // Смотрим в обе стороны от точки
        for (let dir = -4; dir <= 4; dir++) {
            const r = row + dir * dx;
            const c = col + dir * dy;
            if (this.isValidCell(r, c)) {
                if (this.board[r][c] === player) line += 'X';
                else if (this.board[r][c] === opponent) line += 'O';
                else line += '_';
            }
        }

        return line;
    }

    matchesPattern(line, patterns) {
        return patterns.some(pattern => line.includes(pattern));
    }

    isValidCell(row, col) {
        return row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize;
    }

    getDescription(score) {
        if (score >= 1000) return translations[currentLang].winningMove;
        if (score >= 800) return translations[currentLang].blockThreat;
        if (score >= 600) return translations[currentLang].strongThreat;
        if (score >= 400) return translations[currentLang].strongThreat;
        if (score >= 200) return translations[currentLang].developAttack;
        return translations[currentLang].positionalMove;
    }

    checkWin(row, col, player) {
        const directions = [[1,0], [0,1], [1,1], [1,-1]];
        
        return directions.some(([dx, dy]) => {
            let count = 1;
            
            // Проверяем в одну сторону
            let r = row + dx;
            let c = col + dy;
            while (this.isValidCell(r, c) && this.board[r][c] === player) {
                count++;
                r += dx;
                c += dy;
            }
            
            // Проверяем в другую сторону
            r = row - dx;
            c = col - dy;
            while (this.isValidCell(r, c) && this.board[r][c] === player) {
                count++;
                r -= dx;
                c -= dy;
            }
            
            return count >= this.winLength;
        });
    }
}

// Глобальная переменная для игры
let gameEngine;

// Start the game
new WizardDuel();
