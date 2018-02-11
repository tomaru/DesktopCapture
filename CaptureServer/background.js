chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    innerBounds: {
      width: window.parent.screen.width-300,
      height: window.parent.screen.height-300,
      minWidth: 200,
      minHeight: 200,
    }
  });
});
