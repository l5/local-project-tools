(function() {
    const vscode = acquireVsCodeApi();

    window.addEventListener("message", event => {
        const message = event.data;
        if (message.type === "update") {
            renderYaml(message.text);
        }
    });

    vscode.postMessage({ type: "requestYaml" });

    function renderYaml(yamlText) {
        const outputContainer = document.getElementById("outputContainer");
        const summaryContainer = document.getElementById("summaryContainer");
        outputContainer.innerHTML = "";
        summaryContainer.innerHTML = "";

        try {
            const parsedYaml = jsyaml.load(yamlText);
            const resourceSummary = {};

            if (parsedYaml && parsedYaml.scope_elements) {
                parsedYaml.scope_elements.forEach(scope => {
                    const scopeDiv = createScopeElement(scope, resourceSummary);
                    outputContainer.appendChild(scopeDiv);
                });

                const summaryTitle = document.createElement("strong");
                summaryTitle.textContent = "Resource Summary:";
                summaryContainer.appendChild(summaryTitle);

                const summaryList = document.createElement("div");
                Object.entries(resourceSummary).forEach(([resource, days]) => {
                    const summaryItem = document.createElement("div");
                    summaryItem.textContent = resource + ": " + days + " days";
                    summaryList.appendChild(summaryItem);
                });
                summaryContainer.appendChild(summaryList);
            }
        } catch (e) {
            outputContainer.innerHTML = "<p style=\"color: red;\">Error parsing YAML: " + e.message + "</p>";
        }
    }

    function createScopeElement(scope, resourceSummary) {
        const scopeDiv = document.createElement("div");
        scopeDiv.className = "scope-element";

        const title = document.createElement("h3");
        title.textContent = scope.name;
        scopeDiv.appendChild(title);

        if (scope.description) {
            const description = document.createElement("p");
            description.textContent = scope.description;
            scopeDiv.appendChild(description);
        }

        if (scope.estimate) {
            const estimationCard = document.createElement("div");
            estimationCard.className = "estimation-card";

            const estimationTitle = document.createElement("div");
            estimationTitle.innerHTML = "<strong>Estimations:</strong>";
            estimationCard.appendChild(estimationTitle);

            if (scope.estimate.resources && scope.estimate.resources.length > 0) {
                scope.estimate.resources.forEach(res => {
                    if (resourceSummary[res.resource]) {
                        resourceSummary[res.resource] += res.days;
                    } else {
                        resourceSummary[res.resource] = res.days;
                    }

                    const resourceLabel = document.createElement("span");
                    resourceLabel.className = "resource-label";
                    resourceLabel.textContent = res.resource + ": " + res.days + " days";
                    estimationCard.appendChild(resourceLabel);
                });
            } else {
                const noResources = document.createElement("div");
                noResources.textContent = "No resources available";
                estimationCard.appendChild(noResources);
            }

            if (scope.estimate.comment) {
                const comment = document.createElement("p");
                comment.innerHTML = "<strong>Comment:</strong> " + scope.estimate.comment;
                estimationCard.appendChild(comment);
            }

            scopeDiv.appendChild(estimationCard);
        }

        return scopeDiv;
    }
}());
