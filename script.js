const canvas = document.getElementById("playground");
const rect = canvas.getBoundingClientRect();
const ctx = canvas.getContext('2d');
const controlsDiv = document.getElementById("controls");
const controlTable = document.getElementById("control-pad");
const inputElements = controlTable.querySelectorAll("input[type='number']");
const checkbox = document.getElementById("boundary");

canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight;

let ranges = document.querySelectorAll('input[type="range"]');

let particles = [];
let rules = [];
let isPlaying = false;
let mouseX = 0;
let mouseY = 0;
let particleSize = 2;
let bgColor = "#000000"
let boundaryClosed = false;
let inputAffectDistance = 50
let inputAffectForce = 300
let redNum = Math.floor(Math.random() * 15) + 1
let blueNum = Math.floor(Math.random() * 15) + 1
let greenNum = Math.floor(Math.random() * 15) + 1
let yellowNum = Math.floor(Math.random() * 15) + 1
let whiteNum = Math.floor(Math.random() * 15) + 1

let red, blue, green, yellow, white;

function draw(x, y, c, w, h) {
    ctx.fillStyle = c;
    ctx.shadowColor = c;
    ctx.shadowBlur = Math.floor(Math.random() * 6) + 5;
    ctx.fillRect(x, y, w, h);
}

function create(number, color) {
    group = [];
    for (let i = 0; i < number; i++) {
        group.push({ "x": Math.floor(Math.random() * canvas.width), "y": Math.floor(Math.random() * canvas.height), "vx": 0, "vy": 0, "color": color });
        particles.push(group[i]);
    }
    return group;
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    draw(0, 0, bgColor, canvas.width, canvas.height);
    for (i = 0; i < particles.length; i++) {
        const { x, y, color } = particles[i];
        draw(x, y, color, particleSize, particleSize);
    }
    applyRules();
    requestAnimationFrame(update);
}

red = create(redNum, "red");
blue = create(blueNum, "blue");
green = create(greenNum, "green");
yellow = create(yellowNum, "yellow");
white = create(whiteNum, "white");

requestAnimationFrame(update);

canvas.addEventListener('mousemove', (event) => {
    if (!isPlaying) { return; }
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;

    for (let i = 0; i < particles.length; i++) {
        dxMouse = particles[i].x - mouseX;
        dyMouse = particles[i].y - mouseY;
        dMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (dMouse < inputAffectDistance) {
            FMouse = (inputAffectForce) / (dMouse * dMouse);
            particles[i].vx += FMouse * dxMouse;
            particles[i].vy += FMouse * dyMouse;
        }
    }
});

canvas.addEventListener('touchmove', (event) => {
    if (!isPlaying) { return; }
    event.preventDefault();

    mouseX = event.touches[0].clientX;
    mouseY = event.touches[0].clientY;

    for (let i = 0; i < particles.length; i++) {
        dxMouse = particles[i].x - mouseX;
        dyMouse = particles[i].y - mouseY;
        dMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (dMouse < inputAffectDistance * 2) {
            FMouse = (inputAffectForce * 2) / (dMouse * dMouse);
            particles[i].vx += FMouse * dxMouse;
            particles[i].vy += FMouse * dyMouse;
        }
    }
});

function rule(particles1, particles2, gravity, mouseX, mouseY) {
    // F=gravity(m1*m2/d2) 
    for (let i = 0; i < particles1.length; i++) {
        fx = 0
        fy = 0
        for (let j = 0; j < particles2.length; j++) {
            a = particles1[i]
            b = particles2[j]

            dx = a.x - b.x
            dy = a.y - b.y
            d = Math.sqrt(dx * dx + dy * dy)

            if (d > 0 && d < 80) {
                F = gravity * 1 / d
                fx += (F * dx)
                fy += (F * dy)
            }
        }
        // Add repulsive force from mouse
        dxMouse = a.x - mouseX
        dyMouse = a.y - mouseY
        dMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse)

        if (dMouse < 5) {
            FMouse = 10 / (dMouse * dMouse)
            fx += FMouse * dxMouse
            fy += FMouse * dyMouse
        }

        //upadting position speed control TODO
        a.vx = (a.vx + fx) * 0.1
        a.vy = (a.vy + fy) * 0.1
        a.x += a.vx
        a.y += a.vy

        if (boundaryClosed) {
            if (a.x < 0 || a.x > canvas.width) {
                a.vx = -a.vx;
                if (a.x < 0) a.x = 0;
                if (a.x > canvas.width) a.x = canvas.width;
            }
            if (a.y < 0 || a.y > canvas.height) {
                a.vy = -a.vy;
                if (a.y < 0) a.y = 0;
                if (a.y > canvas.height) a.y = canvas.height;
            }
        } else {
            if (a.x < 0) { a.x = canvas.width + a.x }
            if (a.x > canvas.width) { a.x = canvas.width - a.x }
            if (a.y < 0) { a.y = canvas.height + a.y }
            if (a.y > canvas.height) { a.y = canvas.height - a.y }
        }
    }
}

function getColorFromInput(input) {
    const parentRow = input.parentNode.parentNode;
    const parentColumnIndex = Array.from(parentRow.children).indexOf(input.parentNode);

    const firstRowColor = controlTable.rows[0].cells[parentColumnIndex].style.backgroundColor;
    const firstColumnColor = controlTable.rows[parentRow.rowIndex].cells[0].style.backgroundColor;

    return { firstRowColor, firstColumnColor };
}

inputElements.forEach((input) => {
    input.addEventListener("change", (event) => {
        const editedInput = event.target;
        const { firstRowColor, firstColumnColor } = getColorFromInput(editedInput);
        const newValue = parseInt(editedInput.value);

        // Check if the new value is 0
        if (newValue === 0) {
            // Remove the rule from the rules array
            const ruleIndex = rules.findIndex(([rowColor, colColor]) => {
                return rowColor === firstRowColor && colColor === firstColumnColor;
            });

            if (ruleIndex !== -1) {
                rules.splice(ruleIndex, 1);
            }
        } else {
            const newRule = [firstRowColor, firstColumnColor, newValue];

            // Check if a rule for the cell already exists
            const existingRuleIndex = rules.findIndex(([rowColor, colColor]) => {
                return rowColor === firstRowColor && colColor === firstColumnColor;
            });

            if (existingRuleIndex !== -1) {
                // Update the existing rule with the new value
                rules[existingRuleIndex][2] = newRule[2];
            } else {
                // Add the new rule to the rules array
                rules.push(newRule);
            }
        }
    });
});

function applyRules() {
    rules.forEach(([color1, color2, value]) => {
        rule(getParticlesByColor(color1), getParticlesByColor(color2), value, mouseX, mouseY);
    });
}

function getParticlesByColor(color) {
    return particles.filter(particle => particle.color === color);
}

//updoot ranges
rangeUpdate(ranges);

function rangeUpdate(ranges) {
    ranges.forEach(range => {
        const value = range.nextElementSibling;
        value.textContent = range.value;
        range.addEventListener('input', () => {
            value.textContent = range.value;
        });
    });
}

//button manager
playBtn.addEventListener("click", () => {
    if (playBtn.textContent === "Start") {
        isPlaying = true
        ranges.forEach(range => {
            if (range.id === "redParticle") {
                redNum = range.value
            } else if (range.id === "blueParticle") {
                blueNum = range.value
            } else if (range.id === "greenParticle") {
                greenNum = range.value
            } else if (range.id === "yellowParticle") {
                yellowNum = range.value
            } else if (range.id === "whiteParticle") {
                whiteNum = range.value
            }
            range.disabled = true;
        });

        particles = []
        red = create(redNum, "red")
        blue = create(blueNum, "blue")
        green = create(greenNum, "green")
        yellow = create(yellowNum, "yellow")
        white = create(whiteNum, "white")
        playBtn.textContent = "Reset";
    } else if (playBtn.textContent === "Reset") {
        isPlaying = false
        particles = []
        let redNum = Math.floor(Math.random() * 15) + 1
        let blueNum = Math.floor(Math.random() * 15) + 1
        let greenNum = Math.floor(Math.random() * 15) + 1
        let yellowNum = Math.floor(Math.random() * 15) + 1
        let whiteNum = Math.floor(Math.random() * 15) + 1
        red = create(redNum, "red")
        blue = create(blueNum, "blue")
        green = create(greenNum, "green")
        yellow = create(yellowNum, "yellow")
        white = create(whiteNum, "white")
        ranges.forEach(range => {
            range.disabled = false;
            range.value = range.defaultValue;
            const value = range.nextElementSibling;
            value.textContent = range.value;
        });
        playBtn.textContent = "Start";
    }
})

ruleBtn.addEventListener("click", () => {
    // Randomize the table input

    // Update the rules based on the table inputs
    updateRules();
});

function updateRules() {
    const table = document.getElementById("control-pad");

    // Loop through each row of the table
    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];

        // Loop through each cell in the row
        for (let j = 1; j < row.cells.length; j++) {
            const cell = row.cells[j];

            // Get the input element within the cell
            const input = cell.querySelector("input[type='number']");

            // Generate a random value between -10 and 10
            const randomValue = Math.floor(Math.random() * 10) - 5;

            // Update the input value with the random value
            input.value = randomValue;

            const { firstRowColor, firstColumnColor } = getColorFromInput(input);

            // Check if the new value is 0
            if (randomValue === 0) {
                // Remove the rule from the rules array
                const ruleIndex = rules.findIndex(
                    ([rowColor, colColor]) =>
                        rowColor === firstRowColor && colColor === firstColumnColor
                );

                if (ruleIndex !== -1) {
                    rules.splice(ruleIndex, 1);
                }
            } else {
                const newRule = [firstRowColor, firstColumnColor, randomValue];

                // Check if a rule for the cell already exists
                const existingRuleIndex = rules.findIndex(
                    ([rowColor, colColor]) =>
                        rowColor === firstRowColor && colColor === firstColumnColor
                );

                if (existingRuleIndex !== -1) {
                    // Update the existing rule with the new value
                    rules[existingRuleIndex][2] = newRule[2];
                } else {
                    // Add the new rule to the rules array
                    rules.push(newRule);
                }
            }

            // Update the mirrored cell in the table
            const mirroredCell = table.rows[j].cells[i];
            const mirroredInput = mirroredCell.querySelector("input[type='number']");
            mirroredInput.value = input.value;
        }
    }
}

checkbox.addEventListener("change", () => {
    boundaryClosed = checkbox.checked;
});