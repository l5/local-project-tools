"use strict";
(() => {
  // media/renderer.js
  function renderYaml(yamlText, outputContainer, summaryContainer) {
    var _a;
    outputContainer.innerHTML = "";
    summaryContainer.innerHTML = "";
    try {
      const parsedYaml = jsyaml.load(yamlText);
      const resourceSummary = {};
      const scopeResourceSummary = {};
      let totalDays = 0;
      if (parsedYaml && parsedYaml.scope_elements) {
        const resourcesMap = ((_a = parsedYaml.resources) == null ? void 0 : _a.reduce((acc, resource) => {
          acc[resource.id] = resource.role;
          return acc;
        }, {})) || {};
        parsedYaml.scope_elements.forEach((scope) => {
          const scopeDiv = document.createElement("div");
          scopeDiv.className = "scope-element";
          const scopeTitleLabel = document.createElement("div");
          scopeTitleLabel.className = "scope-title-label";
          scopeTitleLabel.textContent = "Scope Element";
          scopeDiv.appendChild(scopeTitleLabel);
          const scopeTitle = document.createElement("h3");
          scopeTitle.textContent = scope.name;
          scopeTitle.className = "scope-title";
          scopeDiv.appendChild(scopeTitle);
          if (scope.description) {
            const description = document.createElement("p");
            description.className = "scope-description";
            description.textContent = scope.description;
            scopeDiv.appendChild(description);
          }
          if (scope.estimate) {
            const estimationsDiv = document.createElement("div");
            estimationsDiv.className = "estimations";
            const estimationsTitle = document.createElement("div");
            estimationsTitle.className = "estimations-title";
            estimationsTitle.textContent = "Estimations";
            estimationsDiv.appendChild(estimationsTitle);
            if (scope.estimate.resources) {
              scope.estimate.resources.forEach((res) => {
                const role = resourcesMap[res.resource] || "Unknown Role";
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
                const resourceLabel = document.createElement("span");
                resourceLabel.className = "resource-label";
                resourceLabel.textContent = "".concat(role, ": ").concat(res.days, " days");
                estimationsDiv.appendChild(resourceLabel);
              });
            }
            if (scope.estimate.comment) {
              const commentDiv = document.createElement("p");
              commentDiv.className = "estimations-comment";
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
      outputContainer.innerHTML = '<p style="color: red;">Error parsing YAML: '.concat(e.message, "</p>");
    }
  }
  function createSummaryHtml(resourceSummary, scopeResourceSummary, totalDays) {
    let resourceSummaryHTML = "<strong>Resource Summary:</strong><br>" + Object.entries(resourceSummary).map(([resource, days]) => "".concat(resource, ": ").concat(days, " days")).join("<br>");
    let scopeResourceSummaryHTML = "<strong>Scope Element and Resource Summary:</strong><br>";
    scopeResourceSummaryHTML += "<table><thead><tr><th>Scope Element</th>";
    const allResources = Object.keys(resourceSummary);
    allResources.forEach((resource) => {
      scopeResourceSummaryHTML += "<th>".concat(resource, "</th>");
    });
    scopeResourceSummaryHTML += "<th>Total Days</th></tr></thead><tbody>";
    Object.entries(scopeResourceSummary).forEach(([scope, resources]) => {
      scopeResourceSummaryHTML += "<tr><td>".concat(scope, "</td>");
      let scopeTotal = 0;
      allResources.forEach((resource) => {
        const days = resources[resource] || 0;
        scopeTotal += days;
        scopeResourceSummaryHTML += "<td>".concat(days, "</td>");
      });
      scopeResourceSummaryHTML += "<td>".concat(scopeTotal, "</td></tr>");
    });
    scopeResourceSummaryHTML += "</tbody></table>";
    return "".concat(resourceSummaryHTML, "<br><br>").concat(scopeResourceSummaryHTML, "<br><br><strong>Total Summary:</strong><br>Total Days: ").concat(totalDays, " days");
  }

  // media/webview.js
  function setTheme(themeKind) {
    const body = document.body;
    if (themeKind === 1) {
      body.classList.remove("vscode-dark");
      body.classList.add("vscode-light");
    } else {
      body.classList.remove("vscode-light");
      body.classList.add("vscode-dark");
    }
  }
  window.addEventListener("message", (event) => {
    const message = event.data;
    if (message.type === "update") {
      const yamlText = message.text;
      const themeKind = message.theme;
      setTheme(themeKind);
      const outputContainer = document.getElementById("outputContainer");
      const summaryContainer = document.getElementById("summaryContainer");
      renderYaml(yamlText, outputContainer, summaryContainer);
    } else if (message.type === "updateTheme") {
      setTheme(message.theme);
    }
  });
  window.onload = () => {
    const vscode = acquireVsCodeApi();
    vscode.postMessage({ type: "requestYaml" });
  };
})();
//# sourceMappingURL=webview.bundle.js.map
