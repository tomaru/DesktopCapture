
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    innerBounds: {
      width: window.parent.screen.width,
      height: window.parent.screen.height,
      minWidth: 200,
      minHeight: 200,
    }
  });
});
