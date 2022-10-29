
      
# AppManager

<div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

App manager handles main application states - focus and online. Those two values can answer questions:
- Is the tab or current view instance focused and visible for user?
- Is our application online or offline?
With the app manager it is not a problem to get the valid answer for this question.

</span></div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>builder</th><th><code><span class="api-type__type ">BuilderInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>options</th><th><code><span class="api-type__type ">AppManagerOptionsType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Properties

</div><div class="api-docs__properties" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>options</th><th><code><span class="api-type__type ">AppManagerOptionsType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>isOnline</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>isFocused</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>events</th><th><code><span class="api-type__symbol">&#123; </span><span>emitBlur<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>emitFocus<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>emitOffline<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>emitOnline<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onBlur<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onFocus<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onOffline<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onOnline<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol"> &#125;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>emitter</th><th><code><span class="api-type__type ">EventEmitter</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>builder</th><th><code><span class="api-type__type ">BuilderInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Methods

</div><div class="api-docs__methods" data-reactroot=""><div class="api-docs__method"><h3 class="api-docs__name">

### `setFocused()`

</h3><div class="api-docs__call-preview">

```tsx
setFocused(isFocused)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>isFocused</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setOnline()`

</h3><div class="api-docs__call-preview">

```tsx
setOnline(isOnline)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>isOnline</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div></div>