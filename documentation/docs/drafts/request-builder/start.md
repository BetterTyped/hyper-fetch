- jest po to by ustanowić połączenie z danym serwerem.
- Co jest najważniejsze?
  - Powstał też po to by z niego później tworzyć/generować middleware
- Dlaczego generujemy je z buildera? 
  - Builder zawiera dużo informacji na temat połączenia z serwerem:
    - typ (rest/graphql)
    - jaki jest baseURL do serwera
    - ustawienie swojego własnego klienta lub skorzystanie z defaultowego
    - globalna obsługa errorów dla danego połączenia
- builder może jeszcze manipulować całym "middleware" przed wysyłką i po wysyłce

Builder -> RequestBuilder // RequestCommandBuilder // ServerBuilder // Server -> 
  - główne ustawienia i połączenie z serwerem.
  - zwraca Factory czegoś co obecnie nazywamy Middleware
  - pozwala na modyfikację przed i po requeście 
  
Middleware -> RequestCommand

// TODO @MPyrc - simplify structure to - this way we will skip one redundant step:
```typescript
const reqBuilder = new RequestBuilder({ baseUrl: "localhost:300" })
const getUser = reqBuilder.create<Response, Request, Query>()({ endpoint: "/" })
```
