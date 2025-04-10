<h1 align="center">
  <!-- Logo -->
  <br/>
  @micro-frame/marko
	<br/>

  <!-- Format -->
  <a href="https://github.com/prettier/prettier">
    <img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Styled with prettier"/>
  </a>
  <!-- Coverage -->
  <a href="https://codecov.io/gh/marko-js/micro-frame">
    <img src="https://codecov.io/gh/marko-js/micro-frame/branch/main/graph/badge.svg?token=cSvMDikbE4"/>
  </a>
  <!-- NPM Version -->
  <a href="https://npmjs.org/package/@micro-frame/marko">
    <img src="https://img.shields.io/npm/v/@micro-frame/marko.svg" alt="NPM Version"/>
  </a>
  <!-- Downloads -->
  <a href="https://npmjs.org/package/@micro-frame/marko">
    <img src="https://img.shields.io/npm/dm/@micro-frame/marko.svg" alt="Downloads"/>
  </a>
</h1>

<p align="center">
  A Marko tag for building SSR friendly micro frontends.
</p>

# Installation

```console
npm install @micro-frame/marko
```

# How it works

This package exposes a `<micro-frame>` Marko component that in many ways is similar to a traditional `<iframe>`.
However, unlike an `iframe`, the content from the `src` is loaded, with streaming support, _directly_ into the existing document.

## On the server

When this component is rendered server side, it will make a request to load the embedded html resource. The response is then streamed along side the content for the host page.

Internally [make-fetch-happen](https://github.com/zkat/make-fetch-happen) is used to perform the requests from the server. These means you can also leverage [HTTP Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control).

## In the browser

When rendered client side a normal fetch request is made to load the embedded html resource. The content of the response will be rendered within the page _as if_ it was a server side render. This includes full streaming support.

Any time the `src` attribute is changed, a new request will be made to load updated html content.

## Why

This module allows for embedded micro frontends with the following benefits:

1. Can take full advantage of streaming, if loaded server side _or_ in the browser.
2. Both the host, and embedded applications simply respond with HTML.
3. Framework agnostic, the child can respond with HTML generated by any tool/framework.

Specifically in comparison to iframes it offers the following advantages:

- Usability
  - Control over loading & error state rendering.
  - Does not break navigation / back button.
  - Does not appear differently to screen readers.
  - Does not cause issues using native browser API’s that are sometimes restricted in iframes.
  - Content can rendered with the rest of the page
    - No resizing issues.
    - Flows with page content / layout.
    - Can escape it’s container, eg for modals
- Performance
  - Shares single connection with host (no round trip once iframe makes it to the browser).
  - Does not impact SEO (sometimes iframes are not indexed by search engines).
  - iframes receive lower priority than other assets on the page, this does not.
  - Avoids additional window / browser context (less memory used).
  - Avoids boilerplate html, just send fragments (no `<html>`, `<head>`, etc).
  - Caches in both the client and host server.

## Why not

This module works best when you have applications that are independently developed, potentially with different technology stacks, that you want to glue together.

- Applications broken up this way in general are harder to optimize, deploy, etc.
- Embedded apps _should_ be served from the same origin/TLD to prevent CORS issues. You should not embed _untrusted_ applications, you should consider the embedded application a part of the host page.
- There will always be overhead in this approach, or really any naive micro-frontend setup. This module does not dictate how assets are loaded or shared across applications. If necessary that must be orchestrated between the applications separately. Solutions like [Module federation](https://webpack.js.org/concepts/module-federation/), native ES modules & globally available modules should work fine with `micro-frame`.

# Example

```marko
<micro-frame src="my-nested-app">
  <@loading>
    We're still loading...
  </@loading>
  <@catch|err|>
    Uh-oh! ${err.message}
  </@catch>
</micro-frame>
```

# API

## `src`

A (required) path to the embedded html application. This is resolved from the [`origin`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin) of the of the host application.

```marko
<micro-frame src="my-nested-app"/>
```

With the above, assuming the host application is rendered at `https://ebay.com/n/all-categories`, the embedded application will resolve to `https://ebay.com/my-nested-app`.

## `headers`

Optionally provide additional http headers to send. Only the object form shown below is supported.

```marko
<micro-frame src="..." headers={
  "X-My-Header": "Hello",
  "X-Another-Header": "World"
}/>
```

> Note that be default on the server side headers are copied from the current incoming request, the `headers` option will be merged with existing headers.

## `cache`

Mirrors the [`Request.cache` options](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache) (works on both server and client renders).

```marko
<!--
This example will always show cached content if available
and fallback to the network otherwise
-->
<micro-frame src="..." cache="force-cache"/>
```

## `fetch`

Optionally provide function to override default `fetch` logic.

```marko
<micro-frame src="..." name="..." fetch(url, options, fetch) {
  // The 3rd parameter allows us to continue to use micro-frames fetch implementation (which is different server/browser).
  // We can use this override to do things like a POST request, eg:
  return fetch(url, {
    ...options,
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ "some": "json" })
  });
}  />
```

## `timeout`

A timeout in `ms` (defaults to 30s) that will prematurely abort the request. This will trigger the `<@catch>` if provided.
If set to `0` the request will not time out.

```marko
<!--
This example will disable the default 30s timeout.
-->
<micro-frame src="..." timeout=0/>
```

## `<@catch|err|>`

An [attribute tag](https://markojs.com/docs/syntax/#attribute-tag) rendered when there is a network error or timeout.
If there is no `@catch` handler the error will be emitted to the stream, similar to the [`<await>`](https://markojs.com/docs/core-tags/#await) tag.

```marko
<micro-frame src="...">
  <@catch|err|>
    <!-- Displays if request to service fails or times out -->
    error: ${err.message}
  </@catch>
</micro-frame>
```

## `<@loading>`

An [attribute tag](https://markojs.com/docs/syntax/#attribute-tag) rendered when while the request is still being streamed.
It is removed after the request has either errored, or successfully loaded.

```marko
<micro-frame src="...">
  <@loading>
    We are loading the nested app...
    <my-spinner/>
  </@loading>
</micro-frame>
```

## `class`

Optional `class` attribute which works the same way as [Marko class attribute](https://markojs.com/docs/syntax/#class-attribute).

```marko
<micro-frame src="..." class="a c"/>
<micro-frame src="..." class={ a:true, b:false, c:true }/>
<micro-frame src="..." class=["a", null, { c:true }]/>
```

## `style`

Optional `style` attribute which works the same way as [Marko style attribute](https://markojs.com/docs/syntax/#style-attribute).

```marko
<micro-frame src="..." style="display:block;margin-right:16px"/>
<micro-frame src="..." style={ display: "block", color: false, marginRight: 16 }/>
<micro-frame src="..." style=["display:block", null, { marginRight: 16 }]/>
```

## `client-reorder`

Similar to the [`<await>` tag client-reorder attribute](https://markojs.com/docs/core-tags/#await), this tells the micro-frame to avoid blocking content later in the document.

> Note when this is used the micro-frame will be buffered instead of streamed and inserted once it's ready.

# Communicating between host and child

Communicating with the embedded application happens primarily in one of two ways, either you want to do a full reload of and get new HTML, or you want to orchestrate a client side rendered update.

### Full reload

To perform a full reload of the embedded application it works best to pass a query string in the `src` attribute. Whenever `src` updates, a full reload will happen automatically.

```marko
class {
  onCreate() {
    this.state = { page: 0 };
  }

  nextPage() {
    this.state.page++;
  }
}

<micro-frame src=`my-nested-app?page=${state.page}`/>

<button onClick("nextPage")>Next Page</button>
```

With the above, any time `state.page` changes the `my-nested-app` content will be re-loaded.

### Client side update

Client side communication between the host and child application can be done through a number of mechanisms.
You can use a global store, store data on the dom (perhaps even use web components) or other creative options.

You can do this relatively simply by having a contract between the host and child application.
Below is an example using a global exposed by the nested application.

```marko
class {
  onCreate() {
    this.state = { page: 0 };
  }

  openModal() {
    if (window.nestedApp) {
      window.nestedApp.openModal();
    }
  }
}

<micro-frame src="my-nested-app"/>

<button onClick("openModal")>Open nested app modal</button>
```

# Code of Conduct

This project adheres to the [eBay Code of Conduct](/.github/CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
