const textarea = document.getElementById('yamlTextarea');
const cursorPosition = document.getElementById('cursorPosition');
const toggleButton = document.getElementById('toggleButton');
const yamlInput = document.getElementById('yamlInput');
const renderedOutput = document.getElementById('renderedOutput');
let isHidden = false;
const cursorPositionContainer = document.getElementById('cursorPosition');

toggleButton.addEventListener('click', () => {
    isHidden = !isHidden;
    if (isHidden) {
        yamlInput.style.display = 'none';
        cursorPositionContainer.style.display = 'none';
        renderedOutput.style.width = '100%';
    } else {
        yamlInput.style.display = 'block';
        cursorPositionContainer.style.display = 'block';
        yamlInput.style.width = '50%';
        renderedOutput.style.width = '50%';
    }
});

textarea.addEventListener('input', updateCursorPosition);
textarea.addEventListener('click', updateCursorPosition);
textarea.addEventListener('keyup', updateCursorPosition);

function updateCursorPosition() {
    const text = textarea.value.substr(0, textarea.selectionStart);
    const lines = text.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    cursorPosition.textContent = `Line: ${line}, Column: ${column}`;
}

document.getElementById('yamlTextarea').addEventListener('input', function () {
    const yamlText = this.value;
    const outputContainer = document.getElementById('outputContainer');
    const summaryContainer = document.getElementById('summaryContainer');
    outputContainer.innerHTML = '';
    summaryContainer.innerHTML = '';

    try {
        const parsedYaml = jsyaml.load(yamlText);
        const resourceSummary = {};
        const scopeResourceSummary = {};
        let totalDays = 0;

        if (parsedYaml && parsedYaml.scope_elements) {
            // Map resources by id for easier access to roles
            const resourcesMap = parsedYaml.resources?.reduce((acc, resource) => {
                acc[resource.id] = resource.role;
                return acc;
            }, {}) || {};

            parsedYaml.scope_elements.forEach(scope => {
                const scopeDiv = document.createElement('div');
                scopeDiv.className = 'scope-element';

                // Scope title label
                const scopeTitleLabel = document.createElement('div');
                scopeTitleLabel.className = 'scope-title-label';
                scopeTitleLabel.textContent = 'Scope Element';
                scopeDiv.appendChild(scopeTitleLabel);

                // Title with scope name
                const scopeTitle = document.createElement('div');
                scopeTitle.className = 'scope-title';
                scopeTitle.textContent = scope.name;
                scopeDiv.appendChild(scopeTitle);

                // Description
                if (scope.description) {
                    const scopeDescription = document.createElement('div');
                    scopeDescription.textContent = scope.description;
                    scopeDiv.appendChild(scopeDescription);
                }

                // Estimations card
                if (scope.estimate) {
                    const estimationsDiv = document.createElement('div');
                    estimationsDiv.className = 'estimations';

                    const estimationsTitle = document.createElement('div');
                    estimationsTitle.className = 'estimations-title';
                    estimationsTitle.textContent = 'Estimations';
                    estimationsDiv.appendChild(estimationsTitle);

                    if (scope.estimate.resources) {
                        scope.estimate.resources.forEach(res => {
                            const role = resourcesMap[res.resource] || 'Unknown Role';
                            if (resourceSummary[role]) {
                                resourceSummary[role] += res.days;
                            } else {
                                resourceSummary[role] = res.days;
                            }

                            if (!scopeResourceSummary[scope.name]) {
                                scopeResourceSummary[scope.name] = {};
                            }
                            if (scopeResourceSummary[scope.name][role]) {
                                scopeResourceSummary[scope.name][role] += res.days;
                            } else {
                                scopeResourceSummary[scope.name][role] = res.days;
                            }

                            totalDays += res.days;

                            const resourceLabel = document.createElement('span');
                            resourceLabel.className = 'resource-label';
                            resourceLabel.textContent = `${role}: ${res.days} days`;
                            estimationsDiv.appendChild(resourceLabel);
                        });
                    }

                    // Comments
                    if (scope.estimate.comment) {
                        const commentDiv = document.createElement('div');
                        commentDiv.textContent = scope.estimate.comment;
                        estimationsDiv.appendChild(commentDiv);
                    }

                    scopeDiv.appendChild(estimationsDiv);
                }

                outputContainer.appendChild(scopeDiv);
            });

            // Render resource summary
            let resourceSummaryHTML = '<strong>Resource Summary:</strong><br>' +
                Object.entries(resourceSummary).map(([resource, days]) => `${resource}: ${days} days`).join('<br>');

            // Render scope element and resource summary as a table
            let scopeResourceSummaryHTML = '<strong>Scope Element and Resource Summary:</strong><br>';
            scopeResourceSummaryHTML += '<table><thead><tr><th>Scope Element</th>';
            const allResources = Object.keys(resourceSummary);
            allResources.forEach(resource => {
                scopeResourceSummaryHTML += `<th>${resource}</th>`;
            });
            scopeResourceSummaryHTML += '<th>Total Days</th></tr></thead><tbody>';

            Object.entries(scopeResourceSummary).forEach(([scope, resources]) => {
                scopeResourceSummaryHTML += `<tr><td>${scope}</td>`;
                let scopeTotal = 0;
                allResources.forEach(resource => {
                    const days = resources[resource] || 0;
                    scopeTotal += days;
                    scopeResourceSummaryHTML += `<td>${days}</td>`;
                });
                scopeResourceSummaryHTML += `<td>${scopeTotal}</td></tr>`;
            });
            scopeResourceSummaryHTML += '</tbody></table>';

            // Render total summary
            let totalSummaryHTML = `<strong>Total Summary:</strong><br>Total Days: ${totalDays} days`;

            summaryContainer.innerHTML = `${resourceSummaryHTML}<br><br>${scopeResourceSummaryHTML}<br><br>${totalSummaryHTML}`;
        }
    } catch (e) {
        outputContainer.innerHTML = '<p style="color: red;">Error parsing YAML: ' + e.message + '</p>';
    }
});

// Initialize cursor position on load
updateCursorPosition();
// Render YAML if already present on load
if (textarea.value) {
    document.getElementById('yamlTextarea').dispatchEvent(new Event('input'));
}