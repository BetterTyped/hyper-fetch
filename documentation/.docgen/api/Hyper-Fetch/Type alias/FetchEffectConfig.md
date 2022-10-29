
      
# FetchEffectConfig

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type" data-reactroot="">

```ts
type FetchEffectConfig = {
  effectKey: string; 
  onError: (response: ClientResponseErrorType<ExtractError<T>>, command: CommandInstance) => void; 
  onFinished: (response: ClientResponseType<ResponseType, ExtractError<T>>, command: CommandInstance) => void; 
  onStart: (command: CommandInstance) => void; 
  onSuccess: (response: ClientResponseSuccessType<ResponseType>, command: CommandInstance) => void; 
  onTrigger: (command: CommandInstance) => void; 
}
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div>