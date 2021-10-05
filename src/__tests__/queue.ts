let waitPromise = Promise.resolve();
export function wait(next?: () => void | Promise<void>) {
  return (waitPromise = waitPromise
    .then(() => new Promise((resolve) => setTimeout(resolve, 100)))
    .then(next));
}
