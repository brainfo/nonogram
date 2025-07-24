document.addEventListener('DOMContentLoaded', () => {
    const imageLoader = document.getElementById('imageLoader');
    const submitBtn = document.getElementById('submitBtn');
    const saveBtn = document.getElementById('saveBtn');
    const gridContainer = document.getElementById('grid');
    const colCuesContainer = document.getElementById('col-cues');
    const rowCuesContainer = document.getElementById('row-cues');
    const feedback = document.getElementById('feedback');

    let originalMatrix = [];
    let userMatrix = [];
    let currentTool = 'fill'; // 'fill' or 'mark'

    imageLoader.addEventListener('change', handleImage, false);
    submitBtn.addEventListener('click', checkSolution);
    saveBtn.addEventListener('click', saveGrid);

    function handleImage(e) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const gridSize = 20; // 20x20 grid
                canvas.width = gridSize;
                canvas.height = gridSize;
                ctx.drawImage(img, 0, 0, gridSize, gridSize);
                const imageData = ctx.getImageData(0, 0, gridSize, gridSize);
                originalMatrix = convertToBinaryMatrix(imageData);
                userMatrix = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
                generateNonogram(originalMatrix);
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);
    }

    function convertToBinaryMatrix(imageData) {
        const matrix = [];
        const data = imageData.data;
        const gridSize = imageData.width;
        for (let i = 0; i < data.length; i += 4 * gridSize) {
            const row = [];
            for (let j = 0; j < gridSize * 4; j += 4) {
                const avg = (data[i + j] + data[i + j + 1] + data[i + j + 2]) / 3;
                row.push(avg < 128 ? 1 : 0);
            }
            matrix.push(row);
        }
        return matrix;
    }

    function generateNonogram(matrix) {
        const colCues = getCues(matrix, 'col');
        const rowCues = getCues(matrix, 'row');

        displayCues(colCues, colCuesContainer);
        displayCues(rowCues, rowCuesContainer);
        displayGrid(matrix.length);
    }

    function getCues(matrix, type) {
        const size = matrix.length;
        const cues = [];
        for (let i = 0; i < size; i++) {
            let count = 0;
            const lineCues = [];
            for (let j = 0; j < size; j++) {
                const cell = type === 'col' ? matrix[j][i] : matrix[i][j];
                if (cell === 1) {
                    count++;
                } else {
                    if (count > 0) {
                        lineCues.push(count);
                    }
                    count = 0;
                }
            }
            if (count > 0) {
                lineCues.push(count);
            }
            if (lineCues.length === 0) {
                lineCues.push(0);
            }
            cues.push(lineCues);
        }
        return cues;
    }

    function displayCues(cues, container) {
        container.innerHTML = '';
        cues.forEach(cueLine => {
            const cueContainer = document.createElement('div');
            cueContainer.classList.add('cue-container');
            const cueSpan = document.createElement('span');
            cueSpan.textContent = cueLine.join(' ');
            cueContainer.appendChild(cueSpan);
            container.appendChild(cueContainer);
        });
    }

    function displayGrid(size) {
        gridContainer.innerHTML = '';
        gridContainer.style.gridTemplateColumns = `repeat(${size}, 30px)`;
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', handleCellClick);
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    handleCellRightClick(e);
                });
                gridContainer.appendChild(cell);
            }
        }
    }

    function handleCellClick(event) {
        const cell = event.target;
        const row = cell.dataset.row;
        const col = cell.dataset.col;

        if (cell.classList.contains('filled')) {
            cell.classList.remove('filled');
            userMatrix[row][col] = 0;
        } else {
            cell.classList.remove('marked');
            cell.classList.add('filled');
            userMatrix[row][col] = 1;
        }
    }

    function handleCellRightClick(event) {
        const cell = event.target;
        const row = cell.dataset.row;
        const col = cell.dataset.col;

        if (cell.classList.contains('marked')) {
            cell.classList.remove('marked');
        } else {
            cell.classList.remove('filled');
            cell.classList.add('marked');
            userMatrix[row][col] = 0; // Marked cells are treated as 0
        }
    }

    function checkSolution() {
        let correct = true;
        for (let i = 0; i < originalMatrix.length; i++) {
            for (let j = 0; j < originalMatrix[i].length; j++) {
                if (originalMatrix[i][j] !== userMatrix[i][j]) {
                    correct = false;
                    break;
                }
            }
            if (!correct) break;
        }

        feedback.textContent = correct ? 'Correct!' : 'Incorrect, try again.';
    }

    function saveGrid() {
        const canvas = document.createElement('canvas');
        const gridSize = userMatrix.length;
        const cellSize = 20;
        canvas.width = gridSize * cellSize;
        canvas.height = gridSize * cellSize;
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                ctx.fillStyle = userMatrix[i][j] === 1 ? 'black' : 'white';
                if (document.querySelector(`.cell[data-row='${i}'][data-col='${j}']`).classList.contains('marked')) {
                    ctx.fillStyle = '#f0f0f0';
                }
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
                if (document.querySelector(`.cell[data-row='${i}'][data-col='${j}']`).classList.contains('marked')) {
                    ctx.fillStyle = 'red';
                    ctx.font = `${cellSize * 0.8}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('X', j * cellSize + cellSize / 2, i * cellSize + cellSize / 2);
                }
            }
        }

        const link = document.createElement('a');
        link.download = 'nonogram.png';
        link.href = canvas.toDataURL();
        link.click();
    }
});