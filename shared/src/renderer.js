export function renderYaml(yamlText, outputContainer, summaryContainer) {
    outputContainer.innerHTML = '';
    summaryContainer.innerHTML = '';

    try {
        const parsedYaml = jsyaml.load(yamlText);
        const resourceSummary = {};
        const scopeResourceSummary = {};
        let totalDays = 0;

        if (parsedYaml && parsedYaml.scope_elements) {
            const resourcesMap = parsedYaml.resources?.reduce((acc, resource) => {
                acc[resource.id] = resource.role;
                return acc;
            }, {}) || {};

            parsedYaml.scope_elements.forEach(scope => {
                const scopeDiv = document.createElement('div');
                scopeDiv.className = 'scope-element';

                const scopeTitleLabel = document.createElement('div');
                scopeTitleLabel.className = 'scope-title-label';
                scopeTitleLabel.textContent = 'Scope Element';
                scopeDiv.appendChild(scopeTitleLabel);

                const scopeTitle = document.createElement('h3');
                scopeTitle.textContent = scope.name;
                scopeTitle.className = 'scope-title';
                scopeDiv.appendChild(scopeTitle);

                if (scope.description) {
                    const description = document.createElement('p');
                    description.className = 'scope-description';
                    description.textContent = scope.description;
                    scopeDiv.appendChild(description);
                }

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

                    if (scope.estimate.comment) {
                        const commentDiv = document.createElement('p');
                        commentDiv.className = 'estimations-comment';
                        commentDiv.textContent = scope.estimate.comment;
                        estimationsDiv.appendChild(commentDiv);
                    }

                    scopeDiv.appendChild(estimationsDiv);
                }

                outputContainer.appendChild(scopeDiv);
            });

            summaryContainer.innerHTML = createSummaryHtml(resourceSummary, scopeResourceSummary, totalDays);
        }
    } catch (e) {
        outputContainer.innerHTML = `<p style="color: red;">Error parsing YAML: ${e.message}</p>`;
    }
}

function createSummaryHtml(resourceSummary, scopeResourceSummary, totalDays) {
    let resourceSummaryHTML = '<strong>Resource Summary:</strong><br>' +
        Object.entries(resourceSummary).map(([resource, days]) => `${resource}: ${days} days`).join('<br>');

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

    return `${resourceSummaryHTML}<br><br>${scopeResourceSummaryHTML}<br><br><strong>Total Summary:</strong><br>Total Days: ${totalDays} days`;
}
