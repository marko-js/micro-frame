type Options = {
  target: ParentNode;
  previousSibling?: ChildNode | null;
  signal?: AbortSignal;
  onLoad?(): void;
};

const noop = () => {};

export = function toWritable({
  target,
  signal,
  onLoad = noop,
  previousSibling,
}: Options) {
  const doc = document.implementation.createHTMLDocument("");
  doc.write("<template>");
  const root = (doc.body.firstChild as HTMLTemplateElement).content;
  const walker = doc.createTreeWalker(root);
  const targetNodes = new WeakMap<Node, Node>([[root, target]]);
  const nextSibling = previousSibling ? previousSibling.nextSibling : null;
  const canContinue = () => !(signal && signal.aborted);
  let pendingText: Text | null = null;
  let scanNode: Node | null = null;
  let isBlocked = false;
  let isClosed = false;

  return {
    close() {
      if (canContinue()) {
        doc.close();
        isClosed = true;
        if (!isBlocked) onLoad();
      }
    },
    write(chunk: string) {
      if (canContinue()) {
        doc.write(chunk);

        if (pendingText) {
          // When we left on text, it's possible more text was written to the same node.
          // here we copy in the final text content from the detached dom to the live dom.
          (targetNodes.get(pendingText) as Text).data = pendingText.data;
        }

        walk();
      }
    },
  };

  function walk(): void {
    let node: Node | null;
    if (isBlocked) {
      // If we are blocked, we walk ahead and preload
      // any assets we can ahead of the last checked node.
      const blockedNode = walker.currentNode;
      if (scanNode) walker.currentNode = scanNode;

      while ((node = walker.nextNode())) {
        const link = getPreloadLink((scanNode = node));
        if (link) {
          link.onload = link.onerror = () => target.removeChild(link);
          target.insertBefore(link, nextSibling);
        }
      }

      walker.currentNode = blockedNode;
    } else {
      while ((node = walker.nextNode())) {
        const clone = document.importNode(node, false);
        if (node.nodeType === Node.TEXT_NODE) {
          pendingText = node as Text;
        } else {
          pendingText = null;

          if (isBlocking(clone)) {
            isBlocked = true;
            clone.onload = clone.onerror = () => {
              isBlocked = false;
              // Continue the normal content injecting walk.
              if (canContinue()) walk();
            };
          }
        }

        const parentNode = targetNodes.get(node.parentNode!)!;
        targetNodes.set(node, clone);

        if (parentNode === target) {
          target.insertBefore(clone, nextSibling);
        } else {
          parentNode.appendChild(clone);
        }

        // Start walking for preloads.
        if (isBlocked) return walk();
      }

      // Some blocking content could have prevented load.
      if (isClosed) onLoad();
    }
  }
};

function isBlocking(node: any): node is HTMLElement {
  return (
    node.nodeType === Node.ELEMENT_NODE &&
    ((node.tagName === "SCRIPT" &&
      node.src &&
      !(
        node.noModule ||
        node.type === "module" ||
        node.hasAttribute("async") ||
        node.hasAttribute("defer")
      )) ||
      (node.tagName === "LINK" &&
        node.rel === "stylesheet" &&
        (!node.media || matchMedia(node.media).matches)))
  );
}

function getPreloadLink(node: any) {
  let link: HTMLLinkElement | undefined;
  if (node.nodeType === Node.ELEMENT_NODE) {
    switch (node.tagName) {
      case "SCRIPT":
        if (node.src && !node.noModule) {
          link = document.createElement("link");
          link.href = node.src;
          if (node.getAttribute("type") === "module") {
            link.rel = "modulepreload";
          } else {
            link.rel = "preload";
            link.as = "script";
          }
        }
        break;
      case "LINK":
        if (
          node.rel === "stylesheet" &&
          (!node.media || matchMedia(node.media).matches)
        ) {
          link = document.createElement("link");
          link.href = node.href;
          link.rel = "preload";
          link.as = "style";
        }
        break;
      case "IMG":
        link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        if (node.srcset) {
          link.imageSrcset = node.srcset;
          link.imageSizes = node.sizes;
        } else {
          link.href = node.src;
        }
        break;
    }

    if (link) {
      if (node.integrity) {
        link.integrity = node.integrity;
      }

      if (node.crossOrigin) {
        link.crossOrigin = node.crossOrigin;
      }
    }
  }

  return link;
}
