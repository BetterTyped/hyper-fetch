Zawiera wszystko to co jest potrzebne do wykonania requestu.
-> Każda metoda zwraca "skopiowany" obiekt. 
Obiekt fetch-command nie jest mutowalny.

Można go użyć też aby:
  - podpiąć się do eventów reqestu:
    - onRequestProgress
    - onResponseProgress
    - onError
    - onSuccess
    - onFinish
    - onRequestStart

Pozwala także na cancellowanie requestów.

Jest to <obiekt> - przez co mamy możliwość wyciągania różnych informacji o danej komendzie.
Dzieki temu łatwiej tworzyć testy i mocki.
Dodawanie query paramsów można robić jako obiekt i jako string. 
Daje to nam możliwość otypowania query paramsów.
Ze stringa endpointu jesteśmy w stanie autoamtycznie stworzyć typy.
Każda metoda, którą wykonujemy na komendzie <zwraca jej klona, a nie referencję>.

