/**
 * HulkPhone ViciDial Integration Script
 *
 * This script injects the HulkPhone widget into the ViciDial AGC agent page.
 *
 * Usage: Add this script tag to your ViciDial AGC page or load it via
 * the ViciDial custom_3 or custom_4 field:
 *
 *   <script src="https://your-hulkphone-server/hulkphone-inject.js"></script>
 *
 * Or configure in ViciDial Admin > System Settings > agent_script_override
 *
 * Security Notes:
 * - No data is sent to external servers
 * - All SIP credentials stored in browser localStorage only
 * - postMessage communication uses origin validation
 * - No eval(), no dynamic code execution
 * - No external tracking or analytics
 */

(function () {
  "use strict";

  // Configuration - update HULKPHONE_URL to your deployment
  var HULKPHONE_URL = window.HULKPHONE_URL || "https://your-hulkphone-server";
  var WIDGET_WIDTH = 370;
  var WIDGET_HEIGHT = 660;
  var WIDGET_POSITION = "right"; // 'right' or 'left'

  // Prevent double injection
  if (document.getElementById("hulkphone-widget")) {
    return;
  }

  // Create floating container
  var container = document.createElement("div");
  container.id = "hulkphone-widget";
  container.style.cssText = [
    "position: fixed",
    "top: 60px",
    WIDGET_POSITION === "right" ? "right: 10px" : "left: 10px",
    "z-index: 999999",
    "width: " + WIDGET_WIDTH + "px",
    "height: " + WIDGET_HEIGHT + "px",
    "border-radius: 16px",
    "overflow: hidden",
    "box-shadow: 0 0 30px rgba(0,255,65,0.2), 0 20px 60px rgba(0,0,0,0.8)",
    "transition: all 0.3s ease",
    "resize: both",
  ].join(";");

  // Create iframe
  var iframe = document.createElement("iframe");
  iframe.src = HULKPHONE_URL + "/embed";
  iframe.style.cssText = [
    "width: 100%",
    "height: 100%",
    "border: none",
    "border-radius: 16px",
    "background: transparent",
  ].join(";");
  iframe.allow = "microphone; camera; autoplay";
  iframe.title = "HulkPhone WebPhone";
  iframe.setAttribute("sandbox", [
    "allow-scripts",
    "allow-same-origin",
    "allow-forms",
    "allow-popups",
  ].join(" "));

  container.appendChild(iframe);

  // Toggle button
  var toggleBtn = document.createElement("button");
  toggleBtn.id = "hulkphone-toggle";
  toggleBtn.innerHTML = "&#9742;"; // Phone icon
  toggleBtn.title = "Toggle HulkPhone";
  toggleBtn.style.cssText = [
    "position: fixed",
    "top: 10px",
    WIDGET_POSITION === "right" ? "right: 10px" : "left: 10px",
    "z-index: 1000000",
    "width: 44px",
    "height: 44px",
    "border-radius: 50%",
    "background: linear-gradient(135deg, #00cc33, #007722)",
    "border: 2px solid #00ff41",
    "color: #000",
    "font-size: 20px",
    "cursor: pointer",
    "box-shadow: 0 0 15px rgba(0,255,65,0.5)",
    "transition: all 0.2s ease",
    "display: flex",
    "align-items: center",
    "justify-content: center",
  ].join(";");

  var isVisible = true;

  toggleBtn.addEventListener("click", function () {
    isVisible = !isVisible;
    container.style.display = isVisible ? "block" : "none";
    toggleBtn.style.background = isVisible
      ? "linear-gradient(135deg, #00cc33, #007722)"
      : "linear-gradient(135deg, #7b2d8b, #4a0e5c)";
    toggleBtn.style.borderColor = isVisible ? "#00ff41" : "#b44fd4";
  });

  // Listen for messages from HulkPhone iframe
  window.addEventListener("message", function (event) {
    // Validate origin
    try {
      var iframeOrigin = new URL(HULKPHONE_URL).origin;
      if (event.origin !== iframeOrigin) return;
    } catch (e) {
      return;
    }

    var data = event.data;
    if (!data || typeof data !== "object") return;

    switch (data.type) {
      case "HULKPHONE_READY":
        // HulkPhone loaded - send current page info
        iframe.contentWindow.postMessage(
          {
            type: "VICIDIAL_STATUS",
            payload: { status: "READY" },
          },
          new URL(HULKPHONE_URL).origin
        );
        break;

      case "HULKPHONE_CALL_STARTED":
        // Optional: Update ViciDial UI
        break;

      case "HULKPHONE_CALL_ENDED":
        // Optional: Trigger ViciDial disposition
        break;
    }
  });

  // Watch for ViciDial auto-dial events
  // ViciDial uses specific DOM elements and JavaScript calls
  var originalDial = window.dial_lead;
  if (typeof originalDial === "function") {
    window.dial_lead = function () {
      // Get the phone number from ViciDial's form
      var phoneField =
        document.getElementById("phone_number") ||
        document.querySelector('[name="phone_number"]');
      if (phoneField && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "VICIDIAL_DIAL",
            payload: { phone: phoneField.value },
          },
          new URL(HULKPHONE_URL).origin
        );
      }
      return originalDial.apply(this, arguments);
    };
  }

  // Inject into page
  document.body.appendChild(container);
  document.body.appendChild(toggleBtn);

  console.log("[HulkPhone] Widget injected successfully");
})();
