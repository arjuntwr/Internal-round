export function setupCounter(element: HTMLButtonElement) {
  let counter = 0;

  // Updates button text
  const updateUI = () => {
    element.textContent = `Count is ${counter}`;
  };

  // Increment handler
  const increment = () => {
    counter++;
    updateUI();
  };

  // Reset counter
  const reset = () => {
    counter = 0;
    updateUI();
  };

  // Allow external access to counter value
  const getValue = () => counter;

  // Attach event listener
  element.addEventListener("click", increment);

  // Initialize UI
  updateUI();

  // Return API so other code can control it
  return {
    increment,
    reset,
    getValue,
    destroy: () => element.removeEventListener("click", increment),
  };
}
