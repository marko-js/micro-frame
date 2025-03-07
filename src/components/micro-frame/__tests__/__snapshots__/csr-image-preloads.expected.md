# Load
```html
<div>
  Host app
</div>
<script>
  $csr_image_preloads_index_C=(window.$csr_image_preloads_index_C||[]).concat({"l":1,"w":[["s0-8",0,{},{"f":1}]],"t":["LfW2QDi"]})
</script>
```
```html
<div>
  Host app
</div>
<div>
</div>
<script>
  $csr_image_preloads_index_C=(window.$csr_image_preloads_index_C||[]).concat({"l":1,"w":[["s0-8",0,{},{"f":1}]],"t":["LfW2QDi"]})
</script>
```
```html
<div>
  Host app
</div>
<div>
  <div>
    Embedded App.
    <script src="/external.js?value=a">
    </script>
  </div>
  <link
    rel="preload"
    as="image"
    href="/external-a.gif"
  >
  <link
    rel="preload"
    as="image"
    imagesrcset="/external-b.gif 480w, /external-c.gif 800w"
    imagesizes="(max-width: 600px) 480px, 800px"
  >
</div>
<script>
  $csr_image_preloads_index_C=(window.$csr_image_preloads_index_C||[]).concat({"l":1,"w":[["s0-8",0,{},{"f":1}]],"t":["LfW2QDi"]})
</script>
```
```html
<div>
  Host app
</div>
<div>
  <div>
    Embedded App.
    <script src="/external.js?value=a">
    </script>
    <img src="/external-a.gif">
    <img
      srcset="/external-b.gif 480w, /external-c.gif 800w"
      sizes="(max-width: 600px) 480px, 800px"
      src="/external-d.gif"
    >
    After blocking.
  </div>
  <link
    rel="preload"
    as="image"
    href="/external-a.gif"
  >
  <link
    rel="preload"
    as="image"
    imagesrcset="/external-b.gif 480w, /external-c.gif 800w"
    imagesizes="(max-width: 600px) 480px, 800px"
  >
</div>
<script>
  $csr_image_preloads_index_C=(window.$csr_image_preloads_index_C||[]).concat({"l":1,"w":[["s0-8",0,{},{"f":1}]],"t":["LfW2QDi"]})
</script>
```
```html
<div>
  Host app
</div>
<div>
  <div>
    Embedded App.
    <script src="/external.js?value=a">
    </script>
    <img src="/external-a.gif">
    <img
      srcset="/external-b.gif 480w, /external-c.gif 800w"
      sizes="(max-width: 600px) 480px, 800px"
      src="/external-d.gif"
    >
    After blocking.
  </div>
  <link
    rel="preload"
    as="image"
    imagesrcset="/external-b.gif 480w, /external-c.gif 800w"
    imagesizes="(max-width: 600px) 480px, 800px"
  >
</div>
<script>
  $csr_image_preloads_index_C=(window.$csr_image_preloads_index_C||[]).concat({"l":1,"w":[["s0-8",0,{},{"f":1}]],"t":["LfW2QDi"]})
</script>
```
```html
<div>
  Host app
</div>
<div>
  <div>
    Embedded App.
    <script src="/external.js?value=a">
    </script>
    <img src="/external-a.gif">
    <img
      srcset="/external-b.gif 480w, /external-c.gif 800w"
      sizes="(max-width: 600px) 480px, 800px"
      src="/external-d.gif"
    >
    After blocking.
  </div>
</div>
<script>
  $csr_image_preloads_index_C=(window.$csr_image_preloads_index_C||[]).concat({"l":1,"w":[["s0-8",0,{},{"f":1}]],"t":["LfW2QDi"]})
</script>
```
