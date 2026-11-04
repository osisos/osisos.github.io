document.addEventListener('DOMContentLoaded', function () {
  var options = {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false }
    ],
    throwOnError: false
  };
  document.querySelectorAll('.prose, .outline').forEach(function (element) {
    renderMathInElement(element, options);
  });
});
