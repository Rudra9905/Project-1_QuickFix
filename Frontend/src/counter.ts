// Counter utility function: sets up a click counter on a button element
// This is a demo/example function, typically used for testing purposes
// @param element - The HTML button element to attach the counter to
export function setupCounter(element: HTMLButtonElement) {
  let counter = 0 // Internal counter variable
  
  // Function to update the counter value and display it
  // @param count - The new counter value to set
  const setCounter = (count: number) => {
    counter = count // Update internal counter
    element.innerHTML = `count is ${counter}` // Update button text to show current count
  }
  
  // Add click event listener to increment counter on each click
  element.addEventListener('click', () => setCounter(counter + 1))
  
  // Initialize counter to 0 on setup
  setCounter(0)
}
