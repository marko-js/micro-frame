# Load
```html
<div>
  Host app
</div>
<script>
  $csr_blocking_scripts_index_C=(window.$csr_blocking_scripts_index_C||[]).concat({"l":1,"w":[["s0-8",0,{},{"f":1}]],"t":["IY0as$c"]})
</script>
```
```html
<div>
  Host app
</div>
<div>
</div>
<script>
  $csr_blocking_scripts_index_C=(window.$csr_blocking_scripts_index_C||[]).concat({"l":1,"w":[["s0-8",0,{},{"f":1}]],"t":["IY0as$c"]})
</script>
```
```html
<div>
  Host app
</div>
<div>
  <div>
    Embedded App.
    <script>
      window.inlineScriptValues = []
    </script>
    <script src="/external.js?value=a">
    </script>
  </div>
  <link
    href="/external.js?value=b"
    rel="preload"
    as="script"
  >
  <link
    href="/external.js?value=c"
    rel="preload"
    as="script"
  >
</div>
<script>
  $csr_blocking_scripts_index_C=(window.$csr_blocking_scripts_index_C||[]).concat({"l":1,"w":[["s0-8",0,{},{"f":1}]],"t":["IY0as$c"]})
</script>
```
```html
<div>
  Host app
</div>
<div>
  <div>
    Embedded App.
    <script>
      window.inlineScriptValues = []
    </script>
    <script src="/external.js?value=a">
    </script>
    <script>
      inlineScriptValues.push(0, scriptValues.at(-1));
    </script>
    <script src="/external.js?value=b">
    </script>
  </div>
  <link
    href="/external.js?value=b"
    rel="preload"
    as="script"
  >
  <link
    href="/external.js?value=c"
    rel="preload"
    as="script"
  >
</div>
<script>
  $csr_blocking_scripts_index_C=(window.$csr_blocking_scripts_index_C||[]).concat({"l":1,"w":[["s0-8",0,{},{"f":1}]],"t":["IY0as$c"]})
</script>
```
```html
<div>
  Host app
</div>
<div>
  <div>
    Embedded App.
    <script>
      window.inlineScriptValues = []
    </script>
    <script src="/external.js?value=a">
    </script>
    <script>
      inlineScriptValues.push(0, scriptValues.at(-1));
    </script>
    <script src="/external.js?value=b">
    </script>
    <script>
      inlineScriptValues.push(1, scriptValues.at(-1));
    </script>
    <script src="/external.js?value=c">
    </script>
  </div>
  <link
    href="/external.js?value=c"
    rel="preload"
    as="script"
  >
</div>
<script>
  $csr_blocking_scripts_index_C=(window.$csr_blocking_scripts_index_C||[]).concat({"l":1,"w":[["s0-8",0,{},{"f":1}]],"t":["IY0as$c"]})
</script>
```
```html
<div>
  Host app
</div>
<div>
  <div>
    Embedded App.
    <script>
      window.inlineScriptValues = []
    </script>
    <script src="/external.js?value=a">
    </script>
    <script>
      inlineScriptValues.push(0, scriptValues.at(-1));
    </script>
    <script src="/external.js?value=b">
    </script>
    <script>
      inlineScriptValues.push(1, scriptValues.at(-1));
    </script>
    <script src="/external.js?value=c">
    </script>
    <script>
      inlineScriptValues.push(2, scriptValues.at(-1));
    </script>
    After blocking.
  </div>
</div>
<script>
  $csr_blocking_scripts_index_C=(window.$csr_blocking_scripts_index_C||[]).concat({"l":1,"w":[["s0-8",0,{},{"f":1}]],"t":["IY0as$c"]})
</script>
```
