
      
# LoggerManager

<div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

This class is used across the Hyper Fetch library to provide unified logging system with necessary setup per each builder.
We can set up the logging level based on available values. This manager enable to initialize the logging instance per individual module
like Builder, Command etc. Which can give you better feedback on the logging itself.

</span></div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>builder</th><th><code><span class="api-type__type ">BuilderInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>options</th><th><code><span class="api-type__type ">LoggerOptionsType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Properties

</div><div class="api-docs__properties" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>severity</th><th><code><span class="api-type__type ">SeverityType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>logger</th><th><code><span class="api-type__type ">LoggerFunctionType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>emitter</th><th><code><span class="api-type__type ">EventEmitter</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Methods

</div><div class="api-docs__methods" data-reactroot=""><div class="api-docs__method"><h3 class="api-docs__name">

### `init()`

</h3><div class="api-docs__call-preview">

```tsx
init(module)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>module</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `LoggerType`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setSeverity()`

</h3><div class="api-docs__call-preview">

```tsx
setSeverity(severity)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>severity</th><th><code><span class="api-type__type ">SeverityType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div></div>