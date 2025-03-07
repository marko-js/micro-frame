# Load
```html
<div>
  Host app
</div>
<div
  id="s0-8-0-0"
  data-src="embed"
>
  <noscript id="afssr_only_indexph0">
  </noscript>
</div>
<div
  id="s0-9-0"
  class="test"
  style="display:block;margin-right:16px"
  data-slot="slot_1"
  data-from="test"
>
</div>
```
```html
<div>
  Host app
</div>
<div
  id="s0-8-0-0"
  data-src="embed"
>
  <noscript id="afssr_only_indexph0">
  </noscript>
</div>
<div
  id="s0-9-0"
  class="test"
  style="display:block;margin-right:16px"
  data-slot="slot_1"
  data-from="test"
>
  <p>
    test_html for slot_1
  </p>
</div>
```
```html
<div>
  Host app
</div>
<div
  id="s0-8-0-0"
  data-src="embed"
>
</div>
<div
  id="s0-9-0"
  class="test"
  style="display:block;margin-right:16px"
  data-slot="slot_1"
  data-from="test"
>
  <p>
    test_html for slot_1
  </p>
  next chunk for slot_1
</div>
<div
  id="s0-10-0"
  data-slot="slot_2"
  data-from="test"
>
  <p>
    test_html for slot_2
  </p>
</div>
<div
  id="afssr_only_index0"
  style="display:none"
>
</div>
<div
  id="afssr_only_index1"
  style="display:none"
>
</div>
<script>
  function $afssr_only_index(d,a,e,l,g,h,k,b,f,c){c=$afssr_only_index;if(a&&!c[a])(c[a+="$"]||(c[a]=[])).push(d);else{e=document;l=e.getElementById("afssr_only_index"+d);g=e.getElementById("afssr_only_indexph"+d);h=e.createDocumentFragment();k=l.childNodes;b=0;for(f=k.length;b
  <f;b++)h.appendChild(k.item(0));g&&g.parentNode.replaceChild(h,g);c[d]=1;if(a=c[d+"$"])for(b=0,f=a.length;b
  <f;b++)c(a[b])}};$afssr_only_index(0);$afssr_only_index(1)
</script>
```
