

# FetchType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { FetchType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:237](https://github.com/BetterTyped/hyper-fetch/blob/6c3eaa91/packages/core/src/command/command.types.ts#L237)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type FetchType<Command> = FetchQueryParamsType<ExtractQueryParams<Command>, ExtractHasQueryParams<Command>> & FetchParamsType<ExtractEndpoint<Command>, ExtractHasParams<Command>> & FetchRequestDataType<ExtractRequestData<Command>, ExtractHasData<Command>> & Omit<FetchOptionsType<ExtractClientOptions<Command>>, params | data> & FetchSendActionsType<Command> & CommandQueueOptions;
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  0: P;
  1: a;
  2: r;
  3: t;
  4: i;
  5: a;
  6: l;
  7: <;
  8: {;
  9: 
;
  10:  ;
  11:  ;
  12: a;
  13: b;
  14: o;
  15: r;
  16: t;
  17: K;
  18: e;
  19: y;
  20: :;
  21:  ;
  22: s;
  23: t;
  24: r;
  25: i;
  26: n;
  27: g;
  28: ;;
  29: 
;
  30:  ;
  31:  ;
  32: a;
  33: u;
  34: t;
  35: h;
  36: :;
  37:  ;
  38: b;
  39: o;
  40: o;
  41: l;
  42: e;
  43: a;
  44: n;
  45: ;;
  46: 
;
  47:  ;
  48:  ;
  49: c;
  50: a;
  51: c;
  52: h;
  53: e;
  54: :;
  55:  ;
  56: b;
  57: o;
  58: o;
  59: l;
  60: e;
  61: a;
  62: n;
  63: ;;
  64: 
;
  65:  ;
  66:  ;
  67: c;
  68: a;
  69: c;
  70: h;
  71: e;
  72: K;
  73: e;
  74: y;
  75: :;
  76:  ;
  77: s;
  78: t;
  79: r;
  80: i;
  81: n;
  82: g;
  83: ;;
  84: 
;
  85:  ;
  86:  ;
  87: c;
  88: a;
  89: c;
  90: h;
  91: e;
  92: T;
  93: i;
  94: m;
  95: e;
  96: :;
  97:  ;
  98: n;
  99: u;
  100: m;
  101: b;
  102: e;
  103: r;
  104: ;;
  105: 
;
  106:  ;
  107:  ;
  108: c;
  109: a;
  110: n;
  111: c;
  112: e;
  113: l;
  114: a;
  115: b;
  116: l;
  117: e;
  118: :;
  119:  ;
  120: b;
  121: o;
  122: o;
  123: l;
  124: e;
  125: a;
  126: n;
  127: ;;
  128: 
;
  129:  ;
  130:  ;
  131: d;
  132: e;
  133: d;
  134: u;
  135: p;
  136: l;
  137: i;
  138: c;
  139: a;
  140: t;
  141: e;
  142: :;
  143:  ;
  144: b;
  145: o;
  146: o;
  147: l;
  148: e;
  149: a;
  150: n;
  151: ;;
  152: 
;
  153:  ;
  154:  ;
  155: d;
  156: e;
  157: d;
  158: u;
  159: p;
  160: l;
  161: i;
  162: c;
  163: a;
  164: t;
  165: e;
  166: T;
  167: i;
  168: m;
  169: e;
  170: :;
  171:  ;
  172: n;
  173: u;
  174: m;
  175: b;
  176: e;
  177: r;
  178: ;;
  179: 
;
  180:  ;
  181:  ;
  182: d;
  183: i;
  184: s;
  185: a;
  186: b;
  187: l;
  188: e;
  189: R;
  190: e;
  191: q;
  192: u;
  193: e;
  194: s;
  195: t;
  196: I;
  197: n;
  198: t;
  199: e;
  200: r;
  201: c;
  202: e;
  203: p;
  204: t;
  205: o;
  206: r;
  207: s;
  208: :;
  209:  ;
  210: b;
  211: o;
  212: o;
  213: l;
  214: e;
  215: a;
  216: n;
  217: ;;
  218: 
;
  219:  ;
  220:  ;
  221: d;
  222: i;
  223: s;
  224: a;
  225: b;
  226: l;
  227: e;
  228: R;
  229: e;
  230: s;
  231: p;
  232: o;
  233: n;
  234: s;
  235: e;
  236: I;
  237: n;
  238: t;
  239: e;
  240: r;
  241: c;
  242: e;
  243: p;
  244: t;
  245: o;
  246: r;
  247: s;
  248: :;
  249:  ;
  250: b;
  251: o;
  252: o;
  253: l;
  254: e;
  255: a;
  256: n;
  257: ;;
  258: 
;
  259:  ;
  260:  ;
  261: e;
  262: f;
  263: f;
  264: e;
  265: c;
  266: t;
  267: K;
  268: e;
  269: y;
  270: :;
  271:  ;
  272: s;
  273: t;
  274: r;
  275: i;
  276: n;
  277: g;
  278: ;;
  279: 
;
  280:  ;
  281:  ;
  282: e;
  283: n;
  284: d;
  285: p;
  286: o;
  287: i;
  288: n;
  289: t;
  290: :;
  291:  ;
  292: G;
  293: e;
  294: n;
  295: e;
  296: r;
  297: i;
  298: c;
  299: E;
  300: n;
  301: d;
  302: p;
  303: o;
  304: i;
  305: n;
  306: t;
  307: ;;
  308: 
;
  309:  ;
  310:  ;
  311: h;
  312: e;
  313: a;
  314: d;
  315: e;
  316: r;
  317: s;
  318: :;
  319:  ;
  320: H;
  321: e;
  322: a;
  323: d;
  324: e;
  325: r;
  326: s;
  327: I;
  328: n;
  329: i;
  330: t;
  331: ;;
  332: 
;
  333:  ;
  334:  ;
  335: m;
  336: e;
  337: t;
  338: h;
  339: o;
  340: d;
  341: :;
  342:  ;
  343: G;
  344: E;
  345: T;
  346:  ;
  347: |;
  348:  ;
  349: P;
  350: O;
  351: S;
  352: T;
  353:  ;
  354: |;
  355:  ;
  356: P;
  357: U;
  358: T;
  359:  ;
  360: |;
  361:  ;
  362: P;
  363: A;
  364: T;
  365: C;
  366: H;
  367:  ;
  368: |;
  369:  ;
  370: D;
  371: E;
  372: L;
  373: E;
  374: T;
  375: E;
  376: ;;
  377: 
;
  378:  ;
  379:  ;
  380: o;
  381: f;
  382: f;
  383: l;
  384: i;
  385: n;
  386: e;
  387: :;
  388:  ;
  389: b;
  390: o;
  391: o;
  392: l;
  393: e;
  394: a;
  395: n;
  396: ;;
  397: 
;
  398:  ;
  399:  ;
  400: o;
  401: p;
  402: t;
  403: i;
  404: o;
  405: n;
  406: s;
  407: :;
  408:  ;
  409: C;
  410: l;
  411: i;
  412: e;
  413: n;
  414: t;
  415: O;
  416: p;
  417: t;
  418: i;
  419: o;
  420: n;
  421: s;
  422: ;;
  423: 
;
  424:  ;
  425:  ;
  426: q;
  427: u;
  428: e;
  429: u;
  430: e;
  431: K;
  432: e;
  433: y;
  434: :;
  435:  ;
  436: s;
  437: t;
  438: r;
  439: i;
  440: n;
  441: g;
  442: ;;
  443: 
;
  444:  ;
  445:  ;
  446: q;
  447: u;
  448: e;
  449: u;
  450: e;
  451: d;
  452: :;
  453:  ;
  454: b;
  455: o;
  456: o;
  457: l;
  458: e;
  459: a;
  460: n;
  461: ;;
  462: 
;
  463:  ;
  464:  ;
  465: r;
  466: e;
  467: t;
  468: r;
  469: y;
  470: :;
  471:  ;
  472: n;
  473: u;
  474: m;
  475: b;
  476: e;
  477: r;
  478: ;;
  479: 
;
  480:  ;
  481:  ;
  482: r;
  483: e;
  484: t;
  485: r;
  486: y;
  487: T;
  488: i;
  489: m;
  490: e;
  491: :;
  492:  ;
  493: n;
  494: u;
  495: m;
  496: b;
  497: e;
  498: r;
  499: ;;
  500: 
;
  501: };
  502: >;
  onDownloadProgress: (values: FetchProgressType, details: CommandEventDetails<Command>) => void;
  onRemove: (details: CommandEventDetails<Command>) => void;
  onRequestStart: (details: CommandEventDetails<Command>) => void;
  onResponse: (response: ClientResponseType<T extends Command<infer D, any, any, any, any, any, any, any, any, any> ? D : never, T extends Command<any, any, any, infer G, infer L, any, any, any, any, any> ? G | L : never>, details: CommandResponseDetails) => void;
  onResponseStart: (details: CommandEventDetails<Command>) => void;
  onSettle: (requestId: string, command: Command) => void;
  onUploadProgress: (values: FetchProgressType, details: CommandEventDetails<Command>) => void;
  dispatcherType: auto | fetch | submit;
}
```

</div>